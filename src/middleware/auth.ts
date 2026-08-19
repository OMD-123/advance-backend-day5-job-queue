// src/middleware/auth.ts — JWT auth middleware
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new Error('Missing or invalid Authorization header'));
    return;
  }

  try {
    const token = authHeader.slice(7);
    // Dev mode: accept any JWT-shaped token without full verification
    const parts = token.split('.');
    if (parts.length !== 3) {
      next(new Error('Invalid token format'));
      return;
    }
    // In dev, decode payload without verification
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    req.userId = payload.sub ?? payload.userId ?? 'dev-user';
    req.userRole = payload.role ?? 'user';
    next();
  } catch {
    next(new Error('Token decode failed'));
  }
}

export function requireRole(role: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.userRole !== role && req.userRole !== 'admin') {
      next(new Error(`Forbidden: requires role ${role}`));
      return;
    }
    next();
  };
}
