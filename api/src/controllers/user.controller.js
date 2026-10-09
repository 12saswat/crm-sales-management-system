import { UserService } from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createUser = asyncHandler(async (req, res) => {
  const user = await UserService.createUser(req.body);
  return ApiResponse.created(res, 'User created successfully', user);
});

export const getUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await UserService.getUsers(req.query);
  return ApiResponse.success(res, 200, 'Users fetched successfully', users, meta);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(req.params.id);
  return ApiResponse.success(res, 200, 'User fetched successfully', user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await UserService.updateUser(req.params.id, req.body);
  return ApiResponse.success(res, 200, 'User updated successfully', user);
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await UserService.toggleUserStatus(req.params.id, req.body.isActive);
  return ApiResponse.success(
    res,
    200,
    `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    user
  );
});

export const deleteUser = asyncHandler(async (req, res) => {
  await UserService.deleteUser(req.params.id);
  return ApiResponse.success(res, 200, 'User deleted successfully');
});
