import { CustomerService } from '../services/customer.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await CustomerService.createCustomer(req.body, req.user);
  return ApiResponse.created(res, 'Customer created successfully', customer);
});

export const getCustomers = asyncHandler(async (req, res) => {
  const { customers, meta } = await CustomerService.getCustomers(req.query, req.user);
  return ApiResponse.success(res, 200, 'Customers fetched successfully', customers, meta);
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await CustomerService.getCustomerById(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Customer details fetched successfully', customer);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await CustomerService.updateCustomer(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 200, 'Customer updated successfully', customer);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  await CustomerService.deleteCustomer(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Customer deleted successfully');
});
