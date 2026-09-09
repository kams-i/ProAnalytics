import { 
    signUpService,
    signInService,
    requestOtpService,
    verifyOtpService, 
    getAllUsersService,
    updateUserService,
    deleteUserService
} from '../services/userService.ts';
import { errorResponse, successResponse } from '../utils/responses.ts';
import codes from '../utils/statusCodes.ts';
import type { NextFunction, Request, Response } from 'express';

export const signUp = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const result = await signUpService(req.body, res);
        
        // If the service already sent an error response (like 409 Conflict or 400 Bad Request), 
        // signUpService returns undefined or the response object, so we check if result is present.
        if (!res.headersSent) {
            return successResponse(res, codes.CREATED, 'User registered successfully.', result);
        }
    } catch (error: unknown) {
        const err = error as { statusCode?: number; message?: string };
        const statusCode = err.statusCode || codes.INTERNAL_SERVER_ERROR;
        const message = err.statusCode ? err.message : 'An error occurred during user registration.';
        if (!res.headersSent) {
            return errorResponse(res, statusCode, message || 'An error occurred during user registration.');
        }
    }
};


export const signIn = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const result = await signInService(req.body, res);
        
        // If the service already sent an error response (like 401 Unauthorized), 
        // signInService returns undefined or a response object, so we check headersSent.
        if (!res.headersSent) {
            return successResponse(res, codes.OK, 'Signed in successfully.', result);
        }
    } catch (error: unknown) {
        console.error('--- SIGNIN ERROR DEBUG ---', error);
        const err = error as { statusCode?: number; message?: string };
        const statusCode = err.statusCode || codes.INTERNAL_SERVER_ERROR;
        const message = err.statusCode ? err.message : 'An error occurred during sign-in.';
        
        if (!res.headersSent) {
            return errorResponse(res, statusCode, message || 'An error occurred during sign-in.');
        }
    }
};

export const requestOtpController = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const email = req.body.email; // <--- Extract the string directly
        const result = await requestOtpService(email, res);
        if (result) return result;

        return successResponse(res, codes.OK, 'OTP sent successfully to your email.');
    } catch (error: unknown) {
        console.error('CONTROLLER ERROR:', error); // Add this so you see future errors if any
        return errorResponse(res, codes.INTERNAL_SERVER_ERROR, 'An error occurred while requesting OTP.');
    }
};

export const verifyOtpController = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const { email, otp } = req.body;
        return await verifyOtpService(email, otp, res);
    } catch (err: unknown) {
        if (!res.headersSent) {
            next(err);
        }
    }
};

export const getAllUsersController = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const { page, limit } = req.query;

        const result = await getAllUsersService({
            page: page as string | undefined,
            limit: limit as string | undefined,
        });

        return successResponse(res, codes.OK, 'Users retrieved successfully.', result);
    } catch (err: unknown) {
        if (!res.headersSent) {
            next(err);
        } else {
            console.error('--- GET_ALL_USERS_CONTROLLER ERROR ---', err);
        }
    }
};

export const updateUserController = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const { id } = req.params;
        const { fullName, role, organizationId } = req.body;

        const updateData: Record<string, any> = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (role !== undefined) updateData.role = role;
        if (organizationId !== undefined) updateData.organizationId = organizationId;

        const updatedUser = await updateUserService(String(id), updateData);

        if (!updatedUser) {
            return errorResponse(res, codes.NOT_FOUND, 'User not found.');
        }

        return successResponse(res, codes.OK, 'User updated successfully.', updatedUser);
    } catch (err: unknown) {
        if (!res.headersSent) {
            next(err);
        }
    }
};

export const deleteUserController = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const { id } = req.params;

        const deletedUser = await deleteUserService(String(id));

        if (!deletedUser) {
            return errorResponse(res, codes.NOT_FOUND, 'User not found.');
        }

        return successResponse(res, codes.OK, 'User deleted successfully.', deletedUser);
    } catch (err: unknown) {
        if (!res.headersSent) {
            next(err);
        } else {
            console.error('--- DELETE_USER_CONTROLLER ERROR ---', err);
        }
    }
};