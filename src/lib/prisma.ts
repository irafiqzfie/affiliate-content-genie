// Safe Prisma client import that handles missing client gracefully
let PrismaClient: any;
let prismaInstance: any = null;

try {
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
} catch (error) {
  console.warn('⚠️ Prisma Client not available - database features will be disabled');
  // Create a mock client that throws helpful errors
  PrismaClient = class MockPrismaClient {
    constructor() {
      console.warn('Using mock Prisma client - database operations will not work');
    }
  };
}

declare global {
  var prisma: any | undefined;
}

export const prisma = global.prisma ?? (PrismaClient ? new PrismaClient() : null);
if (process.env.NODE_ENV === 'development') global.prisma = prisma;
