import { Timeline } from '../models/Timeline.js';


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

export const getEntityTimeline = async (entityType, entityId) => {
  return await Timeline.find({ entityType, entityId })
    .populate('performedBy', 'name email role')
    .sort({ timestamp: -1 });
};

export const TimelineService = {
  logEvent,
  getEntityTimeline,
};
