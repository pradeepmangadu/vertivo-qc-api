import type { NextFunction, Request, Response } from 'express';
import { COOKIES } from '../constants.js';
import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../utils/errors.js';
import type { AuthUser } from '../types/auth.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIES.access];
  if (typeof token !== 'string' || !token) return next(new HttpError(401, 'Unauthorized'));

  const { data, error } = await supabaseAdmin.auth.getUser(token); // verifies signature + revocation with Supabase
  if (error || !data.user) return next(new HttpError(401, 'Unauthorized'));

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('full_name, role').eq('id', data.user.id).maybeSingle();
  if (!profile) return next(new HttpError(403, 'Forbidden'));

  const user: AuthUser = { id: data.user.id, email: data.user.email ?? '', name: profile.full_name, role: profile.role };
  req.user = user;
  next();
}
