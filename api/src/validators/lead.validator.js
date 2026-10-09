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

export const createLeadSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address format'),
  phone: z.string().optional().default(''),
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
  phone: z.string().optional(),
  company: z.string().optional(),
  source: createCaseInsensitiveEnum(LEAD_SOURCES, 'Invalid lead source').optional(),
  status: createCaseInsensitiveEnum(LEAD_STATUSES, 'Invalid lead status').optional(),
  priority: createCaseInsensitiveEnum(LEAD_PRIORITIES, 'Invalid lead priority').optional(),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format').optional(),
  description: z.string().optional(),
});

export const updateLeadStatusSchema = z.object({
  status: createCaseInsensitiveEnum(LEAD_STATUSES, 'Invalid lead status'),
});

export const assignLeadSchema = z.object({
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
});

export const convertLeadSchema = z.object({
  createDeal: z.boolean().optional().default(true),
  dealName: z.string().optional(),
  dealValue: z.number().positive('Deal value must be greater than zero').optional(),
  dealProbability: z.number().min(0).max(100).optional().default(50),
  expectedClosingDate: z.string().or(z.date()).optional(),
});
