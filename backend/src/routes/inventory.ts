import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { facility_id, medicine_id, category, criticality, low_stock, vaccine, state_id } = req.query as any;

    const where: any = {};
    if (user.role === 'hospital' && user.facility_id) {
      where.facilityId = user.facility_id;
    } else if (user.role === 'state' && user.state_id) {
      where.facility = { stateId: user.state_id, type: { not: 'state_reserve' } };
    } else if (state_id) {
      where.facility = { stateId: state_id, type: { not: 'state_reserve' } };
    }
    if (facility_id) {
      where.facilityId = facility_id;
      delete where.facility;
    }
    if (medicine_id) where.medicineId = medicine_id;
    if (criticality) where.medicine = { ...where.medicine, criticality };
    if (vaccine === 'true') where.medicine = { ...where.medicine, isVaccine: 1 };
    if (vaccine === 'false') where.medicine = { ...where.medicine, isVaccine: 0 };


    let inventories = await prisma.inventory.findMany({
      where,
      include: { medicine: true, facility: { include: { state: true } } },
      orderBy: [{ medicine: { criticality: 'desc' } }, { medicine: { name: 'asc' } }],
    });

    if (category) {
      const catLower = String(category).toLowerCase();
      inventories = inventories.filter(i => i.medicine.category.toLowerCase().includes(catLower));
    }

    if (low_stock === 'true') {
      inventories = inventories.filter(i => i.currentStock <= i.safetyThreshold);
    }

    const result = inventories.map(i => ({
      ...i,
      medicine_id: i.medicineId,
      facility_id: i.facilityId,
      current_stock: i.currentStock,
      reserved_stock: i.reservedStock,
      safety_threshold: i.safetyThreshold,
      reorder_level: i.reorderLevel,
      avg_daily_consumption: i.avgDailyConsumption,
      lead_time_days: i.leadTimeDays,
      emergency_lead_time_days: i.emergencyLeadTimeDays,
      delivery_reliability: i.deliveryReliability,
      medicine_name: i.medicine.name,
      generic_name: i.medicine.genericName,
      category: i.medicine.category,
      criticality: i.medicine.criticality,
      unit_type: i.medicine.unitType,
      dosage_form: i.medicine.dosageForm,
      storage_requirement: i.medicine.storageRequirement,
      is_vaccine: i.medicine.isVaccine,
      strength: i.medicine.strength,
      facility_name: i.facility.name,
      facility_type: i.facility.type,
      usable_stock: i.currentStock - i.reservedStock,
      days_of_stock: i.avgDailyConsumption > 0 ? Math.round((i.currentStock / i.avgDailyConsumption) * 10) / 10 : 999,
      is_low_stock: i.currentStock <= i.safetyThreshold ? 1 : 0,
      needs_reorder: i.currentStock <= i.reorderLevel ? 1 : 0,
    }));

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/batches', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { facility_id, medicine_id, status } = req.query as any;

    const where: any = { status: { not: 'expired' } };
    if (user.role === 'hospital' && user.facility_id) where.facilityId = user.facility_id;
    else if (user.role === 'state' && user.state_id) where.facility = { stateId: user.state_id };
    if (facility_id) where.facilityId = facility_id;
    if (medicine_id) where.medicineId = medicine_id;
    if (status) where.status = status;

    const batches = await prisma.inventoryBatch.findMany({
      where,
      include: { medicine: true, facility: true },
      orderBy: { expiryDate: 'asc' },
    });

    const now = new Date();
    const result = batches.map(b => {
      const daysToExpiry = Math.floor((b.expiryDate.getTime() - now.getTime()) / 86400000);
      let expiryRisk = 'good';
      if (daysToExpiry < 0) expiryRisk = 'expired';
      else if (daysToExpiry < 30) expiryRisk = 'expiring_soon';
      else if (daysToExpiry < 90) expiryRisk = 'expiring';

      return {
        ...b,
        medicine_id: b.medicineId,
        facility_id: b.facilityId,
        batch_number: b.batchNumber,
        received_date: b.receivedDate,
        expiry_date: b.expiryDate,
        reserved_quantity: b.reservedQuantity,
        storage_location: b.storageLocation,
        medicine_name: b.medicine.name,
        unit_type: b.medicine.unitType,
        facility_name: b.facility.name,
        days_to_expiry: daysToExpiry,
        expiry_risk: expiryRisk,
      };
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/consumption', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { medicine_id, quantity, date, batch_id, notes } = req.body;

    if (!medicine_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'medicine_id and positive quantity required' });
    }

    const facId = user.facility_id || req.body.facility_id;
    if (!facId) return res.status(400).json({ error: 'facility_id required' });

    const inv = await prisma.inventory.findUnique({ where: { facilityId_medicineId: { facilityId: facId, medicineId: medicine_id } } });
    if (!inv) return res.status(404).json({ error: 'Inventory record not found' });
    if (inv.currentStock - inv.reservedStock < quantity) {
      return res.status(400).json({ error: `Insufficient usable stock. Available: ${inv.currentStock - inv.reservedStock}` });
    }

    const consumptionDate = date || new Date().toISOString().split('T')[0];

    await prisma.$transaction([
      prisma.inventoryTransaction.create({
        data: { facilityId: facId, medicineId: medicine_id, batchId: batch_id || null, transactionType: 'consumption', quantity: -quantity, notes: notes || null, performedBy: user.id }
      }),
      prisma.inventory.update({ where: { facilityId_medicineId: { facilityId: facId, medicineId: medicine_id } }, data: { currentStock: { decrement: quantity }, lastUpdated: new Date() } }),
    ]);

    await prisma.consumptionRecord.upsert({
      where: { facilityId_medicineId_date: { facilityId: facId, medicineId: medicine_id, date: consumptionDate } },
      update: { quantity: { increment: quantity } },
      create: { facilityId: facId, medicineId: medicine_id, date: consumptionDate, quantity, recordedBy: user.id },
    });

    if (batch_id) {
      await prisma.inventoryBatch.update({ where: { id: batch_id }, data: { quantity: { decrement: quantity } } });
    }

    return res.json({ message: 'Consumption recorded' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { facility_id, medicine_id, limit = 50 } = req.query as any;

    const where: any = {};
    if (user.role === 'hospital' && user.facility_id) where.facilityId = user.facility_id;
    else if (user.role === 'state' && user.state_id) where.facility = { stateId: user.state_id };
    if (facility_id) where.facilityId = facility_id;
    if (medicine_id) where.medicineId = medicine_id;

    const txns = await prisma.inventoryTransaction.findMany({
      where,
      include: { medicine: true, facility: true },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    return res.json(txns.map(t => ({
      ...t,
      medicine_id: t.medicineId,
      facility_id: t.facilityId,
      batch_id: t.batchId,
      transaction_type: t.transactionType,
      created_at: t.createdAt,
      medicine_name: t.medicine.name,
      facility_name: t.facility.name,
    })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/state-hospital-summary — Hospital-Wise Medicine Stock Checking Dashboard for State Login
router.get('/state-hospital-summary', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { state_id } = req.query as any;

    const targetStateId = user.role === 'state' ? user.state_id : state_id || user.state_id;

    const facWhere: any = {
      isActive: 1,
      type: { not: 'state_reserve' },
      level: { notIn: ['state_reserve', 'national'] },
    };
    if (targetStateId) facWhere.stateId = targetStateId;

    const hospitals = await prisma.facility.findMany({
      where: facWhere,
      include: {
        district: true,
        state: true,
        inventories: {
          include: { medicine: true },
        },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    const summary = hospitals.map((h) => {
      const totalMedicines = h.inventories.filter((i) => i.medicine.isVaccine === 0).length;
      const totalVaccines = h.inventories.filter((i) => i.medicine.isVaccine === 1).length;
      const totalStockUnits = h.inventories.reduce((acc, i) => acc + i.currentStock, 0);
      const lowStockCount = h.inventories.filter(
        (i) => i.currentStock > 0 && i.currentStock <= i.safetyThreshold
      ).length;
      const stockoutCount = h.inventories.filter((i) => i.currentStock <= 0).length;
      const criticalDeficitItems = h.inventories
        .filter((i) => i.currentStock <= i.safetyThreshold)
        .slice(0, 4)
        .map((i) => ({
          medicine_id: i.medicineId,
          medicine_name: i.medicine.name,
          current_stock: i.currentStock,
          safety_threshold: i.safetyThreshold,
          is_vaccine: i.medicine.isVaccine,
        }));

      return {
        facility_id: h.id,
        facility_name: h.name,
        facility_type: h.type,
        level: h.level,
        district_name: h.district?.name || h.state.name,
        state_id: h.stateId,
        state_name: h.state.name,
        total_medicines: totalMedicines,
        total_vaccines: totalVaccines,
        total_stock_units: totalStockUnits,
        low_stock_count: lowStockCount,
        stockout_count: stockoutCount,
        critical_deficit_items: criticalDeficitItems,
      };
    });

    return res.json(summary);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/vendor-purchase — Manual Stock Entry for Medicines & Vaccines purchased directly from Vendor
router.post('/vendor-purchase', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const {
      facility_id,
      medicine_id,
      custom_medicine_name,
      generic_name,
      category,
      unit_type,
      dosage_form,
      criticality,
      is_vaccine,
      quantity,
      batch_number,
      vendor_name,
      invoice_number,
      expiry_date,
      storage_location,
      safety_threshold,
    } = req.body;

    const targetFacilityId = user.role === 'hospital' ? user.facility_id : facility_id || user.facility_id;
    if (!targetFacilityId) {
      return res.status(400).json({ error: 'Target hospital facility_id is required' });
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({ error: 'Positive quantity is required for vendor stock entry' });
    }

    // Resolve or create Medicine/Vaccine record
    let resolvedMedicineId = medicine_id;
    if (!resolvedMedicineId && custom_medicine_name) {
      const existingMed = await prisma.medicine.findFirst({
        where: { name: custom_medicine_name.trim() },
      });
      if (existingMed) {
        resolvedMedicineId = existingMed.id;
      } else {
        const isVac = is_vaccine === true || is_vaccine === 1 || String(category).toLowerCase() === 'vaccine' ? 1 : 0;
        const createdMed = await prisma.medicine.create({
          data: {
            name: custom_medicine_name.trim(),
            genericName: (generic_name || custom_medicine_name).trim(),
            category: isVac ? 'Vaccine' : category || 'Antibiotic',
            dosageForm: dosage_form || (isVac ? 'Vial' : 'Tablet'),
            unitType: unit_type || (isVac ? 'Doses' : 'Tablets'),
            criticality: criticality || 'high',
            storageRequirement: isVac ? 'cold_chain_2_8c' : 'room_temperature',
            isVaccine: isVac,
            isActive: 1,
          },
        });
        resolvedMedicineId = createdMed.id;
      }
    }

    if (!resolvedMedicineId) {
      return res.status(400).json({ error: 'Please select a medicine/vaccine or provide a custom name' });
    }

    const med = await prisma.medicine.findUnique({ where: { id: resolvedMedicineId } });
    if (!med) return res.status(404).json({ error: 'Selected medicine/vaccine not found' });

    // Upsert Hospital Inventory record
    let inv = await prisma.inventory.findUnique({
      where: {
        facilityId_medicineId: {
          facilityId: targetFacilityId,
          medicineId: resolvedMedicineId,
        },
      },
    });

    if (!inv) {
      inv = await prisma.inventory.create({
        data: {
          facilityId: targetFacilityId,
          medicineId: resolvedMedicineId,
          currentStock: qty,
          reservedStock: 0,
          safetyThreshold: safety_threshold ? Number(safety_threshold) : 250,
          reorderLevel: 400,
          avgDailyConsumption: 25,
          leadTimeDays: 5,
          emergencyLeadTimeDays: 2,
          supplier: vendor_name || 'Direct Vendor Procurement',
        },
      });
    } else {
      inv = await prisma.inventory.update({
        where: { id: inv.id },
        data: {
          currentStock: { increment: qty },
          ...(vendor_name ? { supplier: vendor_name } : {}),
          ...(safety_threshold ? { safetyThreshold: Number(safety_threshold) } : {}),
          lastUpdated: new Date(),
        },
      });
    }

    const now = new Date();
    const parsedExpiry = expiry_date
      ? new Date(expiry_date)
      : new Date(now.getTime() + 365 * 86400000);
    const finalBatchNo =
      batch_number?.trim() || `VND-${med.name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}`;

    const createdBatch = await prisma.inventoryBatch.create({
      data: {
        inventoryId: inv.id,
        facilityId: targetFacilityId,
        medicineId: resolvedMedicineId,
        batchNumber: finalBatchNo,
        manufacturer: vendor_name || 'Direct Hospital Vendor',
        receivedDate: now,
        expiryDate: parsedExpiry,
        quantity: qty,
        reservedQuantity: 0,
        storageLocation:
          storage_location ||
          (med.isVaccine ? 'Cold-Chain ILR Unit (2-8°C)' : 'Main Hospital Pharmacy Store'),
        status: 'usable',
      },
    });

    const txNotes = `Direct Vendor Purchase: ${vendor_name || 'Authorized Supplier'}${
      invoice_number ? ` (Invoice/PO: ${invoice_number})` : ''
    } • Batch: ${finalBatchNo}`;

    await prisma.inventoryTransaction.create({
      data: {
        facilityId: targetFacilityId,
        medicineId: resolvedMedicineId,
        batchId: createdBatch.id,
        transactionType: 'vendor_purchase',
        quantity: qty,
        notes: txNotes,
        performedBy: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: med.isVaccine ? 'MANUAL_VACCINE_VENDOR_ENTRY' : 'MANUAL_MEDICINE_VENDOR_ENTRY',
        resourceType: 'inventory',
        resourceId: inv.id,
        facilityId: targetFacilityId,
        details: JSON.stringify({
          medicine_name: med.name,
          is_vaccine: med.isVaccine,
          quantity: qty,
          batch_number: finalBatchNo,
          vendor_name,
          invoice_number,
          expiry_date: parsedExpiry,
        }),
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({
      message: `${qty.toLocaleString()} ${med.unitType} of ${med.name} added via Direct Vendor Entry (Batch: ${finalBatchNo})`,
      inventory: inv,
      batch: createdBatch,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/adjust', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { facility_id, medicine_id, quantity, reason, type } = req.body;

    if (!facility_id || !medicine_id || quantity === undefined || !reason) {
      return res.status(400).json({ error: 'facility_id, medicine_id, quantity and reason required' });
    }
    if (user.role === 'hospital' && user.facility_id !== facility_id) {
      return res.status(403).json({ error: "Cannot adjust another facility's inventory" });
    }

    let inv = await prisma.inventory.findUnique({
      where: { facilityId_medicineId: { facilityId: facility_id, medicineId: medicine_id } },
    });
    if (!inv) {
      inv = await prisma.inventory.create({
        data: {
          facilityId: facility_id,
          medicineId: medicine_id,
          currentStock: Math.max(0, Number(quantity)),
          safetyThreshold: 200,
          reorderLevel: 350,
          avgDailyConsumption: 20,
        },
      });
    } else {
      inv = await prisma.inventory.update({
        where: { facilityId_medicineId: { facilityId: facility_id, medicineId: medicine_id } },
        data: { currentStock: { increment: Number(quantity) }, lastUpdated: new Date() },
      });
    }

    await prisma.inventoryTransaction.create({
      data: {
        facilityId: facility_id,
        medicineId: medicine_id,
        transactionType: type || (quantity >= 0 ? 'receipt' : 'adjustment'),
        quantity: Number(quantity),
        notes: reason,
        performedBy: user.id,
      },
    });

    return res.json({ message: 'Stock adjusted', inventory: inv });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/consumption-history', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { facility_id, medicine_id, days = 30 } = req.query as any;

    const facId = facility_id || user.facility_id;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const records = await prisma.consumptionRecord.findMany({
      where: { facilityId: facId, medicineId: medicine_id, date: { gte: cutoffStr } },
      orderBy: { date: 'asc' },
    });
    return res.json(records);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

