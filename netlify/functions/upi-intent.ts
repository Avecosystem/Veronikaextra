import { Handler } from '@netlify/functions';
import prisma from '../../lib/prisma';

const UPI_APP_ID = process.env.UPI_APP_ID;
const UPI_SECRET_KEY = process.env.UPI_SECRET_KEY;

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

    if (!UPI_APP_ID || !UPI_SECRET_KEY) {
        return { statusCode: 500, headers, body: JSON.stringify({ message: 'Server Configuration Error: UPI_APP_ID or UPI_SECRET_KEY missing.' }) };
    }

    try {
        const { orderId, amount, returnUrl, email, name, phone = '9999999999', userId, credits } = JSON.parse(event.body || '{}');

        if (!orderId || !amount || !returnUrl || !email || !name || !userId || !credits) {
            return { statusCode: 400, headers, body: JSON.stringify({ message: 'Invalid request. Missing required fields.' }) };
        }

        const customerId = (email || name || orderId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45);
        const baseUrl = (process.env.PUBLIC_APP_BASE_URL || 'https://veronikaextra-image.onrender.com').replace(/\/$/, '');
        const httpsReturnUrl = `${baseUrl}/#/profile?order_id={order_id}&status={order_status}`;

        const payload = {
            order_id: orderId,
            order_amount: Number(amount),
            order_currency: 'INR',
            customer_details: {
                customer_id: customerId,
                customer_email: email,
                customer_phone: phone,
                customer_name: name
            },
            order_meta: {
                return_url: httpsReturnUrl
            }
        };

        const response = await fetch('https://api.cashfree.com/pg/orders', {
            method: 'POST',
            headers: {
                'x-client-id': UPI_APP_ID,
                'x-client-secret': UPI_SECRET_KEY,
                'x-api-version': '2022-01-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            return { statusCode: 500, headers, body: JSON.stringify({ message: data.message || 'Payment Gateway Error' }) };
        }

        // Create transaction record in database
        await prisma.transaction.create({
            data: {
                userId: parseInt(userId),
                orderId,
                amount: Number(amount),
                currency: 'INR',
                credits: Number(credits),
                gateway: 'UPI',
                status: 'pending'
            }
        });

        return { statusCode: 200, headers, body: JSON.stringify({ payLink: data.payment_link }) };
    } catch (e: any) {
        console.error('UPI Intent Error:', e);
        return { statusCode: 500, headers, body: JSON.stringify({ message: e?.message || 'Unexpected error' }) };
    }
};