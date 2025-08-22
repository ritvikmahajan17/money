import { Router, Request, Response } from 'express';
import { smsParsingService } from '../services/smsParsingService';
import { AppLogger } from '../services/logger';
import { SmsRequestBody, SmsResponse } from '../dto';

const router = Router();

// GET /sms - Hello world endpoint
router.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'Hello World! SMS API is working!',
        timestamp: new Date().toISOString(),
    });
});

// POST /sms endpoint
router.post(
    '/',
    async (
        req: Request<Record<string, never>, SmsResponse, SmsRequestBody>,
        res: Response<SmsResponse>
    ) => {
        try {
            const { sms, from, when } = req.body;

            // Validate input
            if (!smsParsingService.validateSmsInput(sms)) {
                AppLogger.validationError('sms', sms);
                return res.status(400).json({
                    status: 'error',
                    received_sms: 'Invalid SMS content provided',
                } as SmsResponse);
            }

            // Parse SMS using the parsing service
            await smsParsingService.parseSms({
                sms,
                from,
                when,
            });

            // Return success response with transaction data
            return res.json({
                status: 'ok',
                received_sms: sms,
            });
        } catch (error) {
            AppLogger.requestError('POST', '/sms', error as Error);
            return res.status(500).json({
                status: 'error',
                received_sms: 'Internal server error',
            } as SmsResponse);
        }
    }
);

export default router;
