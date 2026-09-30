import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { getDb } from './db/connection';

dotenv.config();

// Eagerly resolve database path and initialize writable copy in serverless environments
getDb();

// Routes
import authRouter from './routes/auth';
import inventoryRouter from './routes/inventory';
import forecastRouter from './routes/forecast';
import emergenciesRouter from './routes/emergencies';
import bloodBankRouter from './routes/bloodBank';
import nationalReserveRouter from './routes/nationalReserve';
import facilitiesRouter from './routes/facilities';
import alertsRouter from './routes/alerts';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : true,
  credentials: true,
}));
app.options('*', cors());
app.use(compression() as any);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// SSE clients registry for real-time updates
const sseClients = new Set<Response>();

export function broadcast(eventType: string, data: any) {
  const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
  sseClients.forEach(client => {
    try { client.write(`data: ${payload}\n\n`); } catch { sseClients.delete(client); }
  });
}

// Health check endpoint (accessible on both /api/health and /health)
app.get(['/api/health', '/health'], async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let userCount = 0;
  try {
    const prisma = getDb();
    userCount = await prisma.user.count();
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    status: 'ok',
    service: 'BHISSM API',
    version: '1.0.0',
    is_serverless: Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME),
    db_status: dbStatus,
    users_count: userCount,
    timestamp: new Date().toISOString(),
    note: 'DEMO / SIMULATED DATA — Not connected to government databases',
  });
});

// SSE endpoint
app.get(['/api/events', '/events'], (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('data: {"type":"connected"}\n\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// API Routes (mounted on both /api/* and /* to match regardless of whether proxy strips /api)
app.use(['/api/auth', '/auth'], authRouter);
app.use(['/api/inventory', '/inventory'], inventoryRouter);
app.use(['/api/forecast', '/forecast'], forecastRouter);
app.use(['/api/emergencies', '/emergencies'], emergenciesRouter);
app.use(['/api/blood-bank', '/blood-bank'], bloodBankRouter);
app.use(['/api/national-reserve', '/national-reserve'], nationalReserveRouter);
app.use(['/api/facilities', '/facilities'], facilitiesRouter);
app.use(['/api/alerts', '/alerts'], alertsRouter);

// States and districts
import { authenticate } from './middleware/auth';

app.get(['/api/states', '/states'], authenticate, async (req: Request, res: Response) => {
  const prisma = getDb();
  const states = await prisma.state.findMany({ orderBy: { name: 'asc' } });
  res.json(states);
});

app.get(['/api/districts', '/districts'], authenticate, async (req: Request, res: Response) => {
  const prisma = getDb();
  const { state_id } = req.query as any;
  const districts = await prisma.district.findMany({
    where: state_id ? { stateId: state_id } : {},
    orderBy: { name: 'asc' },
  });
  res.json(districts);
});

app.get(['/api/medicines', '/medicines'], authenticate, async (req: Request, res: Response) => {
  const prisma = getDb();
  const { category, criticality, is_vaccine } = req.query as any;
  const medicines = await prisma.medicine.findMany({
    where: {
      isActive: 1,
      ...(category ? { category } : {}),
      ...(criticality ? { criticality } : {}),
      ...(is_vaccine !== undefined ? { isVaccine: is_vaccine === 'true' ? 1 : 0 } : {}),
    },
    orderBy: [{ criticality: 'desc' }, { name: 'asc' }],
  });
  res.json(medicines);
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
});

// Error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

import { seed } from './db/seed';

app.listen(PORT, async () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║          BHISSM Backend API Server               ║
║  Server: http://localhost:${PORT}                   ║
║  Data: DEMO / SIMULATED                          ║
╚══════════════════════════════════════════════════╝
  `);
  try {
    await seed();
  } catch (e) {
    console.error('Startup seed check warning:', e);
  }
});

export default app;
