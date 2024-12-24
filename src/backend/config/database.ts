import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

export const initDb = async () => {
    try {
        await pool.query(`
            -- Tabla de productos
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                promotion_quantity INTEGER,
                promotion_price DECIMAL(10,2),
                list_number INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Tablas para ventas normales
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                sale_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sale_items (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER REFERENCES sales(id),
                product_id INTEGER NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                quantity INTEGER NOT NULL,
                total DECIMAL(10,2) NOT NULL
            );

            -- Tablas para ventas mama
            CREATE TABLE IF NOT EXISTS sales_mama (
                id SERIAL PRIMARY KEY,
                sale_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sale_items_mama (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER REFERENCES sales_mama(id),
                product_id INTEGER NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                quantity INTEGER NOT NULL,
                total DECIMAL(10,2) NOT NULL
            );
        `);
        console.log(`Tablas creadas correctamente`);
    } catch (error) {
        console.error('Error al crear las tablas:', error);
    }
};