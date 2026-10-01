"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const apiResponse_1 = require("../utils/apiResponse");
const env_1 = require("../config/env");
const REFRESH_COOKIE_NAME = 'school_erp_refresh';
class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password, schoolCode } = req.body;
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const result = await auth_service_1.AuthService.login({
                email,
                password,
                schoolCode,
                ipAddress,
                userAgent,
            });
            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
                httpOnly: true,
                secure: env_1.ENV.COOKIE_SECURE,
                sameSite: 'strict',
                domain: env_1.ENV.COOKIE_DOMAIN,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return apiResponse_1.ResponseUtil.success(res, {
                user: result.user,
                accessToken: result.accessToken,
            }, 'Logged in successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message || 'Login failed');
        }
    }
    static async refreshToken(req, res, next) {
        try {
            const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;
            if (!rawRefreshToken) {
                return apiResponse_1.ResponseUtil.unauthorized(res, 'Refresh token not provided');
            }
            const result = await auth_service_1.AuthService.refreshToken(rawRefreshToken);
            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
                httpOnly: true,
                secure: env_1.ENV.COOKIE_SECURE,
                sameSite: 'strict',
                domain: env_1.ENV.COOKIE_DOMAIN,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return apiResponse_1.ResponseUtil.success(res, { accessToken: result.accessToken }, 'Token refreshed successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.unauthorized(res, error.message || 'Token refresh failed');
        }
    }
    static async logout(req, res, next) {
        try {
            const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
            await auth_service_1.AuthService.logout(rawRefreshToken, req.user?.userId);
            res.clearCookie(REFRESH_COOKIE_NAME, {
                httpOnly: true,
                secure: env_1.ENV.COOKIE_SECURE,
                sameSite: 'strict',
                domain: env_1.ENV.COOKIE_DOMAIN,
            });
            return apiResponse_1.ResponseUtil.success(res, null, 'Logged out successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.error(res, error.message || 'Logout failed');
        }
    }
    static async getMe(req, res, next) {
        try {
            if (!req.user) {
                return apiResponse_1.ResponseUtil.unauthorized(res, 'Authentication required');
            }
            const profile = await auth_service_1.AuthService.getMe(req.user.userId);
            return apiResponse_1.ResponseUtil.success(res, profile, 'Profile retrieved successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message || 'Failed to retrieve profile');
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map