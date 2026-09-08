import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { sequelize } from '../config/database.ts';
import type { Application } from './application.ts';

export enum ConnectorStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    ERROR = 'error',
}

// 1. Attributes interface matching DB columns
export interface ConnectorAttributes {
    id: string;
    applicationId: string;
    type: string; // e.g. 'postgres', 'mixpanel', 'google_analytics', 'api_key'
    credentials: Record<string, any>; // JSONB for API keys, DB strings, or tokens
    status: ConnectorStatus;
    lastSyncedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

// 2. Attributes optional when calling Connector.create()
export interface ConnectorCreationAttributes extends Optional<ConnectorAttributes, 'id' | 'status' | 'lastSyncedAt'> {}

// 3. Model class definition
export class Connector extends Model<ConnectorAttributes, ConnectorCreationAttributes> implements ConnectorAttributes {
    public declare id: string;
    public declare applicationId: string;
    public declare type: string;
    public declare credentials: Record<string, any>;
    public declare status: ConnectorStatus;
    public declare lastSyncedAt: Date | null;

    public declare readonly createdAt: Date;
    public declare readonly updatedAt: Date;

    // TypeScript declarations for Sequelize association mixins
    public declare getApplication: () => Promise<Application>;
    public declare setApplication: (application: Application | string) => Promise<void>;
}

Connector.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        applicationId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'application_id',
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        credentials: {
            type: DataTypes.JSONB,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(ConnectorStatus)),
            defaultValue: ConnectorStatus.ACTIVE,
            allowNull: false,
        },
        lastSyncedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_synced_at',
        },
    },
    {
        sequelize,
        tableName: 'connectors',
        timestamps: true,
        underscored: true,
    }
);

export default Connector;