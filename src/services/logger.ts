import winston from 'winston';

// Define log levels
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

// Create Winston logger instance
const logger = winston.createLogger({
    levels: logLevels,
    level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'sms-api' },
    transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
        }),
        // Write all logs with importance level of `info` or less to `combined.log`
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
        }),
    ],
});

// Add console transport for non-production environments
if (process.env['NODE_ENV'] !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({
                    format: 'HH:mm:ss',
                }),
                winston.format.printf(
                    ({ timestamp, level, message, ...meta }) => {
                        const metaString = Object.keys(meta).length
                            ? JSON.stringify(meta, null, 2)
                            : '';
                        return `${timestamp} [${level}]: ${message} ${metaString}`;
                    }
                )
            ),
        })
    );
}

// Application-specific logging methods
export const AppLogger = {
    // Server and application lifecycle
    serverStart: (port: number, host: string) => {
        logger.info('🚀 Server started successfully', { port, host });
    },

    serverError: (error: Error) => {
        logger.error('💥 Server error occurred', {
            error: error.message,
            stack: error.stack,
        });
    },

    // SMS processing logs
    smsReceived: (sms: string, from?: string, timestamp?: string) => {
        logger.info('📨 SMS received', {
            messageLength: sms.length,
            sender: from || 'Unknown',
            timestamp: timestamp || new Date().toISOString(),
            preview: sms.substring(0, 50) + (sms.length > 50 ? '...' : ''),
        });
    },

    transactionDetected: (transaction: {
        amount?: number | undefined;
        vendor?: string | undefined;
        category?: string | undefined;
        type?: string | undefined;
        confidence?: number | undefined;
    }) => {
        logger.info('💰 Transaction detected', {
            amount: transaction.amount,
            vendor: transaction.vendor,
            category: transaction.category,
            type: transaction.type,
            confidence: transaction.confidence,
        });
    },

    nonTransactionMessage: () => {
        logger.debug('ℹ️  Non-transaction message processed');
    },

    // AI/Gemini logs
    geminiInitialized: () => {
        logger.info('✅ Gemini AI service initialized successfully');
    },

    geminiConfigError: () => {
        logger.error('🚨 GEMINI_API_KEY not configured');
    },

    geminiParseError: (error: Error, smsText: string) => {
        logger.error('❌ Gemini parsing failed', {
            error: error.message,
            smsPreview: smsText.substring(0, 50),
        });
    },

    geminiResponse: (response: string) => {
        logger.debug('🤖 Gemini AI response received', {
            responseLength: response.length,
        });
    },

    // Request/Response logs
    requestReceived: (method: string, path: string, ip?: string) => {
        logger.info('📥 API request', { method, path, ip });
    },

    requestError: (method: string, path: string, error: Error, ip?: string) => {
        logger.error('💥 Request error', {
            method,
            path,
            error: error.message,
            ip,
            stack: error.stack,
        });
    },

    validationError: (field: string, value: unknown) => {
        logger.warn('⚠️  Validation error', { field, value: typeof value });
    },

    // Generic application logs
    info: (message: string, meta?: Record<string, unknown>) => {
        logger.info(message, meta);
    },

    warn: (message: string, meta?: Record<string, unknown>) => {
        logger.warn(message, meta);
    },

    error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
        logger.error(message, {
            ...meta,
            error: error?.message,
            stack: error?.stack,
        });
    },

    debug: (message: string, meta?: Record<string, unknown>) => {
        logger.debug(message, meta);
    },

    xlsDbError: (
        operation: string,
        error: Error,
        meta?: Record<string, unknown>
    ) => {
        logger.error(`XlsDB ${operation} operation failed`, {
            operation,
            error: error.message,
            stack: error.stack,
            ...meta,
        });
    },
};

export default AppLogger;
