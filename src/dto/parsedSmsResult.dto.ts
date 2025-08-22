// Parsed SMS Result DTO (for internal service use)
import { TransactionData } from './transactionData.dto';

export interface ParsedSmsResult {
  originalSms: string;
  sender: string;
  timestamp: string;
  formattedTimestamp: string;
  messageLength: number;
  transaction: TransactionData;
}
