#!/usr/bin/env node

/**
 * Database deployment script for Vercel
 * Ensures schema changes are applied before building
 */

const { execSync } = require('child_process');

console.log('🔧 Starting database deployment...');

try {
  // Push schema changes to database
  console.log('📤 Pushing schema changes...');
  execSync('npx prisma db push --schema=prisma/schema.clean.prisma --accept-data-loss --skip-generate', {
    stdio: 'inherit',
    env: process.env
  });
  
  console.log('✅ Schema pushed successfully');
  
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
  process.exit(1);
}
