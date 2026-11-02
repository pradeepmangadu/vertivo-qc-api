import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { COOKIES } from '../constants.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';
import { csrfCookieOptions } from './cookies.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/** GET /auth/csrf — double-submit token. Cookie is HttpOnly; the SPA keeps the token in memory. */
export function issueCsrf(req: Request, res: Response) {
  const existing = req.cookies?.[COOKIES.csrf];
  const token = typeof existing === 'string' && /^[a-f0-9]{64}$/.test(existing) ? existing : randomBytes(32).toString('hex');
  res.cookie(COOKIES.csrf, token, csrfCookieOptions);
  res.json({ token });
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (SAFE.has(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== env.FRONTEND_ORIGIN) return next(new HttpError(403, 'Forbidden', 'CSRF'));
  const cookie = req.cookies?.[COOKIES.csrf];
  const header = req.get('x-csrf-token');
  if (typeof cookie !== 'string' || !header || cookie.length !== header.length ||
      !timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) {
    return next(new HttpError(403, 'Invalid CSRF token', 'CSRF'));
  }
  next();
}
