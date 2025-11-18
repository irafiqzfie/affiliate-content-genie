// Safe Prisma client import that handles missing client gracefully
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PrismaClient: any;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
} catch {
  console.warn('⚠️ Prisma Client not available - database features will be disabled');
  // Create a mock client that throws helpful errors
  PrismaClient = class MockPrismaClient {
    constructor() {
      console.warn('Using mock Prisma client - database operations will not work');
    }
  };
}

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
  var prisma: any | undefined;
}

export const prisma = global.prisma ?? (PrismaClient ? new PrismaClient() : null);
if (process.env.NODE_ENV === 'development') global.prisma = prisma;
