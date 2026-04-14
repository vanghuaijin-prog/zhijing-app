import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { serverConfig } from '../config';
import type { AuthTokenPayload } from '../types';

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

const base64UrlEncode = (value: string | Buffer) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
};

const sign = (input: string) =>
  base64UrlEncode(createHmac('sha256', serverConfig.appJwtSecret).update(input).digest());

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
};

export const verifyPassword = (password: string, storedHash: string) => {
  const [salt, expectedHash] = storedHash.split(':');
  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, 64).toString('hex');
  if (actualHash.length !== expectedHash.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
};

export const createAuthToken = (payload: { userId: string; username: string }) => {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(
    JSON.stringify({
      sub: payload.userId,
      username: payload.username,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    } satisfies AuthTokenPayload),
  );

  const unsigned = `${header}.${body}`;
  return `${unsigned}.${sign(unsigned)}`;
};

export const parseAuthToken = (token: string): AuthTokenPayload | null => {
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) {
    return null;
  }

  const unsigned = `${header}.${body}`;
  const expectedSignature = sign(unsigned);
  if (signature.length !== expectedSignature.length) {
    return null;
  }
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as AuthTokenPayload;
    if (payload.exp * 1000 <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};
