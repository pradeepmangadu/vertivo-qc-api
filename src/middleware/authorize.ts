import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/errors.js';
import type { Role } from '../types/auth.js';

export const authorize = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) =>
  req.user && roles.includes(req.user.role) ? next() : next(new HttpError(403, 'Forbidden'));
