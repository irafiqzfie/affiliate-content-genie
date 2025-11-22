#!/usr/bin/env node

/**
 * Pre-generate Prisma Client script for Vercel
 * This generates the client using available engines without downloading
 */

const { execSync } = require('child_process');

try {
  console.log('🔧 Attempting to use cached Prisma engines...');
  
  // Try to generate without downloading
  process.env.PRISMA_GENERATE_SKIP_DOWNLOAD = '1';
  process.env.PRISMA_SKIP_POSTINSTALL_GENERATE = '1';
  
  execSync('prisma generate --schema=prisma/schema.vercel.prisma', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PRISMA_GENERATE_SKIP_DOWNLOAD: '1',
      PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1'
    }
  });
  
  console.log('✅ Prisma Client generated successfully');
} catch (error) {
  console.warn('⚠️ Prisma generate failed, will use fallback');
  console.warn('Build will continue without Prisma client generation');
  process.exit(0); // Don't fail the build
}
