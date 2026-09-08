import { sequelize } from '../config/database.ts';
import Organization from './organization.ts';
import User from './user.ts';
import Application from './application.ts';
import Connector from './connector.ts';
import MetricSnapshot from './metricSnapshot.ts';
import AnalyticsDetail from './analyticsDetail.ts';

// 1. Organization Relationships
Organization.hasMany(User, {
    foreignKey: 'organizationId',
    as: 'users',
    onDelete: 'CASCADE',
});
User.belongsTo(Organization, {
    foreignKey: 'organizationId',
    as: 'organization',
});

Organization.hasMany(Application, {
    foreignKey: 'organizationId',
    as: 'applications',
    onDelete: 'CASCADE',
});
Application.belongsTo(Organization, {
    foreignKey: 'organizationId',
    as: 'organization',
});

// 2. Application Relationships
Application.hasMany(Connector, {
    foreignKey: 'applicationId',
    as: 'connectors',
    onDelete: 'CASCADE',
});
Connector.belongsTo(Application, {
    foreignKey: 'applicationId',
    as: 'application',
});

Application.hasMany(MetricSnapshot, {
    foreignKey: 'applicationId',
    as: 'metricSnapshots',
    onDelete: 'CASCADE',
});
MetricSnapshot.belongsTo(Application, {
    foreignKey: 'applicationId',
    as: 'application',
});

Application.hasMany(AnalyticsDetail, {
    foreignKey: 'applicationId',
    as: 'analyticsDetails',
    onDelete: 'CASCADE',
});
AnalyticsDetail.belongsTo(Application, {
    foreignKey: 'applicationId',
    as: 'application',
});

export {
    sequelize,
    Organization,
    User,
    Application,
    Connector,
    MetricSnapshot,
    AnalyticsDetail,
};