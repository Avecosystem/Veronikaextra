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
        const payload = JSON.parse(event.body || '{}');
        const orderId = payload.order_id || payload.orderId;

        if (!orderId) {
            return { statusCode: 400, headers, body: JSON.stringify({ message: 'Missing order_id in webhook.' }) };
        }

        // Verify order status with Cashfree
        const resp = await fetch(`https://api.cashfree.com/pg/orders/${encodeURIComponent(orderId)}`, {
            method: 'GET',
            headers: {
                'x-client-id': UPI_APP_ID,
                'x-client-secret': UPI_SECRET_KEY,
                'x-api-version': '2022-01-01'
            }
        });

        const data = await resp.json();
        if (!resp.ok) {
            return { statusCode: 500, headers, body: JSON.stringify({ message: data.message || 'Failed to verify order', orderId }) };
        }

        const status = data.order_status;
        const verified = status === 'PAID' || status === 'SUCCESS';

        if (verified) {
            // Find the transaction in database
            const transaction = await prisma.transaction.findUnique({ where: { orderId } });

            if (!transaction) {
                return { statusCode: 404, headers, body: JSON.stringify({ message: 'Transaction not found', orderId }) };
            }

            if (transaction.status === 'completed') {
                return { statusCode: 200, headers, body: JSON.stringify({ verified: true, status, orderId, message: 'Already processed' }) };
            }

            // Update user credits and transaction status
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: transaction.userId },
                    data: { credits: { increment: transaction.credits } }
                }),
                prisma.transaction.update({
                    where: { orderId },
                    data: { status: 'completed', completedAt: new Date() }
                }),
                prisma.creditHistory.create({
                    data: {
                        userId: transaction.userId,
                        amount: transaction.credits,
                        type: 'added',
                        description: `UPI Payment - ${orderId}`
                    }
                })
            ]);

            return { statusCode: 200, headers, body: JSON.stringify({ verified: true, status, orderId, message: 'Credits added successfully' }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ verified: false, status, orderId }) };
    } catch (e: any) {
        console.error('Webhook error:', e);
        return { statusCode: 500, headers, body: JSON.stringify({ message: e?.message || 'Unexpected error' }) };
    }
};