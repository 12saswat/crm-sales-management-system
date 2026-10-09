import { z } from 'zod';
import { CUSTOMER_STATUSES } from '../config/constants.js';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  email: z.string().email('Invalid email address format'),
  phone: z.string().optional().default(''),
  company: z.string().optional().default(''),
  address: z.string().optional().default(''),
  originalLead: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Lead ID format').optional(),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID format').optional(),
  status: z.nativeEnum(CUSTOMER_STATUSES).optional().default(CUSTOMER_STATUSES.ACTIVE),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID format').optional(),
  status: z.nativeEnum(CUSTOMER_STATUSES).optional(),
});
