import { DealService } from '../services/deal.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createDeal = asyncHandler(async (req, res) => {
  const deal = await DealService.createDeal(req.body, req.user);
  return ApiResponse.created(res, 'Deal created successfully', deal);
});

export const getDeals = asyncHandler(async (req, res) => {
  const { deals, meta } = await DealService.getDeals(req.query, req.user);
  return ApiResponse.success(res, 200, 'Deals fetched successfully', deals, meta);
});

export const getDealById = asyncHandler(async (req, res) => {
  const deal = await DealService.getDealById(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Deal details fetched successfully', deal);
});

export const updateDeal = asyncHandler(async (req, res) => {
  const deal = await DealService.updateDeal(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 200, 'Deal updated successfully', deal);
});

export const deleteDeal = asyncHandler(async (req, res) => {
  await DealService.deleteDeal(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Deal deleted successfully');
});
