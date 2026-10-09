import { Router } from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  updateLeadStatus,
  assignLead,
  convertLead,
  deleteLead,
} from '../controllers/lead.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validate } from '../validators/validate.middleware.js';
import {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  assignLeadSchema,
  convertLeadSchema,
} from '../validators/lead.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

router.route('/')
  .post(validate(createLeadSchema), createLead)
  .get(getLeads);

router.route('/:id')
  .get(getLeadById)
  .put(validate(updateLeadSchema), updateLead)
  .delete(authorizeRoles(ROLES.ADMIN, ROLES.SALES_MANAGER), deleteLead);

router.patch('/:id/status', validate(updateLeadStatusSchema), updateLeadStatus);
router.patch('/:id/assign', authorizeRoles(ROLES.ADMIN, ROLES.SALES_MANAGER), validate(assignLeadSchema), assignLead);
router.post('/:id/convert', validate(convertLeadSchema), convertLead);

export default router;
