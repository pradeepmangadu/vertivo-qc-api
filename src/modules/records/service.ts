import { env } from '../../config/env.js';
import { supabaseAdmin as db } from '../../config/supabase.js';
import { HttpError, many, one, unwrap } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const COLS = 'item_id, qty_sent, actual_condition, inspection, remarks, version, photo_path';
const SIGNED_URL_TTL = 300; // seconds

/** Replaces the internal storage path with a short-lived signed URL. photo_path never leaves the server. */
export async function withPhotoUrls(rows: any[]) {
  const paths = rows.filter((r) => r.photo_path).map((r) => r.photo_path as string);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data, error } = await db.storage.from(env.PHOTO_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
    if (error) logger.error({ msg: error.message }, 'signed url failure');
    else for (const d of data ?? []) if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl);
  }
  return rows.map(({ photo_path, ...r }) => ({ ...r, photo_url: photo_path ? urls.get(photo_path) ?? null : null }));
}

export async function listRecords(deliveryId: string) {
  return withPhotoUrls(many(await db.from('inspection_records').select(COLS).eq('delivery_id', deliveryId)));
}

interface RecordInput { qty_sent: number | null; actual_condition: string; inspection: string | null; remarks: string; version?: number }

export async function upsertRecord(deliveryId: string, itemId: number, userId: string, input: RecordInput) {
  const { version, ...fields } = input;
  const values = { ...fields, updated_by: userId, updated_at: new Date().toISOString() };
  const existing = unwrap(await db.from('inspection_records').select('version')
    .eq('delivery_id', deliveryId).eq('item_id', itemId).maybeSingle());

  let row;
  if (!existing) {
    row = one(await db.from('inspection_records').insert({ delivery_id: deliveryId, item_id: itemId, ...values }).select(COLS).single());
  } else {
    if (version !== existing.version) throw new HttpError(409, 'This item was changed elsewhere. Reload to continue.', 'VERSION_CONFLICT');
    row = unwrap(await db.from('inspection_records').update({ ...values, version: existing.version + 1 })
      .eq('delivery_id', deliveryId).eq('item_id', itemId).eq('version', existing.version).select(COLS).maybeSingle());
    if (!row) throw new HttpError(409, 'This item was changed elsewhere. Reload to continue.', 'VERSION_CONFLICT');
  }
  return (await withPhotoUrls([row]))[0];
}

/** Sets/clears the photo path. Returns the previous path so the caller can delete the old file. */
export async function setPhotoPath(deliveryId: string, itemId: number, userId: string, path: string | null) {
  const existing = unwrap(await db.from('inspection_records').select('photo_path')
    .eq('delivery_id', deliveryId).eq('item_id', itemId).maybeSingle());
  const patch = { photo_path: path, updated_by: userId, updated_at: new Date().toISOString() };
  let row;
  if (existing) {
    row = one(await db.from('inspection_records').update(patch)
      .eq('delivery_id', deliveryId).eq('item_id', itemId).select(COLS).single());
  } else {
    if (!path) throw new HttpError(404, 'Not found');
    row = one(await db.from('inspection_records').insert({ delivery_id: deliveryId, item_id: itemId, ...patch }).select(COLS).single());
  }
  return { oldPath: (existing?.photo_path as string | null | undefined) ?? null, record: (await withPhotoUrls([row]))[0] };
}
