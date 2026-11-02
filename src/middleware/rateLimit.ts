import { rateLimit } from 'express-rate-limit';

const common = { standardHeaders: 'draft-7' as const, legacyHeaders: false, message: { error: { message: 'Too many requests, slow down.', code: 'RATE_LIMIT' } } };
export const globalLimiter = rateLimit({ ...common, windowMs: 15 * 60 * 1000, limit: 600 });
export const loginLimiter = rateLimit({ ...common, windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true });
export const refreshLimiter = rateLimit({ ...common, windowMs: 15 * 60 * 1000, limit: 60 });
export const uploadLimiter = rateLimit({ ...common, windowMs: 60 * 1000, limit: 30 });
export const exportLimiter = rateLimit({ ...common, windowMs: 60 * 1000, limit: 20 });
