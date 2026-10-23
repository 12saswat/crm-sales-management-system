import { ConfigService } from '../services/config.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getConfig = asyncHandler(async (req, res) => {
  const config = await ConfigService.getConfig();
  return ApiResponse.success(res, 200, 'CRM configuration fetched successfully', config);
});

export const updateConfig = asyncHandler(async (req, res) => {
  const updated = await ConfigService.updateConfig(req.body, req.user);
  return ApiResponse.success(res, 200, 'CRM configuration updated successfully', updated);
});
