import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let prisma: PrismaClient | null = null;

function resolveDatabaseUrl(): string {
  // If an explicit DATABASE_URL is already provided and not in a serverless environment:
  if (process.env.DATABASE_URL && !process.env.VERCEL) {
    return process.env.DATABASE_URL;
  }

  // Check if running in a Serverless environment (Vercel, AWS Lambda)
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    const tmpDbPath = path.join('/tmp', 'bhissm.db');

    // On Vercel, the container filesystem is read-only EXCEPT for /tmp.
    // Copy the bundled seed database to /tmp/bhissm.db so that SQLite has full read/write permissions.
    if (!fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0) {
      const candidates = [
        path.join(process.cwd(), 'api', 'bhissm.db'),
        path.join(__dirname, '..', 'api', 'bhissm.db'),
        path.join(__dirname, '..', '..', 'api', 'bhissm.db'),
        path.join(__dirname, '..', 'bhissm.db'),
        path.join(__dirname, 'bhissm.db'),
        path.join(process.cwd(), 'dist', 'bhissm.db'),
        path.join(process.cwd(), 'bhissm.db'),
        path.join(__dirname, '..', '..', 'prisma', 'bhissm.db'),
        path.join(__dirname, '..', '..', 'data', 'bhissm.db'),
        path.join(process.cwd(), 'prisma', 'bhissm.db'),
        path.join(process.cwd(), 'backend', 'dist', 'bhissm.db'),
        path.join(process.cwd(), 'backend', 'prisma', 'bhissm.db'),
        path.join(process.cwd(), 'data', 'bhissm.db'),
        path.join(process.cwd(), 'backend', 'data', 'bhissm.db'),
        path.resolve('backend/prisma/bhissm.db'),
        path.resolve('api/bhissm.db'),
        path.resolve('bhissm.db'),
      ];

      let copied = false;
      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
          try {
            fs.copyFileSync(candidate, tmpDbPath);
            console.log(`[BHISSM DB] Initialized writable SQLite database at ${tmpDbPath} from ${candidate} (${fs.statSync(candidate).size} bytes)`);
            copied = true;
            break;
          } catch (err) {
            console.error(`[BHISSM DB] Failed copying from candidate ${candidate}:`, err);
          }
        }
      }

      if (!copied) {
        console.warn('[BHISSM DB] No pre-existing database candidate found; /tmp/bhissm.db will be auto-seeded on cold start.');
      }
    }

    const resolvedUrl = `file:${tmpDbPath}`;
    process.env.DATABASE_URL = resolvedUrl;
    return resolvedUrl;
  }

  // Local development resolution
  const localCandidates = [
    path.join(__dirname, '..', '..', 'prisma', 'bhissm.db'),
    path.join(__dirname, '..', '..', 'data', 'bhissm.db'),
    path.join(process.cwd(), 'data', 'bhissm.db'),
    path.join(process.cwd(), 'backend', 'prisma', 'bhissm.db'),
    path.join(process.cwd(), 'backend', 'data', 'bhissm.db'),
  ];

  for (const cand of localCandidates) {
    if (fs.existsSync(cand)) {
      const localUrl = `file:${cand}`;
      process.env.DATABASE_URL = localUrl;
      return localUrl;
    }
  }

  const defaultPath = path.join(__dirname, '..', '..', 'prisma', 'bhissm.db');
  const defaultUrl = `file:${defaultPath}`;
  process.env.DATABASE_URL = defaultUrl;
  return defaultUrl;
}

export function getDb(): PrismaClient {
  if (!prisma) {
    const dbUrl = resolveDatabaseUrl();
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

export default getDb;
