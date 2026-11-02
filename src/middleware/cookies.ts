import type { Response } from 'express';
import { COOKIES } from '../constants.js';
import { isProd } from '../config/env.js';

const base = { httpOnly: true, secure: isProd, sameSite: 'strict' as const };

export function setSessionCookies(res: Response, s: { access_token: string; refresh_token: string; expires_in: number }) {
  res.cookie(COOKIES.access, s.access_token, { ...base, path: '/', maxAge: s.expires_in * 1000 });
  res.cookie(COOKIES.refresh, s.refresh_token, { ...base, path: '/auth', maxAge: 7 * 24 * 3600 * 1000 });
}
export function clearSessionCookies(res: Response) {
  res.clearCookie(COOKIES.access, { ...base, path: '/' });
  res.clearCookie(COOKIES.refresh, { ...base, path: '/auth' });
}
export const csrfCookieOptions = { ...base, path: '/', maxAge: 12 * 3600 * 1000 };
