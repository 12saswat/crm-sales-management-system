import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { parseQueryParams, buildPaginationMeta } from '../utils/queryHelper.js';


export const createUser = async (userData) => {
  const existing = await User.findOne({ email: userData.email.toLowerCase() });
  if (existing) {
    throw new ApiError(400, 'User with this email already exists');
  }

  if (userData.manager) {
    const mgr = await User.findById(userData.manager);
    if (!mgr || !mgr.isActive) {
      throw new ApiError(400, 'Assigned manager is invalid or inactive');
    }
  }

  const user = await User.create(userData);
  return await user.populate('manager', 'name email role');
};

export const getUsers = async (queryParams) => {
  const { filterQuery, sortOptions, page, limit, skip } = parseQueryParams(queryParams, {
    searchFields: ['name', 'email', 'phone'],
    allowedFilters: ['role', 'isActive', 'manager'],
    defaultSort: '-createdAt',
  });

  const [users, totalRecords] = await Promise.all([
    User.find(filterQuery)
      .populate('manager', 'name email role')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    User.countDocuments(filterQuery),
  ]);

  const meta = buildPaginationMeta(page, limit, totalRecords);
  return { users, meta };
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId).populate('manager', 'name email role');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

export const updateUser = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (updateData.email && updateData.email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: updateData.email.toLowerCase() });
    if (existing) {
      throw new ApiError(400, 'Email is already taken by another user');
    }
  }

  if (updateData.manager) {
    const mgr = await User.findById(updateData.manager);
    if (!mgr || !mgr.isActive) {
      throw new ApiError(400, 'Assigned manager is invalid or inactive');
    }
  }

  Object.assign(user, updateData);
  await user.save();
  return await user.populate('manager', 'name email role');
};


export const toggleUserStatus = async (userId, isActive) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.isActive = isActive;
  await user.save();
  return user;
};

export const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  await User.findByIdAndDelete(userId);
  return true;
};

export const UserService = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
};
