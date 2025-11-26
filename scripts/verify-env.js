#!/usr/bin/env node

// Script to verify environment variables are properly configured for deployment
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying environment variable configuration...\n');

// Check local environment files
const envFiles = ['.env.local', '.env.production'];
let foundApiKey = false;

for (const file of envFiles) {
  const filePath = join(process.cwd(), file);
  if (existsSync(filePath)) {
    console.log(`✅ Found ${file}`);
    try {
      const content = readFileSync(filePath, 'utf8');
      if (content.includes('VITE_BYTEZ_API_KEY')) {
        console.log(`✅ VITE_BYTEZ_API_KEY found in ${file}`);
        const match = content.match(/VITE_BYTEZ_API_KEY=(.+)/);
        if (match && match[1]) {
          console.log(`🔑 API Key: ${match[1].substring(0, 8)}...`);
          foundApiKey = true;
        }
      } else {
        console.log(`❌ VITE_BYTEZ_API_KEY not found in ${file}`);
      }
    } catch (error) {
      console.log(`❌ Error reading ${file}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  ${file} not found`);
  }
}

console.log('\n📋 Deployment Instructions:');
console.log('For Vercel:');
console.log('  1. Go to your project settings in Vercel dashboard');
console.log('  2. Navigate to "Environment Variables"');
console.log('  3. Add variable with Key: VITE_BYTEZ_API_KEY');
console.log('  4. Set Value to your actual Bytez API key');
console.log('  5. Redeploy your application\n');

console.log('For Netlify:');
console.log('  1. Go to your site settings in Netlify dashboard');
console.log('  2. Navigate to "Environment Variables"');
console.log('  3. Add variable with Key: VITE_BYTEZ_API_KEY');
console.log('  4. Set Value to your actual Bytez API key');
console.log('  5. Trigger a new deployment\n');

if (foundApiKey) {
  console.log('✅ Environment variables appear to be configured correctly!');
  console.log('   Remember to also set the same variable in your deployment platform.');
} else {
  console.log('⚠️  No API key found in local environment files.');
  console.log('   Make sure to set VITE_BYTEZ_API_KEY in your deployment platform.');
}

console.log('\n💡 Tip: You can test your API key locally with: npm run test:bytez');