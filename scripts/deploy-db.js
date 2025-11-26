#!/usr/bin/env node

/**
 * Database deployment script for Vercel
 * Ensures schema changes are applied before building
 * Updated: 2025-11-25 v4 - Simplified for Windows compatibility
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting database deployment (v4)...');
console.log('📋 Environment check:', {
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV
});

try {
  // Check if DATABASE_URL is set - if not, skip migrations (local dev without DB)
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL not set - skipping migrations (local dev)');
    console.log('✅ Database deployment skipped');
    process.exit(0);
  }

  // Apply migrations
  console.log('📤 Applying migrations...');
  execSync('npx prisma migrate deploy --schema=prisma/schema.clean.prisma', {
    stdio: 'inherit',
    env: process.env
  });
  
  console.log('✅ Migrations applied successfully');
  
  // Generate Prisma Client
  console.log('⚙️ Generating Prisma Client...');
  execSync('npx prisma generate --schema=prisma/schema.clean.prisma', {
    stdio: 'inherit',
    env: process.env
  });
  
  console.log('✅ Prisma Client generated successfully');
  console.log('🎉 Database deployment complete!');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Database deployment failed:', error.message);
  
  // Fallback to db push if migrations fail
  console.log('⚠️ Attempting fallback: db push...');
  try {
    execSync('npx prisma db push --schema=prisma/schema.clean.prisma --accept-data-loss --skip-generate', {
      stdio: 'inherit',
      env: process.env
    });
    
    execSync('npx prisma generate --schema=prisma/schema.clean.prisma', {
      stdio: 'inherit',
      env: process.env
    });
    
    console.log('✅ Fallback successful!');
    process.exit(0);
  } catch (fallbackError) {
    console.error('❌ Fallback also failed:', fallbackError.message);
    process.exit(1);
  }
}
