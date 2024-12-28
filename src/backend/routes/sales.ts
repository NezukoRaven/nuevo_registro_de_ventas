import { Router, Request, Response, RequestHandler } from 'express';
import { pool } from '../config/database';
import { Sales } from '../types';
import { SaleParams } from '../types';

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

const putHandler: RequestHandler<SaleParams, any, Sales> = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update sale date
        await client.query(
            'UPDATE sales SET sale_date = $1 WHERE id = $2',
            [req.body.date, req.params.id]
        );

        // Delete existing sale items
        await client.query(
            'DELETE FROM sale_items WHERE sale_id = $1',
            [req.params.id]
        );

        // Insert updated sale items
        for (const item of req.body.items) {
            await client.query(
                `INSERT INTO sale_items (sale_id, product_id, product_name, price, quantity, total)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    req.params.id,
                    item.id,
                    item.product_name,
                    item.price,
                    item.quantity,
                    item.total
                ]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Venta actualizada correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar la venta:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
        client.release();
    }
};

// DELETE Handler usando RequestHandler
const deleteHandler: RequestHandler<SaleParams> = async (req, res): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Delete sale items first (due to foreign key constraint)
        await client.query(
            'DELETE FROM sale_items WHERE sale_id = $1',
            [req.params.id]
        );

        // Delete the sale
        const result = await client.query(
            'DELETE FROM sales WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Venta no encontrada' });
            return;
        }

        await client.query('COMMIT');
        res.json({ message: 'Venta eliminada correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar la venta:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
        client.release();
    }
};

// Rutas
salesRouter.put('/:id', putHandler);
salesRouter.delete('/:id', deleteHandler);

export default salesRouter;