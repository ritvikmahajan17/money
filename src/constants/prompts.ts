export const GEMINI_PROMPTS = {
    // Transaction analysis prompt for SMS messages
    TRANSACTION_ANALYSIS: (smsText: string) => `
Analyze the following SMS message and determine if it's a financial transaction. 
If it is a transaction, extract the relevant information and return a JSON response.
If it's not a transaction, return isTransaction: false.

SMS Text: "${smsText}"

Please return a JSON response with the following structure:
{
  "isTransaction": boolean,
  "amount": number (if applicable),
  "vendor": string (merchant/vendor name if applicable),
  "category": string (e.g., "food", "transport", "shopping", "utilities", "entertainment", "healthcare", "other"),
  "dateTime": string (ISO format or extracted date/time if available),
  "currency": string (e.g., "USD", "INR", "EUR"),
  "transactionType": string ("debit", "credit"),
  "confidence": number (0-1, how confident you are about this being a transaction)
}

Rules:
1. Only mark as transaction if it clearly mentions money movement, payments, purchases, or account activity
2. Extract amount as a number (remove currency symbols)
3. Identify vendor/merchant names accurately
4. Categorize transactions appropriately
5. Determine transaction type based on context (spent/debited = debit, received/credited = credit, etc.)
6. Set confidence based on clarity of transaction indicators
7. If date/time is not in the SMS, use null
8. Be conservative - if unsure, mark isTransaction as false

Return only the JSON response, no additional text.
  `,
};

// System messages and configurations
export const AI_CONFIG = {
    // Model configurations
    MODELS: {
        GEMINI_FLASH: 'gemini-2.0-flash',
    },
};

export default GEMINI_PROMPTS;
