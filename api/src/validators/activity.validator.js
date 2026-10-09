import { z } from 'zod';
import { ACTIVITY_TYPES, ACTIVITY_STATUSES, ENTITY_TYPES } from '../config/constants.js';

export const createActivitySchema = z.object({
  type: z.nativeEnum(ACTIVITY_TYPES, { required_error: 'Activity type is required' }),
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional().default(''),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID format').optional(),
  dueDate: z.string().or(z.date()),
  status: z.nativeEnum(ACTIVITY_STATUSES).optional().default(ACTIVITY_STATUSES.PENDING),
  entityType: z.nativeEnum(ENTITY_TYPES, { required_error: 'Entity type is required' }),
  entityId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Entity ID format'),
});

export const updateActivitySchema = z.object({
  type: z.nativeEnum(ACTIVITY_TYPES).optional(),
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  dueDate: z.string().or(z.date()).optional(),
  status: z.nativeEnum(ACTIVITY_STATUSES).optional(),
  entityType: z.nativeEnum(ENTITY_TYPES).optional(),
  entityId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});
