import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { authenticate } from '../middleware/auth';
import { getFacilitySector } from '../db/geoData';
import { provisionFacility } from '../db/masterProvisioner';

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

// GET /api/facilities/corridor — Contiguous Regional Corridor (Chennai, Villupuram, Cuddalore, Puducherry)
router.get('/corridor', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const { district, sector, type, search } = req.query as any;

    const CORRIDOR_DISTRICT_CODES = ['TN-CHN', 'TN-VLR', 'TN-CDL', 'PY-PD', 'PY-KK', 'PY-MAH', 'PY-YAN'];

    const corridorDistricts = await prisma.district.findMany({
      where: { code: { in: CORRIDOR_DISTRICT_CODES } },
      include: { state: true },
    });
    const districtIds = corridorDistricts.map((d) => d.id);

    const where: any = {
      isActive: 1,
      type: { not: 'state_reserve' },
      OR: [
        { districtId: { in: districtIds } },
        { state: { code: 'PY' } },
      ],
    };

    if (district && district !== 'all') {
      const targetDist = corridorDistricts.find(
        (d) => d.code === district || d.name.toLowerCase() === district.toLowerCase()
      );
      if (targetDist) {
        where.districtId = targetDist.id;
        delete where.OR;
      }
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    const allCorridorFacilities = await prisma.facility.findMany({
      where,
      include: {
        district: true,
        state: true,
        capacities: true,
        ambulances: true,
        bloodBanks: {
          include: {
            bloodInventories: true,
          },
        },
        inventories: {
          include: {
            medicine: true,
          },
        },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    let mappedFacilities = allCorridorFacilities.map((f) => {
      const sectorTag = (f as any).sector || getFacilitySector(f.type, f.name);

      const generalCap = f.capacities.find((c) => c.careType === 'general');
      const icuCap = f.capacities.find((c) => c.careType === 'icu');
      const traumaCap = f.capacities.find((c) => c.careType === 'trauma');
      const ventCap = f.capacities.find((c) => c.careType === 'ventilator');

      const totalGeneralBeds = generalCap?.totalBeds || 0;
      const availGeneralBeds = generalCap?.availableBeds || 0;
      const totalIcuBeds = icuCap?.totalBeds || 0;
      const availIcuBeds = icuCap?.availableBeds || 0;
      const totalTraumaBeds = traumaCap?.totalBeds || 0;
      const availTraumaBeds = traumaCap?.availableBeds || 0;
      const totalVentBeds = ventCap?.totalBeds || 0;
      const availVentBeds = ventCap?.availableBeds || 0;

      const totalAmbulances = f.ambulances.length;
      const availableAmbulances = f.ambulances.filter((a) => a.status === 'available').length;
      const alsAmbulances = f.ambulances.filter((a) => a.ambulanceType === 'ALS').length;
      const blsAmbulances = f.ambulances.filter((a) => a.ambulanceType === 'BLS').length;

      const totalStock = f.inventories.reduce((acc, inv) => acc + (inv.currentStock || 0), 0);
      const lowStockCount = f.inventories.filter(
        (inv) => (inv.currentStock || 0) < (inv.safetyThreshold || 100)
      ).length;

      let bloodUnits = 0;
      f.bloodBanks.forEach((bb) => {
        bb.bloodInventories.forEach((bi) => {
          bloodUnits += bi.unitsAvailable || 0;
        });
      });

      return {
        id: f.id,
        name: f.name,
        type: f.type,
        level: f.level,
        address: f.address,
        lat: f.lat,
        lng: f.lng,
        hasBloodBank: f.hasBloodBank,
        district_name: f.district?.name || (f.state.code === 'PY' ? 'Puducherry Enclave' : 'Corridor'),
        district_code: f.district?.code || (f.state.code === 'PY' ? 'PY-PD' : 'TN-COR'),
        state_name: f.state.name,
        state_code: f.state.code,
        sector: sectorTag,
        beds: {
          general: { total: totalGeneralBeds, available: availGeneralBeds },
          icu: { total: totalIcuBeds, available: availIcuBeds },
          trauma: { total: totalTraumaBeds, available: availTraumaBeds },
          ventilator: { total: totalVentBeds, available: availVentBeds },
          total: totalGeneralBeds + totalIcuBeds + totalTraumaBeds + totalVentBeds,
          available: availGeneralBeds + availIcuBeds + availTraumaBeds + availVentBeds,
        },
        ambulances: {
          total: totalAmbulances,
          available: availableAmbulances,
          als: alsAmbulances,
          bls: blsAmbulances,
        },
        blood_bank: {
          has_blood_bank: f.hasBloodBank === 1 || f.bloodBanks.length > 0,
          total_units: bloodUnits,
        },
        inventory: {
          total_stock_units: totalStock,
          low_stock_count: lowStockCount,
          total_medicines_monitored: f.inventories.length,
        },
      };
    });

    if (sector && sector !== 'all') {
      mappedFacilities = mappedFacilities.filter((f) => f.sector === sector);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      mappedFacilities = mappedFacilities.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.address && f.address.toLowerCase().includes(q)) ||
          f.district_name.toLowerCase().includes(q)
      );
    }

    const summary = {
      total_facilities: mappedFacilities.length,
      government_count: mappedFacilities.filter((f) => f.sector === 'government').length,
      defence_railway_count: mappedFacilities.filter((f) => f.sector === 'defence_railway').length,
      private_count: mappedFacilities.filter((f) => f.sector === 'private').length,
      health_centre_count: mappedFacilities.filter((f) => f.sector === 'health_centre').length,
      total_beds: mappedFacilities.reduce((sum, f) => sum + f.beds.total, 0),
      available_beds: mappedFacilities.reduce((sum, f) => sum + f.beds.available, 0),
      total_icu_beds: mappedFacilities.reduce((sum, f) => sum + f.beds.icu.total, 0),
      available_icu_beds: mappedFacilities.reduce((sum, f) => sum + f.beds.icu.available, 0),
      total_ventilator_beds: mappedFacilities.reduce((sum, f) => sum + f.beds.ventilator.total, 0),
      available_ventilator_beds: mappedFacilities.reduce((sum, f) => sum + f.beds.ventilator.available, 0),
      total_ambulances: mappedFacilities.reduce((sum, f) => sum + f.ambulances.total, 0),
      available_ambulances: mappedFacilities.reduce((sum, f) => sum + f.ambulances.available, 0),
      als_ambulances: mappedFacilities.reduce((sum, f) => sum + f.ambulances.als, 0),
      bls_ambulances: mappedFacilities.reduce((sum, f) => sum + f.ambulances.bls, 0),
      blood_banks_count: mappedFacilities.filter((f) => f.blood_bank.has_blood_bank).length,
      total_blood_units: mappedFacilities.reduce((sum, f) => sum + f.blood_bank.total_units, 0),
      total_medicine_stock_units: mappedFacilities.reduce((sum, f) => sum + f.inventory.total_stock_units, 0),
    };

    return res.json({
      corridor_meta: {
        name: 'Tamil Nadu & Puducherry Regional Healthcare Corridor',
        districts: ['Chennai', 'Villupuram', 'Cuddalore', 'Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
        nh_routes: ['NH-45 (Grand Southern Trunk Road)', 'NH-45A (Villupuram-Pondy-Cuddalore)', 'ECR (East Coast Road)'],
      },
      summary,
      facilities: mappedFacilities,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/facilities — Add a New Hospital with Auto-Provisioning & Unified Master Database Mirroring
router.post('/', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { name, type, level, sector, district_id, district_code, state_id, state_code, address, lat, lng, contact, has_blood_bank } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Facility name is required' });
    }

    let targetStateId = state_id || user.state_id;
    if (!targetStateId && state_code) {
      const stateObj = await prisma.state.findUnique({ where: { code: state_code } });
      if (stateObj) targetStateId = stateObj.id;
    }
    if (!targetStateId) {
      return res.status(400).json({ error: 'state_id or state_code is required' });
    }

    let targetDistrictId = district_id || null;
    if (!targetDistrictId && district_code) {
      const distObj = await prisma.district.findUnique({ where: { code: district_code } });
      if (distObj) targetDistrictId = distObj.id;
    }

    const derivedSector = sector || getFacilitySector(type, name);

    const created = await prisma.facility.create({
      data: {
        name: name.trim(),
        type: type || 'government_hospital',
        level: level || 'district',
        sector: derivedSector,
        districtId: targetDistrictId,
        stateId: targetStateId,
        address: address || null,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        contact: contact || null,
        hasBloodBank: has_blood_bank ? 1 : 0,
        isActive: 1,
      },
      include: {
        district: true,
        state: true,
      },
    });

    // Run automated cascading provisioning engine (capacities, ambulances, medicines, and login node)
    const provisionResult = await provisionFacility(created.id);

    return res.status(201).json({
      message: 'Facility registered and master database auto-provisioned successfully',
      facility: {
        ...created,
        sector: derivedSector,
        district_name: created.district?.name,
        state_name: created.state.name,
      },
      user: provisionResult.user,
    });
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
    const { care_type, total_beds, occupied_beds, reserved_beds } = req.body;
    if (!care_type) return res.status(400).json({ error: 'care_type is required' });

    const existing = await prisma.hospitalCapacity.findUnique({
      where: { facilityId_careType: { facilityId: facId, careType: care_type } },
    });

    if (user.role === 'hospital' && existing && total_beds !== undefined && Number(total_beds) !== existing.totalBeds) {
      return res.status(403).json({
        error: 'Total sanctioned beds can only be revised by State/National Command Authority. Hospital logins can only update occupied and reserved beds.',
      });
    }

    const occ = Number(occupied_beds) || (existing ? existing.occupiedBeds : 0);
    const resBeds = Number(reserved_beds) || (existing ? existing.reservedBeds : 0);
    const total = existing ? existing.totalBeds : (Number(total_beds) || occ + resBeds || 50);
    const avail = Math.max(0, total - occ - resBeds);

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

// PUT /api/facilities/:id/capacity/:care_type — Update Daily Census (Occupied / Reserved; Vacant is auto-calculated)
router.put('/:id/capacity/:care_type', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const facId = req.params.id;
    const careType = req.params.care_type;

    if (user.role === 'hospital' && user.facility_id !== facId) {
      return res.status(403).json({ error: "Cannot update another facility's capacity" });
    }

    const existing = await prisma.hospitalCapacity.findUnique({
      where: { facilityId_careType: { facilityId: facId, careType } },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Bed capacity record not found for this ward type' });
    }

    const { occupied_beds, reserved_beds, total_beds } = req.body;

    // Hospital logins cannot alter sanctioned total beds
    if (user.role === 'hospital' && total_beds !== undefined && Number(total_beds) !== existing.totalBeds) {
      return res.status(403).json({
        error: 'Sanctioned Total Beds is locked by State Authority. Only Occupied and Reserved beds may be updated by hospital command.',
      });
    }

    const targetTotal =
      (user.role === 'national' || user.role === 'state') && total_beds !== undefined
        ? Number(total_beds)
        : existing.totalBeds;

    const newOcc = occupied_beds !== undefined ? Number(occupied_beds) : existing.occupiedBeds;
    const newRes = reserved_beds !== undefined ? Number(reserved_beds) : existing.reservedBeds;
    // Vacant (available) beds dynamically maintains accurate census: Total - Occupied - Reserved
    const newAvail = Math.max(0, targetTotal - newOcc - newRes);

    const updated = await prisma.hospitalCapacity.update({
      where: { facilityId_careType: { facilityId: facId, careType } },
      data: {
        totalBeds: targetTotal,
        availableBeds: newAvail,
        occupiedBeds: newOcc,
        reservedBeds: newRes,
        lastUpdated: new Date(),
        updatedBy: user.id,
      },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/facilities/:id/capacity/:care_type/sanction — Formal State/National Bed Re-Sanction Protocol
router.post('/:id/capacity/:care_type/sanction', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const facId = req.params.id;
    const careType = req.params.care_type;

    if (user.role !== 'national' && user.role !== 'state') {
      return res.status(403).json({ error: 'Unauthorized: Only State or National Command can revise sanctioned bed quotas' });
    }

    const fac = await prisma.facility.findUnique({ where: { id: facId } });
    if (!fac) return res.status(404).json({ error: 'Facility not found' });

    if (user.role === 'state' && fac.stateId !== user.state_id) {
      return res.status(403).json({ error: 'Unauthorized: Cannot revise bed quotas for a facility in another state/UT' });
    }

    const { total_beds, order_reference, reason } = req.body;
    if (!total_beds || Number(total_beds) <= 0) {
      return res.status(400).json({ error: 'Valid positive total_beds number is required' });
    }

    const existing = await prisma.hospitalCapacity.findUnique({
      where: { facilityId_careType: { facilityId: facId, careType } },
    });

    const newTotal = Number(total_beds);
    const occ = existing ? existing.occupiedBeds : 0;
    const resBeds = existing ? existing.reservedBeds : 0;
    const newAvail = Math.max(0, newTotal - occ - resBeds);

    const updated = await prisma.hospitalCapacity.upsert({
      where: { facilityId_careType: { facilityId: facId, careType } },
      update: {
        totalBeds: newTotal,
        availableBeds: newAvail,
        lastUpdated: new Date(),
        updatedBy: user.id,
      },
      create: {
        facilityId: facId,
        careType,
        totalBeds: newTotal,
        availableBeds: newAvail,
        occupiedBeds: occ,
        reservedBeds: resBeds,
        lastUpdated: new Date(),
        updatedBy: user.id,
      },
    });

    // Write formal administrative audit record
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SANCTIONED_BED_REVISION',
        resourceType: 'hospital_capacity',
        resourceId: updated.id,
        facilityId: facId,
        details: JSON.stringify({
          facility_name: fac.name,
          care_type: careType,
          old_total_beds: existing ? existing.totalBeds : 0,
          new_total_beds: newTotal,
          order_reference: order_reference || 'STATE-SEC-SANCTION-2026',
          reason: reason || 'Administrative capacity expansion/reallocation order',
          revised_by: user.fullName || user.username,
        }),
        ipAddress: req.ip,
      },
    });

    return res.json({
      message: `Sanctioned capacity for ${careType.toUpperCase()} ward revised to ${newTotal} beds successfully.`,
      capacity: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

