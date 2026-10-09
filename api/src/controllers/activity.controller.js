import { ActivityService } from '../services/activity.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createActivity = asyncHandler(async (req, res) => {
  const activity = await ActivityService.createActivity(req.body, req.user);
  return ApiResponse.created(res, 'Activity created successfully', activity);
});

export const getActivities = asyncHandler(async (req, res) => {
  const { activities, meta } = await ActivityService.getActivities(req.query, req.user);
  return ApiResponse.success(res, 200, 'Activities fetched successfully', activities, meta);
});

export const getActivityById = asyncHandler(async (req, res) => {
  const activity = await ActivityService.getActivityById(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Activity details fetched successfully', activity);
});

export const updateActivity = asyncHandler(async (req, res) => {
  const activity = await ActivityService.updateActivity(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 200, 'Activity updated successfully', activity);
});

export const markCompleted = asyncHandler(async (req, res) => {
  const activity = await ActivityService.markCompleted(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Activity marked as completed successfully', activity);
});

export const deleteActivity = asyncHandler(async (req, res) => {
  await ActivityService.deleteActivity(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Activity deleted successfully');
});
