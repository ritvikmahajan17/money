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
        const transactionData = await geminiService.parseTransaction(sms);

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
