import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config/env.js';

const cookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'lax',
  maxAge: config.cookieExpiresInDays * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await AuthService.registerUser(req.body);
  res.cookie('token', token, cookieOptions);
  return ApiResponse.created(res, 'User registered successfully', { user, token });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await AuthService.loginUser(req.body);
  res.cookie('token', token, cookieOptions);
  return ApiResponse.success(res, 200, 'User logged in successfully', { user, token });
});

export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', { ...cookieOptions, maxAge: 0 });
  return ApiResponse.success(res, 200, 'User logged out successfully');
});

export const getProfile = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 200, 'User profile retrieved successfully', req.user);
});

export const changePassword = asyncHandler(async (req, res) => {
  await AuthService.changePassword(req.user._id, req.body);
});
