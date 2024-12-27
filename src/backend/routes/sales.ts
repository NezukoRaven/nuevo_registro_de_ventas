import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { Sales } from '../types';

const salesRouter = Router();

salesRouter.get('/', async (_req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.id, 
                s.sale_date,
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

salesRouter.post('/', async (req: Request<{}, {}, Sales>, res: Response) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const saleResult = await client.query(
            'INSERT INTO sales (sale_date) VALUES ($1) RETURNING id',
            [req.body.date]
        );
        const saleId = saleResult.rows[0].id;

        for (const item of req.body.items) {
            await client.query(
                `INSERT INTO sale_items 
                (sale_id, product_id, product_name, price, quantity, total) 
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    saleId,
                    item.id,        // product_id
                    item.product_name, // nombre del producto
                    item.price,     // precio
                    item.quantity,  // cantidad
                    item.total      // total
                ]
            );
        }

        await client.query('COMMIT');
        res.json({ id: saleId, message: 'Venta guardada correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al guardar la venta:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
        client.release();
    }
});

export default salesRouter;