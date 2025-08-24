import axios from 'axios';
import { AppLogger } from '../services/logger';

interface XlsDBOptions {
    sheetId: string;
    sheetName: string;
    clientEmail: string;
    privateKey: string;
}

interface FindOptions {
    where: Record<string, unknown>;
}

interface UpdateOptions {
    newValues: Record<string, unknown>;
    where: Record<string, unknown>;
}

interface CreateOptions {
    values: Record<string, unknown>;
}

export class XlsDB {
    private URL: string;
    private sheetId: string;
    private sheetName: string;
    private clientEmail: string;
    private privateKey: string;
    private isDev: boolean;

    constructor({ sheetId, sheetName, clientEmail, privateKey }: XlsDBOptions) {
        const devURL = 'http://localhost:5050/xlsDB';
        const prodURL = 'https://xls-db.onrender.com/xlsDB';
        this.isDev = process.env['NODE_ENV'] !== 'production';
        console.log('isDev:', this.isDev);
        this.URL = this.isDev ? devURL : prodURL;
        this.sheetId = sheetId;
        this.sheetName = sheetName;
        this.clientEmail =
            clientEmail || process.env['GOOGLE_CLIENT_EMAIL'] || '';
        this.privateKey = privateKey || process.env['GOOGLE_PRIVATE_KEY'] || '';

        // Validate authentication credentials
        this.validateCredentials();
    }

    private validateCredentials(): void {
        if (!this.clientEmail || !this.privateKey) {
            AppLogger.warn('XlsDB authentication credentials not configured', {
                hasClientEmail: !!this.clientEmail,
                hasPrivateKey: !!this.privateKey,
            });
        } else {
            AppLogger.info(
                `XlsDB authentication credentials configured successfully with spreadsheetId ${this.sheetId} and sheetName ${this.sheetName}`
            );
        }
    }

    async findOne({ where }: FindOptions): Promise<unknown> {
        try {
            const res = await axios.post(`${this.URL}/get-one`, {
                where,
                sheetId: this.sheetId,
                sheetName: this.sheetName,
                client_email: this.clientEmail,
                private_key: this.privateKey,
            });
            return res.data;
        } catch (error) {
            AppLogger.xlsDbError('findOne', error as Error);
            throw new Error(`XlsDB findOne error: ${error}`);
        }
    }

    async findAll({ where }: FindOptions): Promise<unknown[]> {
        try {
            const res = await axios.post(`${this.URL}/get-all`, {
                where,
                sheetId: this.sheetId,
                sheetName: this.sheetName,
                serviceClientEmail: this.clientEmail,
                servicePrivateKey: this.privateKey,
            });
            return res.data;
        } catch (error) {
            AppLogger.xlsDbError('findAll', error as Error);
            throw new Error(`XlsDB findAll error: ${error}`);
        }
    }

    async update({ newValues, where }: UpdateOptions): Promise<unknown> {
        try {
            const res = await axios.put(`${this.URL}/update`, {
                newValues,
                where,
                sheetId: this.sheetId,
                sheetName: this.sheetName,
                serviceClientEmail: this.clientEmail,
                servicePrivateKey: this.privateKey,
            });
            console.log(this.URL);
            console.log(this.sheetId, this.sheetName);
            return res.data;
        } catch (error) {
            AppLogger.xlsDbError('update', error as Error);
            throw new Error(`XlsDB update error: ${error}`);
        }
    }

    async create({ values }: CreateOptions): Promise<unknown> {
        try {
            const res = await axios.post(`${this.URL}/add`, {
                values,
                sheetId: this.sheetId,
                sheetName: this.sheetName,
                serviceClientEmail: this.clientEmail,
                servicePrivateKey: this.privateKey,
            });
            return res.data;
        } catch (error) {
            AppLogger.xlsDbError('create', error as Error);
            throw new Error(`XlsDB create error: ${error}`);
        }
    }
}
