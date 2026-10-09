import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Deal } from '../models/Deal.js';
import { Activity } from '../models/Activity.js';
import { Timeline } from '../models/Timeline.js';
import {
  ROLES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_PRIORITIES,
  CUSTOMER_STATUSES,
  DEAL_STAGES,
  ACTIVITY_TYPES,
  ACTIVITY_STATUSES,
  ENTITY_TYPES,
  TIMELINE_ACTIONS,
} from '../config/constants.js';

const seedDatabase = async () => {
  try {
    console.log('[Seed]: Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('[Seed]: Connected successfully. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Lead.deleteMany({}),
      Customer.deleteMany({}),
      Deal.deleteMany({}),
      Activity.deleteMany({}),
      Timeline.deleteMany({}),
    ]);

    console.log('[Seed]: Creating Users...');

    const admin = await User.create({
      name: 'Saswat Patra',
      email: 'admin@odishacrm.com',
      phone: '+919876543210',
      password: 'AdminPass123!',
      role: ROLES.ADMIN,
      isActive: true,
    });

    const manager = await User.create({
      name: 'Sanjay Mohanty',
      email: 'manager@odishacrm.com',
      password: 'ManagerPass123!',
      phone: '+919876543211',
      role: ROLES.SALES_MANAGER,
      isActive: true,
    });

    const exec1 = await User.create({
      name: 'Debasish Das',
      email: 'executive1@odishacrm.com',
      password: 'ExecutivePass123!',
      phone: '+919876543212',
      role: ROLES.SALES_EXECUTIVE,
      isActive: true,
    });

    const exec2 = await User.create({
      name: 'Subham Nayak',
      email: 'executive2@odishacrm.com',
      password: 'ExecutivePass123!',
      phone: '+919876543213',
      role: ROLES.SALES_EXECUTIVE,
      isActive: true,
    });

    console.log('[Seed]: Creating Leads...');
    const lead1 = await Lead.create({
      name: 'TechCorp Solutions',
      email: 'leads@techcorp.io',
      phone: '+18005550199',
      company: 'TechCorp Inc.',
      source: LEAD_SOURCES.WEBSITE,
      status: LEAD_STATUSES.QUALIFIED,
      priority: LEAD_PRIORITIES.HIGH,
      assignedTo: exec1._id,
      description: 'Interested in enterprise cloud CRM migration',
    });

    const lead2 = await Lead.create({
      name: 'InnoGlobal Inc',
      email: 'info@innoglobal.com',
      phone: '+18005550200',
      company: 'InnoGlobal',
      source: LEAD_SOURCES.REFERRAL,
      status: LEAD_STATUSES.NEW,
      priority: LEAD_PRIORITIES.MEDIUM,
      assignedTo: exec2._id,
      description: 'Inquired via partner referral program',
    });

    console.log('[Seed]: Creating Customer and Converted Lead...');
    const lead3 = await Lead.create({
      name: 'Apex Logistics',
      email: 'sales@apexlogistics.com',
      phone: '+18005550300',
      company: 'Apex Logistics',
      source: LEAD_SOURCES.EMAIL,
      status: LEAD_STATUSES.CONVERTED,
      priority: LEAD_PRIORITIES.HIGH,
      assignedTo: exec1._id,
      isConverted: true,
      convertedAt: new Date(),
    });

    const customer1 = await Customer.create({
      name: 'Apex Logistics',
      email: 'sales@apexlogistics.com',
      phone: '+18005550300',
      company: 'Apex Logistics Ltd',
      address: '100 Industrial Parkway, Chicago IL',
      originalLead: lead3._id,
      assignedTo: exec1._id,
      status: CUSTOMER_STATUSES.ACTIVE,
    });

    lead3.convertedToCustomer = customer1._id;
    await lead3.save();

    console.log('[Seed]: Creating Deals...');
    const deal1 = await Deal.create({
      name: 'Apex Supply Chain Software License',
      lead: lead3._id,
      customer: customer1._id,
      assignedTo: exec1._id,
      value: 25000,
      probability: 80,
      expectedClosingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      stage: DEAL_STAGES.NEGOTIATION,
      description: 'Annual SaaS contract negotiation phase',
    });

    lead3.convertedToDeal = deal1._id;
    await lead3.save();

    const deal2 = await Deal.create({
      name: 'Apex ERP Expansion Deal',
      customer: customer1._id,
      assignedTo: exec1._id,
      value: 50000,
      probability: 100,
      expectedClosingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      stage: DEAL_STAGES.WON,
      description: 'Expanded module deployment successfully closed',
    });

    console.log('[Seed]: Creating Activities...');
    await Activity.create([
      {
        type: ACTIVITY_TYPES.CALL,
        title: 'Initial Discovery Call',
        description: 'Discuss technical requirements and timeline with TechCorp VP of IT',
        assignedTo: exec1._id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: ACTIVITY_STATUSES.PENDING,
        entityType: ENTITY_TYPES.LEAD,
        entityId: lead1._id,
        createdBy: manager._id,
      },
      {
        type: ACTIVITY_TYPES.MEETING,
        title: 'Contract Signing & Onboarding Review',
        description: 'Finalize SLA documentation with Apex Logistics CEO',
        assignedTo: exec1._id,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: ACTIVITY_STATUSES.PENDING, // Overdue activity test
        entityType: ENTITY_TYPES.DEAL,
        entityId: deal1._id,
        createdBy: exec1._id,
      },
    ]);

    console.log('[Seed]: Creating Timeline Audit Entries...');
    await Timeline.create([
      {
        action: TIMELINE_ACTIONS.LEAD_CREATED,
        entityType: ENTITY_TYPES.LEAD,
        entityId: lead1._id,
        performedBy: admin._id,
        newValue: { name: lead1.name, status: lead1.status },
        details: 'Initial lead captured via website',
      },
      {
        action: TIMELINE_ACTIONS.DEAL_WON,
        entityType: ENTITY_TYPES.DEAL,
        entityId: deal2._id,
        performedBy: exec1._id,
        newValue: { stage: DEAL_STAGES.WON, value: deal2.value },
        details: 'Deal won and contract executed',
      },
    ]);

    console.log(' SEEDING COMPLETED SUCCESSFULLY!');
    console.log(' Sample Credentials:');
    console.log(' Admin:         admin@crm.com / AdminPass123!');
    console.log(' Manager:       manager@crm.com / ManagerPass123!');
    console.log(' Executive 1:   executive1@crm.com / ExecutivePass123!');
    console.log(' Executive 2:   executive2@crm.com / ExecutivePass123!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
