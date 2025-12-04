import { formatApiError } from '../../utils/apiUtils';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(request: Request, context: any) {
    const headers = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response('', { status: 200, headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers });
    }

    // 2. Validate API Key from Server Environment
    size: "1024x1024"
};

console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

// Create an array of promises for parallel execution
const imagePromises = Array.from({ length: validImageCount }, async (_, i) => {
    try {
        console.log(`🔐 Generating image ${i + 1} of ${validImageCount}`);

        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };

        const response = await fetchWithTimeout(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        }, 25000); // 25 second timeout per request

        if (!response.ok) {
            let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error?.message || errorData.message || errorMessage;
                console.error(`Full API error response for image ${i + 1}:`, errorData);
            } catch (e) {
                console.error("Could not parse error response:", e);
            }
            throw new Error(`Error generating image ${i + 1}: ${errorMessage}`);
        }

        console.log(`✅ Image ${i + 1} generated successfully`);
        const data = await response.json();
        console.log(`🔎 API raw response for image ${i + 1}:`, JSON.stringify(data));

        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
            const item = data.data[0];
            return {
                id: `img-${Date.now()}-${i}`,
                url: item.url || item.b64_json,
                prompt: prompt
            };
        }
        if (data && data.image && (data.image.url || data.image.b64_json)) {
            return {
                id: `img-${Date.now()}-${i}`,
                url: data.image.url || data.image.b64_json,
                prompt: prompt
            };
        }
        if (data && data.url) {
            return {
                id: `img-${Date.now()}-${i}`,
                url: data.url,
                prompt: prompt
            };
        }
        if (data && data.images && Array.isArray(data.images) && data.images.length > 0) {
            const item = data.images[0];
            return {
                id: `img-${Date.now()}-${i}`,
                url: item.url || item.b64_json || item,
                prompt: prompt
            };
        }
        return null;
    } catch (error: any) {
        console.error(`Failed to generate image ${i + 1}:`, error.message);
        return null; // Return null for failed images instead of throwing
    }
});

// Wait for all images to complete (or fail)
const results = await Promise.all(imagePromises);

// Filter out null results (failed images)
const images = results.filter(img => img !== null);

// If we got NO images at all, throw an error
if (images.length === 0) {
    throw new Error("No images generated. Please try a different prompt.");
}

// Return whatever images we successfully generated
return new Response(JSON.stringify({ images }), { status: 200, headers });

    } catch (error: any) {
    console.error("Backend Generation Error:", error);

    // Provide more detailed error information to the frontend
    const formattedError = formatApiError(error);

    // Log additional debugging information
    console.error("Debug Info:");
    console.error("  - API Key Present:", !!apiKey);
    console.error("  - Model:", model);
    console.error("  - Endpoint:", process.env.API_ENDPOINT || "https://api.a4f.co/v1/images/generations");

    return new Response(JSON.stringify({
        message: formattedError,
        debugInfo: {
            apiKeyPresent: !!apiKey,
            model: model,
            endpoint: process.env.API_ENDPOINT || "https://api.a4f.co/v1/images/generations"
        }
    }), { status: 500, headers });
}
};

// Helper function with timeout
async function fetchWithTimeout(url: string, options: any, timeoutMs: number = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}
