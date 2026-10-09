import { Router } from 'express';
import {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  markCompleted,
  deleteActivity,
} from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validate } from '../validators/validate.middleware.js';
import { createActivitySchema, updateActivitySchema } from '../validators/activity.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

router.route('/')
  .post(validate(createActivitySchema), createActivity)
  .get(getActivities);

router.route('/:id')
  .get(getActivityById)
  .put(validate(updateActivitySchema), updateActivity)
  .delete(authorizeRoles(ROLES.ADMIN, ROLES.SALES_MANAGER), deleteActivity);

router.patch('/:id/complete', markCompleted);

export default router;
