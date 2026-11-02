import { pino } from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.cookie', 'req.headers.authorization', 'req.headers["x-csrf-token"]',
      'res.headers["set-cookie"]', '*.password', '*.access_token', '*.refresh_token',
    ],
    censor: '[redacted]',
  },
});
