import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseUtil } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ENV } from '../config/env';

const REFRESH_COOKIE_NAME = 'school_erp_refresh';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, schoolCode } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.login({
        email,
        password,
        schoolCode,
        ipAddress,
        userAgent,
      });

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: ENV.COOKIE_SECURE,
        sameSite: 'strict',
        domain: ENV.COOKIE_DOMAIN,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ResponseUtil.success(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        'Logged in successfully'
      );
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message || 'Login failed');
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;
      if (!rawRefreshToken) {
        return ResponseUtil.unauthorized(res, 'Refresh token not provided');
      }

      const result = await AuthService.refreshToken(rawRefreshToken);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: ENV.COOKIE_SECURE,
        sameSite: 'strict',
        domain: ENV.COOKIE_DOMAIN,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ResponseUtil.success(
        res,
        { accessToken: result.accessToken },
        'Token refreshed successfully'
      );
    } catch (error: any) {
      return ResponseUtil.unauthorized(res, error.message || 'Token refresh failed');
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      await AuthService.logout(rawRefreshToken, req.user?.userId);

      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: ENV.COOKIE_SECURE,
        sameSite: 'strict',
        domain: ENV.COOKIE_DOMAIN,
      });

      return ResponseUtil.success(res, null, 'Logged out successfully');
    } catch (error: any) {
      return ResponseUtil.error(res, error.message || 'Logout failed');
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, 'Authentication required');
      }

      const profile = await AuthService.getMe(req.user.userId);
      return ResponseUtil.success(res, profile, 'Profile retrieved successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message || 'Failed to retrieve profile');
    }
  }
}
