import { errorResponse, successResponse } from '../utils/responses.ts';
import { Op } from 'sequelize';
import codes from '../utils/statusCodes.ts';
import { generateTokens } from '../utils/utils.ts';
import User, { UserRole } from '../models/user.ts';
import { sequelize } from '../config/database.ts';
import type { Response } from 'express';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import Organization from '../models/organization.ts';
import dotenv from 'dotenv';

dotenv.config();

const getTransporter = () => {
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS?.trim().replace(/\s+/g, '');

    if (!user || !pass) {
        throw new Error('EMAIL_USER or EMAIL_PASS environment variables are missing.');
    }

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // false for port 587 (STARTTLS)
        auth: {
            user,
            pass,
        },
        family: 4, // Forces IPv4 to avoid network unreachable issues
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    } as nodemailer.TransportOptions);
};

export interface SignUpPayload {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole;
    organizationId?: string;
    organizationName?: string;
    [key: string]: any; // Catches any remaining optional user attributes
}

export interface PaginationOptions {
    page?: number | string;
    limit?: number | string;
}

export interface PaginatedUsersResult {
    users: User[];
    pagination: {
        totalUsers: number;
        currentPage: number;
        totalPages: number;
        limit: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export const signUpService = async (payload: SignUpPayload, res: Response) => {
    const { email, password, fullName, role, organizationId, organizationName, ...rest } = payload;

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
        return errorResponse(res, codes.CONFLICT, 'Email is already registered.');
    }

    // Use a transaction to ensure both Organization and User are created safely
    const t = await sequelize.transaction();

    try {
        let targetOrgId = organizationId;

        // If an organization name is provided instead of an ID, create the organization
        if (!targetOrgId && organizationName) {
            const newOrg = await Organization.create(
                { name: organizationName },
                { transaction: t }
            );
            targetOrgId = newOrg.id;
        }

        if (!targetOrgId) {
            await t.rollback();
            return errorResponse(res, codes.BAD_REQUEST, 'An organization is required for registration.');
        }

        const user = await User.create(
            {
                email,
                password,
                fullName,
                role: role || UserRole.APP_ADMIN,
                organizationId: targetOrgId,
                ...rest,
            },
            { transaction: t }
        );

        if (!user) {
            await t.rollback();
            return errorResponse(res, codes.INTERNAL_SERVER_ERROR, 'User registration failed.');
        }

        await t.commit();

        const tokens = generateTokens(user.get({ plain: true }));

        return {
            id: user.id,
            organizationId: user.organizationId,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            ...tokens,
        };
    } catch (error) {
        await t.rollback();
        console.error('Sign-up transaction failed:', error);
        return errorResponse(res, codes.INTERNAL_SERVER_ERROR, 'Internal server error during registration.');
    }
};

export const signInService = async ({ email, password }: { email: string; password: string }, res: Response) => {
    const user = await User.findOne({
        where: { email },
        attributes: { include: ['password'] }
    });

    if (!user) {
        return errorResponse(res, codes.UNAUTHORIZED, 'Invalid email or password.');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        return errorResponse(res, codes.UNAUTHORIZED, 'Invalid email or password.');
    }

    const tokens = generateTokens(user.get({ plain: true }));

    // Fetch organization separately to avoid eager loading alias issues
    let organization = null;
    if (user.organizationId) {
        organization = await Organization.findByPk(user.organizationId);
    }

    const plainUser = user.get({ plain: true }) as Record<string, any>;
    delete plainUser.password;

    return {
        user: plainUser,
        role: user.role,
        organization: organization ? organization.get({ plain: true }) : null,
        ...tokens,
    };
};

export const requestOtpService = async (emailInput: any, res: Response) => {
    const rawEmail = typeof emailInput === 'object' && emailInput !== null
        ? (emailInput.email || emailInput.body?.email)
        : emailInput;

    console.log('--- RAW EMAIL RECEIVED ---', rawEmail);

    if (!rawEmail || typeof rawEmail !== 'string') {
        return errorResponse(res, codes.BAD_REQUEST, 'Email is required.');
    }

    try {
        const fullEmail = rawEmail.toLowerCase().trim();

        // Strip +admin (or any +tag) before @ to find the base user in DB
        const cleanEmail = fullEmail.replace(/\+[^@]+(?=@)/, '');

        const user = await User.findOne({
            where: {
                email: { [Op.iLike]: cleanEmail }
            }
        });

        console.log('--- DEBUG USER FOUND ---', {
            email: user?.email,
            role: user?.role
        });

        if (!user) {
            return errorResponse(res, codes.NOT_FOUND, 'User with this email not found.');
        }

        const userRole = user.role;
        if (typeof userRole !== 'string' || (!userRole.toLowerCase().includes('admin') && userRole !== 'Super Admin' && userRole !== 'App Admin')) {
            return errorResponse(
                res,
                codes.FORBIDDEN,
                'Access denied. Account does not have admin permissions.'
            );
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Handy fallback log incase network/firewall blocks outbound SMTP
        console.log('----------------------------------------');
        console.log(`[DEV OTP CODE for ${fullEmail}]: ${otp}`);
        console.log('----------------------------------------');

        user.otpCode = otp;
        user.otpExpiresAt = expiresAt;
        await user.save();

        try {
            const transporter = getTransporter();
            const emailUser = process.env.EMAIL_USER || '';

            console.log(`[SMTP Debug] Attempting email send from: ${emailUser}`);

            await transporter.sendMail({
                from: `"Admin Portal" <${emailUser.trim()}>`,
                to: fullEmail,
                subject: 'Your Admin Login OTP Code',
                html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Admin Single-Sign-On Code</h2>
          <p>Your one-time login verification code is:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2563eb;">${otp}</p>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
            });
        } catch (smtpErr: any) {
            console.warn('[SMTP Warning] Email delivery failed due to network/firewall timeout, but OTP is saved and printed above:', smtpErr.message);
        }

        return successResponse(res, codes.OK, 'OTP generated successfully. (Check console logs if offline).');
    } catch (err: any) {
        console.error('--- REQUEST_OTP_SERVICE ERROR ---');
        console.error('MESSAGE:', err.message);
        console.error('STACK:', err.stack);
        console.error('--------------------------------');

        return errorResponse(
            res,
            codes.INTERNAL_SERVER_ERROR,
            err.message || 'Failed to process OTP request.'
        );
    }
};

export const verifyOtpService = async (email: string, otp: string, res: Response) => {
    if (!email || !otp) {
        return errorResponse(res, codes.BAD_REQUEST, 'Email and OTP code are required.');
    }

    try {
        const fullEmail = email.toLowerCase().trim();
        const cleanEmail = fullEmail.replace(/\+[^@]+(?=@)/, '');
        const cleanOtp = String(otp).trim();

        const user = await User.findOne({
            where: { email: { [Op.iLike]: cleanEmail } }
        });

        if (!user) {
            return errorResponse(res, codes.NOT_FOUND, 'User not found.');
        }

        console.log('[OTP Debug] DB Code:', user.otpCode, '| Received Code:', cleanOtp);
        console.log('[OTP Debug] DB Expiry:', user.otpExpiresAt, '| Current Time:', new Date());

        const dbOtpCode = user.otpCode;
        if (!dbOtpCode || String(dbOtpCode) !== cleanOtp) {
            return errorResponse(res, codes.BAD_REQUEST, 'Invalid OTP code.');
        }

        const currentTime = new Date();
        const dbExpiry = user.otpExpiresAt;
        const expiryTime = dbExpiry ? new Date(dbExpiry) : new Date(0);

        if (expiryTime < currentTime) {
            return errorResponse(res, codes.BAD_REQUEST, 'OTP code has expired.');
        }

        user.otpCode = null;
        user.otpExpiresAt = null;
        await user.save();

        const accessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'my_access_secret',
            { expiresIn: '1d' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET || '12345',
            { expiresIn: '7d' }
        );

        return successResponse(res, codes.OK, 'Verification successful.', {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        });
    } catch (err: any) {
        console.error('--- VERIFY_OTP_SERVICE ERROR ---', err);
        return errorResponse(
            res,
            codes.INTERNAL_SERVER_ERROR,
            err.message || 'Verification failed.'
        );
    }
};

export const getAllUsersService = async (options: PaginationOptions = {}): Promise<PaginatedUsersResult> => {
    const { page = 1, limit = 10 } = options;

    // Parse and sanitize numerical pagination values
    const pageNum = Math.max(1, typeof page === "string" ? parseInt(page, 10) || 1 : page);
    const limitNum = Math.min(100, Math.max(1, typeof limit === "string" ? parseInt(limit, 10) || 10 : limit)); // Caps max limit at 100
    const offset = (pageNum - 1) * limitNum;

    // Fetch total count and sliced data in a single database query, excluding sensitive fields
    const { count: totalUsers, rows: users } = await User.findAndCountAll({
        attributes: { exclude: ['password', 'otpCode'] },
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset: offset,
    });

    const totalPages = Math.ceil(totalUsers / limitNum);

    return {
        users,
        pagination: {
            totalUsers,
            currentPage: pageNum,
            totalPages,
            limit: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
        },
    };
};

export const updateUserService = async (
    id: string,
    updateData: Record<string, any>
): Promise<User | null> => {
    const [affectedCount] = await User.update(updateData, {
        where: { id },
    });

    if (affectedCount === 0) {
        return null;
    }

    return await User.findByPk(id, {
        attributes: { exclude: ['password', 'otpCode'] },
    });
};

export const deleteUserService = async (id: string): Promise<Record<string, any> | null> => {
    const user = await User.findByPk(id, {
        attributes: { exclude: ['password', 'otpCode'] },
    });
    
    if (!user) {
        return null;
    }

    const deletedUserData = user.toJSON();
    await user.destroy();
    return deletedUserData;
};