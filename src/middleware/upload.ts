import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_PHOTO_MB * 1024 * 1024, files: 1, fields: 0, parts: 2 },
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new HttpError(415, 'Only images are allowed')),
});
