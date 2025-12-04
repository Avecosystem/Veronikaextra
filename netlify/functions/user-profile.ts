import { Handler } from '@netlify/functions';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    try {
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Unauthorized' }) };
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Invalid token' }) };
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'User not found' }) };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    credits: user.credits,
                    isAdmin: user.isAdmin,
                    country: user.country
                }
            })
        };
    } catch (error: any) {
        console.error('Profile error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal Server Error', error: error.message }) };
    }
};