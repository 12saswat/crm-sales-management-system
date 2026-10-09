import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract token from Authorization header or Cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, 'Authentication failed. Access token is missing');
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // 3. Check user existence & active status
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, 'User associated with this token no longer exists');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'User account is inactive. Please contact your administrator.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Invalid or expired authentication token');
  }
});
