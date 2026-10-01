"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const apiResponse_1 = require("../utils/apiResponse");
const env_1 = require("../config/env");
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    if (env_1.ENV.NODE_ENV === 'development') {
        console.error('Unhandled Error:', err);
    }
    // Zod Validation Error
    if (err instanceof zod_1.ZodError) {
        const formatted = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return apiResponse_1.ResponseUtil.badRequest(res, 'Validation failed', formatted);
    }
    // Prisma Duplicate Key (P2002) and Not Found (P2025)
    if (err && typeof err === 'object' && 'code' in err && typeof err.code === 'string') {
        if (err.code === 'P2002') {
            const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
            return apiResponse_1.ResponseUtil.conflict(res, `A record with this ${target} already exists. Duplicates are not allowed.`);
        }
        if (err.code === 'P2025') {
            return apiResponse_1.ResponseUtil.notFound(res, 'Requested record does not exist or has been removed');
        }
    }
    // Custom Application Error
    if (err.statusCode && err.message) {
        return apiResponse_1.ResponseUtil.error(res, err.message, err.statusCode, err.errors || []);
    }
    return apiResponse_1.ResponseUtil.error(res, env_1.ENV.NODE_ENV === 'production'
        ? 'An unexpected internal server error occurred.'
        : err.message || 'Internal server error');
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map