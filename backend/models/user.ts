import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.ts';
import type { Organization } from './organization.ts';

export enum UserRole {
    SUPER_ADMIN = 'Super Admin',
    APP_ADMIN = 'App Admin',
}

// 1. Attributes interface matching DB columns
export interface UserAttributes {
    id: string;
    organizationId: string;
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    createdAt?: Date;
    updatedAt?: Date;
}

// 2. Attributes optional when calling User.create()
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role'> {}

// 3. Model class definition
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public declare id: string;
    public declare organizationId: string;
    public declare fullName: string;
    public declare email: string;
    public declare password: string;
    public declare role: UserRole;

    public declare readonly createdAt: Date;
    public declare readonly updatedAt: Date;

    // TypeScript declarations for Sequelize association mixins
    public declare getOrganization: () => Promise<Organization>;
    public declare setOrganization: (organization: Organization | string) => Promise<void>;

    // Instance method to check passwords during login
    public async matchPassword(enteredPassword: string): Promise<boolean> {
        return await bcrypt.compare(enteredPassword, this.password);
    }

    // Automatically hide password when user model is converted to JSON/sent to client
    public toJSON() {
        const { password, ...values } = this.get();
        return values;
    }
}

User.init(
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
        fullName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'full_name',
            validate: {
                notEmpty: true,
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM(...Object.values(UserRole)),
            defaultValue: UserRole.APP_ADMIN,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeCreate: async (user: User) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user: User) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    }
);

export default User;