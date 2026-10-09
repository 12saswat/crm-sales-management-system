import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';

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

export const applyRoleScope = (req, baseFilter = {}, assignedField = 'assignedTo') => {
  const queryFilter = { ...baseFilter };

  if (req.user.role === ROLES.SALES_EXECUTIVE) {
    queryFilter[assignedField] = req.user._id;
  }

  return queryFilter;
};

/**
 * Checks if current user has permission to view or mutate a single document.
 */
// export const checkDocumentOwnership = (doc, user, assignedField = "assignedTo") => {


//   if (user.role === ROLES.ADMIN || user.role === ROLES.SALES_MANAGER) {
//     return true;
//   }

//   const assignedId = doc[assignedField] ? doc[assignedField].toString() : null;
//   const userId = user._id.toString();

//   console.log({
//     assignedField,
//     assignedId,
//     userId,
//     equal: assignedId._id === userId,
//   });

//   if (assignedId !== userId) {
//     throw new ApiError(403, 'Forbidden: You do not have permission to access or modify this resource');
//   }

//   return true;
// };



export const checkDocumentOwnership = (
  doc,
  user,
  assignedField = "assignedTo"
) => {
  if (
    user.role === ROLES.ADMIN ||
    user.role === ROLES.SALES_MANAGER
  ) {
    return true;
  }

  const assignedValue = doc[assignedField];

  const assignedId = assignedValue?._id
    ? assignedValue._id.toString()
    : assignedValue?.toString() ?? null;

  const userId = user._id.toString();

  if (assignedId !== userId) {
    throw new ApiError(
      403,
      "Forbidden: You do not have permission to access or modify this resource"
    );
  }

  return true;
};