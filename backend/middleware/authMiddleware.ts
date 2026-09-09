import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { Secret } from 'jsonwebtoken';
import User, { UserRole } from '../models/user.ts';
import { errorResponse } from '../utils/responses.ts';
import codes from '../utils/statusCodes.ts';

// 1. Define the shape of your JWT payload
interface DecodedToken {
    id: string | number;
    email?: string;
    role?: UserRole;
    iat?: number;
    exp?: number;
}

// 2. Extend Express's Request interface to include req.user with proper typing
export interface AuthenticatedRequest extends Request {
    user?: User; // Typed directly to your User model instance
}

export const authenticate = async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
): Promise<Response | void> => {
    let token: string | undefined;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            const secret = (process.env.JWT_SECRET || 'my_secret') as Secret;
            const decoded = jwt.verify(token, secret) as DecodedToken;

            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            }) as User | undefined;

            if (!req.user) {
                return errorResponse(res, codes.NOT_FOUND, 'User not found.');
            }
            
            return next();
        } catch (error) {
            console.log(error);
            return errorResponse(res, codes.UNAUTHORIZED, 'Not authorized, token failed.');
        }
    }

    if (!token) {
        return errorResponse(res, codes.UNAUTHORIZED, 'Not authorized, no token provided.');
    }
};

export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
        const userRole = req.user?.get ? req.user.get('role') : req.user?.role;

        if (!req.user || !userRole || !allowedRoles.includes(userRole)) {
            return errorResponse(
                res, 
                codes.FORBIDDEN, 
                `Role ${userRole || 'unknown'} does not have permission to perform this action.`
            );
        }
        return next();
    };
};