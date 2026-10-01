"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
class ResponseUtil {
    static success(res, data = null, message = 'Success', statusCode = 200, meta) {
        const payload = {
            success: true,
            message,
            data,
        };
        if (meta)
            payload.meta = meta;
        return res.status(statusCode).json(payload);
    }
    static created(res, data = null, message = 'Created successfully', meta) {
        const payload = {
            success: true,
            message,
            data,
        };
        if (meta)
            payload.meta = meta;
        return res.status(201).json(payload);
    }
    static badRequest(res, message = 'Bad request', errors) {
        return res.status(400).json({
            success: false,
            message,
            errors,
        });
    }
    static unauthorized(res, message = 'Unauthorized access') {
        return res.status(401).json({
            success: false,
            message,
        });
    }
    static forbidden(res, message = 'Forbidden: insufficient permissions') {
        return res.status(403).json({
            success: false,
            message,
        });
    }
    static notFound(res, message = 'Resource not found') {
        return res.status(404).json({
            success: false,
            message,
        });
    }
    static conflict(res, message = 'Resource conflict or duplicate detected') {
        return res.status(409).json({
            success: false,
            message,
        });
    }
    static serverError(res, message = 'Internal server error', error) {
        return res.status(500).json({
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
    static error(res, message = 'An error occurred', statusCode = 500, errors) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }
}
exports.ResponseUtil = ResponseUtil;
//# sourceMappingURL=apiResponse.js.map