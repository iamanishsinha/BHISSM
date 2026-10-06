import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { getDb } from './connection';
import { getFacilitySector } from './geoData';

/**
 * MASTER DATABASE AUTO-PROVISIONING ENGINE
 * 
 * Ensures that whenever a facility, hospital, or health centre is added:
 * 1. Default Bed Capacities (General, ICU, Trauma, Ventilator) are automatically generated.
 * 2. Dedicated Ambulances (ALS & BLS) are automatically created.
 * 3. If hasBloodBank === 1, a Blood Bank and 8 Blood Group stocks are created.
 * 4. All 33 Essential Medicines are automatically provisioned in the inventory.
 * 5. A secure Command Login Node is automatically created in the users table.
 * 6. The single master database is automatically synced to api/bhissm.db for Vercel.
 */

export const MASTER_DB_PATH = path.resolve('backend/prisma/bhissm.db');
export const API_DB_PATH = path.resolve('api/bhissm.db');

export function syncMasterDatabaseFiles() {
  try {
    if (fs.existsSync(MASTER_DB_PATH) && fs.existsSync(path.dirname(API_DB_PATH))) {
      const masterStat = fs.statSync(MASTER_DB_PATH);
      if (masterStat.size > 0) {
        fs.copyFileSync(MASTER_DB_PATH, API_DB_PATH);
        console.log(`[MasterDB] Successfully synchronized master database (${masterStat.size} bytes) -> ${API_DB_PATH}`);
      }
    }
  } catch (err) {
    console.warn('[MasterDB] Sync warning:', err);
  }
}

export interface ProvisionFacilityOptions {
  customCredentials?: { username?: string; password?: string };
  initialBeds?: {
    general?: number;
    icu?: number;
    trauma?: number;
    ventilator?: number;
  };
  initialAmbulances?: {
    als?: number;
    bls?: number;
  };
}

export async function provisionFacility(
  facilityId: string,
  options?: ProvisionFacilityOptions | { username?: string; password?: string }
) {
  const prisma = getDb();

  const fac = await prisma.facility.findUnique({
    where: { id: facilityId },
    include: { state: true, district: true },
  });

  if (!fac) {
    throw new Error(`Facility not found: ${facilityId}`);
  }

  const now = new Date();
  const expDate = new Date(now.getTime() + 450 * 86400000);
  const stateCode = fac.state?.code || 'IN';

  // Normalize options
  const customCredentials =
    options && 'username' in options && !('customCredentials' in options)
      ? (options as { username?: string; password?: string })
      : (options as ProvisionFacilityOptions)?.customCredentials;
  const initialBeds = (options as ProvisionFacilityOptions)?.initialBeds;

  // 1. Ensure Sector is accurate
  const derivedSector = getFacilitySector(fac.type, fac.name);
  if (fac.sector !== derivedSector) {
    await prisma.facility.update({
      where: { id: fac.id },
      data: { sector: derivedSector },
    });
  }

  // 2. Automatically generate Bed Capacities if missing
  const existingCaps = await prisma.hospitalCapacity.findMany({ where: { facilityId: fac.id } });
  if (existingCaps.length === 0) {
    const isApex = fac.level === 'apex';
    const isState = fac.level === 'state';
    const isPhc = fac.level === 'phc';

    const totB = initialBeds?.general !== undefined ? initialBeds.general : (isApex ? 650 : isState ? 400 : isPhc ? 30 : 120);
    const icuB = initialBeds?.icu !== undefined ? initialBeds.icu : (isApex ? 60 : isState ? 35 : isPhc ? 2 : 12);
    const traB = initialBeds?.trauma !== undefined ? initialBeds.trauma : (isApex ? 40 : isState ? 25 : isPhc ? 2 : 8);
    const ventB = initialBeds?.ventilator !== undefined ? initialBeds.ventilator : (isApex ? 30 : isState ? 18 : isPhc ? 1 : 6);

    const defaultCapacities = [
      { careType: 'general', total: totB, occ: Math.round(totB * 0.78), res: Math.round(totB * 0.04) },
      { careType: 'icu', total: icuB, occ: Math.round(icuB * 0.8), res: Math.round(icuB * 0.05) },
      { careType: 'trauma', total: traB, occ: Math.round(traB * 0.7), res: Math.round(traB * 0.05) },
      { careType: 'ventilator', total: ventB, occ: Math.round(ventB * 0.75), res: Math.round(ventB * 0.05) },
    ];

    for (const c of defaultCapacities) {
      const avail = Math.max(0, c.total - c.occ - c.res);
      await prisma.hospitalCapacity.create({
        data: {
          facilityId: fac.id,
          careType: c.careType,
          totalBeds: c.total,
          availableBeds: avail,
          occupiedBeds: c.occ,
          reservedBeds: c.res,
          lastUpdated: now,
        },
      });
    }
  }

  // 3. Automatically generate Ambulances if missing
  const existingAmbs = await prisma.ambulance.findMany({ where: { facilityId: fac.id } });
  if (existingAmbs.length === 0) {
    const cleanPrefix = fac.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
    const amb1Reg = `${stateCode}01${cleanPrefix}101`;
    const amb2Reg = `${stateCode}01${cleanPrefix}102`;

    await prisma.ambulance.create({
      data: {
        facilityId: fac.id,
        registration: amb1Reg,
        ambulanceType: 'ALS',
        status: 'available',
        currentZone: `${fac.name.slice(0, 22)} Zone A`,
        deploymentTimeMinutes: 15,
        equipment: 'Defibrillator, Transport Ventilator, Syringe Pump, Oxygen',
      },
    });

    await prisma.ambulance.create({
      data: {
        facilityId: fac.id,
        registration: amb2Reg,
        ambulanceType: 'BLS',
        status: 'available',
        currentZone: `${fac.name.slice(0, 22)} Zone B`,
        deploymentTimeMinutes: 15,
        equipment: 'First Aid, Stretcher, Oxygen Cylinders',
      },
    });
  }

  // 4. Automatically generate Blood Bank if hasBloodBank === 1
  if (fac.hasBloodBank) {
    const existingBb = await prisma.bloodBank.findFirst({ where: { facilityId: fac.id } });
    if (!existingBb) {
      const cleanPrefix = fac.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase();
      const lic = `${stateCode}/BB/${cleanPrefix}/2022`;
      const bb = await prisma.bloodBank.create({
        data: {
          facilityId: fac.id,
          name: `${fac.name} Blood Transfusion Center`,
          type: 'government',
          licenseNumber: lic,
          isActive: 1,
        },
      });

      for (const bg of ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']) {
        await prisma.bloodInventory.create({
          data: {
            bloodBankId: bb.id,
            facilityId: fac.id,
            bloodGroup: bg,
            component: 'whole_blood',
            availableUnits: 40,
            reservedUnits: 5,
            collectionDate: now,
            expiryDate: expDate,
            status: 'available',
            lastUpdated: now,
          },
        });
      }
    }
  }

  // 5. Automatically provision all 33 Medicines into Inventory
  const allMeds = await prisma.medicine.findMany({ where: { isActive: 1 } });
  const existingInvs = await prisma.inventory.findMany({ where: { facilityId: fac.id } });
  const existingMedIds = new Set(existingInvs.map((i) => i.medicineId));

  const scale = fac.level === 'apex' ? 1.4 : fac.level === 'state' ? 1.0 : fac.level === 'phc' ? 0.35 : 0.7;

  for (const med of allMeds) {
    if (!existingMedIds.has(med.id)) {
      const stock = Math.round(3500 * scale);
      const safety = Math.round(600 * scale);

      const inv = await prisma.inventory.create({
        data: {
          facilityId: fac.id,
          medicineId: med.id,
          currentStock: stock,
          reservedStock: 0,
          safetyThreshold: safety,
          reorderLevel: safety * 2,
          avgDailyConsumption: 35,
          leadTimeDays: 5,
          emergencyLeadTimeDays: 2,
          supplier: 'BHISSM Central Supply Node',
          deliveryReliability: 0.98,
          lastUpdated: now,
        },
      });

      const cleanMedPrefix = med.name.slice(0, 3).toUpperCase();
      await prisma.inventoryBatch.create({
        data: {
          inventoryId: inv.id,
          facilityId: fac.id,
          medicineId: med.id,
          batchNumber: `LOT-${cleanMedPrefix}-${fac.id.slice(0, 4)}`,
          manufacturer: 'BHISSM Certified Medical Manufacturer',
          receivedDate: now,
          expiryDate: expDate,
          quantity: stock,
          reservedQuantity: 0,
          status: 'usable',
        },
      });
    }
  }

  // 6. Automatically provision Command Login User for this Facility
  const existingUser = await prisma.user.findFirst({ where: { facilityId: fac.id } });
  let userRecord = existingUser;

  if (!existingUser) {
    const slug = fac.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16).replace(/_+/g, '_').replace(/_$/, '');
    const defaultUsername = customCredentials?.username || `hospital_${slug}_01`;
    const defaultPassword = customCredentials?.password || `BHISSM@Demo#${stateCode}`;
    const hash = bcrypt.hashSync(defaultPassword, 10);

    userRecord = await prisma.user.create({
      data: {
        username: defaultUsername,
        passwordHash: hash,
        fullName: `${fac.name} Command Node`,
        role: 'hospital',
        facilityId: fac.id,
        stateId: fac.stateId,
      },
    });
  }

  // 7. Auto-synchronize master database file
  syncMasterDatabaseFiles();

  return {
    facility: fac,
    user: userRecord ? { username: userRecord.username, fullName: userRecord.fullName } : null,
  };
}

/**
 * Scan all facilities in master database and backfill any missing dependent records.
 */
export async function autoConsolidateMasterDatabase() {
  const prisma = getDb();
  console.log('[MasterDB] Verifying master database consolidation...');

  const facilities = await prisma.facility.findMany({
    where: { isActive: 1, type: { not: 'state_reserve' } },
    select: { id: true },
  });

  let provisionedCount = 0;
  for (const f of facilities) {
    const capCount = await prisma.hospitalCapacity.count({ where: { facilityId: f.id } });
    const invCount = await prisma.inventory.count({ where: { facilityId: f.id } });
    const userCount = await prisma.user.count({ where: { facilityId: f.id } });

    if (capCount === 0 || invCount === 0 || userCount === 0) {
      await provisionFacility(f.id);
      provisionedCount++;
    }
  }

  if (provisionedCount > 0) {
    console.log(`[MasterDB] Automatically provisioned ${provisionedCount} unprovisioned facilities.`);
  }

  syncMasterDatabaseFiles();
}

/**
 * Automatically distribute a newly added catalog medicine across all active facilities
 * with initial emergency baseline stock and lot batch.
 */
export async function provisionMedicineAcrossFacilities(medicineId: string, baselineUnits = 1000) {
  const prisma = getDb();
  const med = await prisma.medicine.findUnique({ where: { id: medicineId } });
  if (!med) throw new Error(`Medicine not found: ${medicineId}`);

  const facilities = await prisma.facility.findMany({
    where: { isActive: 1, type: { not: 'state_reserve' } },
    select: { id: true, level: true, name: true },
  });

  const now = new Date();
  const expDate = new Date(now.getTime() + 540 * 86400000);
  let distributedCount = 0;

  for (const fac of facilities) {
    const existing = await prisma.inventory.findFirst({
      where: { facilityId: fac.id, medicineId: med.id },
    });

    if (!existing) {
      const scale = fac.level === 'apex' ? 1.4 : fac.level === 'state' ? 1.0 : fac.level === 'phc' ? 0.35 : 0.7;
      const stock = Math.round(baselineUnits * scale);
      const safety = Math.round(stock * 0.2);

      const inv = await prisma.inventory.create({
        data: {
          facilityId: fac.id,
          medicineId: med.id,
          currentStock: stock,
          reservedStock: 0,
          safetyThreshold: safety,
          reorderLevel: safety * 2,
          avgDailyConsumption: 25,
          leadTimeDays: 5,
          emergencyLeadTimeDays: 2,
          supplier: 'BHISSM Central Supply Node',
          deliveryReliability: 0.98,
          lastUpdated: now,
        },
      });

      const cleanMedPrefix = med.name.slice(0, 3).toUpperCase();
      await prisma.inventoryBatch.create({
        data: {
          inventoryId: inv.id,
          facilityId: fac.id,
          medicineId: med.id,
          batchNumber: `LOT-${cleanMedPrefix}-${fac.id.slice(0, 4)}`,
          manufacturer: 'BHISSM Certified Medical Manufacturer',
          receivedDate: now,
          expiryDate: expDate,
          quantity: stock,
          reservedQuantity: 0,
          status: 'usable',
        },
      });

      distributedCount++;
    }
  }

  syncMasterDatabaseFiles();
  return { medicine: med, distributedCount };
}

