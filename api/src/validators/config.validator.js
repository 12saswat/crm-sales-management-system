import { z } from 'zod';

export const updateConfigSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  currency: z.string().min(2).max(10).optional(),
  timezone: z.string().optional(),
  leadSources: z.array(z.string()).min(1, 'At least one lead source required').optional(),
  leadStatuses: z.array(z.string()).min(1, 'At least one lead status required').optional(),
  dealStages: z.array(z.string()).min(1, 'At least one deal stage required').optional(),
  defaultDealProbabilities: z.record(z.string(), z.number().min(0).max(100)).optional(),
  allowExecutiveLeadReassignment: z.boolean().optional(),
});
