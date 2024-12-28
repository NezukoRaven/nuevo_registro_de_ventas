import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { Products } from '../types';
import { RequestHandler } from 'express-serve-static-core';


const productsMamaRouter = Router();

// GET - Obtener productos por número de lista
productsMamaRouter.get('/:listNumber', async (req: Request<{ listNumber: string }>, res: Response) => {
    try {
        const { listNumber } = req.params;
        const result = await pool.query(
            `SELECT 
                id, name, price,
                CASE WHEN promotion_quantity IS NOT NULL AND promotion_price IS NOT NULL 
                THEN json_build_object('quantity', promotion_quantity, 'price', promotion_price)
                ELSE NULL END as promotion,
                list_number as "listNumber"
            FROM products_mama 
            WHERE list_number = $1
            ORDER BY created_at DESC`,
            [listNumber]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// POST - Crear nuevo producto
productsMamaRouter.post('/', async (req: Request<{}, {}, Products>, res: Response) => {
    const client = await pool.connect();
    try {
        const { name, price, promotion, listNumber } = req.body;
        
        const result = await client.query(
            `INSERT INTO products_mama 
            (name, price, promotion_quantity, promotion_price, list_number) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id, name, price, 
                CASE WHEN promotion_quantity IS NOT NULL AND promotion_price IS NOT NULL 
                THEN json_build_object('quantity', promotion_quantity, 'price', promotion_price)
                ELSE NULL END as promotion,
                list_number as "listNumber"`,
            [name, price, promotion?.quantity || null, promotion?.price || null, listNumber]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    } finally {
        client.release();
    }
});

// PUT - Actualizar producto existente
const putHandler: RequestHandler<{ id: string }, any, Partial<Products>> = async (req, res): Promise<void> => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { name, price, promotion, listNumber } = req.body;

        const result = await client.query(
            `UPDATE products_mama 
            SET name = $1, price = $2, promotion_quantity = $3, promotion_price = $4, list_number = $5
            WHERE id = $6 
            RETURNING id, name, price, 
                CASE WHEN promotion_quantity IS NOT NULL AND promotion_price IS NOT NULL 
                THEN json_build_object('quantity', promotion_quantity, 'price', promotion_price)
                ELSE NULL END as promotion,
                list_number as "listNumber"`,
            [name, price, promotion?.quantity || null, promotion?.price || null, listNumber, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    } finally {
        client.release();
    }
};

productsMamaRouter.put('/:id', putHandler);


// DELETE - Eliminar producto
const deleteHandler: RequestHandler<{ id: string }, any> = async (req, res): Promise<void> => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const result = await client.query(
            'DELETE FROM products_mama WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    } finally {
        client.release();
    }
};

productsMamaRouter.delete('/:id', deleteHandler);

export default productsMamaRouter;