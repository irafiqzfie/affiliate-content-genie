#!/usr/bin/env node

/**
 * Database deployment script for Vercel
 * Ensures schema changes are applied before building
 */

const { execSync } = require('child_process');

console.log('🔧 Starting database deployment...');

try {
  // Apply migrations
  console.log('📤 Applying migrations...');
  execSync('npx prisma migrate deploy --schema=prisma/schema.clean.prisma', {
    stdio: 'inherit',
    env: process.env
  });
  
  console.log('✅ Migrations applied successfully');
  
  // Generate Prisma Client with no cache
  console.log('⚙️ Generating fresh Prisma Client...');
  execSync('npx prisma generate --schema=prisma/schema.clean.prisma --no-engine', {
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
    
    execSync('npx prisma generate --schema=prisma/schema.clean.prisma --no-engine', {
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
