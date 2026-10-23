import { Timeline } from '../models/Timeline.js';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Deal } from '../models/Deal.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { checkDocumentOwnership } from '../middleware/rbac.middleware.js';
import { ENTITY_TYPES, ROLES } from '../config/constants.js';

export const logEvent = async ({
  action,
  entityType,
  entityId,
  performedBy,
  previousValue = null,
  newValue = null,
  details = '',
  session = null,
}) => {
  const entryData = {
    action,
    entityType,
    entityId,
    performedBy,
    previousValue,
    newValue,
    details,
    timestamp: new Date(),
  };

  if (session) {
    const [entry] = await Timeline.create([entryData], { session });
    return entry;
  }

  return await Timeline.create(entryData);
};

export const getEntityTimeline = async (entityType, entityId, currentUser) => {
  let entity = null;
  if (entityType === ENTITY_TYPES.LEAD) entity = await Lead.findById(entityId);
  else if (entityType === ENTITY_TYPES.CUSTOMER) entity = await Customer.findById(entityId);
  else if (entityType === ENTITY_TYPES.DEAL) entity = await Deal.findById(entityId);
  else if (entityType === ENTITY_TYPES.USER) entity = await User.findById(entityId);

  if (!entity) {
    throw new ApiError(404, `${entityType} with ID '${entityId}' not found`);
  }

  if (entityType === ENTITY_TYPES.USER) {
    if (currentUser && currentUser.role !== ROLES.ADMIN && currentUser._id.toString() !== entityId.toString()) {
      throw new ApiError(403, 'Forbidden: You do not have permission to access this user audit trail');
    }
  } else if (currentUser) {
    await checkDocumentOwnership(entity, currentUser, 'assignedTo');
  }

  return await Timeline.find({ entityType, entityId })
    .populate('performedBy', 'name email role')
    .sort({ timestamp: -1 });
};

export const TimelineService = {
  logEvent,
  getEntityTimeline,
};

