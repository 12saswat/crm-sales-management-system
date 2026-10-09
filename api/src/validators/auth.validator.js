import { z } from 'zod';
import { ROLES } from '../config/constants.js';

export const registerSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100),
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email address format'),
  phone: z
    .string()
    .refine((val) => !val || val.trim() === '' || val.trim().length >= 10, {
      message: 'Phone number must be at least 10 characters',
    })
    .optional()
    .default(''),
  password: z
    .string({ message: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(ROLES).optional().default(ROLES.SALES_EXECUTIVE),
});

export const loginSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email address format'),
  password: z
    .string({ message: 'Password is required' })
    .min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ message: 'Current password is required' })
    .min(1, 'Current password is required'),
  newPassword: z
    .string({ message: 'New password is required' })
    .min(6, 'New password must be at least 6 characters'),
});
