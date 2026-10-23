import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';
import { User } from '../models/User.js';

/**
 * Middleware to authorize specific user roles.
 * @param  {...string} roles 
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'User is not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Forbidden: Role '${req.user.role}' is not authorized to perform this action`
        )
      );
    }

    next();
  };
};

/**
 * Returns all user IDs that fall within the scope of the given user:
 * - Admin: null (unrestricted scope)
 * - Sales Manager: [manager._id, ...all executives reporting to this manager]
 * - Sales Executive: [executive._id]
 */
export const getTeamUserIds = async (user) => {
  if (user.role === ROLES.ADMIN) {
    return null;
  }
  if (user.role === ROLES.SALES_EXECUTIVE) {
    return [user._id];
  }
  if (user.role === ROLES.SALES_MANAGER) {
    const subordinates = await User.find({ manager: user._id }).select('_id');
    return [user._id, ...subordinates.map((s) => s._id)];
  }
  return [user._id];
};

export const applyRoleScope = async (reqOrUser, baseFilter = {}, assignedField = 'assignedTo') => {
  const user = reqOrUser?.user || reqOrUser;
  const queryFilter = { ...baseFilter };

  if (!user || user.role === ROLES.ADMIN) {
    return queryFilter;
  }

  if (user.role === ROLES.SALES_EXECUTIVE) {
    queryFilter[assignedField] = user._id;
    return queryFilter;
  }

  if (user.role === ROLES.SALES_MANAGER) {
    const teamUserIds = await getTeamUserIds(user);
    if (queryFilter[assignedField]) {
      const requestedId = queryFilter[assignedField]?.toString();
      const allowedStrings = teamUserIds.map((id) => id.toString());
      if (!allowedStrings.includes(requestedId)) {
        queryFilter[assignedField] = { $in: [] };
      }
    } else {
      queryFilter[assignedField] = { $in: [...teamUserIds, null] };
    }
    return queryFilter;
  }

  return queryFilter;
};

export const checkDocumentOwnership = async (
  doc,
  user,
  assignedField = "assignedTo"
) => {
  if (user.role === ROLES.ADMIN) {
    return true;
  }

  const assignedValue = doc[assignedField];
  const assignedId = assignedValue?._id
    ? assignedValue._id.toString()
    : assignedValue?.toString() ?? null;

  if (user.role === ROLES.SALES_MANAGER) {
    if (!assignedId) {
      return true;
    }
    const teamUserIds = await getTeamUserIds(user);
    const teamIdStrings = teamUserIds.map((id) => id.toString());
    if (teamIdStrings.includes(assignedId)) {
      return true;
    }
    throw new ApiError(
      403,
      "Forbidden: You do not have permission to access or modify resources outside your team"
    );
  }

  const userId = user._id.toString();
  if (assignedId !== userId) {
    throw new ApiError(
      403,
      "Forbidden: You do not have permission to access or modify this resource"
    );
  }

  return true;
};