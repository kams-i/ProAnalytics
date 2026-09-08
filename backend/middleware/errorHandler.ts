import type { Request, Response, NextFunction } from "express";
import codes from "../utils/statusCodes.ts";
import { errorResponse } from "../utils/responses.ts";

// Extend the base Error type to include optional properties assigned to custom errors
interface CustomError extends Error {
    statusCode?: number;
    errors?: any;
}

const errors = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(`[Error] ${req.method} ${req.url}:`, err);

    const statusCode = err.statusCode || codes.INTERNAL_SERVER_ERROR;

    const is500 = statusCode === codes.INTERNAL_SERVER_ERROR;
    const message = is500 ? "Internal Server Error" : (err.message || "Something went wrong");

    const errorDetails = err.errors || null;

    return errorResponse(res, statusCode, message, errorDetails);
};

export default errors;