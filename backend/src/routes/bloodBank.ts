import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/inventory', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { blood_group, component, facility_id, low_only } = req.query as any;

    const where: any = { bloodBank: { isActive: 1 } };
    if (user.role === 'hospital' && user.state_id) where.facility = { stateId: user.state_id };
    else if (user.role === 'state' && user.state_id) where.facility = { stateId: user.state_id };
    if (blood_group) where.bloodGroup = blood_group;
    if (component) where.component = component;
    if (facility_id) where.facilityId = facility_id;
    if (low_only === 'true') where.status = { in: ['low', 'critical', 'exhausted'] };

    const inv = await prisma.bloodInventory.findMany({
      where,
      include: { bloodBank: true, facility: { include: { state: true } } },
      orderBy: [{ bloodGroup: 'asc' }, { component: 'asc' }],
    });

    return res.json(inv.map(i => ({ ...i, blood_bank_name: i.bloodBank.name, bb_type: i.bloodBank.type, facility_name: i.facility.name, state_name: i.facility.state.name, requestable_units: i.availableUnits - i.reservedUnits })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const where: any = { bloodBank: { isActive: 1 } };
    if (user.role !== 'national' && user.state_id) where.facility = { stateId: user.state_id };

    const items = await prisma.bloodInventory.findMany({ where });
    const grouped: Record<string, Record<string, { available: number; reserved: number; count: number }>> = {};
    for (const i of items) {
      if (!grouped[i.bloodGroup]) grouped[i.bloodGroup] = {};
      if (!grouped[i.bloodGroup][i.component]) grouped[i.bloodGroup][i.component] = { available: 0, reserved: 0, count: 0 };
      grouped[i.bloodGroup][i.component].available += i.availableUnits;
      grouped[i.bloodGroup][i.component].reserved += i.reservedUnits;
      grouped[i.bloodGroup][i.component].count++;
    }

    const result: any[] = [];
    for (const [bg, comps] of Object.entries(grouped)) {
      for (const [comp, d] of Object.entries(comps)) {
        result.push({ blood_group: bg, component: comp, total_available: d.available, total_reserved: d.reserved, total_requestable: d.available - d.reserved, source_count: d.count });
      }
    }
    return res.json(result.sort((a, b) => a.blood_group.localeCompare(b.blood_group) || a.component.localeCompare(b.component)));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/requests', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { status, blood_group } = req.query as any;

    const where: any = {};
    if (user.role === 'hospital' && user.facility_id) where.requestingFacilityId = user.facility_id;
    else if (user.role === 'state' && user.state_id) where.facility = { stateId: user.state_id };
    if (status) where.status = status;
    if (blood_group) where.bloodGroup = blood_group;

    const requests = await prisma.bloodRequest.findMany({ where, include: { facility: true, user: { select: { fullName: true } }, emergency: { select: { title: true } } }, orderBy: { createdAt: 'desc' } });
    return res.json(requests.map(r => ({ ...r, facility_name: r.facility.name, requested_by_name: r.user?.fullName, emergency_title: r.emergency?.title })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/request', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { blood_group, component, units_required, priority, required_by, reason, emergency_id } = req.body;
    if (!blood_group || !component || !units_required) return res.status(400).json({ error: 'blood_group, component, units_required required' });

    const facilityId = user.facility_id || req.body.requesting_facility_id;
    if (!facilityId) return res.status(400).json({ error: 'requesting_facility_id required' });

    const bloodRequest = await prisma.bloodRequest.create({
      data: { requestingFacilityId: facilityId, emergencyId: emergency_id || null, bloodGroup: blood_group, component, unitsRequired: units_required, priority: priority || 'urgent', requiredBy: required_by ? new Date(required_by) : null, reason: reason || null, requestedBy: user.id }
    });

    const sources = await prisma.bloodInventory.findMany({
      where: { bloodGroup: blood_group, component, facilityId: { not: facilityId }, bloodBank: { isActive: 1 } },
      include: { bloodBank: true, facility: true },
      orderBy: { availableUnits: 'desc' },
      take: 10,
    });

    const availableSources = sources.filter(s => s.availableUnits - s.reservedUnits > 0);
    if (availableSources.length > 0) {
      await prisma.bloodRequest.update({ where: { id: bloodRequest.id }, data: { status: 'source_identified' } });
    }

    return res.status(201).json({ request: await prisma.bloodRequest.findUnique({ where: { id: bloodRequest.id } }), available_sources: availableSources.map(s => ({ ...s, requestable_units: s.availableUnits - s.reservedUnits, blood_bank_name: s.bloodBank.name, facility_name: s.facility.name })) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/requests/:id/sources', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const request = await prisma.bloodRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const sources = await prisma.bloodInventory.findMany({
      where: { bloodGroup: request.bloodGroup, component: request.component, facilityId: { not: request.requestingFacilityId }, bloodBank: { isActive: 1 } },
      include: { bloodBank: true, facility: { include: { state: true } } },
      orderBy: { availableUnits: 'desc' },
    });

    let remaining = request.unitsRequired - request.unitsConfirmed;
    const plan: any[] = [];
    for (const s of sources) {
      if (remaining <= 0) break;
      const req_ = Math.min(s.availableUnits - s.reservedUnits, remaining);
      if (req_ > 0) { plan.push({ ...s, blood_bank_name: s.bloodBank.name, facility_name: s.facility.name, state_name: s.facility.state.name, requestable_units: s.availableUnits - s.reservedUnits, suggested_units: req_ }); remaining -= req_; }
    }

    return res.json({ request, fulfillment_plan: plan, can_fulfill: remaining <= 0, remaining_shortfall: remaining });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/requests/:id/offer', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { blood_bank_id, units_offered, eta_minutes } = req.body;

    const request = await prisma.bloodRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const bb = await prisma.bloodBank.findUnique({ where: { id: blood_bank_id } });
    if (!bb) return res.status(404).json({ error: 'Blood bank not found' });

    const inv = await prisma.bloodInventory.findUnique({ where: { bloodBankId_bloodGroup_component: { bloodBankId: blood_bank_id, bloodGroup: request.bloodGroup, component: request.component } } });
    if (!inv || (inv.availableUnits - inv.reservedUnits) < units_offered) {
      return res.status(400).json({ error: 'Insufficient units', available: inv ? inv.availableUnits - inv.reservedUnits : 0 });
    }

    const offer = await prisma.bloodOffer.create({ data: { requestId: request.id, bloodBankId: blood_bank_id, sourceFacilityId: bb.facilityId, bloodGroup: request.bloodGroup, component: request.component, unitsOffered: units_offered, etaMinutes: eta_minutes || null, offeredBy: user.id } });
    await prisma.bloodInventory.update({ where: { bloodBankId_bloodGroup_component: { bloodBankId: blood_bank_id, bloodGroup: request.bloodGroup, component: request.component } }, data: { reservedUnits: { increment: units_offered } } });

    const newConf = request.unitsConfirmed + units_offered;
    await prisma.bloodRequest.update({ where: { id: request.id }, data: { unitsConfirmed: newConf, status: newConf >= request.unitsRequired ? 'reserved' : 'offered' } });

    return res.status(201).json({ offer, request: await prisma.bloodRequest.findUnique({ where: { id: request.id } }) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/offers/:offer_id/dispatch', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const offer = await prisma.bloodOffer.findUnique({ where: { id: req.params.offer_id } });
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    await prisma.bloodOffer.update({ where: { id: offer.id }, data: { status: 'dispatched' } });
    await prisma.bloodInventory.update({ where: { bloodBankId_bloodGroup_component: { bloodBankId: offer.bloodBankId, bloodGroup: offer.bloodGroup, component: offer.component } }, data: { availableUnits: { decrement: offer.unitsOffered }, reservedUnits: { decrement: offer.unitsOffered } } });
    return res.json({ message: 'Blood dispatched' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/offers/:offer_id/receive', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const offer = await prisma.bloodOffer.findUnique({ where: { id: req.params.offer_id } });
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    await prisma.bloodOffer.update({ where: { id: offer.id }, data: { status: 'received', unitsAccepted: offer.unitsOffered } });
    const req_ = await prisma.bloodRequest.findUnique({ where: { id: offer.requestId } });
    if (req_ && req_.unitsConfirmed >= req_.unitsRequired) await prisma.bloodRequest.update({ where: { id: req_.id }, data: { status: 'completed' } });
    return res.json({ message: 'Blood received' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/blood-bank/manual-entry — Manual Blood Stock Entry (Donation Camp / Vendor / Direct Collection)
router.post('/manual-entry', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const {
      facility_id,
      blood_group,
      component,
      units_added,
      source_type,
      bag_batch_number,
      expiry_date,
      notes,
    } = req.body;

    const targetFacilityId =
      user.role === 'hospital' ? user.facility_id : facility_id || user.facility_id;
    if (!targetFacilityId) {
      return res.status(400).json({ error: 'Target hospital facility_id is required' });
    }

    const units = Number(units_added);
    if (!blood_group || !component || !units || units <= 0) {
      return res
        .status(400)
        .json({ error: 'blood_group, component, and a positive units_added are required' });
    }

    const facility = await prisma.facility.findUnique({ where: { id: targetFacilityId } });
    if (!facility) return res.status(404).json({ error: 'Hospital facility not found' });

    // Ensure a BloodBank record exists for this hospital
    let bloodBank = await prisma.bloodBank.findFirst({
      where: { facilityId: targetFacilityId, isActive: 1 },
    });

    if (!bloodBank) {
      bloodBank = await prisma.bloodBank.create({
        data: {
          facilityId: targetFacilityId,
          name: `${facility.name} Blood Bank`,
          type: facility.type.includes('private') ? 'private' : 'government',
          licenseNumber: `BB-LIC-${targetFacilityId.slice(0, 5).toUpperCase()}`,
          isActive: 1,
          contact: facility.contact || '0413-2272380',
        },
      });
      await prisma.facility.update({
        where: { id: targetFacilityId },
        data: { hasBloodBank: 1 },
      });
    }

    const now = new Date();
    const parsedExpiry = expiry_date
      ? new Date(expiry_date)
      : new Date(now.getTime() + 35 * 86400000);

    const existingInv = await prisma.bloodInventory.findUnique({
      where: {
        bloodBankId_bloodGroup_component: {
          bloodBankId: bloodBank.id,
          bloodGroup: blood_group,
          component,
        },
      },
    });

    const newAvailableUnits = (existingInv?.availableUnits || 0) + units;
    const computedStatus =
      newAvailableUnits <= 0
        ? 'exhausted'
        : newAvailableUnits <= 5
        ? 'critical'
        : newAvailableUnits <= 15
        ? 'low'
        : 'available';

    const updatedInv = await prisma.bloodInventory.upsert({
      where: {
        bloodBankId_bloodGroup_component: {
          bloodBankId: bloodBank.id,
          bloodGroup: blood_group,
          component,
        },
      },
      update: {
        availableUnits: newAvailableUnits,
        collectionDate: now,
        expiryDate: parsedExpiry,
        status: computedStatus,
        lastUpdated: now,
      },
      create: {
        bloodBankId: bloodBank.id,
        facilityId: targetFacilityId,
        bloodGroup: blood_group,
        component,
        availableUnits: units,
        reservedUnits: 0,
        collectionDate: now,
        expiryDate: parsedExpiry,
        status: computedStatus,
        lastUpdated: now,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'MANUAL_BLOOD_STOCK_ENTRY',
        resourceType: 'blood_inventory',
        resourceId: updatedInv.id,
        facilityId: targetFacilityId,
        details: JSON.stringify({
          blood_bank: bloodBank.name,
          blood_group,
          component,
          units_added: units,
          new_total_available: newAvailableUnits,
          source_type: source_type || 'Voluntary Donation / Direct Entry',
          bag_batch_number,
          notes,
        }),
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({
      message: `Added ${units} units of ${blood_group} (${component.replace('_', ' ')}) to ${bloodBank.name}`,
      inventory: updatedInv,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

