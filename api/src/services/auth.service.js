import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';


export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

export const registerUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }

  // Security: Public registration is strictly restricted to Sales Executive
  if (userData.role && userData.role !== 'Sales Executive') {
    throw new ApiError(403, 'Public registration is restricted to Sales Executive role only. Management accounts must be created by an administrator.');
  }
  userData.role = 'Sales Executive';

  const user = await User.create(userData);
  const token = generateToken(user);
  return { user, token };
};


export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Please contact your administrator.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user);
  const userJson = user.toJSON();
  return { user: userJson, token };
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  return true;
};

export const AuthService = {
  generateToken,
  registerUser,
  loginUser,
  changePassword,
};
