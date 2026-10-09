import { Activity } from '../models/Activity.js';
import { User } from '../models/User.js';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Deal } from '../models/Deal.js';
import { ApiError } from '../utils/ApiError.js';
import { parseQueryParams, buildPaginationMeta } from '../utils/queryHelper.js';
import { applyRoleScope, checkDocumentOwnership } from '../middleware/rbac.middleware.js';
import { logEvent } from './timeline.service.js';
import { ACTIVITY_STATUSES, ACTIVITY_TYPES, ENTITY_TYPES, TIMELINE_ACTIONS } from '../config/constants.js';



export const validateEntity = async (entityType, entityId) => {
  let entity = null;
  if (entityType === ENTITY_TYPES.LEAD) entity = await Lead.findById(entityId);
  if (entityType === ENTITY_TYPES.CUSTOMER) entity = await Customer.findById(entityId);
  if (entityType === ENTITY_TYPES.DEAL) entity = await Deal.findById(entityId);
  if (entityType === ENTITY_TYPES.USER) entity = await User.findById(entityId);

  if (!entity) {
    throw new ApiError(404, `Associated ${entityType} entity with ID '${entityId}' not found`);
  }
  return entity;
};

export const createActivity = async (activityData, currentUser) => {
  await validateEntity(activityData.entityType, activityData.entityId);

  const assignedUserId = activityData.assignedTo || currentUser._id;
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

  const scopedFilter = applyRoleScope({ user: currentUser }, filterQuery, 'assignedTo');

  // Handle dynamic Overdue query filtering
  if (queryParams.isOverdue === 'true') {
    scopedFilter.status = ACTIVITY_STATUSES.PENDING;
    scopedFilter.dueDate = { $lt: new Date() };
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

  checkDocumentOwnership(activity, currentUser, 'assignedTo');

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

  checkDocumentOwnership(activity, currentUser, 'assignedTo');

  if (updateData.status === ACTIVITY_STATUSES.COMPLETED && activity.status !== ACTIVITY_STATUSES.COMPLETED) {
    updateData.completedAt = new Date();
  }

  Object.assign(activity, updateData);
  await activity.save();

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

  checkDocumentOwnership(activity, currentUser, 'assignedTo');

  activity.status = ACTIVITY_STATUSES.COMPLETED;
  activity.completedAt = new Date();
  await activity.save();

  await logEvent({
    action: TIMELINE_ACTIONS.ACTIVITY_COMPLETED,
    entityType: activity.entityType,
    entityId: activity.entityId,
    performedBy: currentUser._id,
    newValue: { status: ACTIVITY_STATUSES.COMPLETED, completedAt: activity.completedAt },
    details: `Activity "${activity.title}" marked as completed`,
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

  checkDocumentOwnership(activity, currentUser, 'assignedTo');
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
