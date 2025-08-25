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
  "vendor": string (merchant/vendor name if applicable, otherwise null),
  "category": string (e.g., "food", "transport", "shopping", "utilities", "entertainment", "healthcare", "other", or null),
  "dateTime": string (ISO format or extracted date/time if available, otherwise null),
  "currency": string (e.g., "USD", "INR", "EUR", or null),
  "transactionType": string ("debit", "credit", or null),
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

---

### Examples  

**Valid Transaction (Credit):**  
SMS: "Dear Customer, Acct XX298 is credited with Rs 2.00 on 25-Aug-25 from NPCI BHIM. UPI:101289300407-ICICI Bank."  

Expected JSON:
{
  "isTransaction": true,
  "amount": 2.00,
  "vendor": "NPCI BHIM",
  "category": "other",
  "dateTime": "2025-08-25T00:00:00Z",
  "currency": "INR",
  "transactionType": "credit",
  "confidence": 0.95
}

**Valid Transaction (Debit):**  
SMS: "ICICI Bank Acct XX298 debited for Rs 153.00 on 25-Aug-25; Bistro credited. UPI:523742264712. Call 18002662 for dispute. SMS BLOCK 298 to 9215676766."  

Expected JSON:
{
  "isTransaction": true,
  "amount": 153.00,
  "vendor": "Bistro",
  "category": "food",
  "dateTime": "2025-08-25T00:00:00Z",
  "currency": "INR",
  "transactionType": "debit",
  "confidence": 0.95
}

**Not a Transaction (Scheduled/Pending):**  
SMS: "Your account will be debited with Rs 5000.00 on 27-Aug-25 towards ICCL GROWW AUTOPAY for AutoPay UPI Mandate, RRN 517468660010-ICICI Bank."  

Expected JSON:
{
  "isTransaction": false,
  "amount": null,
  "vendor": null,
  "category": null,
  "dateTime": null,
  "currency": null,
  "transactionType": null,
  "confidence": 0.99
}

**Not a Transaction (OTP):**  
SMS: "Use OTP 347892 for completing your transaction at Amazon. Do not share with anyone. - HDFC Bank"  

Expected JSON:
{
  "isTransaction": false,
  "amount": null,
  "vendor": null,
  "category": null,
  "dateTime": null,
  "currency": null,
  "transactionType": null,
  "confidence": 0.99
}

**Not a Transaction (Promotional/Offer):**  
SMS: "Get 10% cashback on all weekend dining spends with your ICICI Bank Debit Card. Offer valid till 31-Aug."  

Expected JSON:
{
  "isTransaction": false,
  "amount": null,
  "vendor": null,
  "category": null,
  "dateTime": null,
  "currency": null,
  "transactionType": null,
  "confidence": 0.99
}
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
