"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const apiResponse_1 = require("../utils/apiResponse");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return apiResponse_1.ResponseUtil.badRequest(res, 'Validation error', error.errors);
            }
            return apiResponse_1.ResponseUtil.badRequest(res, 'Invalid request data');
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.middleware.js.map