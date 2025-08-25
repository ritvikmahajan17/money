import { geminiService } from './geminiService';
import { AppLogger } from './logger';
import { TransactionData, SmsData, ParsedSmsResult } from '../dto';
import { XlsDB } from '../database/xlsDB';

class SmsParsingService {
    private xlsDb: XlsDB;

    constructor(xlsDb: XlsDB) {
        this.xlsDb = xlsDb;
    }
    async parseSms(smsData: SmsData): Promise<ParsedSmsResult> {
        const { sms, from, when } = smsData;

        // Process timestamp
        const timestamp = when ? new Date(Number(when)) : new Date();
        const formattedTimestamp = timestamp.toLocaleString();

        // Log the SMS message
        AppLogger.smsReceived(sms, from, timestamp.toISOString());

        // Parse transaction data using Gemini AI
        const transactionData = await geminiService.parseTransaction(
            sms,
            from!
        );

        // Log transaction analysis
        this.logTransactionAnalysis(transactionData);

        // Save to Excel if it's a valid transaction with good confidence
        if (
            transactionData.isTransaction &&
            transactionData.confidence &&
            transactionData.confidence > 0.5
        ) {
            await this.saveTransactionToExcel(
                transactionData,
                formattedTimestamp
            );
        }

        return {
            originalSms: sms,
            sender: from || 'Unknown',
            timestamp: timestamp.toISOString(),
            formattedTimestamp,
            messageLength: sms.length,
            transaction: transactionData,
        };
    }

    private logTransactionAnalysis(transactionData: TransactionData): void {
        if (transactionData.isTransaction) {
            AppLogger.transactionDetected({
                amount: transactionData.amount,
                vendor: transactionData.vendor,
                category: transactionData.category,
                type: transactionData.transactionType,
                confidence: transactionData.confidence,
            });
        } else {
            AppLogger.nonTransactionMessage();
        }
    }

    validateSmsInput(sms: unknown): sms is string {
        return typeof sms === 'string' && sms.length > 0;
    }

    async saveTransactionToExcel(
        transactionData: TransactionData,
        smsTime: string
    ): Promise<void> {
        try {
            if (!transactionData.isTransaction) {
                AppLogger.info('Skipping non-transaction data for Excel save');
                return;
            }

            const values = {
                amount: transactionData.amount,
                vendor: transactionData.vendor,
                category: transactionData.category,
                dateTime: smsTime,
                currency: transactionData.currency,
                transactionType: transactionData.transactionType,
                confidence: transactionData.confidence,
            };

            // Check for duplicates before saving
            const isDuplicate = await this.checkForDuplicate(values);
            if (isDuplicate) {
                AppLogger.warn(
                    'Duplicate transaction detected, skipping save to Excel',
                    {
                        amount: values.amount,
                        timeWindow: `${Number(process.env['DUPLICATE_CHECK_WINDOW_MINUTES']) || 1} minute(s)`
                    }
                );
                return;
            }

            await this.xlsDb.create({ values });

            AppLogger.info('Transaction saved to Excel successfully', {
                vendor: values.vendor,
                amount: values.amount,
                category: values.category,
            });
        } catch (error) {
            AppLogger.error(
                'Failed to save transaction to Excel',
                error as Error,
                { transactionData }
            );
            throw error;
        }
    }

    private async checkForDuplicate(
        newTransaction: Record<string, unknown>
    ): Promise<boolean> {
        try {
            const { amount } = newTransaction;

            // If amount is missing, allow the transaction
            if (!amount) {
                return false;
            }

            // Get time window from environment variable (default to 60 seconds = 1 minute)
            const timeWindowSeconds = Number(process.env['DUPLICATE_CHECK_WINDOW_SECONDS']) || 60;
            const now = new Date();
            const timeWindowAgo = new Date(now.getTime() - timeWindowSeconds * 1000);

            // Search for existing transactions with same amount only
            const existingTransactions = await this.xlsDb.findAll({
                where: {
                    amount: amount,
                },
            });

            // Check if any existing transaction is within the time window
            if (Array.isArray(existingTransactions)) {
                for (const transaction of existingTransactions) {
                    const transactionRecord = transaction as Record<
                        string,
                        unknown
                    >;
                    const transactionTime =
                        transactionRecord['dateTime'] ||
                        transactionRecord['timestamp'];

                    if (transactionTime) {
                        const transactionDate = new Date(
                            transactionTime as string
                        );

                        // If transaction is within the time window, it's a duplicate
                        if (
                            transactionDate >= timeWindowAgo &&
                            transactionDate <= now
                        ) {
                            AppLogger.info(
                                `Duplicate transaction found within ${timeWindowSeconds}-second window`,
                                {
                                    existingTransaction: {
                                        amount: transactionRecord['amount'],
                                        dateTime: transactionTime,
                                    },
                                    newTransaction: {
                                        amount,
                                    },
                                    timeDifference: `${Math.round((now.getTime() - transactionDate.getTime()) / 1000)}s`,
                                    timeWindowSeconds,
                                }
                            );
                            return true;
                        }
                    }
                }
            }

            return false;
        } catch (error) {
            AppLogger.error(
                'Error checking for duplicates, allowing transaction',
                error as Error,
                {
                    newTransaction,
                }
            );
            // If duplicate check fails, allow the transaction to proceed
            return false;
        }
    }

    async getTransactionsFromExcel(
        filters?: Record<string, unknown>
    ): Promise<unknown[]> {
        try {
            const where = filters || {};
            const transactions = await this.xlsDb.findAll({ where });
            AppLogger.info('Retrieved transactions from Excel', {
                count: Array.isArray(transactions) ? transactions.length : 0,
                filters,
            });
            return transactions;
        } catch (error) {
            AppLogger.error(
                'Failed to retrieve transactions from Excel',
                error as Error,
                {
                    filters,
                }
            );
            throw error;
        }
    }

    async updateTransactionInExcel(
        where: Record<string, unknown>,
        newValues: Record<string, unknown>
    ): Promise<unknown> {
        try {
            const result = await this.xlsDb.update({ where, newValues });
            AppLogger.info('Transaction updated in Excel successfully', {
                where,
                newValues,
            });
            return result;
        } catch (error) {
            AppLogger.error(
                'Failed to update transaction in Excel',
                error as Error,
                {
                    where,
                    newValues,
                }
            );
            throw error;
        }
    }
}

// Export singleton instance
const sheetId = process.env['EXCEL_SHEET_ID'];
if (!sheetId) {
    throw new Error('EXCEL_SHEET_ID not set in environment variables');
}
const sheetName = process.env['EXCEL_SHEET_NAME'];
if (!sheetName) {
    throw new Error('EXCEL_SHEET_NAME not set in environment variables');
}

const clientEmail = process.env['GOOGLE_CLIENT_EMAIL'];
if (!clientEmail) {
    throw new Error('GOOGLE_CLIENT_EMAIL not set in environment variables');
}
const privateKey = process.env['GOOGLE_PRIVATE_KEY'];
if (!privateKey) {
    throw new Error('GOOGLE_PRIVATE_KEY not set in environment variables');
}
const xlsDb = new XlsDB({
    sheetId,
    sheetName,
    clientEmail,
    privateKey,
});

export const smsParsingService = new SmsParsingService(xlsDb);
