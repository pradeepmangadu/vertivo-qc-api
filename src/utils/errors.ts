import { logger } from './logger.js';

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

/** Unwraps a Supabase result; maps DB errors to safe HTTP errors (no internals leaked). */
export function unwrap<T>(res: { data: T; error: { code?: string; message: string } | null }): T {
  if (res.error) {
    const c = res.error.code;
    if (c === '23505') throw new HttpError(409, 'Conflict', 'CONFLICT');
    if (c === '23503') throw new HttpError(404, 'Not found');
    if (c === '22P02' || c === '23514' || c === '22001') throw new HttpError(400, 'Invalid data');
    logger.error({ code: c, msg: res.error.message }, 'database error');
    throw new HttpError(500, 'Internal server error');
  }
  return res.data;
}

/** List queries: never null. */
export function many<T>(res: { data: T[] | null; error: { code?: string; message: string } | null }): T[] {
  return unwrap(res) ?? [];
}
/** .single() queries: a missing row is a server error, never a null. */
export function one<T>(res: { data: T | null; error: { code?: string; message: string } | null }): NonNullable<T> {
  const row = unwrap(res);
  if (row === null || row === undefined) throw new HttpError(500, 'Internal server error');
  return row as NonNullable<T>;
}
