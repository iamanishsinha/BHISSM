import { getDb } from './connection';

export async function migrate() {
  const prisma = getDb();
  await prisma.$connect();
  console.log('Database connection verified via Prisma.');
}
