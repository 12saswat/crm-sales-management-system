import { Router } from 'express';
import { getConfig, updateConfig } from '../controllers/config.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validate } from '../validators/validate.middleware.js';
import { updateConfigSchema } from '../validators/config.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/', getConfig);
router.put('/', authorizeRoles(ROLES.ADMIN), validate(updateConfigSchema), updateConfig);
router.patch('/', authorizeRoles(ROLES.ADMIN), validate(updateConfigSchema), updateConfig);

export default router;
