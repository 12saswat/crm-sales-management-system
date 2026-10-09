import { TimelineService } from '../services/timeline.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getEntityTimeline = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const timeline = await TimelineService.getEntityTimeline(entityType, entityId);
  return ApiResponse.success(res, 200, `Timeline audit history fetched for ${entityType}`, timeline);
});
