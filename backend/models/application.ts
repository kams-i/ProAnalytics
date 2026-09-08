import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { sequelize } from '../config/database.ts';
import type { Organization } from './organization.ts';

export enum AppStatus {
    OPERATIONAL = 'Operational',
    DEGRADED = 'Degraded',
    DOWN = 'Down',
}

// 1. Attributes interface matching DB columns
export interface ApplicationAttributes {
    id: string;
    organizationId: string;
    name: string;
    status: AppStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

// 2. Attributes optional when calling Application.create()
export interface ApplicationCreationAttributes extends Optional<ApplicationAttributes, 'id' | 'status'> {}

// 3. Model class definition
export class Application extends Model<ApplicationAttributes, ApplicationCreationAttributes> implements ApplicationAttributes {
    public declare id: string;
    public declare organizationId: string;
    public declare name: string;
    public declare status: AppStatus;

    public declare readonly createdAt: Date;
    public declare readonly updatedAt: Date;

    // TypeScript declarations for Sequelize association mixins
    public declare getOrganization: () => Promise<Organization>;
    public declare setOrganization: (organization: Organization | string) => Promise<void>;
}

Application.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        organizationId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'organization_id',
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        status: {
            type: DataTypes.ENUM(...Object.values(AppStatus)),
            defaultValue: AppStatus.OPERATIONAL,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'applications',
        timestamps: true,
        underscored: true,
    }
);

export default Application;