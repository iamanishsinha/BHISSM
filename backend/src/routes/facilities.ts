import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { state_id, district_id, type, level, has_blood_bank, include_state_reserve } = req.query as any;

    const where: any = { isActive: 1 };
    if (include_state_reserve !== 'true' && !type) {
      where.type = { not: 'state_reserve' };
    }
    if (req.query.all_states !== 'true') {
      if (user.role === 'hospital' && user.state_id) where.stateId = user.state_id;
      else if (user.role === 'state' && user.state_id) where.stateId = user.state_id;
    }
    if (state_id) where.stateId = state_id;
    if (district_id) where.districtId = district_id;
    if (type) where.type = type;
    if (level) where.level = level;
    if (has_blood_bank === 'true') where.hasBloodBank = 1;

    const facilities = await prisma.facility.findMany({
      where,
      include: { district: true, state: true },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
    return res.json(
      facilities.map((f) => ({
        ...f,
        district_name: f.district?.name,
        state_name: f.state.name,
        state_code: f.state.code,
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/ambulances/list', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { status, type, facility_id } = req.query as any;

    const where: any = {};
    if (user.role === 'hospital' && user.state_id) where.facility = { stateId: user.state_id };
    else if (user.role === 'state' && user.state_id) where.facility = { stateId: user.state_id };
    if (facility_id) where.facilityId = facility_id;
    if (status) where.status = status;
    if (type) where.ambulanceType = type;

    const ambulances = await prisma.ambulance.findMany({
      where,
      include: { facility: { include: { state: true } } },
      orderBy: [{ status: 'asc' }, { ambulanceType: 'asc' }],
    });
    return res.json(
      ambulances.map((a) => ({
        ...a,
        facility_name: a.facility.name,
        state_name: a.facility.state.name,
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/facilities/ambulances — Manual Entry of a New Ambulance
router.post('/ambulances', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const {
      facility_id,
      registration,
      ambulance_type,
      provider,
      current_zone,
      deployment_time_minutes,
      capacity,
      equipment,
      status,
    } = req.body;

    const targetFacilityId =
      user.role === 'hospital' ? user.facility_id : facility_id || user.facility_id;
    if (!targetFacilityId) {
      return res.status(400).json({ error: 'Target hospital facility_id is required' });
    }
    if (!registration || !registration.trim()) {
      return res.status(400).json({ error: 'Vehicle registration number is required' });
    }

    const cleanReg = registration.trim().toUpperCase();
    const existing = await prisma.ambulance.findUnique({ where: { registration: cleanReg } });
    if (existing) {
      return res
        .status(400)
        .json({ error: `Ambulance with registration ${cleanReg} already exists in the fleet` });
    }

    const created = await prisma.ambulance.create({
      data: {
        facilityId: targetFacilityId,
        registration: cleanReg,
        ambulanceType: ambulance_type || 'ALS',
        provider: provider || 'Hospital Fleet / Direct Vendor Purchase',
        status: status || 'available',
        currentZone: current_zone || 'Hospital Emergency Bay',
        deploymentTimeMinutes: Number(deployment_time_minutes) || 10,
        capacity: Number(capacity) || 2,
        equipment: equipment || 'Ventilator, Defibrillator, Oxygen Cylinder, Trauma Kit',
      },
      include: { facility: { include: { state: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'MANUAL_AMBULANCE_ENTRY',
        resourceType: 'ambulance',
        resourceId: created.id,
        facilityId: targetFacilityId,
        details: JSON.stringify({
          registration: cleanReg,
          ambulance_type: created.ambulanceType,
          provider: created.provider,
          current_zone: created.currentZone,
        }),
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({
      ...created,
      facility_name: created.facility.name,
      state_name: created.facility.state.name,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/ambulances/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const { status, current_zone } = req.body;
    const updated = await prisma.ambulance.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(current_zone && { currentZone: current_zone }),
        lastUpdated: new Date(),
      },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/staff/list', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { status, staff_type, facility_id } = req.query as any;

    const where: any = {};
    if (user.role === 'hospital' && user.state_id) where.facility = { stateId: user.state_id };
    else if (user.role === 'state' && user.state_id) where.facility = { stateId: user.state_id };
    if (status) where.status = status;
    if (staff_type) where.staffType = staff_type;
    if (facility_id) where.facilityId = facility_id;

    const staff = await prisma.medicalStaff.findMany({
      where,
      include: { facility: { include: { state: true } } },
      orderBy: [{ createdAt: 'desc' }, { staffType: 'asc' }, { name: 'asc' }],
    });
    return res.json(
      staff.map((s) => ({
        ...s,
        facility_name: s.facility.name,
        state_name: s.facility.state.name,
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/facilities/staff — Manual Entry of a New Doctor / Specialist / Nurse / Paramedic
router.post('/staff', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const {
      facility_id,
      name,
      staff_type,
      specialty,
      contact,
      deployment_time_minutes,
      status,
    } = req.body;

    const targetFacilityId =
      user.role === 'hospital' ? user.facility_id : facility_id || user.facility_id;
    if (!targetFacilityId) {
      return res.status(400).json({ error: 'Target hospital facility_id is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Doctor / Staff member name is required' });
    }

    const created = await prisma.medicalStaff.create({
      data: {
        facilityId: targetFacilityId,
        name: name.trim(),
        staffType: staff_type || 'doctor',
        specialty: specialty || 'Emergency & Trauma Medicine',
        contact: contact || '+91-94430-10800',
        status: status || 'available',
        deploymentTimeMinutes: Number(deployment_time_minutes) || 15,
      },
      include: { facility: { include: { state: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'MANUAL_DOCTOR_STAFF_ENTRY',
        resourceType: 'medical_staff',
        resourceId: created.id,
        facilityId: targetFacilityId,
        details: JSON.stringify({
          name: created.name,
          staff_type: created.staffType,
          specialty: created.specialty,
          contact: created.contact,
        }),
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({
      ...created,
      facility_name: created.facility.name,
      state_name: created.facility.state.name,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/facilities/staff/:id — Toggle Doctor/Staff availability status
router.patch('/staff/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const { status } = req.body;
    const updated = await prisma.medicalStaff.update({
      where: { id: req.params.id },
      data: { ...(status && { status }) },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const f = await prisma.facility.findUnique({
      where: { id: req.params.id },
      include: { district: true, state: true },
    });
    if (!f) return res.status(404).json({ error: 'Facility not found' });
    return res.json({ ...f, district_name: f.district?.name, state_name: f.state.name });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id/capacity', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const capacity = await prisma.hospitalCapacity.findMany({
      where: { facilityId: req.params.id },
      orderBy: { careType: 'asc' },
    });
    return res.json(capacity);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/facilities/:id/capacity — Add or Upsert a Bed Ward / Care Type Capacity
router.post('/:id/capacity', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const facId = req.params.id;
    if (user.role === 'hospital' && user.facility_id !== facId) {
      return res.status(403).json({ error: "Cannot update another facility's capacity" });
    }
    const { care_type, total_beds, available_beds, occupied_beds, reserved_beds } = req.body;
    if (!care_type) return res.status(400).json({ error: 'care_type is required' });

    const avail = Number(available_beds) || 0;
    const occ = Number(occupied_beds) || 0;
    const resBeds = Number(reserved_beds) || 0;
    const total = Number(total_beds) || avail + occ + resBeds;

    const upserted = await prisma.hospitalCapacity.upsert({
      where: { facilityId_careType: { facilityId: facId, careType: care_type } },
      update: {
        totalBeds: total,
        availableBeds: avail,
        occupiedBeds: occ,
        reservedBeds: resBeds,
        lastUpdated: new Date(),
        updatedBy: user.id,
      },
      create: {
        facilityId: facId,
        careType: care_type,
        totalBeds: total,
        availableBeds: avail,
        occupiedBeds: occ,
        reservedBeds: resBeds,
        lastUpdated: new Date(),
        updatedBy: user.id,
      },
    });
    return res.status(201).json(upserted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id/capacity/:care_type', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    if (user.role === 'hospital' && user.facility_id !== req.params.id)
      return res.status(403).json({ error: "Cannot update another facility's capacity" });
    const { available_beds, occupied_beds, reserved_beds, total_beds } = req.body;
    const updated = await prisma.hospitalCapacity.update({
      where: { facilityId_careType: { facilityId: req.params.id, careType: req.params.care_type } },
      data: {
        ...(total_beds !== undefined && { totalBeds: Number(total_beds) }),
        ...(available_beds !== undefined && { availableBeds: Number(available_beds) }),
        ...(occupied_beds !== undefined && { occupiedBeds: Number(occupied_beds) }),
        ...(reserved_beds !== undefined && { reservedBeds: Number(reserved_beds) }),
        lastUpdated: new Date(),
        updatedBy: user.id,
      },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

