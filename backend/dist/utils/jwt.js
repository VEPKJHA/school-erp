"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashToken = void 0;
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.generateRefreshTokenString = generateRefreshTokenString;
exports.hashRefreshToken = hashRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
function signAccessToken(payload) {
    const normalized = {
        ...payload,
        id: payload.userId || payload.id,
        userId: payload.userId || payload.id,
    };
    return jsonwebtoken_1.default.sign(normalized, env_1.ENV.JWT_ACCESS_SECRET, {
        expiresIn: '15m',
    });
}
function verifyAccessToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_ACCESS_SECRET);
    if (!decoded.id && decoded.userId) {
        decoded.id = decoded.userId;
    }
    return decoded;
}
function generateRefreshToken() {
    const token = generateRefreshTokenString();
    const hash = hashRefreshToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env_1.ENV.JWT_REFRESH_EXPIRES_IN_DAYS);
    return { token, hash, expiresAt };
}
function generateRefreshTokenString() {
    return crypto_1.default.randomBytes(40).toString('hex');
}
function hashRefreshToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
exports.hashToken = hashRefreshToken;
//# sourceMappingURL=jwt.js.map