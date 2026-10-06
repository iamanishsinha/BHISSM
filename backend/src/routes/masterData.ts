import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/connection';
import { authenticate } from '../middleware/auth';
import { getFacilitySector } from '../db/geoData';
import {
  provisionFacility,
  provisionMedicineAcrossFacilities,
  syncMasterDatabaseFiles,
} from '../db/masterProvisioner';

const router = Router();
router.use(authenticate);

// Middleware: Restrict access to State and National Command authorities
router.use((req: Request, res: Response, next) => {
  const user = req.user;
  if (!user || (user.role !== 'national' && user.role !== 'state')) {
    return res.status(403).json({
      error: 'Access Denied: Master Data Console is restricted to State and National Command authorities.',
    });
  }
  next();
});

// GET /api/master-data/overview — Comprehensive Master Statistics across 4 Pillars
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const stateFilter = user.role === 'state' && user.state_id ? { stateId: user.state_id } : {};

    // 1. Facilities statistics
    const facilities = await prisma.facility.findMany({
      where: {
        type: { not: 'state_reserve' },
        ...stateFilter,
      },
      select: {
        id: true,
        sector: true,
        level: true,
        isActive: true,
        hasBloodBank: true,
      },
    });

    const totalFacilities = facilities.length;
    const activeFacilities = facilities.filter((f) => f.isActive === 1).length;
    const sectorBreakdown = {
      government: facilities.filter((f) => f.sector === 'government').length,
      defence_railway: facilities.filter((f) => f.sector === 'defence_railway').length,
      private: facilities.filter((f) => f.sector === 'private').length,
      health_centre: facilities.filter((f) => f.sector === 'health_centre').length,
    };
    const levelBreakdown = {
      apex: facilities.filter((f) => f.level === 'apex').length,
      state: facilities.filter((f) => f.level === 'state').length,
      district: facilities.filter((f) => f.level === 'district').length,
      phc: facilities.filter((f) => f.level === 'phc').length,
    };
    const bloodBanksCount = facilities.filter((f) => f.hasBloodBank === 1).length;

    // 2. Medicines Catalog statistics
    const medicines = await prisma.medicine.findMany({
      select: {
        id: true,
        criticality: true,
        isVaccine: true,
        storageRequirement: true,
        isActive: true,
      },
    });
    const totalMedicines = medicines.length;
    const activeMedicines = medicines.filter((m) => m.isActive === 1).length;
    const vaccineCount = medicines.filter((m) => m.isVaccine === 1).length;
    const coldChainCount = medicines.filter((m) => m.storageRequirement.includes('cold') || m.storageRequirement.includes('freeze')).length;

    // 3. Bed Capacities census (Sanctioned, Occupied, Vacant/Available, Reserved)
    const facilityIds = facilities.map((f) => f.id);
    const capacities = await prisma.hospitalCapacity.findMany({
      where: { facilityId: { in: facilityIds } },
    });

    let totalSanctionedBeds = 0;
    let totalOccupiedBeds = 0;
    let totalAvailableBeds = 0;
    let totalReservedBeds = 0;
    let totalIcuBeds = 0;
    let totalVentilatorBeds = 0;

    for (const c of capacities) {
      totalSanctionedBeds += c.totalBeds;
      totalOccupiedBeds += c.occupiedBeds;
      totalAvailableBeds += c.availableBeds;
      totalReservedBeds += c.reservedBeds;
      if (c.careType === 'icu') totalIcuBeds += c.totalBeds;
      if (c.careType === 'ventilator') totalVentilatorBeds += c.totalBeds;
    }

    // 4. Ambulance Fleets
    const ambulances = await prisma.ambulance.findMany({
      where: { facilityId: { in: facilityIds } },
    });
    const totalAmbulances = ambulances.length;
    const alsCount = ambulances.filter((a) => a.ambulanceType === 'ALS').length;
    const blsCount = ambulances.filter((a) => a.ambulanceType === 'BLS').length;
    const availableAmbs = ambulances.filter((a) => a.status === 'available').length;

    // 5. Command Node Users
    const userFilter = user.role === 'state' && user.state_id ? { stateId: user.state_id } : {};
    const totalUsers = await prisma.user.count({ where: userFilter });
    const hospitalUsers = await prisma.user.count({ where: { role: 'hospital', ...userFilter } });

    return res.json({
      jurisdiction: user.role === 'national' ? 'National Strategic Grid (All States & UTs)' : `${user.state_name || 'State'} Command`,
      facilities: {
        total: totalFacilities,
        active: activeFacilities,
        sectors: sectorBreakdown,
        levels: levelBreakdown,
        blood_banks: bloodBanksCount,
      },
      catalog: {
        total_medicines: totalMedicines,
        active_medicines: activeMedicines,
        vaccines: vaccineCount,
        cold_chain: coldChainCount,
      },
      beds: {
        sanctioned: totalSanctionedBeds,
        occupied: totalOccupiedBeds,
        available_vacant: totalAvailableBeds,
        reserved: totalReservedBeds,
        icu_sanctioned: totalIcuBeds,
        ventilator_sanctioned: totalVentilatorBeds,
        occupancy_rate: totalSanctionedBeds > 0 ? Math.round(((totalOccupiedBeds + totalReservedBeds) / totalSanctionedBeds) * 100) : 0,
      },
      ambulances: {
        total: totalAmbulances,
        als: alsCount,
        bls: blsCount,
        available: availableAmbs,
      },
      command_nodes: {
        total_users: totalUsers,
        hospital_nodes: hospitalUsers,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/master-data/facilities — Searchable Master Facilities with live census totals
router.get('/facilities', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { state_id, district_id, sector, level, search, is_active } = req.query as any;

    const where: any = {
      type: { not: 'state_reserve' },
    };

    if (user.role === 'state' && user.state_id) {
      where.stateId = user.state_id;
    } else if (state_id) {
      where.stateId = state_id;
    }

    if (district_id) where.districtId = district_id;
    if (sector && sector !== 'all') where.sector = sector;
    if (level && level !== 'all') where.level = level;
    if (is_active !== undefined && is_active !== 'all') where.isActive = Number(is_active);

    if (search && search.trim()) {
      where.name = { contains: search.trim() };
    }

    const facilities = await prisma.facility.findMany({
      where,
      include: {
        state: true,
        district: true,
        capacities: true,
        ambulances: true,
        users: { select: { id: true, username: true, role: true } },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    const mapped = facilities.map((f) => {
      let totalBeds = 0;
      let availBeds = 0;
      let occBeds = 0;
      let resBeds = 0;

      for (const c of f.capacities) {
        totalBeds += c.totalBeds;
        availBeds += c.availableBeds;
        occBeds += c.occupiedBeds;
        resBeds += c.reservedBeds;
      }

      return {
        id: f.id,
        name: f.name,
        type: f.type,
        level: f.level,
        sector: f.sector,
        address: f.address,
        contact: f.contact,
        isActive: f.isActive,
        hasBloodBank: f.hasBloodBank,
        state_id: f.stateId,
        state_name: f.state.name,
        state_code: f.state.code,
        district_id: f.districtId,
        district_name: f.district?.name,
        district_code: f.district?.code,
        beds: {
          sanctioned: totalBeds,
          available: availBeds,
          occupied: occBeds,
          reserved: resBeds,
        },
        ambulances_count: f.ambulances.length,
        command_username: f.users[0]?.username || null,
        created_at: f.createdAt,
      };
    });

    return res.json(mapped);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/master-data/facilities — Register New Hospital with Auto-Provisioning
router.post('/facilities', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const {
      name,
      type,
      level,
      sector,
      state_id,
      state_code,
      district_id,
      district_code,
      address,
      contact,
      lat,
      lng,
      has_blood_bank,
      initial_beds,
      initial_ambulances,
      custom_credentials,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Facility name is required' });
    }

    // State role cannot add facilities into another state
    let targetStateId = user.role === 'state' ? user.state_id : state_id;
    if (!targetStateId && state_code) {
      const st = await prisma.state.findUnique({ where: { code: state_code } });
      if (st) targetStateId = st.id;
    }
    if (!targetStateId) {
      return res.status(400).json({ error: 'State identification is required' });
    }

    let targetDistrictId = district_id || null;
    if (!targetDistrictId && district_code) {
      const dt = await prisma.district.findUnique({ where: { code: district_code } });
      if (dt) targetDistrictId = dt.id;
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
        state: true,
        district: true,
      },
    });

    // Run automated cascading provisioning engine with smart defaults / customization
    const provisionResult = await provisionFacility(created.id, {
      customCredentials: custom_credentials,
      initialBeds: initial_beds,
      initialAmbulances: initial_ambulances,
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'MASTER_FACILITY_REGISTRATION',
        resourceType: 'facility',
        resourceId: created.id,
        facilityId: created.id,
        details: JSON.stringify({
          name: created.name,
          level: created.level,
          sector: derivedSector,
          state: created.state.name,
          command_user: provisionResult.user?.username,
        }),
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({
      message: `Facility "${created.name}" registered and auto-provisioned successfully.`,
      facility: {
        ...created,
        sector: derivedSector,
        state_name: created.state.name,
        district_name: created.district?.name,
      },
      command_user: provisionResult.user,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/master-data/facilities/:id — Update Master Facility Metadata
router.put('/facilities/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const facId = req.params.id;

    const existing = await prisma.facility.findUnique({ where: { id: facId } });
    if (!existing) return res.status(404).json({ error: 'Facility not found' });

    if (user.role === 'state' && existing.stateId !== user.state_id) {
      return res.status(403).json({ error: 'Unauthorized: Cannot modify a facility in another state/UT' });
    }

    const { name, type, level, sector, address, contact, has_blood_bank, is_active } = req.body;

    const updated = await prisma.facility.update({
      where: { id: facId },
      data: {
        ...(name && { name: name.trim() }),
        ...(type && { type }),
        ...(level && { level }),
        ...(sector && { sector }),
        ...(address !== undefined && { address }),
        ...(contact !== undefined && { contact }),
        ...(has_blood_bank !== undefined && { hasBloodBank: has_blood_bank ? 1 : 0 }),
        ...(is_active !== undefined && { isActive: Number(is_active) }),
      },
      include: { state: true, district: true },
    });

    syncMasterDatabaseFiles();

    return res.json({
      message: 'Facility details updated successfully',
      facility: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/master-data/facilities/:id/toggle-status — Activate or Decommission Facility
router.patch('/facilities/:id/toggle-status', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const fac = await prisma.facility.findUnique({ where: { id: req.params.id } });
    if (!fac) return res.status(404).json({ error: 'Facility not found' });

    if (user.role === 'state' && fac.stateId !== user.state_id) {
      return res.status(403).json({ error: 'Unauthorized to alter facility status outside state jurisdiction' });
    }

    const nextStatus = fac.isActive === 1 ? 0 : 1;
    const updated = await prisma.facility.update({
      where: { id: fac.id },
      data: { isActive: nextStatus },
    });

    syncMasterDatabaseFiles();

    return res.json({
      message: `Facility "${fac.name}" is now ${nextStatus === 1 ? 'ACTIVE & OPERATIONAL' : 'DECOMMISSIONED / STANDBY'}`,
      is_active: nextStatus,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/master-data/medicines — Comprehensive Master Medicine & Vaccine Catalog
router.get('/medicines', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const { search, category, criticality, is_vaccine } = req.query as any;

    const where: any = {};
    if (category && category !== 'all') where.category = category;
    if (criticality && criticality !== 'all') where.criticality = criticality;
    if (is_vaccine !== undefined && is_vaccine !== 'all') where.isVaccine = Number(is_vaccine);
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { genericName: { contains: search.trim() } },
      ];
    }

    const medicines = await prisma.medicine.findMany({
      where,
      include: {
        inventories: {
          select: {
            currentStock: true,
            facilityId: true,
          },
        },
      },
      orderBy: [{ isVaccine: 'desc' }, { criticality: 'desc' }, { name: 'asc' }],
    });

    const mapped = medicines.map((m) => {
      let totalStockAcrossNation = 0;
      for (const inv of m.inventories) {
        totalStockAcrossNation += inv.currentStock;
      }

      return {
        id: m.id,
        name: m.name,
        genericName: m.genericName,
        brand: m.brand,
        strength: m.strength,
        dosageForm: m.dosageForm,
        category: m.category,
        unitType: m.unitType,
        criticality: m.criticality,
        storageRequirement: m.storageRequirement,
        isVaccine: m.isVaccine,
        isActive: m.isActive,
        facilities_stocked_count: m.inventories.length,
        total_national_stock: totalStockAcrossNation,
        created_at: m.createdAt,
      };
    });

    return res.json(mapped);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/master-data/medicines — Add New Medicine to National Catalog & Universal Distribution
router.post('/medicines', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;

    // Catalog additions require National Command Authority
    if (user.role !== 'national') {
      return res.status(403).json({
        error: 'National Catalog additions are reserved for National Command Authority.',
      });
    }

    const {
      name,
      generic_name,
      brand,
      strength,
      dosage_form,
      category,
      unit_type,
      criticality,
      storage_requirement,
      is_vaccine,
      baseline_units,
    } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Medicine name is required' });
    if (!generic_name || !generic_name.trim()) return res.status(400).json({ error: 'Generic chemical name is required' });

    const created = await prisma.medicine.create({
      data: {
        name: name.trim(),
        genericName: generic_name.trim(),
        brand: brand?.trim() || null,
        strength: strength?.trim() || null,
        dosageForm: dosage_form || 'Injection / Vial',
        category: category || 'Critical Resuscitation',
        unitType: unit_type || 'vial',
        criticality: criticality || 'critical',
        storageRequirement: storage_requirement || 'room_temperature',
        isVaccine: is_vaccine ? 1 : 0,
        isActive: 1,
      },
    });

    // Automatic Universal Enrollment across all facilities
    const distResult = await provisionMedicineAcrossFacilities(
      created.id,
      Number(baseline_units) || 1200
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'MASTER_MEDICINE_CATALOG_ENROLLMENT',
        resourceType: 'medicine',
        resourceId: created.id,
        details: JSON.stringify({
          name: created.name,
          category: created.category,
          criticality: created.criticality,
          distributed_facilities: distResult.distributedCount,
        }),
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({
      message: `Medicine "${created.name}" enrolled in Master Catalog and distributed to ${distResult.distributedCount} healthcare facilities nationwide.`,
      medicine: created,
      distribution: distResult,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/master-data/medicines/:id — Update Medicine Specifications
router.put('/medicines/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    if (user.role !== 'national') {
      return res.status(403).json({ error: 'Catalog alterations require National Command Authority' });
    }

    const {
      name,
      generic_name,
      brand,
      strength,
      dosage_form,
      category,
      unit_type,
      criticality,
      storage_requirement,
      is_vaccine,
      is_active,
    } = req.body;

    const updated = await prisma.medicine.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(generic_name && { genericName: generic_name.trim() }),
        ...(brand !== undefined && { brand }),
        ...(strength !== undefined && { strength }),
        ...(dosage_form && { dosageForm: dosage_form }),
        ...(category && { category }),
        ...(unit_type && { unitType: unit_type }),
        ...(criticality && { criticality }),
        ...(storage_requirement && { storageRequirement: storage_requirement }),
        ...(is_vaccine !== undefined && { isVaccine: is_vaccine ? 1 : 0 }),
        ...(is_active !== undefined && { isActive: Number(is_active) }),
      },
    });

    syncMasterDatabaseFiles();

    return res.json({
      message: 'Medicine master specifications updated successfully',
      medicine: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/master-data/beds — All Facility Sanctioned & Vacant Bed Records
router.get('/beds', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { facility_id, care_type } = req.query as any;

    const where: any = {};
    if (facility_id) where.facilityId = facility_id;
    if (care_type && care_type !== 'all') where.careType = care_type;

    if (user.role === 'state' && user.state_id) {
      where.facility = { stateId: user.state_id };
    }

    const capacities = await prisma.hospitalCapacity.findMany({
      where,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            level: true,
            sector: true,
            state: { select: { name: true, code: true } },
            district: { select: { name: true } },
          },
        },
      },
      orderBy: [{ facility: { name: 'asc' } }, { careType: 'asc' }],
    });

    return res.json(capacities);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/master-data/ambulances — Ambulance Fleet Directory
router.get('/ambulances', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { facility_id, status, type } = req.query as any;

    const where: any = {};
    if (facility_id) where.facilityId = facility_id;
    if (status && status !== 'all') where.status = status;
    if (type && type !== 'all') where.ambulanceType = type;

    if (user.role === 'state' && user.state_id) {
      where.facility = { stateId: user.state_id };
    }

    const ambs = await prisma.ambulance.findMany({
      where,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            sector: true,
            state: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: [{ facility: { name: 'asc' } }, { ambulanceType: 'asc' }],
    });

    return res.json(ambs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/master-data/users — Command User Credentials Directory
router.get('/users', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { role, state_id, search } = req.query as any;

    const where: any = {};
    if (user.role === 'state' && user.state_id) {
      where.stateId = user.state_id;
    } else if (state_id) {
      where.stateId = state_id;
    }

    if (role && role !== 'all') where.role = role;
    if (search && search.trim()) {
      where.OR = [
        { username: { contains: search.trim() } },
        { fullName: { contains: search.trim() } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        facilityId: true,
        stateId: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        facility: { select: { id: true, name: true, sector: true, level: true } },
        state: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ role: 'asc' }, { username: 'asc' }],
    });

    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/master-data/users/reset-password — Reset Command Node Password
router.post('/users/reset-password', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { user_id, new_password } = req.body;

    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const targetUser = await prisma.user.findUnique({
      where: { id: user_id },
      include: { facility: true, state: true },
    });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'state' && targetUser.stateId !== user.state_id) {
      return res.status(403).json({ error: 'Unauthorized to reset credentials outside state jurisdiction' });
    }

    const pwdToSet = new_password?.trim() || `BHISSM@Demo#${targetUser.state?.code || 'IN'}`;
    const hash = bcrypt.hashSync(pwdToSet, 10);

    await prisma.user.update({
      where: { id: user_id },
      data: { passwordHash: hash },
    });

    syncMasterDatabaseFiles();

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'COMMAND_NODE_PASSWORD_RESET',
        resourceType: 'user',
        resourceId: targetUser.id,
        details: JSON.stringify({
          username: targetUser.username,
          target_role: targetUser.role,
          reset_by: user.username,
        }),
        ipAddress: req.ip,
      },
    });

    return res.json({
      message: `Password for node "${targetUser.username}" reset successfully.`,
      username: targetUser.username,
      new_password: pwdToSet,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
