import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { authenticate } from './middleware/authenticate.js';
import { csrfProtection } from './middleware/csrf.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { router as authRouter } from './modules/auth/routes.js';
import { router as checklistRouter } from './modules/checklist/routes.js';
import { router as deliveriesRouter } from './modules/deliveries/routes.js';
import { logger } from './utils/logger.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/healthz' } }));
  app.use(helmet({
    contentSecurityPolicy: { useDefaults: false, directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'same-site' },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    referrerPolicy: { policy: 'no-referrer' },
  }));
  app.use(cors({
    origin: env.FRONTEND_ORIGIN,           // single allowed origin, never "*"
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    maxAge: 600,
  }));
  app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  app.get('/healthz', (_req, res) => { res.json({ ok: true }); });

  app.use(globalLimiter);
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());
  app.use(csrfProtection);

  app.use('/auth', authRouter);
  app.use('/checklist', authenticate, checklistRouter);
  app.use('/deliveries', authenticate, deliveriesRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
