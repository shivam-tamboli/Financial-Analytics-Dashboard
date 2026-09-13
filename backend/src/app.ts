import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import { errorHandler, notFoundHandler } from './middleware/error';
import { ApiError } from './utils/ApiError';

export function createApp(): Application {
  const app = express();

  // Render (and most PaaS hosts) sit behind a reverse proxy and set X-Forwarded-For.
  // Trusting exactly one hop lets express-rate-limit key on the real client IP
  // instead of the proxy's — without this it throws on every request behind a proxy.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header means a non-browser request (curl, server-to-server, health
        // checks) — nothing to check against, so allow it through.
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new ApiError(403, `Origin "${origin}" is not allowed by CORS`));
        }
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', transactionRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
