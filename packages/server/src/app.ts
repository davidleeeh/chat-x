import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './middleware/errors.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);

  app.use(errorHandler);

  return app;
}
