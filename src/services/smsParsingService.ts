import { geminiService } from './geminiService';
import { AppLogger } from './logger';
import { TransactionData, SmsData, ParsedSmsResult } from '../dto';

class SmsParsingService {
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
}

// Export singleton instance
export const smsParsingService = new SmsParsingService();
