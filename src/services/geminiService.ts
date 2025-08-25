import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { AppLogger } from './logger';
import { GEMINI_PROMPTS, AI_CONFIG } from '../constants';
import { TransactionData } from '../dto';

// Load environment variables
dotenv.config();

class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    constructor() {
        const apiKey = process.env['GEMINI_API_KEY'];
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            AppLogger.geminiConfigError();
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: AI_CONFIG.MODELS.GEMINI_FLASH,
            });
            AppLogger.geminiInitialized();
        }
    }

    async parseTransaction(
        smsText: string,
        from: string
    ): Promise<TransactionData> {
        // Ensure API key is configured
        if (!this.model) {
            throw new Error(
                'GEMINI_API_KEY not configured. Please set your API key in the .env file.'
            );
        }

        try {
            const prompt = GEMINI_PROMPTS.TRANSACTION_ANALYSIS(smsText, from);
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const cleaned = text.replace(/```json|```/g, '').trim();

            AppLogger.geminiResponse(cleaned);

            // Parse the JSON response from Gemini
            const parsedData = JSON.parse(cleaned);

            return {
                ...parsedData,
                rawData: {
                    originalText: smsText,
                    extractedInfo: parsedData,
                },
            };
        } catch (error) {
            AppLogger.geminiParseError(error as Error, smsText);

            // Return error state instead of fallback parsing
            return {
                isTransaction: false,
                confidence: 0.0,
            };
        }
    }
}

// Export singleton instance
export const geminiService = new GeminiService();
