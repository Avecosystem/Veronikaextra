import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    try {
        // Check environment variables
        const healthCheck = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            },
            api: {
                imageApiKeyPresent: !!(process.env.NEW_API_KEY || process.env.API_KEY),
                imageEndpoint: process.env.API_ENDPOINT || 'https://api.a4f.co/v1/images/generations',
                providerModel: process.env.PROVIDER_MODEL || 'provider-4/imagen-3.5'
            },
            database: {
                databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
            }
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(healthCheck)
        };
    } catch (error: any) {
        console.error('Health check error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                status: 'unhealthy',
                error: error.message
            })
        };
    }
};