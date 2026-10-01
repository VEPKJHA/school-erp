"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = exports.PasswordUtil = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class PasswordUtil {
    static async hash(password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        return bcryptjs_1.default.hash(password, salt);
    }
    static async compare(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
}
exports.PasswordUtil = PasswordUtil;
exports.hashPassword = PasswordUtil.hash;
exports.comparePassword = PasswordUtil.compare;
//# sourceMappingURL=password.js.map