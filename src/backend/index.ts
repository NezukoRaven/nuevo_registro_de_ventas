import express from 'express';
import cors from 'cors';
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Resolver __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Inicializar Express
const app = express();

// Middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'http://34.136.163.22:5173'] // URL de tu frontend
}));
app.use(express.json());

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

// Función para inicializar base de datos
const initDb = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
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
    `);
        console.log('Tablas creadas correctamente');
    } catch (error) {
        console.error('Error al crear las tablas:', error);
    }
};

// Inicializar base de datos
initDb();

// Endpoint para crear una nueva venta
app.post('/api/sales', async (req, res) => {
    const client = await pool.connect();

    try {
        // Iniciar transacción
        await client.query('BEGIN');

        // Crear nueva venta
        const saleResult = await client.query(
            'INSERT INTO sales DEFAULT VALUES RETURNING id'
        );
        const saleId = saleResult.rows[0].id;

        // Insertar items de la venta
        const { items } = req.body;
        for (const item of items) {
            await client.query(
                `INSERT INTO sale_items 
        (sale_id, product_id, product_name, price, quantity, total) 
        VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    saleId,
                    item.id,
                    item.name,
                    item.price,
                    item.quantity,
                    item.total
                ]
            );
        }

        // Confirmar transacción
        await client.query('COMMIT');

        res.json({
            id: saleId,
            message: 'Venta guardada correctamente'
        });

    } catch (error) {
        // Revertir transacción en caso de error
        await client.query('ROLLBACK');
        console.error('Error al guardar la venta:', error);
        res.status(500).json({ error: 'Error al guardar la venta' });
    } finally {
        // Liberar cliente de la pool
        client.release();
    }
});

// Endpoint para obtener todas las ventas
app.get('/api/sales', async (_req, res) => {
    try {
        const result = await pool.query(`
    SELECT 
        s.id, 
        s.created_at, 
        json_agg(json_build_object(
          'id', si.id,
          'product_id', si.product_id,
          'product_name', si.product_name,
          'price', si.price,
          'quantity', si.quantity,
          'total', si.total
        )) as items,
        SUM(si.total) as total_sale
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener las ventas:', error);
        res.status(500).json({ error: 'Error al obtener las ventas' });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});