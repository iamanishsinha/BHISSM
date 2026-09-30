import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

function weightedMovingAverage(values: number[]): number {
  if (!values.length) return 0;
  let sum = 0, wSum = 0;
  values.forEach((v, i) => { sum += v * (i + 1); wSum += (i + 1); });
  return wSum > 0 ? sum / wSum : 0;
}

function getSeasonalFactor(): number {
  const mon = new Date().getMonth() + 1;
  if (mon >= 6 && mon <= 9) return 1.28;
  if (mon >= 10 && mon <= 11) return 1.1;
  if (mon >= 3 && mon <= 5) return 1.15;
  return 1.0;
}

function computeForecast(history: number[]) {
  const wma = weightedMovingAverage(history);
  const seasonal = getSeasonalFactor();
  const daily = wma * seasonal;
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (history.length >= 14) {
    const r7 = history.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const p7 = history.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
    const chg = (r7 - p7) / (p7 || 1);
    if (chg > 0.1) trend = 'increasing';
    else if (chg < -0.1) trend = 'decreasing';
  }
  return { daily, monthly: daily * 30, seasonal, trend, confidence: Math.min(0.95, 0.5 + history.length / 100) };
}

function computeSafeTransfer(inv: any, dailyForecast: number) {
  const forecastLT = dailyForecast * inv.leadTimeDays;
  const safetyBuf = forecastLT * 0.5;
  const protected_ = Math.ceil(forecastLT + safetyBuf + inv.reservedStock);
  const safe = Math.max(0, inv.currentStock - protected_);
  return { protected_, safe, canOffer: safe > 0 };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { facility_id, medicine_id, state_id } = req.query as any;

    let facId = facility_id || user.facility_id;
    if (!facId) {
      const effectiveState = state_id || user.state_id;
      const defaultFac = await prisma.facility.findFirst({
        where: effectiveState && user.role !== 'national' ? { stateId: effectiveState } : {},
      });
      if (defaultFac) facId = defaultFac.id;
    }

    if (!facId) return res.status(400).json({ error: 'facility_id required' });

    const where: any = { facilityId: facId };
    if (medicine_id) where.medicineId = medicine_id;

    const inventories = await prisma.inventory.findMany({ where, include: { medicine: true, facility: true } });

    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const results = await Promise.all(inventories.map(async inv => {
      const history = await prisma.consumptionRecord.findMany({
        where: { facilityId: inv.facilityId, medicineId: inv.medicineId, date: { gte: cutoffStr } },
        orderBy: { date: 'asc' },
      });
      const histVals = history.map(h => h.quantity);
      const forecast = computeForecast(histVals);
      const { protected_, safe, canOffer } = computeSafeTransfer(inv, forecast.daily);
      const usable = inv.currentStock - inv.reservedStock;
      const daysOfStock = forecast.daily > 0 ? usable / forecast.daily : 999;
      const stockoutDate = forecast.daily > 0
        ? new Date(Date.now() + daysOfStock * 86400000).toISOString().split('T')[0]
        : null;

      let demandRisk = 'low';
      if (daysOfStock < inv.leadTimeDays) demandRisk = 'critical';
      else if (daysOfStock < inv.leadTimeDays * 1.5) demandRisk = 'high';
      else if (forecast.trend === 'increasing' && forecast.seasonal > 1.1) demandRisk = 'medium';

      let supplyRisk = 'low';
      if (daysOfStock <= inv.leadTimeDays) supplyRisk = 'critical';
      else if (daysOfStock <= inv.leadTimeDays * 1.5) supplyRisk = 'high';
      else if (inv.deliveryReliability < 0.8) supplyRisk = 'medium';

      return {
        medicine_id: inv.medicineId,
        medicine_name: inv.medicine.name,
        facility_id: inv.facilityId,
        facility_name: inv.facility.name,
        category: inv.medicine.category,
        criticality: inv.medicine.criticality,
        unit_type: inv.medicine.unitType,
        current_stock: inv.currentStock,
        reserved_stock: inv.reservedStock,
        usable_stock: usable,
        safety_threshold: inv.safetyThreshold,
        avg_daily_consumption: inv.avgDailyConsumption,
        forecast: { daily: Math.round(forecast.daily * 10) / 10, monthly: Math.round(forecast.monthly), confidence: Math.round(forecast.confidence * 100), trend: forecast.trend, seasonal_factor: forecast.seasonal },
        days_of_stock: Math.round(daysOfStock * 10) / 10,
        predicted_stockout_date: stockoutDate,
        lead_time_days: inv.leadTimeDays,
        demand_risk: demandRisk,
        supply_risk: supplyRisk,
        safety_stock_calculation: {
          protected_stock: protected_,
          safe_transferable: safe,
          can_offer: canOffer,
          formula: `Protected = ForecastDuringLeadTime(${Math.round(forecast.daily * inv.leadTimeDays)}) + SafetyBuffer(${Math.round(forecast.daily * inv.leadTimeDays * 0.5)}) + Reservations(${inv.reservedStock})`,
        },
        supplier: inv.supplier,
        history_days: histVals.length,
      };
    }));

    return res.json(results);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/safe-transferable', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { facility_id, medicine_id, quantity_requested } = req.query as any;

    let facId = facility_id || user.facility_id;
    if (!facId) {
      const defaultFac = await prisma.facility.findFirst({
        where: user.role === 'state' && user.state_id ? { stateId: user.state_id } : {},
      });
      if (defaultFac) facId = defaultFac.id;
    }

    if (!facId || !medicine_id) return res.status(400).json({ error: 'facility_id and medicine_id required' });

    const inv = await prisma.inventory.findUnique({ where: { facilityId_medicineId: { facilityId: facId, medicineId: medicine_id } }, include: { medicine: true } });
    if (!inv) return res.status(404).json({ error: 'Inventory not found' });

    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
    const history = await prisma.consumptionRecord.findMany({ where: { facilityId: facId, medicineId: medicine_id, date: { gte: cutoff.toISOString().split('T')[0] } }, orderBy: { date: 'asc' } });
    const forecast = computeForecast(history.map(h => h.quantity));
    const { protected_, safe } = computeSafeTransfer(inv, forecast.daily);

    return res.json({
      medicine_name: inv.medicine.name,
      current_stock: inv.currentStock,
      reserved_stock: inv.reservedStock,
      usable_stock: inv.currentStock - inv.reservedStock,
      forecast_daily: Math.round(forecast.daily * 10) / 10,
      lead_time_days: inv.leadTimeDays,
      calculation: {
        forecast_during_lead_time: Math.round(forecast.daily * inv.leadTimeDays),
        safety_buffer: Math.round(forecast.daily * inv.leadTimeDays * 0.5),
        existing_reservations: inv.reservedStock,
        protected_stock: protected_,
        safe_transferable: safe,
      },
      can_offer: quantity_requested ? safe >= parseInt(quantity_requested) : safe > 0,
      quantity_requested: quantity_requested ? parseInt(quantity_requested) : null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/multi-source', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const { medicine_id, quantity_required, requesting_facility_id } = req.body;
    if (!medicine_id || !quantity_required) return res.status(400).json({ error: 'medicine_id and quantity_required required' });

    const candidates = await prisma.inventory.findMany({
      where: { medicineId: medicine_id, facilityId: { not: requesting_facility_id || '' } },
      include: { medicine: true, facility: { include: { state: true } } },
    });

    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    let remaining = parseInt(quantity_required);
    const plan: any[] = [];

    for (const cand of candidates) {
      if (remaining <= 0) break;
      if (cand.currentStock <= cand.safetyThreshold) continue;

      const hist = await prisma.consumptionRecord.findMany({ where: { facilityId: cand.facilityId, medicineId: medicine_id, date: { gte: cutoff.toISOString().split('T')[0] } }, orderBy: { date: 'asc' } });
      const fc = computeForecast(hist.map(h => h.quantity));
      const { protected_, safe } = computeSafeTransfer(cand, fc.daily);

      if (safe <= 0) continue;
      const canOffer = Math.min(safe, remaining);
      plan.push({
        facility_id: cand.facilityId, facility_name: cand.facility.name, facility_type: cand.facility.type, state_name: cand.facility.state.name,
        current_stock: cand.currentStock, protected_stock: protected_, safe_transferable: safe, quantity_can_offer: canOffer,
        after_transfer_stock: cand.currentStock - canOffer,
        needs_donor_replenishment: (cand.currentStock - canOffer) < (cand.safetyThreshold * 1.2),
        forecast_daily: Math.round(fc.daily * 10) / 10,
      });
      remaining -= canOffer;
    }

    const total = parseInt(quantity_required);
    return res.json({
      medicine_id, quantity_required: total, quantity_planned: total - remaining, quantity_remaining: remaining,
      fulfillment_percentage: Math.round(((total - remaining) / total) * 100),
      is_fully_fulfilled: remaining === 0, fulfillment_plan: plan,
      national_reserve_needed: remaining > 0, shortfall: remaining,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
