import mongoose from 'mongoose';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Deal } from '../models/Deal.js';
import { Timeline } from '../models/Timeline.js';
import { ApiError } from '../utils/ApiError.js';
import { logEvent } from './timeline.service.js';
import { checkDocumentOwnership } from '../middleware/rbac.middleware.js';
import { LEAD_STATUSES, CUSTOMER_STATUSES, DEAL_STAGES, ENTITY_TYPES, TIMELINE_ACTIONS } from '../config/constants.js';

/**
 * Safely convert a qualified lead into a Customer (and optionally a Deal)
 */
export const convertLead = async (leadId, conversionParams = {}, currentUser) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  await checkDocumentOwnership(lead, currentUser, 'assignedTo');

  if (lead.isConverted || lead.status === LEAD_STATUSES.CONVERTED) {
    throw new ApiError(400, 'Lead has already been converted and cannot be converted again');
  }

  // Spec: Only a qualified lead can be converted
  if (lead.status !== LEAD_STATUSES.QUALIFIED) {
    throw new ApiError(400, `Only qualified leads can be converted. Current status: '${lead.status}'`);
  }

  // Try transaction session first
  let session = null;
  let useTransaction = false;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (e) {
    // Standalone MongoDB without replica set - clean up opened session
    if (session) {
      try {
        await session.endSession();
      } catch (_) {}
    }
    session = null;
    useTransaction = false;
  }

  let customer = null;
  let deal = null;
  const createdTimelineIds = [];

  try {
    // 1. Create Customer
    const customerData = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      address: conversionParams.customerAddress || '',
      originalLead: lead._id,
      assignedTo: lead.assignedTo,
      status: CUSTOMER_STATUSES.ACTIVE,
    };

    if (useTransaction) {
      const [c] = await Customer.create([customerData], { session });
      customer = c;
    } else {
      customer = await Customer.create(customerData);
    }

    // 2. Create Deal if requested (default: true)
    let shouldCreateDeal = conversionParams.createDeal !== false;

    if (shouldCreateDeal) {
      const dealData = {
        name: conversionParams.dealName || `${lead.company || lead.name} Deal`,
        lead: lead._id,
        customer: customer._id,
        assignedTo: lead.assignedTo,
        value: conversionParams.dealValue || 1000,
        probability: conversionParams.dealProbability !== undefined ? conversionParams.dealProbability : 50,
        expectedClosingDate: conversionParams.expectedClosingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stage: DEAL_STAGES.QUALIFICATION,
        description: `Created automatically from Lead Conversion (${lead.name})`,
      };

      if (useTransaction) {
        const [d] = await Deal.create([dealData], { session });
        deal = d;
      } else {
        deal = await Deal.create(dealData);
      }
    }

    // 3. Update Lead Status
    lead.status = LEAD_STATUSES.CONVERTED;
    lead.isConverted = true;
    lead.convertedAt = new Date();
    lead.convertedToCustomer = customer._id;
    if (deal) lead.convertedToDeal = deal._id;

    if (useTransaction) {
      await lead.save({ session });
    } else {
      await lead.save();
    }

    // 4. Log Timeline Events
    const tCustomer = await logEvent({
      action: TIMELINE_ACTIONS.CUSTOMER_CREATED,
      entityType: ENTITY_TYPES.CUSTOMER,
      entityId: customer._id,
      performedBy: currentUser._id,
      newValue: { name: customer.name, email: customer.email },
      details: `Customer created from Lead Conversion (${lead.name})`,
      session: useTransaction ? session : null,
    });
    if (tCustomer?._id) createdTimelineIds.push(tCustomer._id);

    if (deal) {
      const tDeal = await logEvent({
        action: TIMELINE_ACTIONS.DEAL_CREATED,
        entityType: ENTITY_TYPES.DEAL,
        entityId: deal._id,
        performedBy: currentUser._id,
        newValue: { name: deal.name, value: deal.value, stage: deal.stage },
        details: `Deal created from Lead Conversion`,
        session: useTransaction ? session : null,
      });
      if (tDeal?._id) createdTimelineIds.push(tDeal._id);
    }

    const tLead = await logEvent({
      action: TIMELINE_ACTIONS.LEAD_CONVERTED,
      entityType: ENTITY_TYPES.LEAD,
      entityId: lead._id,
      performedBy: currentUser._id,
      newValue: { customerId: customer._id, dealId: deal ? deal._id : null },
      details: `Lead successfully converted to Customer${deal ? ' and Deal' : ''}`,
      session: useTransaction ? session : null,
    });
    if (tLead?._id) createdTimelineIds.push(tLead._id);

    if (useTransaction && session) {
      await session.commitTransaction();
      session.endSession();
    }

    return {
      lead,
      customer,
      deal,
    };
  } catch (error) {
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
      } catch (_) {}
      try {
        session.endSession();
      } catch (_) {}
    } else {
      // Compensating rollback for standalone MongoDB
      if (deal?._id) {
        try {
          await Deal.findByIdAndDelete(deal._id);
        } catch (_) {}
      }
      if (customer?._id) {
        try {
          await Customer.findByIdAndDelete(customer._id);
        } catch (_) {}
      }
      if (createdTimelineIds.length > 0) {
        try {
          await Timeline.deleteMany({ _id: { $in: createdTimelineIds } });
        } catch (_) {}
      }

      // Revert lead in-memory changes
      lead.status = LEAD_STATUSES.QUALIFIED;
      lead.isConverted = false;
      lead.convertedAt = undefined;
      lead.convertedToCustomer = undefined;
      lead.convertedToDeal = undefined;
      try {
        await lead.save();
      } catch (_) {}
    }
    throw error;
  }
};

export const LeadConversionService = {
  convertLead,
};

