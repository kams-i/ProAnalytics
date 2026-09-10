import { 
    getAllOrganizationsService,
    getOrganizationByIdService,
    updateOrganizationService,
    deleteOrganizationService
} from '../services/organizationService.ts';
import { errorResponse, successResponse } from '../utils/responses.ts';
import codes from '../utils/statusCodes.ts';
import type { NextFunction, Request, Response } from 'express';

export const getAllOrganizationsController = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const { page, limit } = req.query;

        const result = await getAllOrganizationsService({
            page: page as string | undefined,
            limit: limit as string | undefined,
        });

        return successResponse(res, codes.OK, 'Organizations retrieved successfully.', result);
    } catch (err: unknown) {
        if (!res.headersSent) {
            next(err);
        } else {
            console.error('--- GET_ALL_ORGANIZATIONS_CONTROLLER ERROR ---', err);
        }
    }
};

export const getOrganizationByIdController = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const { id } = req.params;
        const organizationId = Array.isArray(id) ? id[0] : id;

        const organization = await getOrganizationByIdService(organizationId);

        if (!organization) {
            return errorResponse(res, codes.NOT_FOUND, 'Organization not found.');
        }

        return successResponse(res, codes.OK, 'Organization retrieved successfully.', organization);
    } catch (err: unknown) {
        if (!res.headersSent) {
            next(err);
        } else {
            console.error('--- GET_ORGANIZATION_BY_ID_CONTROLLER ERROR ---', err);
        }
    }
};

export const updateOrganizationController = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const { id } = req.params;
        const organizationId = Array.isArray(id) ? id[0] : id;
        const { name } = req.body;

        const updatedOrganization = await updateOrganizationService(organizationId, { name });

        if (!updatedOrganization) {
            return errorResponse(res, codes.NOT_FOUND, 'Organization not found.');
        }

        return successResponse(res, codes.OK, 'Organization updated successfully.', updatedOrganization);
    } catch (err: unknown) {
        if (!res.headersSent) {
            next(err);
        } else {
            console.error('--- UPDATE_ORGANIZATION_CONTROLLER ERROR ---', err);
        }
    }
};

export const deleteOrganizationController = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const { id } = req.params;
        const organizationId = Array.isArray(id) ? id[0] : id;

        const deletedOrganization = await deleteOrganizationService(organizationId);

        if (!deletedOrganization) {
            return errorResponse(res, codes.NOT_FOUND, 'Organization not found.');
        }

        return successResponse(res, codes.OK, 'Organization deleted successfully.', deletedOrganization);
    } catch (err: unknown) {
        if (!res.headersSent) {
            next(err);
        } else {
            console.error('--- DELETE_ORGANIZATION_CONTROLLER ERROR ---', err);
        }
    }
};