import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /alerts - get alerts
router.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { unread_only, severity, type, state_id } = req.query as any;

    const where: any = {};
    const effectiveStateId = state_id || (user.role !== 'national' ? user.state_id : undefined);

    if (user.role === 'hospital' && user.facility_id) {
      where.OR = [{ facilityId: user.facility_id }, { stateId: user.state_id }];
    } else if (effectiveStateId) {
      where.stateId = effectiveStateId;
    }

    if (unread_only === 'true') where.isRead = 0;
    if (severity) where.severity = severity;
    if (type) where.alertType = type;

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        medicine: { select: { name: true } },
        facility: { select: { name: true } },
        emergency: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json(
      alerts.map((a) => ({
        ...a,
        medicine_name: a.medicine?.name,
        facility_name: a.facility?.name,
        emergency_title: a.emergency?.title,
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /alerts/:id/read - mark as read
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    await prisma.alert.update({ where: { id: req.params.id }, data: { isRead: 1 } });
    return res.json({ message: 'Alert marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /alerts/audit - audit log
router.get('/audit', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { limit = 50, action } = req.query as any;

    const where: any = {};
    if (user.role === 'hospital' && user.facility_id) where.facilityId = user.facility_id;
    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { fullName: true, role: true } },
        facility: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });
    return res.json(
      logs.map((l) => ({
        ...l,
        user_name: l.user?.fullName,
        role: l.user?.role,
        facility_name: l.facility?.name,
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /alerts/dashboard - dashboard statistics
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { state_id } = req.query as any;

    const effectiveStateId = state_id || (user.role !== 'national' ? user.state_id : undefined);

    let facilityWhere: any = {};
    let stateWhere: any = {};
    let facilityStateWhere: any = {};

    if (user.role === 'hospital' && user.facility_id) {
      facilityWhere = { facilityId: user.facility_id };
      stateWhere = user.state_id ? { stateId: user.state_id } : {};
      facilityStateWhere = { facilityId: user.facility_id };
    } else if (effectiveStateId) {
      facilityWhere = { facility: { stateId: effectiveStateId } };
      stateWhere = { stateId: effectiveStateId };
      facilityStateWhere = { facility: { stateId: effectiveStateId } };
    }

    // National Level Filter:
    // If user is national and hasn't filtered to a single state,
    const emergencyWhere: any = { status: 'active' };
    if (user.role === 'national' && !effectiveStateId) {
      emergencyWhere.estimatedCasualties = { gte: 500 };
    } else {
      Object.assign(emergencyWhere, stateWhere);
    }

    const [
      allInv,
      activeEmergencies,
      ambulances,
      bloodInv,
      unreadAlerts,
      expiringBatches,
      nationalReserves,
      allStates,
    ] = await Promise.all([
      prisma.inventory.findMany({ where: facilityWhere, include: { medicine: true } }),
      prisma.emergency.count({ where: emergencyWhere }),
      prisma.ambulance.findMany({ where: facilityStateWhere }),
      prisma.bloodInventory.findMany({ where: { ...facilityStateWhere, bloodBank: { isActive: 1 } } }),
      prisma.alert.count({
        where: {
          isRead: 0,
          ...(user.role === 'hospital' && user.facility_id
            ? { OR: [{ facilityId: user.facility_id }, { stateId: user.state_id }] }
            : effectiveStateId
            ? { stateId: effectiveStateId }
            : {}),
        },
      }),
      prisma.inventoryBatch.count({
        where: {
          status: 'usable',
          expiryDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) },
          ...facilityWhere,
        },
      }),
      prisma.nationalReserve.findMany({ include: { medicine: true } }),
      prisma.state.findMany({ where: { code: { not: 'NA' } } }),
    ]);

    const medicines = allInv.filter((i) => !i.medicine.isVaccine);
    const vaccines = allInv.filter((i) => i.medicine.isVaccine);

    // Compute National Strategic Overview for National Dashboard
    const totalReserveStock = nationalReserves.reduce((acc, r) => acc + r.totalQuantity, 0);
    const totalEmergencyReleasable = nationalReserves.reduce((acc, r) => acc + (r.emergencyAvailable - r.allocatedQuantity), 0);
    const totalAllocatedReleases = nationalReserves.reduce((acc, r) => acc + r.allocatedQuantity, 0);

    return res.json({
      medicine: {
        total_medicines: medicines.length,
        low_stock_count: medicines.filter((i) => i.currentStock <= i.safetyThreshold).length,
        critical_low_stock: medicines.filter((i) => i.medicine.criticality === 'critical' && i.currentStock <= i.safetyThreshold).length,
        stockout_count: medicines.filter((i) => i.currentStock <= 0).length,
      },
      vaccines: {
        total_vaccines: vaccines.length,
        total_doses: vaccines.reduce((sum, i) => sum + i.currentStock, 0),
        low_stock_count: vaccines.filter((i) => i.currentStock <= i.safetyThreshold).length,
      },
      emergency: {
        active: activeEmergencies,
        is_national_scope: user.role === 'national' && !effectiveStateId,
      },
      blood: {
        total_units: bloodInv.reduce((sum, b) => sum + b.availableUnits, 0),
        critical_groups: bloodInv.filter((b) => ['critical', 'exhausted'].includes(b.status)).length,
      },
      ambulances: {
        total: ambulances.length,
        available: ambulances.filter((a) => a.status === 'available').length,
        deployed: ambulances.filter((a) => ['dispatched', 'in_use'].includes(a.status)).length,
      },
      alerts: { total_unread: unreadAlerts },
      expiring_batches_30d: expiringBatches,
      national_network: {
        total_strategic_stockpile: totalReserveStock,
        immediately_releasable_quota: totalEmergencyReleasable,
        active_emergency_releases: totalAllocatedReleases,
        reserves_list: nationalReserves.map((r) => ({
          medicine_name: r.medicine.name,
          category: r.medicine.category,
          total: r.totalQuantity,
          protected: r.protectedQuantity,
          available: r.emergencyAvailable - r.allocatedQuantity,
          allocated: r.allocatedQuantity,
        })),
        states_count: allStates.length,
      },
      data_note: 'DEMO / SIMULATED DATA',
      state_filtered: effectiveStateId || 'ALL',
      generated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
