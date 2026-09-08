import type { Response } from "express";

// Line 1: Success Response Helper
export const successResponse = (
    res: Response,
    statusCode: number,
    message: string,
    data: any = null
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

// Line 9: Error Response Helper
export const errorResponse = (
    res: Response,
    statusCode: number,
    message: string,
    errors: any = null
) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};