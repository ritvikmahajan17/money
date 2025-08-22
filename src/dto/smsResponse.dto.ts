// SMS Response DTO

export interface SmsResponse {
    status: 'ok' | 'error';
    received_sms: string;
}
