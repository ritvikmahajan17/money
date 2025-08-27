// Environment validation utility
export class EnvValidator {
    private static requiredVars = {
        development: [
            'GEMINI_API_KEY',
            'EXCEL_SHEET_ID',
            'EXCEL_SHEET_NAME',
            'GOOGLE_CLIENT_EMAIL',
            'GOOGLE_PRIVATE_KEY',
        ],
        production: [
            'GEMINI_API_KEY',
            'EXCEL_SHEET_ID',
            'EXCEL_SHEET_NAME',
            'GOOGLE_CLIENT_EMAIL',
            'GOOGLE_PRIVATE_KEY',
            'XLSDB_PROD_URL',
        ],
    };

    static validate(): void {
        const nodeEnv = process.env['NODE_ENV'] || 'development';
        const isProduction = nodeEnv === 'production';
        const requiredForEnv =
            this.requiredVars[isProduction ? 'production' : 'development'];

        console.log(`🔍 Validating environment variables for: ${nodeEnv}`);

        // In production (EB), we expect ALL env vars to come from AWS Console
        if (isProduction) {
            console.log(
                '📋 Production mode: Using AWS Elastic Beanstalk environment variables'
            );
        } else {
            console.log('🛠️  Development mode: Using local .env file');
        }

        const missing: string[] = [];
        const present: string[] = [];

        for (const varName of requiredForEnv) {
            if (!process.env[varName]) {
                missing.push(varName);
            } else {
                present.push(varName);
            }
        }

        // Log results
        if (present.length > 0) {
            console.log(`✅ Found: ${present.join(', ')}`);
        }

        if (missing.length > 0) {
            console.error(
                `❌ Missing required environment variables: ${missing.join(', ')}`
            );

            if (isProduction) {
                console.error(
                    '💡 Please set these variables in AWS Elastic Beanstalk Console:'
                );
                console.error('   Configuration > Environment properties');
                throw new Error(
                    `Missing required environment variables: ${missing.join(', ')}`
                );
            } else {
                console.warn(
                    '⚠️  App may not function correctly without these variables'
                );
                console.warn('💡 Please add them to your .env file');
            }
        } else {
            console.log('✅ All required environment variables are present');
        }
    }

    static getOptionalVar(name: string, defaultValue: string): string {
        return process.env[name] || defaultValue;
    }

    static getRequiredVar(name: string): string {
        const value = process.env[name];
        if (!value) {
            throw new Error(`Required environment variable ${name} is missing`);
        }
        return value;
    }
}
