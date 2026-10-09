import { Router } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validate } from '../validators/validate.middleware.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

router.route('/')
  .post(validate(createCustomerSchema), createCustomer)
  .get(getCustomers);

router.route('/:id')
  .get(getCustomerById)
  .put(validate(updateCustomerSchema), updateCustomer)
  .delete(authorizeRoles(ROLES.ADMIN, ROLES.SALES_MANAGER), deleteCustomer);

export default router;
