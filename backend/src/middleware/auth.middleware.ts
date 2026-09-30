import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenUserPayload } from '../utils/jwt';
import { ResponseUtil } from '../utils/apiResponse';
import { prisma } from '../config/prisma';

export interface AuthenticatedRequest extends Request {
  user?: TokenUserPayload;
  schoolId?: string;
  file?: any;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseUtil.unauthorized(res, 'Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    let decoded: TokenUserPayload;

    try {
      decoded = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return ResponseUtil.unauthorized(res, 'Access token has expired');
      }
      return ResponseUtil.unauthorized(res, 'Invalid access token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, status: true, schoolId: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      return ResponseUtil.unauthorized(res, 'User account is inactive or no longer exists');
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return ResponseUtil.unauthorized(res, 'Authentication verification failed');
  }
};

