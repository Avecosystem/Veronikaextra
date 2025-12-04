import dotenv from 'dotenv';
dotenv.config();

console.log('🧪 Testing fixes...');

// Test 1: Check environment variables
console.log('\n1. Environment Variables Check:');
console.log('  NEW_API_KEY:', process.env.NEW_API_KEY ? '✅ Set' : '❌ Missing');
console.log('  PROVIDER_MODEL:', process.env.PROVIDER_MODEL || '❌ Missing');
console.log('  API_ENDPOINT:', process.env.API_ENDPOINT || '❌ Missing');

// Test 2: Check Prisma client import
console.log('\n2. Prisma Client Check:');
try {
    await import('./lib/prisma.js');
    console.log('  ✅ Prisma client imported successfully');
} catch (error) {
    console.log('  ❌ Prisma client import failed:', error.message);
}

// Test 3: Check API handlers
console.log('\n3. API Handlers Check:');
const handlers = [
    './netlify/functions/system-status.ts',
    './netlify/functions/generate-images.ts',
    './netlify/functions/global-settings.ts',
    './netlify/functions/auth-login.ts',
    './netlify/functions/auth-register.ts'
];

for (const handlerPath of handlers) {
    try {
        const module = await import(handlerPath);
        const handler = module.handler || module.default;
        if (handler) {
            console.log(`  ✅ ${handlerPath} - Handler loaded`);
        } else {
            console.log(`  ❌ ${handlerPath} - No handler found`);
        }
    } catch (error) {
        console.log(`  ❌ ${handlerPath} - Import failed:`, error.message);
    }
}

console.log('\n🏁 Tests completed. Check output above for any issues.');