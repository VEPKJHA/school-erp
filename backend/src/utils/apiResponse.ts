import { Response } from 'express';

export class ResponseUtil {
  static success(res: Response, data: any = null, message = 'Success', statusCode = 200, meta?: any) {
    const payload: any = {
      success: true,
      message,
      data,
    };
    if (meta) payload.meta = meta;
    return res.status(statusCode).json(payload);
  }

  static created(res: Response, data: any = null, message = 'Created successfully', meta?: any) {
    const payload: any = {
      success: true,
      message,
      data,
    };
    if (meta) payload.meta = meta;
    return res.status(201).json(payload);
  }

  static badRequest(res: Response, message = 'Bad request', errors?: any) {
    return res.status(400).json({
      success: false,
      message,
      errors,
    });
  }

  static unauthorized(res: Response, message = 'Unauthorized access') {
    return res.status(401).json({
      success: false,
      message,
    });
  }

  static forbidden(res: Response, message = 'Forbidden: insufficient permissions') {
    return res.status(403).json({
      success: false,
      message,
    });
  }

  static notFound(res: Response, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  static conflict(res: Response, message = 'Resource conflict or duplicate detected') {
    return res.status(409).json({
      success: false,
      message,
    });
  }

  static serverError(res: Response, message = 'Internal server error', error?: any) {
    return res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }

  static error(res: Response, message = 'An error occurred', statusCode = 500, errors?: any) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
}
