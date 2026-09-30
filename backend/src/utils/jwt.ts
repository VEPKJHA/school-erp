import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env';

export interface TokenPayload {
  userId: string;
  id?: string;
  email: string;
  schoolId?: string | null;
  roleId: string;
  roleCode: string;
  permissions: string[];
}

export type TokenUserPayload = TokenPayload;

export function signAccessToken(payload: TokenPayload): string {
  const normalized = {
    ...payload,
    id: payload.userId || payload.id,
    userId: payload.userId || payload.id,
  };
  return jwt.sign(normalized, ENV.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as any;
  if (!decoded.id && decoded.userId) {
    decoded.id = decoded.userId;
  }
  return decoded as TokenPayload;
}

export function generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
  const token = generateRefreshTokenString();
  const hash = hashRefreshToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ENV.JWT_REFRESH_EXPIRES_IN_DAYS);

  return { token, hash, expiresAt };
}

export function generateRefreshTokenString(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const hashToken = hashRefreshToken;
