import { z } from 'zod';
import { OVERALL_STATUSES } from '../../constants.js';

const text = (max: number) => z.string().trim().max(max);
const dim = z.number().int().min(0).max(100000).nullable();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date').nullable();

const fields = z.object({
  customer: text(120), location: text(300), model: text(80), colour: text(80),
  height_mm: dim, width_mm: dim, depth_mm: dim,
  inspector: text(120), site_signoff: text(120), vertivo_signoff: text(120),
  inspection_date: date, overall_status: z.enum(OVERALL_STATUSES).nullable(),
});

export const createDeliverySchema = fields.partial().strict();
export const updateDeliverySchema = fields.partial().extend({ version: z.number().int().positive() }).strict();
export const idParams = z.object({ id: z.string().uuid() });
