import { errorResponse, successResponse } from '../utils/responses.ts';
import { Organization, User } from '../models/index.ts';
import { Op } from 'sequelize';
import codes from '../utils/statusCodes.ts';
import { generateTokens } from '../utils/utils.ts';
import { sequelize } from '../config/database.ts';
import type { Response } from 'express';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

export interface PaginatedOrganizationsResult {
    organizations: Organization[];
    pagination: {
        totalOrganizations: number;
        currentPage: number;
        totalPages: number;
        limit: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface PaginationOptions {
    page?: number | string;
    limit?: number | string;
}

export const getAllOrganizationsService = async (options: PaginationOptions = {}): Promise<PaginatedOrganizationsResult> => {
    const { page = 1, limit = 10 } = options;

    const pageNum = Math.max(1, typeof page === "string" ? parseInt(page, 10) || 1 : page);
    const limitNum = Math.min(100, Math.max(1, typeof limit === "string" ? parseInt(limit, 10) || 10 : limit));
    const offset = (pageNum - 1) * limitNum;

    const { count: totalOrganizations, rows: organizations } = await Organization.findAndCountAll({
        include: [
            {
                model: User,
                as: 'users', // Adjust this alias ('users' or 'Users') if you defined a custom one in your model associations
                attributes: ['id', 'fullName'], // Fetches only the user ID and name as requested
            },
        ],
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset: offset,
        distinct: true, // Ensures accurate count when using joins
    });

    const totalPages = Math.ceil(totalOrganizations / limitNum);

    return {
        organizations,
        pagination: {
            totalOrganizations,
            currentPage: pageNum,
            totalPages,
            limit: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
        },
    };
};

export const getOrganizationByIdService = async (id: string) => {
    const organization = await Organization.findByPk(id, {
        include: [
            {
                model: User,
                as: 'users',
                attributes: ['id', 'fullName', 'email', 'role'],
            },
        ],
    });

    return organization;
};

export const updateOrganizationService = async (id: string, updateData: { name?: string }) => {
    const organization = await Organization.findByPk(id);
    if (!organization) {
        return null;
    }

    await organization.update(updateData);
    return organization;
};

export const deleteOrganizationService = async (id: string) => {
    const organization = await Organization.findByPk(id);
    if (!organization) {
        return null;
    }

    // Keep a copy of the organization data before destroying it
    const organizationData = organization.toJSON();

    await organization.destroy();
    return organizationData;
};