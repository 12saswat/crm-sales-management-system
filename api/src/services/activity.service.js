import { Activity } from '../models/Activity.js';
import { User } from '../models/User.js';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Deal } from '../models/Deal.js';
import { ApiError } from '../utils/ApiError.js';
import { parseQueryParams, buildPaginationMeta } from '../utils/queryHelper.js';
import { applyRoleScope, checkDocumentOwnership, getTeamUserIds } from '../middleware/rbac.middleware.js';
import { logEvent } from './timeline.service.js';
import { ACTIVITY_STATUSES, ACTIVITY_TYPES, ENTITY_TYPES, TIMELINE_ACTIONS, ROLES } from '../config/constants.js';

export const validateEntity = async (entityType, entityId, currentUser = null) => {
  let entity = null;
  if (entityType === ENTITY_TYPES.LEAD) entity = await Lead.findById(entityId);
  if (entityType === ENTITY_TYPES.CUSTOMER) entity = await Customer.findById(entityId);
  if (entityType === ENTITY_TYPES.DEAL) entity = await Deal.findById(entityId);
  if (entityType === ENTITY_TYPES.USER) entity = await User.findById(entityId);

  if (!entity) {
    throw new ApiError(404, `Associated ${entityType} entity with ID '${entityId}' not found`);
  }

  if (currentUser) {
    if (entityType === ENTITY_TYPES.USER) {
      if (currentUser.role !== ROLES.ADMIN && currentUser._id.toString() !== entityId.toString()) {
        throw new ApiError(403, 'Forbidden: You do not have permission to attach activities to this user');
      }
    } else {
      await checkDocumentOwnership(entity, currentUser, 'assignedTo');
    }
  }

  return entity;
};

export const createActivity = async (activityData, currentUser) => {
  await validateEntity(activityData.entityType, activityData.entityId, currentUser);


  let assignedUserId = activityData.assignedTo || currentUser._id;
  if (currentUser.role === ROLES.SALES_EXECUTIVE) {
    assignedUserId = currentUser._id;
  } else if (currentUser.role === ROLES.SALES_MANAGER && activityData.assignedTo) {
    const teamUserIds = await getTeamUserIds(currentUser);
    const teamIdStrings = teamUserIds.map((id) => id.toString());
    if (!teamIdStrings.includes(activityData.assignedTo.toString())) {
      throw new ApiError(403, 'Sales Managers can only assign activities to executives within their team');
    }
  }

  const assignedUser = await User.findById(assignedUserId);
  if (!assignedUser || !assignedUser.isActive) {
    throw new ApiError(400, 'Assigned user is invalid or inactive');
  }

  const activity = await Activity.create({
    ...activityData,
    assignedTo: assignedUserId,
    createdBy: currentUser._id,
  });

  let action = TIMELINE_ACTIONS.ACTIVITY_CREATED;
  if (activityData.type === ACTIVITY_TYPES.NOTE) action = TIMELINE_ACTIONS.NOTE_ADDED;
  if (activityData.type === ACTIVITY_TYPES.FOLLOW_UP) action = TIMELINE_ACTIONS.FOLLOW_UP_CREATED;

  await logEvent({
    action,
    entityType: activityData.entityType,
    entityId: activityData.entityId,
    performedBy: currentUser._id,
    newValue: { type: activity.type, title: activity.title, dueDate: activity.dueDate },
    details: `${activity.type} added: "${activity.title}"`,
  });

  return await activity.populate([
    { path: 'assignedTo', select: 'name email role' },
    { path: 'createdBy', select: 'name email' },
  ]);
};

export const getActivities = async (queryParams, currentUser) => {
  const { filterQuery, sortOptions, page, limit, skip } = parseQueryParams(queryParams, {
    searchFields: ['title', 'description'],
    allowedFilters: ['type', 'status', 'assignedTo', 'entityType', 'entityId'],
    defaultSort: 'dueDate',
  });

  const scopedFilter = await applyRoleScope({ user: currentUser }, filterQuery, 'assignedTo');

  // Fix Overdue & Pending query filtering (Overdue is dynamically evaluated from pending activities whose dueDate has passed)
  const statusParam = queryParams.status ? queryParams.status.toString().toLowerCase() : null;

  if (statusParam === 'overdue' || queryParams.isOverdue === 'true') {
    delete scopedFilter.status;
    scopedFilter.status = ACTIVITY_STATUSES.PENDING;
    scopedFilter.dueDate = { $lt: new Date() };
  } else if (statusParam === 'pending') {
    delete scopedFilter.status;
    scopedFilter.status = ACTIVITY_STATUSES.PENDING;
    scopedFilter.dueDate = { $gte: new Date() };
  } else if (statusParam === 'completed') {
    delete scopedFilter.status;
    scopedFilter.status = ACTIVITY_STATUSES.COMPLETED;
  }

  const [rawActivities, totalRecords] = await Promise.all([
    Activity.find(scopedFilter)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Activity.countDocuments(scopedFilter),
  ]);

  // Update overdue status dynamically in response
  const activities = rawActivities.map((act) => {
    const json = act.toJSON();
    if (json.status === ACTIVITY_STATUSES.PENDING && new Date(json.dueDate) < new Date()) {
      json.status = ACTIVITY_STATUSES.OVERDUE;
    }
    return json;
  });

  const meta = buildPaginationMeta(page, limit, totalRecords);
  return { activities, meta };
};

export const getActivityById = async (activityId, currentUser) => {
  const activity = await Activity.findById(activityId)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email');

  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  await checkDocumentOwnership(activity, currentUser, 'assignedTo');

  const json = activity.toJSON();
  if (json.status === ACTIVITY_STATUSES.PENDING && new Date(json.dueDate) < new Date()) {
    json.status = ACTIVITY_STATUSES.OVERDUE;
  }

  return json;
};

export const updateActivity = async (activityId, updateData, currentUser) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  await checkDocumentOwnership(activity, currentUser, 'assignedTo');

  const wasCompleted = activity.status === ACTIVITY_STATUSES.COMPLETED;
  const isNowCompleted = updateData.status === ACTIVITY_STATUSES.COMPLETED;

  if (isNowCompleted && !wasCompleted) {
    updateData.completedAt = new Date();
  }

  Object.assign(activity, updateData);
  await activity.save();

  if (isNowCompleted && !wasCompleted) {
    const isFollowUp = activity.type === ACTIVITY_TYPES.FOLLOW_UP;
    const action = isFollowUp ? TIMELINE_ACTIONS.FOLLOW_UP_COMPLETED : TIMELINE_ACTIONS.ACTIVITY_COMPLETED;
    const actionName = isFollowUp ? 'Follow-up' : 'Activity';

    await logEvent({
      action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      performedBy: currentUser._id,
      newValue: { status: ACTIVITY_STATUSES.COMPLETED, completedAt: updateData.completedAt },
      details: `${actionName} "${activity.title}" marked as completed`,
    });
  }

  return await activity.populate([
    { path: 'assignedTo', select: 'name email role' },
    { path: 'createdBy', select: 'name email' },
  ]);
};

export const markCompleted = async (activityId, currentUser) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  await checkDocumentOwnership(activity, currentUser, 'assignedTo');

  activity.status = ACTIVITY_STATUSES.COMPLETED;
  activity.completedAt = new Date();
  await activity.save();

  // Spec: Completing a follow-up logs Follow-up Completed
  const isFollowUp = activity.type === ACTIVITY_TYPES.FOLLOW_UP;
  const action = isFollowUp ? TIMELINE_ACTIONS.FOLLOW_UP_COMPLETED : TIMELINE_ACTIONS.ACTIVITY_COMPLETED;
  const actionName = isFollowUp ? 'Follow-up' : 'Activity';

  await logEvent({
    action,
    entityType: activity.entityType,
    entityId: activity.entityId,
    performedBy: currentUser._id,
    newValue: { status: ACTIVITY_STATUSES.COMPLETED, completedAt: activity.completedAt },
    details: `${actionName} "${activity.title}" marked as completed`,
  });

  return await activity.populate([
    { path: 'assignedTo', select: 'name email role' },
    { path: 'createdBy', select: 'name email' },
  ]);
};

export const deleteActivity = async (activityId, currentUser) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  await checkDocumentOwnership(activity, currentUser, 'assignedTo');
  await Activity.findByIdAndDelete(activityId);
  return true;
};

export const ActivityService = {
  validateEntity,
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  markCompleted,
  deleteActivity,
};

