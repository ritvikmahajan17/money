export const GEMINI_PROMPTS = {
    TRANSACTION_ANALYSIS: (smsText: string, sender: string) => `
Analyze the following SMS message and determine if it is a confirmed debit or credit notification sent by a bank. 
Ignore promotional messages, OTPs, payment requests, offers, reminders, pending/future transactions, or non-bank senders.

SMS Text: "${smsText}"
Sender: "${sender}"

Return only a JSON response with the following structure:
{
  "isTransaction": boolean,
  "amount": number (if applicable),
  "vendor": string (merchant/vendor name if applicable),
  "category": string (e.g., "food", "transport", "shopping", "utilities", "entertainment", "healthcare", "other"),
  "dateTime": string (ISO format or extracted date/time if available),
  "currency": string (e.g., "USD", "INR", "EUR"),
  "transactionType": string ("debit", "credit"),
  "confidence": number (0-1, how confident you are about this being a confirmed bank transaction)
}

Rules:
1. Only set "isTransaction": true if:
   - The SMS is from a bank, AND
   - It explicitly confirms that money was debited or credited.
2. Ignore all messages from wallets, apps, UPI handles, or non-bank senders.
3. Do not mark as transaction if the SMS contains words like:
   "will be", "pending", "scheduled", "authorize", "authorization", "to be", "upcoming".
4. Extract "amount" only if clearly mentioned as part of debit/credit.
5. Extract "vendor" only if merchant name is mentioned (otherwise null).
6. Set "transactionType": 
   - "debit" if words like "debited", "spent", "purchase", "withdrawn"
   - "credit" if words like "credited", "received", "deposit"
7. If date/time is missing, return null.
8. Be conservative: if not 100% sure it’s a confirmed debit/credit bank SMS, return isTransaction: false.
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
