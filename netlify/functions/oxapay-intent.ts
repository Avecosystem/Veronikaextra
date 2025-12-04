import { Handler } from '@netlify/functions';
import prisma from '../../lib/prisma';
import { formatApiError } from '../../utils/apiUtils';
import { OXPAY_MERCHANT_ID as MERCHANT_CONST, OXPAY_API_ID as API_CONST, OXPAY_PAYMENT_URL_BASE } from '../../constants';

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

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    const merchantId = process.env.OXAPAY_MERCHANT_ID || MERCHANT_CONST;
    const apiId = process.env.OXPAY_API_ID || API_CONST;

    if (!merchantId) {
        return { statusCode: 500, headers, body: JSON.stringify({ message: 'Server Configuration Error: OXAPAY_MERCHANT_ID missing.' }) };
    }

    try {
        const { orderId, credits, amount, returnUrl, email, name, userId } = JSON.parse(event.body || '{}');

        if (!orderId || !credits || !amount || !returnUrl || !email || !userId) {
            return { statusCode: 400, headers, body: JSON.stringify({ message: 'Invalid request. Missing required fields.' }) };
        }

        const formattedAmount = Number(Number(amount).toFixed(2));

        const oxapayHeaders: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (apiId) {
            oxapayHeaders['general_api_key'] = apiId;
        }

        const response = await fetch('https://api.oxapay.com/merchants/request', {
            method: 'POST',
            headers: oxapayHeaders,
            body: JSON.stringify({
                merchant: merchantId,
                amount: formattedAmount,
                currency: 'USD',
                lifeTime: 30,
                feePaidByPayer: 0,
                underPaidCover: 0,
                returnUrl,
                description: `Purchase ${credits} Credits - ${name || email}`,
                orderId,
                email
            })
        });

        const result = await response.json();

        if (result.result === 100 && result.payLink) {
            // Create transaction record in database
            await prisma.transaction.create({
                data: {
                    userId: parseInt(userId),
                    orderId,
                    amount: formattedAmount,
                    currency: 'USD',
                    credits: Number(credits),
                    gateway: 'OXPAY',
                    status: 'pending'
                }
            });

            return { statusCode: 200, headers, body: JSON.stringify({ payLink: result.payLink }) };
        }

        // Fallback to public payment page if API didn't return a specific payLink
        if (OXPAY_PAYMENT_URL_BASE) {
            await prisma.transaction.create({
                data: {
                    userId: parseInt(userId),
                    orderId,
                    amount: formattedAmount,
                    currency: 'USD',
                    credits: Number(credits),
                    gateway: 'OXPAY',
                    status: 'pending'
                }
            });

            return { statusCode: 200, headers, body: JSON.stringify({ payLink: OXPAY_PAYMENT_URL_BASE, message: result.message || 'Using fallback pay link' }) };
        }

        return { statusCode: 500, headers, body: JSON.stringify({ message: result.message || 'Payment Gateway Error' }) };
    } catch (error: any) {
        const formatted = formatApiError(error);
        console.error('Oxapay Intent Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ message: formatted }) };
    }
};