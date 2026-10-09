import { z } from 'zod';
import { ROLES } from '../config/constants.js';

export const createUserSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(2, 'Name must be at least 2 characters').max(100),
  email: z.string({ message: 'Email is required' }).email('Invalid email address format'),
  phone: z
    .string()
    .refine((val) => !val || val.trim() === '' || val.trim().length >= 10, {
      message: 'Phone number must be at least 10 characters',
    })
    .optional()
    .default(''),
  password: z.string({ message: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(ROLES).optional().default(ROLES.SALES_EXECUTIVE),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z
    .string()
    .refine((val) => !val || val.trim() === '' || val.trim().length >= 10, {
      message: 'Phone number must be at least 10 characters',
    })
    .optional(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(ROLES).optional(),
  isActive: z.boolean().optional(),
});

export const toggleUserStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive status is required' }),
});
