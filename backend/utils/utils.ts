import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// 1. Define an interface for the incoming user object
export interface UserPayload {
    id: string | number;
    fullName?: string;
    email: string;
    role?: string;
}

export const generateTokens = (user: UserPayload) => {
    const payload = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
    };

    // 2. Cast secret keys as non-null Secret types
    const secret = process.env.JWT_SECRET as Secret;
    const refreshSecret = (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET) as Secret;

    // 3. Cast values to SignOptions['expiresIn'] for strict TS compatibility
    const accessToken = jwt.sign(payload, secret, {
        expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, refreshSecret, {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
};