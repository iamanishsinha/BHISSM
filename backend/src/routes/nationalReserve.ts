import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(requireRole('national', 'state'));

/**
 * Helper: Finds or creates the dedicated State Reserve Stockpile Depot facility for a given State,
 * and ensures it has baseline reserve inventory so State Controllers can immediately inspect & redistribute.
 */
export async function ensureStateReserveFacility(prisma: any, stateId: string) {
  const state = await prisma.state.findUnique({ where: { id: stateId } });
  if (!state) throw new Error('Target state not found');

  let depot = await prisma.facility.findFirst({
    where: {
      stateId: state.id,
      OR: [{ level: 'state_reserve' }, { type: 'state_reserve' }],
    },
  });

  if (!depot) {
    depot = await prisma.facility.create({
      data: {
        name: `${state.name} State Medical Reserve Depot`,
        type: 'state_reserve',
        level: 'state_reserve',
        stateId: state.id,
        address: `${state.name} State Health Directorate Central Warehouse`,
        hasBloodBank: 0,
        isActive: 1,
      },
    });
  }

  // Ensure baseline State Reserve inventory exists for this depot if empty
  const existingInvCount = await prisma.inventory.count({ where: { facilityId: depot.id } });
  if (existingInvCount === 0) {
    const medicines = await prisma.medicine.findMany({ where: { isActive: 1 } });
    const now = new Date();
    const expDate = new Date(now.getTime() + 450 * 86400000);
    for (const med of medicines) {
      const baseStock = med.criticality === 'critical' ? 8000 : med.criticality === 'high' ? 5000 : 3500;
      const inv = await prisma.inventory.create({
        data: {
          facilityId: depot.id,
          medicineId: med.id,
          currentStock: baseStock,
          reservedStock: 0,
          safetyThreshold: 1000,
          reorderLevel: 1500,
          avgDailyConsumption: 50,
          leadTimeDays: 5,
          emergencyLeadTimeDays: 2,
          supplier: 'Central & State Medical Services Corporation',
          deliveryReliability: 0.96,
        },
      });
      await prisma.inventoryBatch.create({
        data: {
          inventoryId: inv.id,
          facilityId: depot.id,
          medicineId: med.id,
          batchNumber: `SR-${state.code}-${med.name.slice(0, 3).toUpperCase()}-01`,
          manufacturer: `${state.name} State Reserve Stockpile`,
          receivedDate: now,
          expiryDate: expDate,
          quantity: baseStock,
          reservedQuantity: 0,
          storageLocation: med.isVaccine ? 'State Cold-Chain Vault (2-8°C)' : 'State Reserve Bay A',
          status: 'usable',
        },
      });
    }
  }

  return { depot, state };
}

// GET /api/national-reserve — Central National Stockpile
router.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const reserves = await prisma.nationalReserve.findMany({
      include: { medicine: true },
      orderBy: { medicine: { name: 'asc' } },
    });
    return res.json(
      reserves.map((r) => ({
        ...r,
        medicine_id: r.medicineId,
        total_quantity: r.totalQuantity,
        protected_quantity: r.protectedQuantity,
        emergency_available: r.emergencyAvailable,
        allocated_quantity: r.allocatedQuantity,
        released_quantity: r.releasedQuantity,
        storage_location: r.storageLocation,
        medicine_name: r.medicine.name,
        generic_name: r.medicine.genericName,
        category: r.medicine.category,
        criticality: r.medicine.criticality,
        unit_type: r.medicine.unitType,
        is_vaccine: r.medicine.isVaccine,
        immediately_available: Math.max(0, r.emergencyAvailable - r.allocatedQuantity),
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/national-reserve/releases — Central-to-State Release Ledger
router.get('/releases', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { status, state_id } = req.query as any;

    const where: any = {};
    if (status) where.status = status;
    if (user.role === 'state' && user.state_id) {
      where.destinationStateId = user.state_id;
    } else if (state_id) {
      where.destinationStateId = state_id;
    }

    const releases = await prisma.nationalReserveRelease.findMany({
      where,
      include: {
        medicine: true,
        destFacility: true,
        destState: true,
        releasedByUser: { select: { fullName: true } },
        emergency: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(
      releases.map((r) => ({
        ...r,
        medicine_id: r.medicineId,
        destination_facility_id: r.destinationFacilityId,
        destination_state_id: r.destinationStateId,
        created_at: r.createdAt,
        approved_at: r.approvedAt,
        medicine_name: r.medicine.name,
        unit_type: r.medicine.unitType,
        destination_facility_name: r.destFacility?.name || 'State Medical Reserve Depot',
        destination_state_name: r.destState?.name || 'State Command',
        destination_state_code: r.destState?.code || '',
        released_by_name: r.releasedByUser?.fullName,
        emergency_title: r.emergency?.title,
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/national-reserve/release — Central releases medicine -> Credited directly to State Reserve Stock!
router.post('/release', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    if (user.role !== 'national') {
      return res.status(403).json({ error: 'Only National Command can release from the Central National Reserve' });
    }

    const {
      medicine_id,
      quantity,
      requirement_id,
      emergency_id,
      destination_facility_id,
      destination_state_id,
      reason,
    } = req.body;

    const qty = Number(quantity);
    if (!medicine_id || !qty || qty <= 0 || !reason) {
      return res.status(400).json({ error: 'medicine_id, positive quantity, and reason are required' });
    }

    const reserve = await prisma.nationalReserve.findUnique({
      where: { medicineId: medicine_id },
      include: { medicine: true },
    });
    if (!reserve) return res.status(404).json({ error: 'No national reserve found for this medicine' });

    const available = reserve.emergencyAvailable - reserve.allocatedQuantity;
    if (available < qty) {
      return res.status(400).json({
        error: `Insufficient emergency releasable quota. Immediately available: ${available}`,
        available,
        protected: reserve.protectedQuantity,
        total: reserve.totalQuantity,
      });
    }

    // Resolve target state ID
    let targetStateId = destination_state_id;
    if (!targetStateId && destination_facility_id) {
      const destFac = await prisma.facility.findUnique({ where: { id: destination_facility_id } });
      if (destFac) targetStateId = destFac.stateId;
    }
    if (!targetStateId) {
      const defaultState = await prisma.state.findFirst({ where: { code: 'PY' } });
      targetStateId = defaultState?.id;
    }

    // Ensure the target state's State Reserve Depot exists
    const { depot: stateReserveDepot, state: destState } = await ensureStateReserveFacility(
      prisma,
      targetStateId
    );

    // 1. Create NationalReserveRelease record pointing to the State & its State Reserve Depot
    const release = await prisma.nationalReserveRelease.create({
      data: {
        reserveId: reserve.id,
        medicineId: medicine_id,
        requirementId: requirement_id || null,
        emergencyId: emergency_id || null,
        quantity: qty,
        destinationFacilityId: stateReserveDepot.id,
        destinationStateId: destState.id,
        reason,
        status: 'released_to_state',
        releasedBy: user.id,
        approvedAt: new Date(),
      },
    });

    // 2. Update Central National Reserve stock
    await prisma.nationalReserve.update({
      where: { medicineId: medicine_id },
      data: {
        totalQuantity: { decrement: qty },
        allocatedQuantity: { increment: qty },
        releasedQuantity: { increment: qty },
        lastUpdated: new Date(),
      },
    });

    // 3. Credit the State Reserve Depot's Inventory & create an FEFO Batch in State Reserve!
    let stateInv = await prisma.inventory.findUnique({
      where: {
        facilityId_medicineId: {
          facilityId: stateReserveDepot.id,
          medicineId: medicine_id,
        },
      },
    });

    if (!stateInv) {
      stateInv = await prisma.inventory.create({
        data: {
          facilityId: stateReserveDepot.id,
          medicineId: medicine_id,
          currentStock: qty,
          reservedStock: 0,
          safetyThreshold: 1000,
          reorderLevel: 1500,
          avgDailyConsumption: 50,
          leadTimeDays: 5,
          emergencyLeadTimeDays: 2,
          supplier: 'Central National Strategic Reserve',
        },
      });
    } else {
      stateInv = await prisma.inventory.update({
        where: { id: stateInv.id },
        data: {
          currentStock: { increment: qty },
          lastUpdated: new Date(),
        },
      });
    }

    const now = new Date();
    const expDate = new Date(now.getTime() + 540 * 86400000);
    const batchNo = `CENTRAL-${destState.code}-${Date.now().toString().slice(-5)}`;

    const createdBatch = await prisma.inventoryBatch.create({
      data: {
        inventoryId: stateInv.id,
        facilityId: stateReserveDepot.id,
        medicineId: medicine_id,
        batchNumber: batchNo,
        manufacturer: 'Central National Strategic Stockpile',
        receivedDate: now,
        expiryDate: expDate,
        quantity: qty,
        reservedQuantity: 0,
        storageLocation: reserve.medicine.isVaccine
          ? 'State Cold-Chain Vault (2-8°C)'
          : 'State Reserve Central Bay',
        status: 'usable',
      },
    });

    await prisma.inventoryTransaction.create({
      data: {
        facilityId: stateReserveDepot.id,
        medicineId: medicine_id,
        batchId: createdBatch.id,
        transactionType: 'central_release_to_state',
        quantity: qty,
        referenceId: release.id,
        referenceType: 'national_reserve_release',
        notes: `Central Release to ${destState.name} State Reserve (${qty} units) — ${reason}`,
        performedBy: user.id,
      },
    });

    // Notify State Controller via Alert
    await prisma.alert.create({
      data: {
        stateId: destState.id,
        facilityId: stateReserveDepot.id,
        medicineId: medicine_id,
        alertType: 'central_release_received',
        severity: 'info',
        title: `Central Reserve Released to ${destState.name} State Stockpile`,
        message: `${qty.toLocaleString()} ${reserve.medicine.unitType} of ${reserve.medicine.name} released by National Command into ${stateReserveDepot.name}. Ready for State-to-Hospital redistribution.`,
      },
    });

    if (requirement_id) {
      const req_ = await prisma.emergencyRequirement.findUnique({ where: { id: requirement_id } });
      if (req_) {
        const nc = req_.quantityConfirmed + qty;
        await prisma.emergencyRequirement.update({
          where: { id: req_.id },
          data: {
            quantityConfirmed: nc,
            status: nc >= req_.quantityRequired ? 'fulfilled' : 'partially_fulfilled',
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'NATIONAL_RESERVE_RELEASE_TO_STATE',
        resourceType: 'national_reserve',
        resourceId: release.id,
        facilityId: stateReserveDepot.id,
        details: JSON.stringify({
          medicine_id,
          medicine_name: reserve.medicine.name,
          quantity: qty,
          destination_state: destState.name,
          state_reserve_depot: stateReserveDepot.name,
          batch_number: batchNo,
          reason,
        }),
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({
      message: `Released ${qty.toLocaleString()} units to ${destState.name} State Reserve Stockpile`,
      release,
      state_reserve_depot: stateReserveDepot,
      reserve_after: await prisma.nationalReserve.findUnique({ where: { medicineId: medicine_id } }),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/national-reserve/releases/:id/dispatch
router.put('/releases/:id/dispatch', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    await prisma.nationalReserveRelease.update({
      where: { id: req.params.id },
      data: { status: 'dispatched', approvedAt: new Date() },
    });
    return res.json({ message: 'Release dispatched to State Reserve' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/national-reserve/state-stock — View State Reserve Stockpile & State-to-Hospital Redistribution Ledger
router.get('/state-stock', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { state_id } = req.query as any;

    let targetStateId = state_id || user.state_id;
    if (!targetStateId || user.role === 'national') {
      if (!state_id) {
        const py = await prisma.state.findFirst({ where: { code: 'PY' } });
        targetStateId = py?.id;
      }
    }

    const { depot, state } = await ensureStateReserveFacility(prisma, targetStateId);

    const inventories = await prisma.inventory.findMany({
      where: { facilityId: depot.id },
      include: { medicine: true, batches: { where: { status: 'usable' }, orderBy: { expiryDate: 'asc' } } },
      orderBy: [{ medicine: { criticality: 'desc' } }, { medicine: { name: 'asc' } }],
    });

    const redistributions = await prisma.inventoryTransaction.findMany({
      where: {
        facilityId: depot.id,
        transactionType: { in: ['state_redistribution_out', 'central_release_to_state'] },
      },
      include: { medicine: true },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    return res.json({
      state: { id: state.id, name: state.name, code: state.code },
      depot: { id: depot.id, name: depot.name, address: depot.address },
      stock: inventories.map((i) => ({
        id: i.id,
        medicine_id: i.medicineId,
        medicine_name: i.medicine.name,
        generic_name: i.medicine.genericName,
        category: i.medicine.category,
        criticality: i.medicine.criticality,
        unit_type: i.medicine.unitType,
        is_vaccine: i.medicine.isVaccine,
        current_stock: i.currentStock,
        reserved_stock: i.reservedStock,
        available_to_distribute: Math.max(0, i.currentStock - i.reservedStock),
        safety_threshold: i.safetyThreshold,
        last_updated: i.lastUpdated,
        batches_count: i.batches.length,
      })),
      ledger: redistributions.map((tx) => ({
        id: tx.id,
        medicine_id: tx.medicineId,
        medicine_name: tx.medicine.name,
        unit_type: tx.medicine.unitType,
        transaction_type: tx.transactionType,
        quantity: tx.quantity,
        notes: tx.notes,
        created_at: tx.createdAt,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/national-reserve/state-redistribute — State redistributes medicine from State Reserve to a Hospital in its jurisdiction
router.post('/state-redistribute', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { medicine_id, destination_facility_id, quantity, notes, state_id } = req.body;

    const qty = Number(quantity);
    if (!medicine_id || !destination_facility_id || !qty || qty <= 0) {
      return res.status(400).json({
        error: 'medicine_id, destination_facility_id, and a positive quantity are required',
      });
    }

    const destHospital = await prisma.facility.findUnique({
      where: { id: destination_facility_id },
      include: { state: true },
    });
    if (!destHospital) {
      return res.status(404).json({ error: 'Destination hospital facility not found' });
    }

    const effectiveStateId = user.role === 'state' ? user.state_id! : state_id || destHospital.stateId;

    if (user.role === 'state' && destHospital.stateId !== user.state_id) {
      return res.status(403).json({
        error: `Jurisdiction violation: ${destHospital.name} is outside your state command jurisdiction.`,
      });
    }

    const { depot: stateReserveDepot, state } = await ensureStateReserveFacility(prisma, effectiveStateId);

    const stateInv = await prisma.inventory.findUnique({
      where: {
        facilityId_medicineId: {
          facilityId: stateReserveDepot.id,
          medicineId: medicine_id,
        },
      },
      include: { medicine: true },
    });

    if (!stateInv || stateInv.currentStock - stateInv.reservedStock < qty) {
      return res.status(400).json({
        error: `Insufficient State Reserve stock for ${stateInv?.medicine?.name || 'selected medicine'}. Available in ${state.name} State Reserve: ${
          stateInv ? stateInv.currentStock - stateInv.reservedStock : 0
        }`,
      });
    }

    // 1. Deduct from State Reserve Depot Inventory
    await prisma.inventory.update({
      where: { id: stateInv.id },
      data: {
        currentStock: { decrement: qty },
        lastUpdated: new Date(),
      },
    });

    // Deduct from earliest FEFO batch in State Reserve Depot
    const stateBatches = await prisma.inventoryBatch.findMany({
      where: { facilityId: stateReserveDepot.id, medicineId: medicine_id, status: 'usable', quantity: { gt: 0 } },
      orderBy: { expiryDate: 'asc' },
    });
    let remainingToDeduct = qty;
    for (const b of stateBatches) {
      if (remainingToDeduct <= 0) break;
      const deduct = Math.min(b.quantity, remainingToDeduct);
      await prisma.inventoryBatch.update({
        where: { id: b.id },
        data: { quantity: { decrement: deduct } },
      });
      remainingToDeduct -= deduct;
    }

    // 2. Credit the Destination Hospital's Inventory & create an FEFO Batch at the Hospital
    let hospInv = await prisma.inventory.findUnique({
      where: {
        facilityId_medicineId: {
          facilityId: destHospital.id,
          medicineId: medicine_id,
        },
      },
    });

    if (!hospInv) {
      hospInv = await prisma.inventory.create({
        data: {
          facilityId: destHospital.id,
          medicineId: medicine_id,
          currentStock: qty,
          reservedStock: 0,
          safetyThreshold: 250,
          reorderLevel: 400,
          avgDailyConsumption: 25,
          leadTimeDays: 5,
          emergencyLeadTimeDays: 2,
          supplier: stateReserveDepot.name,
        },
      });
    } else {
      hospInv = await prisma.inventory.update({
        where: { id: hospInv.id },
        data: {
          currentStock: { increment: qty },
          lastUpdated: new Date(),
        },
      });
    }

    const now = new Date();
    const expDate = new Date(now.getTime() + 420 * 86400000);
    const batchNo = `STATE-${state.code}-${Date.now().toString().slice(-5)}`;

    const hospBatch = await prisma.inventoryBatch.create({
      data: {
        inventoryId: hospInv.id,
        facilityId: destHospital.id,
        medicineId: medicine_id,
        batchNumber: batchNo,
        manufacturer: `${state.name} State Reserve Allocation`,
        receivedDate: now,
        expiryDate: expDate,
        quantity: qty,
        reservedQuantity: 0,
        storageLocation: stateInv.medicine.isVaccine
          ? 'Hospital Cold-Chain Refrigerator (2-8°C)'
          : 'Hospital Main Pharmacy Store',
        status: 'usable',
      },
    });

    // 3. Log transactions on both State Reserve Depot and Destination Hospital
    await prisma.inventoryTransaction.createMany({
      data: [
        {
          facilityId: stateReserveDepot.id,
          medicineId: medicine_id,
          transactionType: 'state_redistribution_out',
          quantity: -qty,
          referenceId: destHospital.id,
          referenceType: 'state_redistribution',
          notes: `Redistributed to ${destHospital.name} (${qty} units) — ${notes || 'State Command Allocation'}`,
          performedBy: user.id,
        },
        {
          facilityId: destHospital.id,
          medicineId: medicine_id,
          batchId: hospBatch.id,
          transactionType: 'state_redistribution_in',
          quantity: qty,
          referenceId: stateReserveDepot.id,
          referenceType: 'state_redistribution',
          notes: `Received from ${stateReserveDepot.name} (${qty} units, Batch ${batchNo}) — ${notes || 'State Command Allocation'}`,
          performedBy: user.id,
        },
      ],
    });

    // 4. Create Alert for the Recipient Hospital & AuditLog
    await prisma.alert.create({
      data: {
        stateId: state.id,
        facilityId: destHospital.id,
        medicineId: medicine_id,
        alertType: 'state_stock_allocated',
        severity: 'info',
        title: `State Reserve Stock Received: ${stateInv.medicine.name}`,
        message: `${qty.toLocaleString()} ${stateInv.medicine.unitType} of ${stateInv.medicine.name} (Batch ${batchNo}) redistributed from ${stateReserveDepot.name} to ${destHospital.name}.`,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'STATE_RESERVE_REDISTRIBUTION_TO_HOSPITAL',
        resourceType: 'inventory',
        resourceId: hospInv.id,
        facilityId: destHospital.id,
        details: JSON.stringify({
          source_state_depot: stateReserveDepot.name,
          destination_hospital: destHospital.name,
          medicine_id,
          medicine_name: stateInv.medicine.name,
          quantity: qty,
          batch_number: batchNo,
          notes,
        }),
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({
      message: `Successfully redistributed ${qty.toLocaleString()} units of ${stateInv.medicine.name} from ${state.name} State Reserve to ${destHospital.name}`,
      hospital_inventory: hospInv,
      batch: hospBatch,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/fulfillment-check/:requirement_id', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const req_ = await prisma.emergencyRequirement.findUnique({
      where: { id: req.params.requirement_id },
      include: { medicine: true },
    });
    if (!req_) return res.status(404).json({ error: 'Requirement not found' });

    const reserve = req_.medicineId
      ? await prisma.nationalReserve.findUnique({ where: { medicineId: req_.medicineId } })
      : null;
    const remaining = req_.quantityRequired - req_.quantityConfirmed;
    const available = reserve ? reserve.emergencyAvailable - reserve.allocatedQuantity : 0;

    return res.json({
      requirement: { ...req_, medicine_name: req_.medicine?.name },
      shortfall: remaining,
      national_reserve: reserve
        ? {
            total: reserve.totalQuantity,
            protected: reserve.protectedQuantity,
            emergency_available: reserve.emergencyAvailable,
            allocated: reserve.allocatedQuantity,
            immediately_available: available,
            can_fulfill_shortfall: available >= remaining,
          }
        : null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

