import { randomUUID } from 'node:crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { env } from '../../config/env.js';
import { supabaseAdmin as db } from '../../config/supabase.js';
import { upload } from '../../middleware/upload.js';
import { uploadLimiter } from '../../middleware/rateLimit.js';
import { parse } from '../../middleware/validate.js';
import { audit } from '../../services/audit.js';
import { sanitizeImage } from '../../services/imageSanitizer.js';
import { HttpError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { getDelivery } from '../deliveries/service.js';
import { itemParams } from '../records/schemas.js';
import { setPhotoPath } from '../records/service.js';

export const router = Router({ mergeParams: true });

// Ownership is verified BEFORE the upload body is buffered.
async function guard(req: Request, _res: Response, next: NextFunction) {
  const { id } = parse(itemParams, req.params);
  await getDelivery(id, req.user!);
  next();
}

async function removeFile(path: string | null) {
  if (!path) return;
  const { error } = await db.storage.from(env.PHOTO_BUCKET).remove([path]);
  if (error) logger.error({ msg: error.message }, 'photo cleanup failed');
}

router.post('/', uploadLimiter, guard, upload.single('photo'), async (req, res) => {
  const { id, itemId } = parse(itemParams, req.params);
  if (!req.file) throw new HttpError(400, 'No file uploaded');
  const clean = await sanitizeImage(req.file.buffer);
  const path = `${id}/${itemId}-${randomUUID()}.jpg`; // server-generated; never derived from user input
  const { error } = await db.storage.from(env.PHOTO_BUCKET).upload(path, clean, { contentType: 'image/jpeg', upsert: false, cacheControl: '0' });
  if (error) { logger.error({ msg: error.message }, 'photo upload failed'); throw new HttpError(502, 'Could not store the photo'); }
  const { oldPath, record } = await setPhotoPath(id, itemId, req.user!.id, path);
  await removeFile(oldPath);
  await audit(req, 'photo_upload', 'record', `${id}/${itemId}`);
  res.status(201).json(record);
});

router.delete('/', guard, async (req, res) => {
  const { id, itemId } = parse(itemParams, req.params);
  const { oldPath, record } = await setPhotoPath(id, itemId, req.user!.id, null);
  await removeFile(oldPath);
  await audit(req, 'photo_delete', 'record', `${id}/${itemId}`);
  res.json(record);
});
