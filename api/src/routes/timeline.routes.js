import { Router } from 'express';
import { getEntityTimeline } from '../controllers/timeline.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/:entityType/:entityId', getEntityTimeline);

export default router;
