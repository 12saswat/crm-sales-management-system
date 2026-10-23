import { z } from 'zod';
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_PRIORITIES } from '../config/constants.js';

const createCaseInsensitiveEnum = (enumObj, customErrorMessage) => {
  const allowedValues = Object.values(enumObj);
  return z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        const match = allowedValues.find((v) => v.toLowerCase() === trimmed.toLowerCase());
        return match || trimmed;
      }
      return val;
    },
    z.enum(allowedValues, {
      errorMap: () => ({ message: customErrorMessage || 'Invalid enum value' }),
    })
  );
};

const phoneValidator = z
  .string()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true;
      const cleaned = val.replace(/[\s\-\.\(\)]/g, '');
      return /^\+?[1-9]\d{9,14}$/.test(cleaned);
    },
    { message: 'Phone number must be a valid format with 10 to 15 digits' }
  );

export const createLeadSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address format'),
  phone: phoneValidator.optional().default(''),
  company: z.string().optional().default(''),
  source: createCaseInsensitiveEnum(LEAD_SOURCES, 'Invalid lead source').optional().default(LEAD_SOURCES.WEBSITE),
  status: createCaseInsensitiveEnum(LEAD_STATUSES, 'Invalid lead status').optional().default(LEAD_STATUSES.NEW),
  priority: createCaseInsensitiveEnum(LEAD_PRIORITIES, 'Invalid lead priority').optional().default(LEAD_PRIORITIES.MEDIUM),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format').optional(),
  description: z.string().optional().default(''),
});

export const updateLeadSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: phoneValidator.optional(),
  company: z.string().optional(),

  source: createCaseInsensitiveEnum(LEAD_SOURCES, 'Invalid lead source').optional(),
  status: createCaseInsensitiveEnum(LEAD_STATUSES, 'Invalid lead status')
    .refine((val) => !val || val.toLowerCase() !== LEAD_STATUSES.CONVERTED, {
      message: "Lead status cannot be set to 'converted' directly. Use the conversion endpoint (POST /leads/:id/convert)",
    })
    .optional(),
  priority: createCaseInsensitiveEnum(LEAD_PRIORITIES, 'Invalid lead priority').optional(),
  description: z.string().optional(),
});

export const updateLeadStatusSchema = z.object({
  status: createCaseInsensitiveEnum(LEAD_STATUSES, 'Invalid lead status').refine(
    (val) => val.toLowerCase() !== LEAD_STATUSES.CONVERTED,
    {
      message: "Lead status cannot be set to 'converted' directly. Use the conversion endpoint (POST /leads/:id/convert)",
    }
  ),
});

export const assignLeadSchema = z.object({
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
});

export const convertLeadSchema = z.object({
  customerAddress: z.string().optional().default(''),
  createDeal: z.boolean().optional().default(true),
  dealName: z.string().optional(),
  dealValue: z.number().positive('Deal value must be greater than zero').optional(),
  dealProbability: z.number().min(0).max(100).optional().default(50),
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
});

