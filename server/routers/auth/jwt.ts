import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.trim().length < 16) {
  throw new Error(
    'JWT_SECRET is missing or too short. Set a strong secret (>=16 chars) in your environment.'
  );
}

export type JwtPayload = {
  sub: string;
  email?: string;
  [key: string]: any;
};

export function signAccessToken(payload: JwtPayload, expiresIn: string = '1h') {
  try {
    return jwt.sign(payload, JWT_SECRET!, { expiresIn });
  } catch (err: any) {
    throw new Error('Failed to sign access token');
  }
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch (err: any) {
    throw new Error('Invalid or expired token');
  }
}

export function getBearerToken(authorizationHeader?: string | null): string | null {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}
