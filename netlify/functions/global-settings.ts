import { Handler } from '@netlify/functions';
import prisma from '../../lib/prisma';

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        if (event.httpMethod === 'GET') {
            const settings = await prisma.globalSettings.findUnique({ where: { id: 1 } });
            const { key } = event.queryStringParameters || {};

            // Default settings structure
            const defaultSettings = {
                globalNotice: '',
                creditsPageNotice: '',
                termsOfService: '',
                privacyPolicy: '',
                socialMediaLinks: { instagram: '', twitter: '', globe: '', chain: '' },
                creditPlans: [],
                contactDetails: []
            };

            if (!settings) {
                if (key) return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: (defaultSettings as any)[key] }) };
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: defaultSettings }) };
            }

            if (key) {
                if (['socialMediaLinks', 'creditPlans', 'contactDetails'].includes(key)) {
                    const val = (settings as any)[key];
                    return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: val ? JSON.parse(val) : (defaultSettings as any)[key] }) };
                }
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: (settings as any)[key] }) };
            }

            const responseData = {
                ...settings,
                socialMediaLinks: JSON.parse(settings.socialMediaLinks || '{}'),
                creditPlans: JSON.parse(settings.creditPlans || '[]'),
                contactDetails: JSON.parse(settings.contactDetails || '[]')
            };
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: responseData }) };
        }

        if (event.httpMethod === 'POST') {
            const { key, value } = JSON.parse(event.body || '{}');

            if (!key) {
                return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Key is required' }) };
            }

            const updateData: any = {};
            if (['socialMediaLinks', 'creditPlans', 'contactDetails'].includes(key)) {
                updateData[key] = JSON.stringify(value);
            } else {
                updateData[key] = value;
            }

            await prisma.globalSettings.upsert({
                where: { id: 1 },
                update: updateData,
                create: {
                    globalNotice: '',
                    creditsPageNotice: '',
                    termsOfService: '',
                    privacyPolicy: '',
                    socialMediaLinks: '{}',
                    creditPlans: '[]',
                    contactDetails: '[]',
                    ...updateData
                }
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: value,
                    message: 'Setting updated successfully'
                })
            };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };

    } catch (error: any) {
        console.error('Global Settings Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal Server Error', error: error.message }) };
    }
};