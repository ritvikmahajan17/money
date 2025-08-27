import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import smsRoutes from './routes/smsRoutes';
import { AppLogger } from './services/logger';
import { EnvValidator } from './utils/envValidator';

// Load environment variables from .env file (only for local development)
// In production (EB), environment variables come from AWS Console
if (process.env['NODE_ENV'] !== 'production') {
    dotenv.config();
}

// Validate required environment variables
EnvValidator.validate();

const app: Application = express();
const PORT = Number(EnvValidator.getOptionalVar('PORT', '8000'));
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/sms', smsRoutes);

// Root route for EB health checks
app.get('/', (_req: Request, res: Response) => {
    res.json({ 
        status: 'ok', 
        message: 'Money SMS API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
const server = app.listen(PORT, HOST, () => {
    AppLogger.serverStart(PORT, HOST);
    console.log(`Server started successfully on ${HOST}:${PORT}`);
});

// Error handling
server.on('error', (error) => {
    console.error('Server startup error:', error);
    AppLogger.error('Server startup failed', error, { context: 'SERVER' });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    AppLogger.error('Uncaught Exception', error, { context: 'PROCESS' });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    AppLogger.error('Unhandled Rejection', reason as Error, { context: 'PROCESS' });
});

export default app;
