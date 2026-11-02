import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { HttpError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) return void res.status(err.status).json({ error: { message: err.message, code: err.code } });
  if (err instanceof ZodError) {
    return void res.status(400).json({
      error: { message: 'Validation failed', code: 'VALIDATION', issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
    });
  }
  if (err instanceof multer.MulterError) {
    return void res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: { message: 'Upload rejected' } });
  }
  if (err?.type === 'entity.too.large') return void res.status(413).json({ error: { message: 'Payload too large' } });
  if (err instanceof SyntaxError && 'body' in err) return void res.status(400).json({ error: { message: 'Invalid JSON' } });

  (req.log ?? logger).error({ err }, 'unhandled error'); // details go to logs only
  res.status(500).json({ error: { message: 'Internal server error' } });
};
