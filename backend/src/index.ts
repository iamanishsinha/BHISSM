import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { getDb } from './db/connection';

dotenv.config();

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
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression() as any);
app.use(express.json({ limit: '10mb' }));

// SSE clients registry for real-time updates
const sseClients = new Set<Response>();

export function broadcast(eventType: string, data: any) {
  const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
  sseClients.forEach(client => {
    try { client.write(`data: ${payload}\n\n`); } catch { sseClients.delete(client); }
  });
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'BHISSM API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    note: 'DEMO / SIMULATED DATA — Not connected to government databases',
  });
});

// SSE endpoint
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('data: {"type":"connected"}\n\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/emergencies', emergenciesRouter);
app.use('/api/blood-bank', bloodBankRouter);
app.use('/api/national-reserve', nationalReserveRouter);
app.use('/api/facilities', facilitiesRouter);
app.use('/api/alerts', alertsRouter);

// States and districts
import { authenticate } from './middleware/auth';

app.get('/api/states', authenticate, async (req: Request, res: Response) => {
  const prisma = getDb();
  const states = await prisma.state.findMany({ orderBy: { name: 'asc' } });
  res.json(states);
});

app.get('/api/districts', authenticate, async (req: Request, res: Response) => {
  const prisma = getDb();
  const { state_id } = req.query as any;
  const districts = await prisma.district.findMany({
    where: state_id ? { stateId: state_id } : {},
    orderBy: { name: 'asc' },
  });
  res.json(districts);
});

app.get('/api/medicines', authenticate, async (req: Request, res: Response) => {
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
  res.status(404).json({ error: 'Route not found' });
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
