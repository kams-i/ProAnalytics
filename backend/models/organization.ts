import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { sequelize } from '../config/database.ts';
import type { User } from './user.ts';

// 1. Attributes interface matching DB columns
export interface OrganizationAttributes {
    id: string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// 2. Attributes optional when calling Organization.create()
export interface OrganizationCreationAttributes extends Optional<OrganizationAttributes, 'id'> {}

// 3. Model class definition
export class Organization extends Model<OrganizationAttributes, OrganizationCreationAttributes> implements OrganizationAttributes {
    public declare id: string;
    public declare name: string;

    public declare readonly createdAt: Date;
    public declare readonly updatedAt: Date;

    // TypeScript declarations for Sequelize association mixins
    public declare getUsers: () => Promise<User[]>;
    public declare addUser: (user: User | string) => Promise<void>;
    public declare removeUser: (user: User | string) => Promise<void>;
    public declare hasUser: (user: User | string) => Promise<boolean>;
}

Organization.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
            },
        },
    },
    {
        sequelize,
        tableName: 'organizations',
        timestamps: true,
        underscored: true,
    }
);

export default Organization;