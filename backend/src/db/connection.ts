import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function getDb(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

export default getDb;
