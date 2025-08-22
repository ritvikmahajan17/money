import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import smsRoutes from './routes/smsRoutes';
import { AppLogger } from './services/logger';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = Number(process.env['PORT']) || 8000;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/sms', smsRoutes);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, HOST, () => {
    AppLogger.serverStart(PORT, HOST);
});

export default app;
