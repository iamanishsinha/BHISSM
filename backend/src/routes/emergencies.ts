import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

export interface EmergencyHospitalHierarchy {
  text: string;
  primaryFacilityId: string | null;
  secondaryFacilityId: string | null;
  supportingFacilityIds: string[];
  designatedFacilityIds: string[];
}

export function parseHospitalHierarchy(emergency: {
  description?: string | null;
  facilityId?: string | null;
}): EmergencyHospitalHierarchy {
  let text = emergency.description || '';
  let primaryFacilityId = emergency.facilityId || null;
  let secondaryFacilityId: string | null = null;
  let supportingFacilityIds: string[] = [];

  if (emergency.description && emergency.description.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(emergency.description);
      if (parsed && typeof parsed === 'object') {
        text = typeof parsed.text === 'string' ? parsed.text : '';
        if (parsed.primary_facility_id) primaryFacilityId = parsed.primary_facility_id;
        if (parsed.secondary_facility_id) secondaryFacilityId = parsed.secondary_facility_id;
        if (Array.isArray(parsed.supporting_facility_ids)) {
          supportingFacilityIds = parsed.supporting_facility_ids.filter(Boolean);
        }
      }
    } catch {
      // Fallback to plain text description if JSON parsing fails
    }
  }

  // Ensure no duplicate IDs across tiers
  if (secondaryFacilityId === primaryFacilityId) {
    secondaryFacilityId = null;
  }
  supportingFacilityIds = supportingFacilityIds.filter(
    (id) => id !== primaryFacilityId && id !== secondaryFacilityId
  );

  const designatedFacilityIds = Array.from(
    new Set([primaryFacilityId, secondaryFacilityId, ...supportingFacilityIds].filter(Boolean) as string[])
  );

  return {
    text,
    primaryFacilityId,
    secondaryFacilityId,
    supportingFacilityIds,
    designatedFacilityIds,
  };
}

export function serializeHospitalHierarchy(
  text: string,
  primaryFacilityId: string | null,
  secondaryFacilityId: string | null,
  supportingFacilityIds: string[]
): string {
  const cleanSecondary = secondaryFacilityId && secondaryFacilityId !== primaryFacilityId ? secondaryFacilityId : null;
  const cleanSupporting = Array.from(
    new Set(
      (supportingFacilityIds || []).filter(
        (id) => Boolean(id) && id !== primaryFacilityId && id !== cleanSecondary
      )
    )
  );
  return JSON.stringify({
    text: text || '',
    primary_facility_id: primaryFacilityId || null,
    secondary_facility_id: cleanSecondary,
    supporting_facility_ids: cleanSupporting,
  });
}

async function buildFacilityLookup(prisma: ReturnType<typeof getDb>) {
  const allFacilities = await prisma.facility.findMany({
    include: { state: true, district: true },
  });
  const map = new Map<string, any>();
  for (const f of allFacilities) {
    map.set(f.id, {
      id: f.id,
      name: f.name,
      level: f.level,
      type: f.type,
      state_id: f.stateId,
      state_code: f.state?.code,
      state_name: f.state?.name,
      district_name: f.district?.name,
    });
  }
  return map;
}

// Cross-State & Adjacent District Mutual Aid Corridors
const ADJACENT_STATE_CORRIDORS: Record<string, string[]> = {
  PY: ['PY', 'TN', 'AP', 'KL'], // Puducherry enclaves border Tamil Nadu (Villupuram, Auroville, Cuddalore, Chennai ECR), AP & KL
  TN: ['TN', 'PY', 'KA', 'KL', 'AP'], // Tamil Nadu borders Puducherry, Karnataka, Kerala, Andhra Pradesh
  KA: ['KA', 'TN', 'MH', 'AP', 'KL'],
  AP: ['AP', 'TN', 'KA', 'PY'],
  KL: ['KL', 'TN', 'KA', 'PY'],
  MH: ['MH', 'KA'],
};

const ADJACENT_HELPER_DISTRICTS_BY_STATE: Record<string, string[]> = {
  PY: [
    'Puducherry & Kalapet ECR (PY)',
    'Villupuram & Auroville Border District (Tamil Nadu)',
    'Cuddalore Coastal District (Tamil Nadu)',
    'Chennai ECR Trauma Corridor (Tamil Nadu)',
  ],
  TN: [
    'Villupuram & Cuddalore Districts (TN)',
    'Puducherry & Kalapet / Auroville Enclave (Puducherry UT)',
    'Karaikal District (Puducherry UT)',
    'Bengaluru Urban Border Corridor (Karnataka)',
  ],
  KA: [
    'Bengaluru Urban & Mysuru (KA)',
    'Hosur / Vellore Border (Tamil Nadu)',
    'Belagavi - Pune Corridor (Maharashtra)',
  ],
  AP: ['Visakhapatnam & Vijayawada (AP)', 'Yanam (Puducherry UT)', 'Chennai North Corridor (TN)'],
  KL: ['Thiruvananthapuram & Kochi (KL)', 'Mahe (Puducherry UT)', 'Coimbatore / Kanyakumari Border (TN)'],
  MH: ['Mumbai & Pune Corridors (MH)', 'Belagavi Border District (Karnataka)'],
};

function enrichEmergencyResponse(
  e: any,
  facilityMap: Map<string, any>,
  viewerStateId?: string | null
) {
  const hierarchy = parseHospitalHierarchy(e);
  const primaryFac = hierarchy.primaryFacilityId ? facilityMap.get(hierarchy.primaryFacilityId) : null;
  const secondaryFac = hierarchy.secondaryFacilityId ? facilityMap.get(hierarchy.secondaryFacilityId) : null;
  const supportingFacs = hierarchy.supportingFacilityIds
    .map((id) => facilityMap.get(id))
    .filter(Boolean);

  const incidentStateCode = e.state?.code || primaryFac?.state_code || 'PY';
  const incidentStateName = e.state?.name || primaryFac?.state_name || 'Puducherry';
  const effectiveIncidentStateId = e.stateId || primaryFac?.state_id;
  const isCrossBorderAid = Boolean(
    viewerStateId && effectiveIncidentStateId && effectiveIncidentStateId !== viewerStateId
  );

  const adjacentDistrictsNotified =
    ADJACENT_HELPER_DISTRICTS_BY_STATE[incidentStateCode] || [
      `${incidentStateName} Regional Grid`,
      'Adjacent Inter-State Border Districts',
    ];

  const requirements = Array.isArray(e.requirements)
    ? e.requirements.map((r: any) => ({
        ...r,
        resource_type: r.resourceType,
        quantity_required: r.quantityRequired,
        quantity_confirmed: r.quantityConfirmed,
        medicine_name: r.medicine?.name || null,
        offers: Array.isArray(r.offers)
          ? r.offers.map((o: any) => ({
              ...o,
              quantity_offered: o.quantityOffered,
              quantity_accepted: o.quantityAccepted,
              offering_facility_id: o.offeringFacilityId,
              facility_name: o.facility?.name || facilityMap.get(o.offeringFacilityId)?.name,
            }))
          : undefined,
      }))
    : undefined;

  return {
    ...e,
    description: hierarchy.text,
    emergency_type: e.emergencyType,
    estimated_casualties: e.estimatedCasualties,
    expected_duration_hours: e.expectedDurationHours,
    facility_name: primaryFac?.name || e.facility?.name,
    district_name: e.district?.name || primaryFac?.district_name,
    state_name: incidentStateName,
    state_code: incidentStateCode,
    activated_by_name: e.activatedByUser?.fullName,
    confirmed_by_name: e.confirmedByUser?.fullName,
    primary_facility_id: hierarchy.primaryFacilityId,
    primary_facility: primaryFac,
    primary_facility_name: primaryFac?.name || e.facility?.name || null,
    secondary_facility_id: hierarchy.secondaryFacilityId,
    secondary_facility: secondaryFac,
    secondary_facility_name: secondaryFac?.name || null,
    supporting_facility_ids: hierarchy.supportingFacilityIds,
    supporting_facilities: supportingFacs,
    designated_facility_ids: hierarchy.designatedFacilityIds,
    is_cross_border_aid: isCrossBorderAid,
    adjacent_districts_notified: adjacentDistrictsNotified,
    adjacent_corridor_note: isCrossBorderAid
      ? `Adjacent State / District Mutual Aid: Incident in ${incidentStateName} (${e.location}) — Neighbouring border districts mobilized to assist.`
      : `Inter-State Adjacent District Protocol Active: ${adjacentDistrictsNotified.join(' • ')}`,
    total_requirements: e.requirements ? e.requirements.length : 0,
    fulfilled_requirements: e.requirements
      ? e.requirements.filter((r: any) => r.status === 'fulfilled').length
      : 0,
    is_national_disaster: e.estimatedCasualties >= 500,
    ...(requirements !== undefined && { requirements }),
  };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const {
      status,
      state_id,
      min_casualties,
      national_only,
      strict_state_only,
      include_all_india,
    } = req.query as any;

    const where: any = { status: { not: 'closed' } };
    if (status && status !== 'all') {
      // Even when status='active' is requested by legacy callers, include 'initiated' so newly created incidents are immediately visible
      where.status = status === 'active' ? { in: ['active', 'initiated'] } : status;
    }

    if (min_casualties) {
      where.estimatedCasualties = { gte: parseInt(min_casualties) };
    } else if (
      (user.role === 'national' && !state_id && include_all_india !== 'true') ||
      national_only === 'true'
    ) {
      // National level default view: only major national disasters (>= 500 casualties affected)
      where.estimatedCasualties = { gte: 500 };
    }

    const [allEmergencies, facilityMap, allStates] = await Promise.all([
      prisma.emergency.findMany({
        where,
        include: {
          facility: true,
          district: true,
          state: true,
          activatedByUser: { select: { fullName: true } },
          confirmedByUser: { select: { fullName: true } },
          requirements: {
            select: {
              id: true,
              status: true,
              resourceType: true,
              quantityRequired: true,
              quantityConfirmed: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { estimatedCasualties: 'desc' }],
      }),
      buildFacilityLookup(prisma),
      prisma.state.findMany(),
    ]);

    const stateIdToCode = new Map<string, string>();
    for (const s of allStates) {
      stateIdToCode.set(s.id, s.code);
    }

    const viewerStateId =
      state_id || (user.role !== 'national' ? user.state_id : null) || null;
    const viewerStateCode = viewerStateId ? stateIdToCode.get(viewerStateId) : null;

    let filtered = allEmergencies;

    if (viewerStateId && include_all_india !== 'true') {
      const allowedStateCodes =
        strict_state_only === 'true'
          ? [viewerStateCode].filter(Boolean)
          : (viewerStateCode && ADJACENT_STATE_CORRIDORS[viewerStateCode]) || [viewerStateCode];

      filtered = allEmergencies.filter((e) => {
        const hierarchy = parseHospitalHierarchy(e);
        const primaryFac = hierarchy.primaryFacilityId
          ? facilityMap.get(hierarchy.primaryFacilityId)
          : null;
        const emStateId = e.stateId || primaryFac?.state_id;
        const emStateCode = e.state?.code || primaryFac?.state_code || stateIdToCode.get(emStateId);

        // 1. Direct state match
        if (emStateId === viewerStateId) return true;

        // 2. User's facility or any facility in viewer's state is designated (Primary, Secondary, or Supporting)
        if (user.facility_id && hierarchy.designatedFacilityIds.includes(user.facility_id)) {
          return true;
        }
        const anyDesignatedInViewerState = hierarchy.designatedFacilityIds.some(
          (fid) => facilityMap.get(fid)?.state_id === viewerStateId
        );
        if (anyDesignatedInViewerState) return true;

        // 3. Keyword match for Puducherry / Auroville / Kalapet enclaves
        const textBlob = `${e.title} ${e.location}`.toLowerCase();
        if (
          viewerStateCode === 'PY' &&
          (textBlob.includes('puducherry') ||
            textBlob.includes('pondicherry') ||
            textBlob.includes('kalapet') ||
            textBlob.includes('auroville') ||
            textBlob.includes('ozhukarai') ||
            textBlob.includes('karaikal') ||
            textBlob.includes('cuddalore') ||
            textBlob.includes('villupuram'))
        ) {
          return true;
        }

        // 4. Cross-border adjacent state/district mutual aid match (default enabled)
        if (strict_state_only !== 'true' && emStateCode && allowedStateCodes.includes(emStateCode)) {
          return true;
        }

        return false;
      });

      // Sort so local state emergencies appear first, followed by adjacent district cross-border emergencies
      filtered.sort((a, b) => {
        const aLocal = a.stateId === viewerStateId ? 0 : 1;
        const bLocal = b.stateId === viewerStateId ? 0 : 1;
        if (aLocal !== bLocal) return aLocal - bLocal;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return res.json(filtered.map((e) => enrichEmergencyResponse(e, facilityMap, viewerStateId)));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const [emergencies, facilityMap] = await Promise.all([
      prisma.emergency.findMany({
        include: { facility: true, state: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      buildFacilityLookup(prisma),
    ]);
    return res.json(emergencies.map((e) => enrichEmergencyResponse(e, facilityMap, user.state_id)));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const [emergency, facilityMap] = await Promise.all([
      prisma.emergency.findUnique({
        where: { id: req.params.id },
        include: {
          facility: true,
          district: true,
          state: true,
          activatedByUser: { select: { fullName: true } },
          confirmedByUser: { select: { fullName: true } },
          requirements: {
            include: {
              medicine: true,
              offers: { include: { facility: true } },
            },
          },
          movements: {
            include: {
              sourceFacility: true,
              destFacility: true,
              medicine: true,
            },
          },
        },
      }),
      buildFacilityLookup(prisma),
    ]);
    if (!emergency) return res.status(404).json({ error: 'Emergency not found' });
    return res.json(enrichEmergencyResponse(emergency, facilityMap, user.state_id));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const {
      title,
      emergency_type,
      location,
      severity,
      description,
      estimated_casualties,
      expected_duration_hours,
      facility_id,
      primary_facility_id,
      secondary_facility_id,
      supporting_facility_ids,
      district_id,
      state_id,
    } = req.body;

    if (!title || !emergency_type || !location || !severity) {
      return res.status(400).json({ error: 'title, emergency_type, location, severity required' });
    }

    const effectivePrimaryId = primary_facility_id || facility_id || user.facility_id || null;
    if (!effectivePrimaryId) {
      return res.status(400).json({ error: 'A Primary Hospital must be designated for the emergency.' });
    }

    const [primaryFacility, allStates] = await Promise.all([
      prisma.facility.findUnique({ where: { id: effectivePrimaryId } }),
      prisma.state.findMany(),
    ]);

    const naState = allStates.find((s) => s.code === 'NA');
    const pyState = allStates.find((s) => s.code === 'PY');
    const textBlob = `${title} ${location}`.toLowerCase();
    const isPuducherryIncident =
      textBlob.includes('puducherry') ||
      textBlob.includes('pondicherry') ||
      textBlob.includes('kalapet') ||
      textBlob.includes('auroville') ||
      textBlob.includes('ozhukarai') ||
      textBlob.includes('karaikal');

    // Prioritize the Primary Hospital's state (or Puducherry if location is in Puducherry), never 'NA'
    let effectiveStateId = primaryFacility?.stateId || state_id || user.state_id || '';
    if ((!effectiveStateId || effectiveStateId === naState?.id) && isPuducherryIncident && pyState) {
      effectiveStateId = pyState.id;
    } else if (primaryFacility?.stateId && primaryFacility.stateId !== naState?.id) {
      effectiveStateId = primaryFacility.stateId;
    }

    const effectiveDistrictId = primaryFacility?.districtId || district_id || null;

    const structuredDescription = serializeHospitalHierarchy(
      description || '',
      effectivePrimaryId,
      secondary_facility_id || null,
      Array.isArray(supporting_facility_ids) ? supporting_facility_ids : []
    );

    const emergency = await prisma.emergency.create({
      data: {
        title,
        emergencyType: emergency_type,
        location,
        facilityId: effectivePrimaryId,
        districtId: effectiveDistrictId,
        stateId: effectiveStateId,
        severity,
        description: structuredDescription,
        estimatedCasualties: Number(estimated_casualties) || 0,
        expectedDurationHours: expected_duration_hours ? Number(expected_duration_hours) : null,
        status: 'initiated',
        activatedBy: user.id,
        activatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMERGENCY_INITIATE',
        resourceType: 'emergency',
        resourceId: emergency.id,
        facilityId: effectivePrimaryId,
        details: JSON.stringify({
          title,
          emergency_type,
          severity,
          primary_facility_id: effectivePrimaryId,
          secondary_facility_id: secondary_facility_id || null,
          supporting_facility_ids: supporting_facility_ids || [],
        }),
        ipAddress: req.ip,
      },
    });

    const facilityMap = await buildFacilityLookup(prisma);
    return res.status(201).json(enrichEmergencyResponse(emergency, facilityMap, user.state_id));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update Designated Primary, Secondary, and Supporting Hospitals for an Emergency
router.put('/:id/hospitals', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { primary_facility_id, secondary_facility_id, supporting_facility_ids } = req.body;

    const emergency = await prisma.emergency.findUnique({ where: { id: req.params.id } });
    if (!emergency) return res.status(404).json({ error: 'Emergency not found' });

    if (!primary_facility_id) {
      return res.status(400).json({ error: 'Primary hospital is required' });
    }

    const currentHierarchy = parseHospitalHierarchy(emergency);
    const updatedDescription = serializeHospitalHierarchy(
      currentHierarchy.text,
      primary_facility_id,
      secondary_facility_id || null,
      Array.isArray(supporting_facility_ids) ? supporting_facility_ids : []
    );

    const updated = await prisma.emergency.update({
      where: { id: req.params.id },
      data: {
        facilityId: primary_facility_id,
        description: updatedDescription,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMERGENCY_HOSPITALS_UPDATE',
        resourceType: 'emergency',
        resourceId: emergency.id,
        facilityId: user.facility_id,
        details: JSON.stringify({
          primary_facility_id,
          secondary_facility_id,
          supporting_facility_ids,
        }),
        ipAddress: req.ip,
      },
    });

    const facilityMap = await buildFacilityLookup(prisma);
    return res.json(enrichEmergencyResponse(updated, facilityMap, user.state_id));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const emergency = await prisma.emergency.findUnique({
      where: { id: req.params.id },
      include: { state: true },
    });
    if (!emergency) return res.status(404).json({ error: 'Emergency not found' });
    if (emergency.status !== 'initiated') {
      return res.status(400).json({ error: `Cannot confirm emergency in status: ${emergency.status}` });
    }

    const updated = await prisma.emergency.update({
      where: { id: req.params.id },
      data: { status: 'active', confirmedBy: user.id, confirmedAt: new Date() },
    });

    // 1. Alert the primary state
    await prisma.alert.create({
      data: {
        stateId: emergency.stateId,
        alertType: 'emergency',
        severity: 'critical',
        title: `EMERGENCY ACTIVE: ${emergency.title}`,
        message: `Emergency response activated at ${emergency.location}. Severity: ${emergency.severity.toUpperCase()}.`,
        emergencyId: emergency.id,
      },
    });

    // 2. Alert adjacent states for Cross-Border District Mutual Aid (e.g. PY <-> TN)
    const allStates = await prisma.state.findMany();
    const primaryStateCode = emergency.state?.code || allStates.find((s) => s.id === emergency.stateId)?.code;
    if (primaryStateCode && ADJACENT_STATE_CORRIDORS[primaryStateCode]) {
      const adjacentCodes = ADJACENT_STATE_CORRIDORS[primaryStateCode].filter(
        (c) => c !== primaryStateCode
      );
      for (const adjCode of adjacentCodes.slice(0, 2)) {
        const adjState = allStates.find((s) => s.code === adjCode);
        if (adjState) {
          await prisma.alert.create({
            data: {
              stateId: adjState.id,
              alertType: 'emergency',
              severity: 'critical',
              title: `CROSS-BORDER MUTUAL AID: ${emergency.title}`,
              message: `Adjacent state incident at ${emergency.location}. Border district hospitals requested to assist with ambulances and medical supplies.`,
              emergencyId: emergency.id,
            },
          });
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMERGENCY_CONFIRM',
        resourceType: 'emergency',
        resourceId: emergency.id,
        ipAddress: req.ip,
      },
    });

    const facilityMap = await buildFacilityLookup(prisma);
    return res.json(enrichEmergencyResponse(updated, facilityMap, user.state_id));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id/load', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const { load_critical, load_serious, load_minor, load_deceased, load_unassessed } = req.body;
    const updated = await prisma.emergency.update({
      where: { id: req.params.id },
      data: {
        ...(load_critical !== undefined && { loadCritical: load_critical }),
        ...(load_serious !== undefined && { loadSerious: load_serious }),
        ...(load_minor !== undefined && { loadMinor: load_minor }),
        ...(load_deceased !== undefined && { loadDeceased: load_deceased }),
        ...(load_unassessed !== undefined && { loadUnassessed: load_unassessed }),
      },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/:id/requirements', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const {
      resource_type,
      medicine_id,
      blood_group,
      blood_component,
      description,
      quantity_required,
      priority,
      required_by,
    } = req.body;

    if (!resource_type || !quantity_required) {
      return res.status(400).json({ error: 'resource_type and quantity_required required' });
    }

    // STRICT VALIDATION: medicineId is ONLY saved if resource_type === 'medicine'!
    // For ambulance, staff, blood, medicineId MUST be null!
    const effectiveMedicineId = resource_type === 'medicine' ? (medicine_id || null) : null;
    const effectiveBloodGroup = resource_type === 'blood' ? (blood_group || null) : null;
    const effectiveBloodComponent = resource_type === 'blood' ? (blood_component || null) : null;

    const req_ = await prisma.emergencyRequirement.create({
      data: {
        emergencyId: req.params.id,
        resourceType: resource_type,
        medicineId: effectiveMedicineId,
        bloodGroup: effectiveBloodGroup,
        bloodComponent: effectiveBloodComponent,
        description: description || null,
        quantityRequired: quantity_required,
        priority: priority || 'urgent',
        requiredBy: required_by ? new Date(required_by) : null,
        createdBy: user.id,
      },
      include: { medicine: true },
    });
    return res.status(201).json(req_);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id/requirements', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const reqs = await prisma.emergencyRequirement.findMany({
      where: { emergencyId: req.params.id },
      include: { medicine: true, offers: { include: { facility: true } } },
      orderBy: { priority: 'desc' },
    });
    return res.json(
      reqs.map((r) => ({
        ...r,
        resource_type: r.resourceType,
        quantity_required: r.quantityRequired,
        quantity_confirmed: r.quantityConfirmed,
        medicine_name: r.medicine?.name || null,
        offer_count: r.offers.length,
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/requirements/:req_id/offer', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const {
      quantity_offered,
      available_from,
      available_until,
      deployment_time_minutes,
      ambulance_id,
      staff_id,
    } = req.body;

    const requirement = await prisma.emergencyRequirement.findUnique({
      where: { id: req.params.req_id },
      include: { emergency: true },
    });
    if (!requirement) return res.status(404).json({ error: 'Requirement not found' });

    const offeringFacilityId = user.facility_id || req.body.offering_facility_id;
    if (!offeringFacilityId) {
      return res.status(400).json({ error: 'offering_facility_id required' });
    }

    const hierarchy = parseHospitalHierarchy(requirement.emergency);
    if (hierarchy.designatedFacilityIds.includes(offeringFacilityId)) {
      return res.status(400).json({
        error:
          'Designated response hospitals (Primary, Secondary, or Supporting) are recipients for this emergency and cannot offer mutual aid to their own incident. External donor hospitals must fulfill this requisition.',
      });
    }

    let safeTransferableQty = null,
      protectedStock = null;
    if (requirement.resourceType === 'medicine' && requirement.medicineId) {
      const inv = await prisma.inventory.findUnique({
        where: {
          facilityId_medicineId: {
            facilityId: offeringFacilityId,
            medicineId: requirement.medicineId,
          },
        },
      });
      if (inv) {
        const p = Math.ceil(inv.avgDailyConsumption * inv.leadTimeDays * 1.5 + inv.reservedStock);
        const s = Math.max(0, inv.currentStock - p);
        protectedStock = p;
        safeTransferableQty = s;
        if (s < quantity_offered) {
          return res.status(400).json({
            error: `Insufficient safe transferable stock. Safe: ${s}`,
            safe_transferable: s,
            protected_stock: p,
            current_stock: inv.currentStock,
          });
        }
      }
    }

    const offer = await prisma.resourceOffer.create({
      data: {
        requirementId: requirement.id,
        emergencyId: requirement.emergencyId,
        offeringFacilityId,
        resourceType: requirement.resourceType,
        medicineId: requirement.medicineId,
        ambulanceId: ambulance_id || null,
        staffId: staff_id || null,
        quantityOffered: quantity_offered,
        availableFrom: available_from ? new Date(available_from) : null,
        availableUntil: available_until ? new Date(available_until) : null,
        deploymentTimeMinutes: deployment_time_minutes || null,
        safeTransferableQty,
        protectedStock,
        status: 'offered',
        offeredBy: user.id,
      },
    });

    if (ambulance_id) {
      await prisma.ambulance.update({
        where: { id: ambulance_id },
        data: { status: 'offered', assignedIncident: requirement.emergencyId },
      });
    }
    if (staff_id) {
      await prisma.medicalStaff.update({
        where: { id: staff_id },
        data: { status: 'offered', assignedIncident: requirement.emergencyId },
      });
    }

    return res.status(201).json(offer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// AUTHORIZED ONLY FOR DESIGNATED HOSPITALS (Primary, Secondary, Supporting)
router.post('/offers/:offer_id/accept', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const { quantity_accepted } = req.body;
    const offer = await prisma.resourceOffer.findUnique({
      where: { id: req.params.offer_id },
      include: { emergency: true },
    });
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const hierarchy = parseHospitalHierarchy(offer.emergency);
    const isAuthorizedHospital =
      user.facility_id && hierarchy.designatedFacilityIds.includes(user.facility_id);

    if (!isAuthorizedHospital) {
      return res.status(403).json({
        error:
          'Unauthorized: Only the designated Primary, Secondary, or Supporting hospitals for this emergency are authorized to Confirm & Accept incoming mutual aid offers.',
      });
    }

    const qty = quantity_accepted || offer.quantityOffered;

    if (offer.resourceType === 'medicine' && offer.medicineId) {
      await prisma.inventory.updateMany({
        where: {
          facilityId: offer.offeringFacilityId,
          medicineId: offer.medicineId,
        },
        data: { reservedStock: { increment: qty } },
      });
      await prisma.inventoryReservation.create({
        data: {
          facilityId: offer.offeringFacilityId,
          medicineId: offer.medicineId,
          quantity: qty,
          reason: 'Emergency resource reservation',
          referenceId: offer.emergencyId,
          referenceType: 'emergency',
          reservedBy: user.id,
        },
      });
    }

    await prisma.resourceOffer.update({
      where: { id: offer.id },
      data: {
        status: 'reserved',
        quantityAccepted: qty,
        acceptedBy: user.id,
        updatedAt: new Date(),
      },
    });

    const req_ = await prisma.emergencyRequirement.findUnique({ where: { id: offer.requirementId } });
    if (req_) {
      const newConfirmed = req_.quantityConfirmed + qty;
      await prisma.emergencyRequirement.update({
        where: { id: req_.id },
        data: {
          quantityConfirmed: newConfirmed,
          status: newConfirmed >= req_.quantityRequired ? 'fulfilled' : 'partially_fulfilled',
        },
      });
    }

    if (offer.ambulanceId) {
      await prisma.ambulance.update({ where: { id: offer.ambulanceId }, data: { status: 'reserved' } });
    }
    if (offer.staffId) {
      await prisma.medicalStaff.update({ where: { id: offer.staffId }, data: { status: 'reserved' } });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'RESOURCE_ACCEPT',
        resourceType: 'resource_offer',
        resourceId: offer.id,
        facilityId: user.facility_id,
        ipAddress: req.ip,
      },
    });

    return res.json({ message: 'Offer confirmed and resource reserved for designated response hospital' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/offers/:offer_id/dispatch', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const offer = await prisma.resourceOffer.findUnique({ where: { id: req.params.offer_id } });
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (!['reserved', 'accepted'].includes(offer.status)) {
      return res.status(400).json({ error: `Cannot dispatch in status: ${offer.status}` });
    }

    const emergency = await prisma.emergency.findUnique({ where: { id: offer.emergencyId } });
    const hierarchy = emergency ? parseHospitalHierarchy(emergency) : null;
    const destinationId =
      req.body.destination_facility_id ||
      hierarchy?.primaryFacilityId ||
      emergency?.facilityId;

    const qty = offer.quantityAccepted || offer.quantityOffered;
    await prisma.resourceMovement.create({
      data: {
        offerId: offer.id,
        requirementId: offer.requirementId,
        emergencyId: offer.emergencyId,
        sourceFacilityId: offer.offeringFacilityId,
        destinationFacilityId: destinationId!,
        resourceType: offer.resourceType,
        medicineId: offer.medicineId,
        quantityTransferred: qty,
        status: 'in_transit',
        dispatchedAt: new Date(),
        createdBy: user.id,
      },
    });

    if (offer.resourceType === 'medicine' && offer.medicineId) {
      await prisma.inventory.updateMany({
        where: {
          facilityId: offer.offeringFacilityId,
          medicineId: offer.medicineId,
        },
        data: {
          currentStock: { decrement: qty },
          reservedStock: { decrement: qty },
          lastUpdated: new Date(),
        },
      });
      await prisma.inventoryTransaction.create({
        data: {
          facilityId: offer.offeringFacilityId,
          medicineId: offer.medicineId,
          transactionType: 'transfer_out',
          quantity: -qty,
          referenceId: offer.emergencyId,
          referenceType: 'emergency',
          notes: 'Emergency dispatch',
          performedBy: user.id,
        },
      });
    }

    await prisma.resourceOffer.update({
      where: { id: offer.id },
      data: { status: 'dispatched', updatedAt: new Date() },
    });
    if (offer.ambulanceId) {
      await prisma.ambulance.update({ where: { id: offer.ambulanceId }, data: { status: 'dispatched' } });
    }
    if (offer.staffId) {
      await prisma.medicalStaff.update({ where: { id: offer.staffId }, data: { status: 'deployed' } });
    }

    return res.json({ message: 'Resources dispatched' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// CONFIRM & RECEIVE REQUESTED SUPPLIES — STRICTLY AUTHORIZED ONLY FOR DESIGNATED HOSPITALS (Primary, Secondary, Supporting)
router.post('/offers/:offer_id/receive', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    const offer = await prisma.resourceOffer.findUnique({
      where: { id: req.params.offer_id },
      include: { emergency: true },
    });
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (offer.status === 'received') {
      return res.status(400).json({ error: 'This offer has already been confirmed and received.' });
    }

    const hierarchy = parseHospitalHierarchy(offer.emergency);
    const isAuthorizedHospital =
      user.facility_id && hierarchy.designatedFacilityIds.includes(user.facility_id);

    if (!isAuthorizedHospital) {
      return res.status(403).json({
        error:
          'Unauthorized: Only the designated Primary, Secondary, or Supporting hospitals for this emergency are authorized to Confirm & Receive requested items.',
      });
    }

    const receivingFacilityId = user.facility_id!;
    const qty = offer.quantityAccepted || offer.quantityOffered;
    const wasAlreadyAccepted = ['reserved', 'accepted', 'dispatched'].includes(offer.status);
    const wasAlreadyDispatched = offer.status === 'dispatched';

    // If offer was still in 'offered' status, update requirement confirmed count
    if (!wasAlreadyAccepted) {
      const req_ = await prisma.emergencyRequirement.findUnique({ where: { id: offer.requirementId } });
      if (req_) {
        const newConfirmed = req_.quantityConfirmed + qty;
        await prisma.emergencyRequirement.update({
          where: { id: req_.id },
          data: {
            quantityConfirmed: newConfirmed,
            status: newConfirmed >= req_.quantityRequired ? 'fulfilled' : 'partially_fulfilled',
          },
        });
      }
    } else {
      // Check if requirement is now fulfilled
      const req_ = await prisma.emergencyRequirement.findUnique({ where: { id: offer.requirementId } });
      if (req_ && req_.quantityConfirmed >= req_.quantityRequired && req_.status !== 'fulfilled') {
        await prisma.emergencyRequirement.update({
          where: { id: req_.id },
          data: { status: 'fulfilled' },
        });
      }
    }

    // If not yet dispatched, deduct donor stock now
    if (!wasAlreadyDispatched && offer.resourceType === 'medicine' && offer.medicineId) {
      const donorInv = await prisma.inventory.findUnique({
        where: {
          facilityId_medicineId: {
            facilityId: offer.offeringFacilityId,
            medicineId: offer.medicineId,
          },
        },
      });
      if (donorInv) {
        await prisma.inventory.update({
          where: { id: donorInv.id },
          data: {
            currentStock: Math.max(0, donorInv.currentStock - qty),
            ...(wasAlreadyAccepted && { reservedStock: Math.max(0, donorInv.reservedStock - qty) }),
            lastUpdated: new Date(),
          },
        });
        await prisma.inventoryTransaction.create({
          data: {
            facilityId: offer.offeringFacilityId,
            medicineId: offer.medicineId,
            transactionType: 'transfer_out',
            quantity: -qty,
            referenceId: offer.emergencyId,
            referenceType: 'emergency',
            notes: `Emergency mutual aid transferred to designated hospital (${receivingFacilityId})`,
            performedBy: user.id,
          },
        });
      }
    }

    // Credit the receiving designated hospital's inventory if medicine
    if (offer.resourceType === 'medicine' && offer.medicineId) {
      const receiverInv = await prisma.inventory.findUnique({
        where: {
          facilityId_medicineId: {
            facilityId: receivingFacilityId,
            medicineId: offer.medicineId,
          },
        },
      });
      if (receiverInv) {
        await prisma.inventory.update({
          where: { id: receiverInv.id },
          data: {
            currentStock: { increment: qty },
            lastUpdated: new Date(),
          },
        });
      } else {
        await prisma.inventory.create({
          data: {
            facilityId: receivingFacilityId,
            medicineId: offer.medicineId,
            currentStock: qty,
            reorderLevel: 100,
            safetyThreshold: 50,
            avgDailyConsumption: 10,
            leadTimeDays: 2,
          },
        });
      }

      await prisma.inventoryTransaction.create({
        data: {
          facilityId: receivingFacilityId,
          medicineId: offer.medicineId,
          transactionType: 'transfer_in',
          quantity: qty,
          referenceId: offer.emergencyId,
          referenceType: 'emergency',
          notes: `Emergency supply confirmed & received from ${offer.offeringFacilityId}`,
          performedBy: user.id,
        },
      });
    }

    // Update or create ResourceMovement record as 'received'
    const existingMovement = await prisma.resourceMovement.findFirst({
      where: { offerId: offer.id },
    });
    if (existingMovement) {
      await prisma.resourceMovement.update({
        where: { id: existingMovement.id },
        data: {
          destinationFacilityId: receivingFacilityId,
          status: 'received',
          receivedAt: new Date(),
        },
      });
    } else {
      await prisma.resourceMovement.create({
        data: {
          offerId: offer.id,
          requirementId: offer.requirementId,
          emergencyId: offer.emergencyId,
          sourceFacilityId: offer.offeringFacilityId,
          destinationFacilityId: receivingFacilityId,
          resourceType: offer.resourceType,
          medicineId: offer.medicineId,
          quantityTransferred: qty,
          status: 'received',
          dispatchedAt: new Date(),
          receivedAt: new Date(),
          createdBy: user.id,
        },
      });
    }

    await prisma.resourceOffer.update({
      where: { id: offer.id },
      data: {
        status: 'received',
        quantityAccepted: qty,
        acceptedBy: offer.acceptedBy || user.id,
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'RESOURCE_CONFIRM_RECEIVE',
        resourceType: 'resource_offer',
        resourceId: offer.id,
        facilityId: receivingFacilityId,
        details: JSON.stringify({
          quantity_received: qty,
          resource_type: offer.resourceType,
          source_facility_id: offer.offeringFacilityId,
          receiving_facility_id: receivingFacilityId,
        }),
        ipAddress: req.ip,
      },
    });

    return res.json({
      message: 'Requested supplies confirmed and received into designated hospital inventory.',
      receiving_facility_id: receivingFacilityId,
      quantity_received: qty,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const prisma = getDb();
    const user = req.user!;
    await prisma.emergency.update({ where: { id: req.params.id }, data: { status: 'closed', closedAt: new Date() } });
    await prisma.ambulance.updateMany({
      where: { assignedIncident: req.params.id },
      data: { status: 'available', assignedIncident: null },
    });
    await prisma.medicalStaff.updateMany({
      where: { assignedIncident: req.params.id },
      data: { status: 'available', assignedIncident: null },
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMERGENCY_CLOSE',
        resourceType: 'emergency',
        resourceId: req.params.id,
        ipAddress: req.ip,
      },
    });
    return res.json({ message: 'Emergency closed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
