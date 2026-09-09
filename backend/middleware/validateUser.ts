import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import codes from "../utils/statusCodes.ts";
import { errorResponse } from "../utils/responses.ts";
import { UserRole } from "../models/user.ts";

// ==========================================
// 1. SCHEMAS & TYPES
// ==========================================

export const userSchema = z.object({
    fullName: z.string().min(1, "Full name is required."),
    email: z.string().email("Invalid email address."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    role: z.nativeEnum(UserRole).optional(),
    organizationId: z.string().optional(),
    organizationName: z.string().optional(),
});

// Accepts either a single user object OR an array of users (with an optional wrapper object)
export const validateUsersPayloadSchema = z
    .union([userSchema, z.array(userSchema).nonempty("Payload array cannot be empty.")])
    .or(
        z.object({
            users: z.union([
                userSchema,
                z.array(userSchema).nonempty("Payload array cannot be empty."),
            ],
            )
        }).transform((data) => data.users)
    );

export type UserInput = z.infer<typeof userSchema>;

// ==========================================
// 2. CUSTOM REQUEST INTERFACE
// ==========================================

export interface CustomRequest extends Request {
    normalizedData?: any;
}

// ==========================================
// 3. VALIDATION MIDDLEWARE
// ==========================================

const validateUser = (req: CustomRequest, res: Response, next: NextFunction) => {
    const result = validateUsersPayloadSchema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.issues.map((err) => {
            const path = err.path.length > 0 ? `[Field: ${err.path.join(".")}] ` : "";
            return `${path}${err.message}`;
        });

        return errorResponse(res, codes.BAD_REQUEST, "Validation failed.", errors);
    }

    // Set the parsed & sanitized payload
    req.normalizedData = result.data;

    next();
};

export default validateUser;