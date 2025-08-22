export interface TransactionData {
    isTransaction: boolean;
    amount?: number | undefined;
    vendor?: string | undefined;
    category?: string | undefined;
    dateTime?: string | undefined;
    currency?: string | undefined;
    transactionType?: 'debit' | 'credit' | undefined;
    confidence?: number | undefined;
}
