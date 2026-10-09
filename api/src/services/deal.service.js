import { Deal } from '../models/Deal.js';
import { Customer } from '../models/Customer.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { parseQueryParams, buildPaginationMeta } from '../utils/queryHelper.js';
import { applyRoleScope, checkDocumentOwnership } from '../middleware/rbac.middleware.js';
import { logEvent } from './timeline.service.js';
import { DEAL_STAGES, ENTITY_TYPES, TIMELINE_ACTIONS, ROLES } from '../config/constants.js';


export const createDeal = async (dealData, currentUser) => {
  const customer = await Customer.findById(dealData.customer);
  if (!customer) {
    throw new ApiError(404, 'Associated customer not found');
  }

  const assignedUserId = dealData.assignedTo || currentUser._id;
  const assignedUser = await User.findById(assignedUserId);
  if (!assignedUser || !assignedUser.isActive) {
    throw new ApiError(400, 'Assigned sales executive is invalid or inactive');
  }

  const deal = await Deal.create({
    ...dealData,
    assignedTo: assignedUserId,
  });

  // Audit log
  await logEvent({
    action: TIMELINE_ACTIONS.DEAL_CREATED,
    entityType: ENTITY_TYPES.DEAL,
    entityId: deal._id,
    performedBy: currentUser._id,
    newValue: { name: deal.name, value: deal.value, stage: deal.stage },
    details: `Deal created for customer ${customer.name}`,
  });

  return await deal.populate([
    { path: 'customer', select: 'name email company' },
    { path: 'lead', select: 'name email status' },
    { path: 'assignedTo', select: 'name email role' },
  ]);
};


export const getDeals = async (queryParams, currentUser) => {
  const { filterQuery, sortOptions, page, limit, skip } = parseQueryParams(queryParams, {
    searchFields: ['name', 'description'],
    allowedFilters: ['stage', 'assignedTo', 'customer', 'lead'],
    defaultSort: '-createdAt',
  });

  const scopedFilter = applyRoleScope({ user: currentUser }, filterQuery, 'assignedTo');

  const [deals, totalRecords] = await Promise.all([
    Deal.find(scopedFilter)
      .populate('customer', 'name email company')
      .populate('lead', 'name email status')
      .populate('assignedTo', 'name email role')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Deal.countDocuments(scopedFilter),
  ]);

  const meta = buildPaginationMeta(page, limit, totalRecords);
  return { deals, meta };
};

export const getDealById = async (dealId, currentUser) => {
  const deal = await Deal.findById(dealId)
    .populate('customer', 'name email company')
    .populate('lead', 'name email status')
    .populate('assignedTo', 'name email role');

  if (!deal) {
    throw new ApiError(404, 'Deal not found');
  }

  checkDocumentOwnership(deal, currentUser, 'assignedTo');
  return deal;
};

export const updateDeal = async (dealId, updateData, currentUser) => {
  const deal = await Deal.findById(dealId);
  if (!deal) {
    throw new ApiError(404, 'Deal not found');
  }

  checkDocumentOwnership(deal, currentUser, 'assignedTo');

  const prevStage = deal.stage;
  const isClosedStage = prevStage === DEAL_STAGES.WON || prevStage === DEAL_STAGES.LOST;

  // Business Rule: Closed deal cannot freely move back to active stage unless user is Admin or Sales Manager
  if (
    isClosedStage &&
    updateData.stage &&
    updateData.stage !== prevStage &&
    currentUser.role === ROLES.SALES_EXECUTIVE
  ) {
    throw new ApiError(
      403,
      `Closed deal in stage '${prevStage}' cannot be moved back to active stage without Manager approval`
    );
  }

  // Business Rule: Lost deal MUST have a lost reason
  if (updateData.stage === DEAL_STAGES.LOST) {
    const reason = updateData.lostReason || deal.lostReason;
    if (!reason || reason.trim() === '') {
      throw new ApiError(400, 'A valid reason is required when marking a deal as Lost');
    }
  }

  // Business Rule: Won deal validation
  if (updateData.stage === DEAL_STAGES.WON) {
    if ((updateData.value !== undefined && updateData.value <= 0) || deal.value <= 0) {
      throw new ApiError(400, 'A Won deal must have a value greater than zero');
    }
    // Auto set probability to 100 for Won deals
    updateData.probability = 100;
  }

  // Handle reassignment audit
  if (updateData.assignedTo && updateData.assignedTo.toString() !== deal.assignedTo.toString()) {
    const newAssignedUser = await User.findById(updateData.assignedTo);
    if (!newAssignedUser || !newAssignedUser.isActive) {
      throw new ApiError(400, 'Cannot reassign deal to an invalid or inactive user');
    }
    await logEvent({
      action: TIMELINE_ACTIONS.DEAL_ASSIGNED,
      entityType: ENTITY_TYPES.DEAL,
      entityId: deal._id,
      performedBy: currentUser._id,
      previousValue: deal.assignedTo,
      newValue: updateData.assignedTo,
      details: `Deal reassigned to ${newAssignedUser.name}`,
    });
  }

  Object.assign(deal, updateData);
  await deal.save();

  // Stage change audit log
  if (updateData.stage && updateData.stage !== prevStage) {
    let action = TIMELINE_ACTIONS.DEAL_STAGE_CHANGED;
    if (updateData.stage === DEAL_STAGES.WON) action = TIMELINE_ACTIONS.DEAL_WON;
    if (updateData.stage === DEAL_STAGES.LOST) action = TIMELINE_ACTIONS.DEAL_LOST;

    await logEvent({
      action,
      entityType: ENTITY_TYPES.DEAL,
      entityId: deal._id,
      performedBy: currentUser._id,
      previousValue: prevStage,
      newValue: updateData.stage,
      details: `Deal stage changed from '${prevStage}' to '${updateData.stage}'`,
    });
  }

  return await deal.populate([
    { path: 'customer', select: 'name email company' },
    { path: 'lead', select: 'name email status' },
    { path: 'assignedTo', select: 'name email role' },
  ]);
};

export const deleteDeal = async (dealId, currentUser) => {
  const deal = await Deal.findById(dealId);
  if (!deal) {
    throw new ApiError(404, 'Deal not found');
  }

  checkDocumentOwnership(deal, currentUser, 'assignedTo');
  await Deal.findByIdAndDelete(dealId);
  return true;
};

export const DealService = {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  deleteDeal,
};
