import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { sequelize } from '../config/database.ts';
import type { Application } from './application.ts';

// 1. Attributes interface matching DB columns
export interface MetricSnapshotAttributes {
    id: string;
    applicationId: string;
    activeUsers: number;
    dau: number;
    retentionRate: number; // e.g., 78.5 for %
    uptime: number; // e.g., 99.98 for %
    totalSessions: number;
    timestamp: Date;
}

// 2. Attributes optional when calling MetricSnapshot.create()
export interface MetricSnapshotCreationAttributes extends Optional<MetricSnapshotAttributes, 'id' | 'timestamp'> {}

// 3. Model class definition
export class MetricSnapshot extends Model<MetricSnapshotAttributes, MetricSnapshotCreationAttributes> implements MetricSnapshotAttributes {
    public declare id: string;
    public declare applicationId: string;
    public declare activeUsers: number;
    public declare dau: number;
    public declare retentionRate: number;
    public declare uptime: number;
    public declare totalSessions: number;
    public declare timestamp: Date;

    // TypeScript declarations for Sequelize association mixins
    public declare getApplication: () => Promise<Application>;
    public declare setApplication: (application: Application | string) => Promise<void>;
}

MetricSnapshot.init(
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
        activeUsers: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            field: 'active_users',
        },
        dau: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        retentionRate: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0,
            allowNull: false,
            field: 'retention_rate',
        },
        uptime: {
            type: DataTypes.FLOAT,
            defaultValue: 100.0,
            allowNull: false,
        },
        totalSessions: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            field: 'total_sessions',
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'metric_snapshots',
        timestamps: false,
        underscored: true,
    }
);

export default MetricSnapshot;