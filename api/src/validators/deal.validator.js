import { z } from 'zod';
import { DEAL_STAGES } from '../config/constants.js';

export const createDealSchema = z
  .object({
    name: z.string().min(2, 'Deal name is required'),
    customer: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Customer ID format'),
    lead: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Lead ID format').optional(),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID format').optional(),
    value: z.number({ required_error: 'Value is required' }).positive('Deal value must be greater than zero'),
    probability: z.number().min(0, 'Probability cannot be < 0').max(100, 'Probability cannot be > 100').optional().default(50),
    expectedClosingDate: z
      .string({ required_error: 'Expected closing date is required' })
      .or(z.date())
      .refine(
        (val) => {
          const d = new Date(val);
          return !isNaN(d.getTime());
        },
        { message: 'Expected closing date must be a valid date' }
      )
      .refine(
        (val) => {
          const d = new Date(val);
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          return d >= startOfToday;
        },
        { message: 'Expected closing date must be today or a future date' }
      ),
    stage: z.nativeEnum(DEAL_STAGES).optional().default(DEAL_STAGES.QUALIFICATION),
    lostReason: z.string().optional(),
    description: z.string().optional().default(''),
  })
  .refine(
    (data) => {
      if (data.stage === DEAL_STAGES.LOST && (!data.lostReason || data.lostReason.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'Reason for lost deal is required when setting deal stage to Lost',
      path: ['lostReason'],
    }
  );

export const updateDealSchema = z
  .object({
    name: z.string().min(2).optional(),
    customer: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    lead: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    value: z.number().positive('Deal value must be greater than zero').optional(),
    probability: z.number().min(0).max(100).optional(),
    expectedClosingDate: z
      .string()
      .or(z.date())
      .refine(
        (val) => {
          if (!val) return true;
          const d = new Date(val);
          return !isNaN(d.getTime());
        },
        { message: 'Expected closing date must be a valid date' }
      )
      .refine(
        (val) => {
          if (!val) return true;
          const d = new Date(val);
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          return d >= startOfToday;
        },
        { message: 'Expected closing date must be today or a future date' }
      )
      .optional(),
    stage: z.nativeEnum(DEAL_STAGES).optional(),
    lostReason: z.string().optional(),
    reopenReason: z.string().optional(),
    description: z.string().optional(),
  })

  .refine(
    (data) => {
      if (data.stage === DEAL_STAGES.LOST && (!data.lostReason || data.lostReason.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'Reason for lost deal is required when updating deal stage to Lost',
      path: ['lostReason'],
    }
  );
