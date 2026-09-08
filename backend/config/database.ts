import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const db = process.env.DATABASE_URL;

if (!db) {
    throw new Error('DATABASE_URL is not defined in environment variables.');
}

export const sequelize = new Sequelize(db, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});