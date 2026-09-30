import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ResponseUtil } from '../utils/apiResponse';
import { ENV } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (ENV.NODE_ENV === 'development') {
    console.error('Unhandled Error:', err);
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return ResponseUtil.badRequest(res, 'Validation failed', formatted);
  }

  // Prisma Duplicate Key (P2002) and Not Found (P2025)
  if (err && typeof err === 'object' && 'code' in err && typeof err.code === 'string') {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      return ResponseUtil.conflict(
        res,
        `A record with this ${target} already exists. Duplicates are not allowed.`
      );
    }
    if (err.code === 'P2025') {
      return ResponseUtil.notFound(res, 'Requested record does not exist or has been removed');
    }
  }

  // Custom Application Error
  if (err.statusCode && err.message) {
    return ResponseUtil.error(res, err.message, err.statusCode, err.errors || []);
  }

  return ResponseUtil.error(
    res,
    ENV.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred.'
      : err.message || 'Internal server error'
  );
};

