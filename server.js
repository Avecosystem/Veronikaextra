import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./db.sqlite';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Log environment variables for debugging
console.log('🔍 Environment variables check:');
console.log('  NEW_API_KEY:', process.env.NEW_API_KEY ? 'Set' : 'Not set');
console.log('  API_KEY:', process.env.API_KEY ? 'Set' : 'Not set');
console.log('  PROVIDER_MODEL:', process.env.PROVIDER_MODEL || 'undefined');
console.log('  API_ENDPOINT:', process.env.API_ENDPOINT || 'undefined');

if (!process.env.NEW_API_KEY && !process.env.API_KEY) {
    console.error('CRITICAL: API_KEY missing in server environment.');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// API routes - proxy to Netlify-style function handlers
const apiHandlers = {};

// Dynamically import and register API handlers
const registerApiHandler = async (name, modulePath) => {
  try {
    const module = await import(modulePath);
    // Handle both .handler and .default exports
    apiHandlers[name] = module.handler || module.default;
    console.log(`✅ Registered API handler: ${name}`);
  } catch (error) {
    console.error(`❌ Failed to load API handler ${name}:`, error.message);
    const candidates = [
      modulePath.replace(/\.ts$/, '.js'),
      modulePath.replace('netlify/functions', 'api').replace(/\.ts$/, '.ts'),
      modulePath.replace('netlify/functions', 'api').replace(/\.ts$/, '.js')
    ];
    for (const alt of candidates) {
      try {
        const m = await import(alt);
        apiHandlers[name] = m.handler || m.default || m;
        console.log(`✅ Registered API handler via fallback: ${name} -> ${alt}`);
        return;
      } catch {}
    }
  }
};

// Register all API handlers
await Promise.all([
    registerApiHandler('system-status', './netlify/functions/system-status.ts'),
    registerApiHandler('generate-images', './netlify/functions/generate-images.ts'),
    registerApiHandler('global-settings', './netlify/functions/global-settings.ts'),
    registerApiHandler('oxapay-intent', './netlify/functions/oxapay-intent.ts'),
    registerApiHandler('upi-intent', './netlify/functions/upi-intent.ts'),
    registerApiHandler('cashfree-webhook', './netlify/functions/cashfree-webhook.ts'),
    registerApiHandler('cashfree-order-status', './netlify/functions/cashfree-order-status.ts'),
    registerApiHandler('auth-register', './netlify/functions/auth-register.ts'),
    registerApiHandler('auth-login', './netlify/functions/auth-login.ts'),
    registerApiHandler('user-profile', './netlify/functions/user-profile.ts')
]);

// API endpoint handler
app.all('/api/:endpoint', async (req, res) => {
  const endpoint = req.params.endpoint;
  const handler = apiHandlers[endpoint];

    if (!handler) {
        return res.status(404).json({
            message: `API endpoint not found: /api/${endpoint}`,
            availableEndpoints: Object.keys(apiHandlers).map(name => `/api/${name}`)
        });
    }

  try {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const requestInit = {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    };

    const webRequest = new Request(url, requestInit);

    const event = {
      httpMethod: req.method,
      headers: req.headers,
      body: requestInit.body,
      queryStringParameters: req.query,
      pathParameters: { endpoint }
    };

    let response = await handler(event, {});

    if (response instanceof Response) {
      const headersObj = {};
      response.headers.forEach((v, k) => { headersObj[k] = v; });
      Object.entries(headersObj).forEach(([k, v]) => res.setHeader(k, v));
      const buf = await response.text();
      res.status(response.status).send(buf);
      return;
    }

    // Try calling with web Request for handlers expecting Request
    if (!response || (typeof response.statusCode !== 'number' && typeof response.headers !== 'object')) {
      response = await handler(webRequest, {});
    }

    if (response && typeof response.statusCode === 'number') {
      if (response.headers) {
        Object.entries(response.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      res.status(response.statusCode).send(response.body);
      return;
    }

    if (response instanceof Response) {
      const headersObj = {};
      response.headers.forEach((v, k) => { headersObj[k] = v; });
      Object.entries(headersObj).forEach(([k, v]) => res.setHeader(k, v));
      const buf = await response.text();
      res.status(response.status).send(buf);
      return;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error(`Error handling API request to ${endpoint}:`, error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Database initialization
const initializeDatabase = async () => {
    try {
        // Import prisma only when needed to avoid early initialization issues
        const { default: prisma } = await import('./lib/prisma');
        
        // Check if we can connect to the database
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        
        // Initialize global settings if they don't exist
        const settings = await prisma.globalSettings.findUnique({ where: { id: 1 } });
        if (!settings) {
            await prisma.globalSettings.create({
                data: {
                    id: 1,
                    globalNotice: '',
                    creditsPageNotice: '',
                    termsOfService: '',
                    privacyPolicy: '',
                    socialMediaLinks: '{}',
                    creditPlans: '[]',
                    contactDetails: '[]'
                }
            });
            console.log('✅ Global settings initialized');
        }
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        // Don't exit the process, just log the error
    }
};

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📦 Serving static files from: ${path.join(__dirname, 'dist')}`);
        console.log(`🔌 API endpoints available at: /api/*`);
        console.log(`✨ Available API handlers: ${Object.keys(apiHandlers).filter(h => apiHandlers[h]).join(', ')}`);
    });
});
