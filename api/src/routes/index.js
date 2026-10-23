import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import leadRoutes from './lead.routes.js';
import customerRoutes from './customer.routes.js';
import dealRoutes from './deal.routes.js';
import activityRoutes from './activity.routes.js';
import timelineRoutes from './timeline.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import configRoutes from './config.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/leads', leadRoutes);
router.use('/customers', customerRoutes);
router.use('/deals', dealRoutes);
router.use('/activities', activityRoutes);
router.use('/timeline', timelineRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/config', configRoutes);

export default router;

