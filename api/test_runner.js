import mongoose from 'mongoose';
import { config } from './src/config/env.js';
import { User } from './src/models/User.js';
import { Lead } from './src/models/Lead.js';
import { Customer } from './src/models/Customer.js';
import { Deal } from './src/models/Deal.js';
import { Activity } from './src/models/Activity.js';
import { Timeline } from './src/models/Timeline.js';
import { CrmConfig } from './src/models/CrmConfig.js';
import { LeadService } from './src/services/lead.service.js';
import { LeadConversionService } from './src/services/leadConversion.service.js';
import { DealService } from './src/services/deal.service.js';
import { ActivityService } from './src/services/activity.service.js';
import { CustomerService } from './src/services/customer.service.js';
import { TimelineService } from './src/services/timeline.service.js';
import { ConfigService } from './src/services/config.service.js';
import { DashboardService } from './src/services/dashboard.service.js';
import { AuthService } from './src/services/auth.service.js';
import { convertLeadSchema, createLeadSchema } from './src/validators/lead.validator.js';
import { createDealSchema, updateDealSchema } from './src/validators/deal.validator.js';
import { registerSchema } from './src/validators/auth.validator.js';
import { createCustomerSchema } from './src/validators/customer.validator.js';
import { errorHandler } from './src/middleware/error.middleware.js';
import {
  ROLES,
  LEAD_STATUSES,
  ACTIVITY_TYPES,
  ACTIVITY_STATUSES,
  ENTITY_TYPES,
  TIMELINE_ACTIONS,
  DEAL_STAGES,
} from './src/config/constants.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('Connecting to DB for verification tests...');
  await mongoose.connect(config.mongoUri);

  const admin = await User.findOne({ role: ROLES.ADMIN });
  const manager1 = await User.findOne({ email: 'manager@odishacrm.com' });
  const manager2 = await User.findOne({ email: 'manager2@odishacrm.com' });
  const exec1 = await User.findOne({ email: 'executive1@odishacrm.com' });
  const exec2 = await User.findOne({ email: 'executive2@odishacrm.com' });
  const exec3 = await User.findOne({ email: 'executive3@odishacrm.com' });

  console.log('\n--- Test 3: Only a qualified lead can be converted ---');
  const newLead = await Lead.create({
    name: 'Unqualified Test Lead',
    email: 'newlead@test.com',
    status: LEAD_STATUSES.NEW,
    assignedTo: exec1._id,
  });

  try {
    await LeadConversionService.convertLead(newLead._id, {}, exec1);
    assert(false, 'Expected conversion of NEW lead to throw 400 error');
  } catch (err) {
    assert(err.statusCode === 400 && err.message.includes('Only qualified leads can be converted'), 'Blocked conversion of NEW lead: ' + err.message);
  }

  newLead.status = LEAD_STATUSES.QUALIFIED;
  await newLead.save();

  const convertedResult = await LeadConversionService.convertLead(
    newLead._id,
    { customerAddress: '789 Qualify Rd', dealValue: 12000 },
    exec1
  );
  assert(convertedResult.lead.isConverted === true, 'Successfully converted QUALIFIED lead');
  assert(convertedResult.customer.address === '789 Qualify Rd', 'customerAddress persisted to customer on conversion (Test 5)');

  try {
    await LeadConversionService.convertLead(newLead._id, {}, exec1);
    assert(false, 'Expected re-conversion to throw error');
  } catch (err) {
    assert(err.statusCode === 400, 'Blocked re-conversion of already-converted lead');
  }

  console.log('\n--- Test 4: Atomicity on conversion failure ---');
  const qualLeadForFail = await Lead.create({
    name: 'Atomic Rollback Test Lead',
    email: 'atomic@test.com',
    status: LEAD_STATUSES.QUALIFIED,
    assignedTo: exec1._id,
  });

  try {
    // Pass invalid deal value (-500) to force Deal.create to fail validation
    await LeadConversionService.convertLead(qualLeadForFail._id, { dealValue: -500 }, exec1);
    assert(false, 'Expected conversion to fail due to negative dealValue');
  } catch (err) {
    assert(true, 'Conversion failed as expected: ' + err.message);
  }

  // Check that customer was not left orphaned
  const orphanedCustomer = await Customer.findOne({ email: 'atomic@test.com' });
  const unchangedLead = await Lead.findById(qualLeadForFail._id);
  assert(orphanedCustomer === null, 'Compensating rollback deleted customer when deal creation failed');
  assert(unchangedLead.isConverted === false, 'Lead remains unconverted and in QUALIFIED status');

  console.log('\n--- Test 5: customerAddress Zod validation ---');
  const parsed = convertLeadSchema.safeParse({ customerAddress: '123 Main St', dealValue: 5000 });
  assert(parsed.success && parsed.data.customerAddress === '123 Main St', 'convertLeadSchema preserves customerAddress');

  console.log('\n--- Test 6: Admin CRM Configuration API ---');
  const currentConfig = await ConfigService.getConfig();
  assert(currentConfig !== null, 'ConfigService.getConfig returns configuration');
  const updatedConfig = await ConfigService.updateConfig({ companyName: 'Odisha CRM Enterprise' }, admin);
  assert(updatedConfig.companyName === 'Odisha CRM Enterprise', 'ConfigService.updateConfig updates system config');

  console.log('\n--- Test 7: Sales Manager Team Scope ---');
  const mgr1Leads = await LeadService.getLeads({ limit: 50 }, manager1);
  const leadAssignedIds = mgr1Leads.leads.map((l) => l.assignedTo._id.toString());
  assert(!leadAssignedIds.includes(exec3._id.toString()), 'Manager 1 cannot see leads assigned to Team 2 (exec3)');

  const team2Lead = await Lead.findOne({ assignedTo: exec3._id });
  if (team2Lead) {
    try {
      await LeadService.getLeadById(team2Lead._id, manager1);
      assert(false, 'Expected Manager 1 to be forbidden from accessing Team 2 lead');
    } catch (err) {
      assert(err.statusCode === 403, 'Manager 1 blocked with 403 accessing lead outside their team');
    }

    const leadOfTeam1 = await Lead.findOne({ assignedTo: exec1._id, isConverted: false });
    if (leadOfTeam1) {
      try {
        await LeadService.assignLead(leadOfTeam1._id, exec3._id, manager1);
        assert(false, 'Expected Manager 1 to be forbidden from assigning lead to exec3');
      } catch (err) {
        assert(err.statusCode === 403, 'Manager 1 blocked from reassigning lead outside team');
      }
    }
  }

  const team1Perf = await DashboardService.getTeamPerformance(manager1);
  const team1UserIds = team1Perf.map((p) => p.user.id.toString());
  assert(team1UserIds.includes(exec1._id.toString()), 'Team 1 performance includes exec1');
  assert(team1UserIds.includes(exec2._id.toString()), 'Team 1 performance includes exec2');
  assert(!team1UserIds.includes(exec3._id.toString()), 'Team 1 performance excludes exec3');

  console.log('\n--- Test: Dynamic allowExecutiveLeadReassignment Config Enforcement ---');
  const leadToReassign = await Lead.create({
    name: 'Dynamic Flag Test Lead',
    email: 'flagtest@test.com',
    status: LEAD_STATUSES.NEW,
    assignedTo: exec1._id,
  });

  // 1. Ensure config flag is false
  await ConfigService.updateConfig({ allowExecutiveLeadReassignment: false }, admin);
  try {
    await LeadService.assignLead(leadToReassign._id, exec2._id, exec1);
    assert(false, 'Expected executive reassignment to fail when config flag is false');
  } catch (err) {
    assert(err.statusCode === 403 && err.message.includes('disabled in CRM configuration'), 'Executive reassignment blocked by dynamic config flag: ' + err.message);
  }

  // 2. Set config flag to true
  await ConfigService.updateConfig({ allowExecutiveLeadReassignment: true }, admin);
  const reassignedLead = await LeadService.assignLead(leadToReassign._id, exec2._id, exec1);
  assert(reassignedLead.assignedTo._id.toString() === exec2._id.toString(), 'Executive reassignment allowed when dynamic config flag is true');

  // Reset config back to default false
  await ConfigService.updateConfig({ allowExecutiveLeadReassignment: false }, admin);

  console.log('\n--- Test: Related-Entity Ownership on Create ---');
  // Create customer belonging to Exec 3 (Team 2)
  const custTeam2 = await Customer.create({
    name: 'Exec 3 Customer',
    email: 'team2cust@test.com',
    assignedTo: exec3._id,
  });

  // Exec 1 attempts to create a Deal on Exec 3 customer -> Must fail 403
  try {
    await DealService.createDeal({
      name: 'Unauthorized Cross Deal',
      customer: custTeam2._id,
      value: 10000,
      expectedClosingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    }, exec1);
    assert(false, 'Expected Exec 1 deal creation on Exec 3 customer to fail 403');
  } catch (err) {
    assert(err.statusCode === 403, 'Exec 1 blocked from creating deal on Exec 3 customer: ' + err.message);
  }

  // Exec 1 attempts to create an Activity on Exec 3 customer -> Must fail 403
  try {
    await ActivityService.createActivity({
      type: ACTIVITY_TYPES.CALL,
      title: 'Unauthorized Activity',
      entityType: ENTITY_TYPES.CUSTOMER,
      entityId: custTeam2._id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    }, exec1);
    assert(false, 'Expected Exec 1 activity creation on Exec 3 customer to fail 403');
  } catch (err) {
    assert(err.statusCode === 403, 'Exec 1 blocked from creating activity on Exec 3 customer: ' + err.message);
  }

  // Exec 1 attempts to create a Customer referencing Exec 3 lead -> Must fail 403
  const leadTeam2 = await Lead.create({
    name: 'Exec 3 Lead',
    email: 'team2lead@test.com',
    assignedTo: exec3._id,
    status: LEAD_STATUSES.QUALIFIED,
  });

  try {
    await CustomerService.createCustomer({
      name: 'Cross Lead Customer',
      email: 'crosslead@test.com',
      originalLead: leadTeam2._id,
    }, exec1);
    assert(false, 'Expected Exec 1 customer creation referencing Exec 3 lead to fail 403');
  } catch (err) {
    assert(err.statusCode === 403, 'Exec 1 blocked from referencing unauthorized lead on customer create: ' + err.message);
  }

  // Create deal referencing lead (verifying Lead import in deal.service.js)
  const validExec1Lead = await Lead.create({
    name: 'Deal Lead Link Test',
    email: 'deallead@test.com',
    assignedTo: exec1._id,
    status: LEAD_STATUSES.QUALIFIED,
  });
  const validExec1Cust = await Customer.create({
    name: 'Deal Cust Link Test',
    email: 'dealcust@test.com',
    assignedTo: exec1._id,
  });

  const dealWithLead = await DealService.createDeal({
    name: 'Deal Linked to Lead',
    customer: validExec1Cust._id,
    lead: validExec1Lead._id,
    value: 15000,
    expectedClosingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  }, exec1);
  assert(dealWithLead.lead._id.toString() === validExec1Lead._id.toString(), 'createDeal successfully resolves Lead model and links lead to deal (Lead import verified)');

  console.log('\n--- Test: Production 500 Error Sanitization ---');
  let resStatus = 0;
  let resJson = null;
  const resMock = {
    status(code) { resStatus = code; return this; },
    json(data) { resJson = data; return this; },
  };
  const originalEnv = config.env;
  config.env = 'production';
  errorHandler(new Error('Internal raw database crash details with password=secret'), {}, resMock, () => {});
  assert(resStatus === 500 && resJson.message === 'An internal server error occurred. Please try again later.', 'errorHandler sanitizes raw 500 error message in production');
  config.env = originalEnv;

  console.log('\n--- Test: Phone Format Validation ---');
  // Zod Phone tests
  const invalidPhoneLead = createLeadSchema.safeParse({
    name: 'Bad Phone',
    email: 'badphone@test.com',
    phone: '12345',
  });
  assert(!invalidPhoneLead.success, 'createLeadSchema rejects phone shorter than 10 digits');

  const invalidAlphaPhone = createCustomerSchema.safeParse({
    name: 'Alpha Phone',
    email: 'alphaphone@test.com',
    phone: '+12345abcde',
  });
  assert(!invalidAlphaPhone.success, 'createCustomerSchema rejects phone with alphabetic characters');

  const validPhoneLead = createLeadSchema.safeParse({
    name: 'Good Phone',
    email: 'goodphone@test.com',
    phone: '+919876543210',
  });
  assert(validPhoneLead.success, 'createLeadSchema accepts valid E.164 phone number');

  console.log('\n--- Test: Deal Update Expected Closing Date Validation ---');
  const pastDateStr = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const futureDateStr = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  const updatePastParsed = updateDealSchema.safeParse({
    expectedClosingDate: pastDateStr,
  });
  assert(!updatePastParsed.success, 'updateDealSchema rejects past expectedClosingDate');

  const updateFutureParsed = updateDealSchema.safeParse({
    expectedClosingDate: futureDateStr,
  });
  assert(updateFutureParsed.success, 'updateDealSchema accepts future expectedClosingDate');

  console.log('\n--- Test: Closed Won/Lost Deal Reopening Rules ---');
  const custTeam1 = await Customer.create({
    name: 'Exec 1 Customer',
    email: 'team1cust@test.com',
    assignedTo: exec1._id,
  });

  const wonDeal = await Deal.create({
    name: 'Won Deal To Reopen',
    customer: custTeam1._id,
    assignedTo: exec1._id,
    value: 5000,
    expectedClosingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    stage: DEAL_STAGES.WON,
    probability: 100,
  });

  // Exec 1 attempts to reopen closed won deal
  try {
    await DealService.updateDeal(wonDeal._id, { stage: DEAL_STAGES.PROPOSAL }, exec1);
    assert(false, 'Expected Sales Executive reopening of closed deal to fail 403');
  } catch (err) {
    assert(err.statusCode === 403, 'Executive blocked from reopening closed deal: ' + err.message);
  }

  // Manager 1 attempts to reopen closed won deal WITHOUT reopenReason
  try {
    await DealService.updateDeal(wonDeal._id, { stage: DEAL_STAGES.PROPOSAL }, manager1);
    assert(false, 'Expected Manager reopening without reopenReason to fail 400');
  } catch (err) {
    assert(err.statusCode === 400 && err.message.includes('reopenReason'), 'Manager reopening requires reopenReason: ' + err.message);
  }

  // Manager 1 reopens closed won deal WITH reopenReason
  const reopenedDeal = await DealService.updateDeal(
    wonDeal._id,
    { stage: DEAL_STAGES.PROPOSAL, reopenReason: 'Client renewed contract discussions for scope expansion' },
    manager1
  );
  assert(reopenedDeal.stage === DEAL_STAGES.PROPOSAL, 'Manager successfully reopened closed deal to Proposal');

  // Verify timeline contains the reopening reason and manager details
  const dealTimeline = await Timeline.findOne({
    entityId: wonDeal._id,
    action: TIMELINE_ACTIONS.DEAL_STAGE_CHANGED,
    details: { $regex: /Closed deal reopened/i },
  });
  assert(dealTimeline !== null && dealTimeline.details.includes('Client renewed contract discussions'), 'Timeline audit recorded reopening with reason');

  console.log('\n--- Test: Dashboard Pending vs Overdue Count Parity ---');
  const futureAct = await Activity.create({
    type: ACTIVITY_TYPES.CALL,
    title: 'Future Pending Task',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    assignedTo: exec1._id,
    createdBy: exec1._id,
    status: ACTIVITY_STATUSES.PENDING,
    entityType: ENTITY_TYPES.CUSTOMER,
    entityId: custTeam1._id,
  });

  const pastAct = await Activity.create({
    type: ACTIVITY_TYPES.CALL,
    title: 'Past Overdue Task',
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    assignedTo: exec1._id,
    createdBy: exec1._id,
    status: ACTIVITY_STATUSES.PENDING,
    entityType: ENTITY_TYPES.CUSTOMER,
    entityId: custTeam1._id,
  });

  const exec1Metrics = await DashboardService.getOverviewMetrics(exec1);
  const exec1PendingApi = await ActivityService.getActivities({ status: 'Pending' }, exec1);
  const exec1OverdueApi = await ActivityService.getActivities({ status: 'Overdue' }, exec1);

  assert(
    exec1Metrics.activities.pending === exec1PendingApi.meta.totalRecords,
    `Dashboard pending count (${exec1Metrics.activities.pending}) matches GET /activities?status=Pending (${exec1PendingApi.meta.totalRecords})`
  );
  assert(
    exec1Metrics.activities.overdue === exec1OverdueApi.meta.totalRecords,
    `Dashboard overdue count (${exec1Metrics.activities.overdue}) matches GET /activities?status=Overdue (${exec1OverdueApi.meta.totalRecords})`
  );

  // Cleanup
  await Lead.deleteMany({ email: { $in: ['newlead@test.com', 'atomic@test.com', 'flagtest@test.com', 'team2lead@test.com', 'deallead@test.com'] } });
  await Customer.deleteMany({ email: { $in: ['atomic@test.com', 'team2cust@test.com', 'team1cust@test.com', 'crosslead@test.com', 'dealcust@test.com'] } });
  await Deal.deleteMany({ _id: { $in: [wonDeal._id, dealWithLead._id] } });
  await Activity.deleteMany({ _id: { $in: [futureAct._id, pastAct._id] } });

  console.log(`\n========================================`);
  console.log(`Total tests passed: ${passed}`);
  console.log(`Total tests failed: ${failed}`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
