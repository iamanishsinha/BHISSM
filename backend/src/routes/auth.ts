import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/connection';
import { signToken, authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const prisma = getDb();

    // Auto-seed check if users table is empty on cold start
    const userCount = await prisma.user.count().catch(() => 0);
    if (userCount === 0) {
      console.log('[Auth] Database empty on login request, running auto-seed...');
      try {
        const { seed } = await import('../db/seed');
        await seed();
      } catch (seedErr) {
        console.error('[Auth] Auto-seed error:', seedErr);
      }
    }

    const user = await prisma.user.findUnique({
      where: { username, isActive: 1 },
      include: { facility: true, state: true },
    });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Attempt to record lastLogin and audit log, but do not block login if write fails
    try {
      await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
      await prisma.auditLog.create({ data: { userId: user.id, action: 'LOGIN', details: JSON.stringify({ username }), ipAddress: req.ip } });
    } catch (auditErr) {
      console.warn('[Auth] Non-blocking audit log warning:', auditErr);
    }

    const authUser = { id: user.id, username: user.username, role: user.role as any, facility_id: user.facilityId, state_id: user.stateId, full_name: user.fullName };
    const token = signToken(authUser);

    return res.json({
      token,
      user: { ...authUser, facility_name: user.facility?.name, state_name: user.state?.name },
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: err.message || 'Server error during authentication' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { facility: true, state: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safe } = user;
    return res.json({ ...safe, facility_name: user.facility?.name, state_name: user.state?.name });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/logout', authenticate, async (req: Request, res: Response) => {
  const prisma = getDb();
  await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'LOGOUT', ipAddress: req.ip } });
  return res.json({ message: 'Logged out' });
});

export default router;
