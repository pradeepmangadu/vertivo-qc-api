import { z } from 'zod';
import { INSPECTION_STATUSES } from '../../constants.js';

export const recordSchema = z.object({
  qty_sent: z.number().int().min(0).max(1_000_000).nullable(),
  actual_condition: z.string().trim().max(200),
  inspection: z.enum(INSPECTION_STATUSES).nullable(),
  remarks: z.string().trim().max(500),
  version: z.number().int().positive().optional(),
}).strict();

export const itemParams = z.object({ id: z.string().uuid(), itemId: z.coerce.number().int().positive() });
