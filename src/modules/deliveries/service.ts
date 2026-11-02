import { supabaseAdmin as db } from '../../config/supabase.js';
import { HttpError, many, one, unwrap } from '../../utils/errors.js';
import type { AuthUser } from '../../types/auth.js';

export const DELIVERY_COLS =
  'id, customer, location, model, colour, height_mm, width_mm, depth_mm, inspector, site_signoff, vertivo_signoff, inspection_date, overall_status, version, created_at, updated_at';

/** Inspectors only ever see their own deliveries; admins see all. Applied to EVERY delivery query. */
function scoped<T extends { eq: (c: string, v: string) => T }>(q: T, user: AuthUser): T {
  return user.role === 'admin' ? q : q.eq('created_by', user.id);
}

export async function listDeliveries(user: AuthUser) {
  const q = db.from('deliveries').select(DELIVERY_COLS).is('deleted_at', null).order('updated_at', { ascending: false }).limit(200);
  return many(await scoped(q, user));
}

/** Throws 404 for both "missing" and "not yours" so IDs can't be probed. */
export async function getDelivery(id: string, user: AuthUser) {
  const q = db.from('deliveries').select(DELIVERY_COLS).eq('id', id).is('deleted_at', null);
  const row = unwrap(await scoped(q, user).maybeSingle());
  if (!row) throw new HttpError(404, 'Not found');
  return row;
}

export async function createDelivery(user: AuthUser, input: Record<string, unknown>): Promise<Record<string, any>> {
  const res = await db.from('deliveries').insert({ ...input, created_by: user.id }).select(DELIVERY_COLS).single();
  return one(res as { data: Record<string, any> | null; error: { code?: string; message: string } | null });
}

export async function updateDelivery(id: string, user: AuthUser, input: Record<string, unknown> & { version: number }) {
  await getDelivery(id, user); // ownership check
  const { version, ...fields } = input;
  const row = unwrap(await db.from('deliveries')
    .update({ ...fields, version: version + 1, updated_at: new Date().toISOString() })
    .eq('id', id).eq('version', version).is('deleted_at', null)
    .select(DELIVERY_COLS).maybeSingle());
  if (!row) throw new HttpError(409, 'This delivery was changed elsewhere. Reload to continue.', 'VERSION_CONFLICT');
  return row;
}

export async function softDeleteDelivery(id: string, user: AuthUser) {
  await getDelivery(id, user);
  unwrap(await db.from('deliveries').update({ deleted_at: new Date().toISOString() }).eq('id', id));
}
