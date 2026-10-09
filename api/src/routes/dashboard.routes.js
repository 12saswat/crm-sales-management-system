import { Router } from 'express';
import {
  getOverviewMetrics,
  getPipelineMetrics,
  getTeamPerformance,
} from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/overview', getOverviewMetrics);
router.get('/pipeline', getPipelineMetrics);
router.get('/team-performance', authorizeRoles(ROLES.ADMIN, ROLES.SALES_MANAGER), getTeamPerformance);

export default router;
