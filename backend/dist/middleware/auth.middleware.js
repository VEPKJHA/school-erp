"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const apiResponse_1 = require("../utils/apiResponse");
const prisma_1 = require("../config/prisma");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return apiResponse_1.ResponseUtil.unauthorized(res, 'Authentication token missing or invalid');
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = (0, jwt_1.verifyAccessToken)(token);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                return apiResponse_1.ResponseUtil.unauthorized(res, 'Access token has expired');
            }
            return apiResponse_1.ResponseUtil.unauthorized(res, 'Invalid access token');
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, status: true, schoolId: true },
        });
        if (!user || user.status !== 'ACTIVE') {
            return apiResponse_1.ResponseUtil.unauthorized(res, 'User account is inactive or no longer exists');
        }
        req.user = decoded;
        return next();
    }
    catch (error) {
        return apiResponse_1.ResponseUtil.unauthorized(res, 'Authentication verification failed');
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map