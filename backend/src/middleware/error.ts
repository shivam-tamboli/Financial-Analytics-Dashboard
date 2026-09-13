import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: { message: err.message } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        details: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      },
    });
    return;
  }

  if (err && typeof err === 'object' && 'code' in err && (err as { code: unknown }).code === 11000) {
    res.status(409).json({ error: { message: 'Duplicate resource' } });
    return;
  }

  // Body-parser (and other Express middleware) throw plain errors shaped like this
  // for client mistakes — e.g. malformed JSON — with a real 4xx status already
  // attached. Without this check they fall through to the 500 below and a bad
  // request body looks like a server crash instead of what it actually is.
  if (
    err &&
    typeof err === 'object' &&
    'statusCode' in err &&
    typeof (err as { statusCode: unknown }).statusCode === 'number'
  ) {
    const statusCode = (err as { statusCode: number }).statusCode;
    if (statusCode >= 400 && statusCode < 500) {
      const message =
        'message' in err && typeof (err as { message: unknown }).message === 'string'
          ? (err as { message: string }).message
          : 'Bad request';
      res.status(statusCode).json({ error: { message } });
      return;
    }
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
}
