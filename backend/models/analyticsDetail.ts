import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { sequelize } from '../config/database.ts';
import type { Application } from './application.ts';

export enum AnalyticsDetailType {
    FUNNEL = 'funnel',
    HEATMAP = 'heatmap',
    RETENTION = 'retention',
    SESSION = 'session',
}

// 1. Attributes interface matching DB columns
export interface AnalyticsDetailAttributes {
    id: string;
    applicationId: string;
    type: AnalyticsDetailType;
    payload: Record<string, any>;
    timestamp: Date;
}

// 2. Attributes optional when calling AnalyticsDetail.create()
export interface AnalyticsDetailCreationAttributes extends Optional<AnalyticsDetailAttributes, 'id' | 'timestamp'> {}

// 3. Model class definition
export class AnalyticsDetail extends Model<AnalyticsDetailAttributes, AnalyticsDetailCreationAttributes> implements AnalyticsDetailAttributes {
    public declare id: string;
    public declare applicationId: string;
    public declare type: AnalyticsDetailType;
    public declare payload: Record<string, any>;
    public declare timestamp: Date;

    // TypeScript declarations for Sequelize association mixins
    public declare getApplication: () => Promise<Application>;
    public declare setApplication: (application: Application | string) => Promise<void>;
}

AnalyticsDetail.init(
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
            type: DataTypes.ENUM(...Object.values(AnalyticsDetailType)),
            allowNull: false,
        },
        payload: {
            type: DataTypes.JSONB,
            allowNull: false,
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'analytics_details',
        timestamps: false,
        underscored: true,
    }
);

export default AnalyticsDetail;