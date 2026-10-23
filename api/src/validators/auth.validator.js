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
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const cleaned = val.replace(/[\s\-\.\(\)]/g, '');
        return /^\+?[1-9]\d{9,14}$/.test(cleaned);
      },
      { message: 'Phone number must be a valid format with 10 to 15 digits' }
    )
    .optional()
    .default(''),

  password: z
    .string({ message: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  role: z.literal(ROLES.SALES_EXECUTIVE, {
    errorMap: () => ({ message: 'Public registration is restricted to Sales Executive role only' }),
  }).optional().default(ROLES.SALES_EXECUTIVE),
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
