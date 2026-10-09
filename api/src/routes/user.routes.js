import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validate } from '../validators/validate.middleware.js';
import { createUserSchema, updateUserSchema, toggleUserStatusSchema } from '../validators/user.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Protect all routes with JWT Auth & Admin Authorization
router.use(authenticate, authorizeRoles(ROLES.ADMIN));

router.route('/')
  .post(validate(createUserSchema), createUser)
  .get(getUsers);

router.route('/:id')
  .get(getUserById)
  .put(validate(updateUserSchema), updateUser)
  .delete(deleteUser);

router.patch('/:id/status', validate(toggleUserStatusSchema), toggleUserStatus);

export default router;
