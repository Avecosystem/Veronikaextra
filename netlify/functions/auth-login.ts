import { Handler } from '@netlify/functions';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    try {
        const { email, password } = JSON.parse(event.body || '{}');

        if (!email || !password) {
            return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Email and password required' }) };
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Invalid credentials' }) };
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Invalid credentials' }) };
        }

        const token = jwt.sign({ userId: user.id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });

        // Update session or create new one
        await prisma.session.create({
            data: {
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                token,
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
        console.error('Login error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal Server Error', error: error.message }) };
    }
};