import { Router } from 'express';
import {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  deleteDeal,
} from '../controllers/deal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validate } from '../validators/validate.middleware.js';
import { createDealSchema, updateDealSchema } from '../validators/deal.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

router.route('/')
  .post(validate(createDealSchema), createDeal)
  .get(getDeals);

router.route('/:id')
  .get(getDealById)
  .put(validate(updateDealSchema), updateDeal)
  .delete(authorizeRoles(ROLES.ADMIN, ROLES.SALES_MANAGER), deleteDeal);

export default router;
