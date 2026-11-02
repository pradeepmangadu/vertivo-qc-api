import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = createApp().listen(env.PORT, () => logger.info(`API listening on :${env.PORT}`));
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;

const shutdown = (sig: string) => { logger.info(`${sig} received, shutting down`); server.close(() => process.exit(0)); setTimeout(() => process.exit(1), 10_000).unref(); };
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (e) => logger.error({ err: e }, 'unhandledRejection'));
