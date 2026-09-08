import type { Request, Response } from "express";
import codes from "../utils/statusCodes.ts";
import { errorResponse } from "../utils/responses.ts";

const notFound = (req: Request, res: Response) => {
    return errorResponse(res, codes.NOT_FOUND, `Route ${req.originalUrl} not found.`);
};

export default notFound;