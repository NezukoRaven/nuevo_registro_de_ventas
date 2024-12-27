import express from 'express';
import cors from 'cors';
import productsRouter from './routes/products';
import salesRouter from './routes/sales';
import salesMamaRouter from './routes/salesMama';
import { initDb } from './config/database';
import path from 'path';
import { fileURLToPath } from 'url'; // Importa fileURLToPath
import { dirname } from 'node:path';

const app = express();

const PORT = 80;

app.use(cors({
    //origin: ['http://localhost:5173', 'http://34.136.163.22:5173']

}));
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/sales_mama', salesMamaRouter);

initDb();


// Ruta catchall para SPA

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = path.resolve(__dirname, '..', '..', 'dist');

app.use(express.static(distPath));

app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html')); // Usa path.resolve aquí también
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});