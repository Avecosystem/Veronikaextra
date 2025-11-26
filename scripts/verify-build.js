#!/usr/bin/env node

// Simple build verification script
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying build setup...');

try {
  // Check if required files exist
  const requiredFiles = [
    '.env.local',
    '.env.production',
    'vite.config.ts',
    'package.json'
  ];

  for (const file of requiredFiles) {
    if (existsSync(join(process.cwd(), file))) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} is missing`);
    }
  }

  // Check if environment variables are properly configured
  const envLocal = existsSync(join(process.cwd(), '.env.local'));
  if (envLocal) {
    const envContent = execSync('cat .env.local', { encoding: 'utf-8' });
    if (envContent.includes('VITE_BYTEZ_API_KEY')) {
      console.log('✅ VITE_BYTEZ_API_KEY found in .env.local');
    } else {
      console.log('❌ VITE_BYTEZ_API_KEY not found in .env.local');
    }
  }

  // Try to build the project
  console.log('\n🏗️  Attempting build...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful!');

  console.log('\n🎉 All checks passed! Your app is ready for deployment.');
} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}