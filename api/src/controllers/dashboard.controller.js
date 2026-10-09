import { DashboardService } from '../services/dashboard.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getOverviewMetrics = asyncHandler(async (req, res) => {
  const metrics = await DashboardService.getOverviewMetrics(req.user);
  return ApiResponse.success(res, 200, 'Sales dashboard overview metrics fetched successfully', metrics);
});

export const getPipelineMetrics = asyncHandler(async (req, res) => {
  const pipeline = await DashboardService.getPipelineMetrics(req.user);
  return ApiResponse.success(res, 200, 'Sales pipeline stage metrics fetched successfully', pipeline);
});

export const getTeamPerformance = asyncHandler(async (req, res) => {
  const performance = await DashboardService.getTeamPerformance(req.user);
  return ApiResponse.success(res, 200, 'Team performance analytics fetched successfully', performance);
});
