import sharp from 'sharp';
import { HttpError } from '../utils/errors.js';

/**
 * Verifies the bytes really are a JPEG/PNG/WebP (the client-declared MIME type is not trusted),
 * applies EXIF orientation, then re-encodes. sharp drops all metadata (EXIF/GPS) by default.
 */
export async function sanitizeImage(input: Buffer): Promise<Buffer> {
  try {
    const img = sharp(input, { limitInputPixels: 40_000_000, failOn: 'error' });
    const meta = await img.metadata();
    if (!meta.format || !['jpeg', 'png', 'webp'].includes(meta.format)) throw new Error('format');
    return await img.rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 75, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new HttpError(415, 'Unsupported or corrupt image');
  }
}
