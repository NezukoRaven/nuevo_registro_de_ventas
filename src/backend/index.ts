import express from 'express';
import cors from 'cors';
import productsRouter from './routes/products';
import salesRouter from './routes/sales';
import salesMamaRouter from './routes/salesMama';
import { initDb } from './config/database';

const app = express();

app.use(cors({
    //origin: ['http://localhost:5173', 'http://34.136.163.22:5173']
    origin: ['http://localhost:5173', 'http://192.168.1.95:5173']
}));
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/sales_mama', salesMamaRouter);

initDb();

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});