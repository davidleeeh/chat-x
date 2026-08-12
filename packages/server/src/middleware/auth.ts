import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export interface AuthenticatedRequest extends Request {
  userId: string;
  sessionId: string;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' });
    return;
  }

  const token = header.slice(7);

  const session = await prisma.session.findUnique({ where: { id: token } });
  if (!session) {
    res.status(401).json({ error: 'Invalid session token', code: 'UNAUTHORIZED' });
    return;
  }

  (req as AuthenticatedRequest).userId = session.userId;
  (req as AuthenticatedRequest).sessionId = session.id;
  next();
}
