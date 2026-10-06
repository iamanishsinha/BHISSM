import bcrypt from 'bcryptjs';
import { getDb } from './connection';
import { ALL_STATES, ALL_DISTRICTS, ALL_HOSPITALS } from './geoData';
import { syncMasterDatabaseFiles } from './masterProvisioner';

const prisma = getDb();

export async function seed() {
  console.log('🌱 Seeding & synchronizing BHISSM Pan-India 36 States & UTs Reserve Stockpiles and Hospital Networks...');

  // ─── 1. States & Union Territories (28 States + 8 UTs + National) ───────────
  for (const s of ALL_STATES) {
    await prisma.state.upsert({
      where: { code: s.code },
      update: { name: s.name, type: s.type },
      create: { name: s.name, code: s.code, type: s.type },
    });
  }

  const states: Record<string, string> = {};
  const allStates = await prisma.state.findMany();
  for (const s of allStates) states[s.code] = s.id;

  // ─── 2. Districts Across All States & UTs ────────────────────────────────────
  for (const d of ALL_DISTRICTS) {
    const sId = states[d.state];
    if (!sId) continue;
    await prisma.district.upsert({
      where: { code: d.code },
      update: { name: d.name, stateId: sId },
      create: { name: d.name, code: d.code, stateId: sId },
    });
  }

  const districts: Record<string, string> = {};
  const allDistricts = await prisma.district.findMany();
  for (const d of allDistricts) districts[d.code] = d.id;

  // ─── 3. Facilities (2-4 Hospitals per State/UT + National Store) ────────────
  const facilityMap: Record<string, string> = {};

  for (const f of ALL_HOSPITALS) {
    const sId = states[f.state];
    if (!sId) continue;
    const dId = f.district ? districts[f.district] || null : null;

    let fac = await prisma.facility.findFirst({
      where: { name: f.name },
    });

    if (!fac) {
      fac = await prisma.facility.create({
        data: {
          name: f.name,
          type: f.type,
          level: f.level,
          districtId: dId,
          stateId: sId,
          address: f.address || `${f.name}, ${f.state}`,
          hasBloodBank: f.hasBloodBank,
          lat: f.lat,
          lng: f.lng,
          isActive: 1,
        },
      });
    } else {
      fac = await prisma.facility.update({
        where: { id: fac.id },
        data: {
          type: f.type,
          level: f.level,
          districtId: dId,
          stateId: sId,
          address: f.address || fac.address,
          hasBloodBank: f.hasBloodBank,
          lat: f.lat,
          lng: f.lng,
          isActive: 1,
        },
      });
    }
    facilityMap[f.key] = fac.id;
  }

  // ─── 4. State Medical Reserve Depots (1 Dedicated Depot for Each State & UT) ─
  const depotMap: Record<string, string> = {};

  for (const s of ALL_STATES) {
    if (s.code === 'NA') continue;
    const stateId = states[s.code];
    if (!stateId) continue;

    const depotName = `${s.name} ${s.type === 'ut' ? 'UT' : 'State'} Medical Reserve Depot`;
    let depot = await prisma.facility.findFirst({
      where: {
        stateId,
        OR: [{ level: 'state_reserve' }, { type: 'state_reserve' }],
      },
    });

    if (!depot) {
      depot = await prisma.facility.create({
        data: {
          name: depotName,
          type: 'state_reserve',
          level: 'state_reserve',
          stateId,
          address: `${s.name} Health Directorate Central Medical Warehouse`,
          hasBloodBank: 0,
          isActive: 1,
        },
      });
    } else {
      depot = await prisma.facility.update({
        where: { id: depot.id },
        data: {
          name: depotName,
          type: 'state_reserve',
          level: 'state_reserve',
          isActive: 1,
        },
      });
    }
    depotMap[s.code] = depot.id;
  }

  // ─── 5. Users & Command Logins (National, All 36 States/UTs, & Hospitals) ───
  const defaultPasswordHash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  const userData: Array<{
    username: string;
    password: string;
    fullName: string;
    role: string;
    facilityKey: string | null;
    stateCode: string;
  }> = [
    // 5.1 National Command
    {
      username: 'national_monitor_01',
      password: 'BHISSM@National#01',
      fullName: 'National Strategic Stockpile Monitor',
      role: 'national',
      facilityKey: 'NATIONAL_STORE',
      stateCode: 'NA',
    },
    {
      username: 'national_director_01',
      password: 'BHISSM@National#Dir01',
      fullName: 'National Health Logistics Directorate',
      role: 'national',
      facilityKey: 'NATIONAL_STORE',
      stateCode: 'NA',
    },
  ];

  // 5.2 State Command Admin for EVERY single State and UT (36 Admins)
  for (const s of ALL_STATES) {
    if (s.code === 'NA') continue;
    userData.push({
      username: `state_${s.code.toLowerCase()}_admin`,
      password: `BHISSM@State#${s.code}`,
      fullName: `${s.name} ${s.type === 'ut' ? 'UT' : 'State'} Health Command`,
      role: 'state',
      facilityKey: null,
      stateCode: s.code,
    });
  }

  // 5.3 Hospital Nodes for Key Testing Facilities Across States
  const hospitalUserDefs: Array<{
    username: string;
    password: string;
    facilityKey: string;
    fullName: string;
    stateCode: string;
  }> = [
    // Delhi
    { username: 'hospital_aiims_01', password: 'BHISSM@Demo#DL01', facilityKey: 'DL_AIIMS', fullName: 'AIIMS New Delhi Command Node', stateCode: 'DL' },
    { username: 'hospital_sjh_01', password: 'BHISSM@Demo#DL02', facilityKey: 'DL_SJH', fullName: 'Safdarjung Hospital Node', stateCode: 'DL' },
    // Uttar Pradesh
    { username: 'hospital_kgmu_01', password: 'BHISSM@Demo#UP01', facilityKey: 'UP_KGMU', fullName: 'KGMU Lucknow Command Node', stateCode: 'UP' },
    { username: 'hospital_rmlims_01', password: 'BHISSM@Demo#UP02', facilityKey: 'UP_RMLIMS', fullName: 'RMLIMS Lucknow Node', stateCode: 'UP' },
    // Maharashtra
    { username: 'hospital_kem_01', password: 'BHISSM@Demo#MH01', facilityKey: 'KEM_MUM', fullName: 'KEM Hospital Mumbai Command Node', stateCode: 'MH' },
    { username: 'hospital_jj_01', password: 'BHISSM@Demo#MH02', facilityKey: 'MH_JJ_MUM', fullName: 'Sir JJ Hospital Mumbai Node', stateCode: 'MH' },
    // Puducherry
    { username: 'hospital_jipmer_01', password: 'BHISSM@Demo#J01', facilityKey: 'JIPMER', fullName: 'JIPMER Apex Hospital Command Node', stateCode: 'PY' },
    { username: 'hospital_puducherry_01', password: 'BHISSM@Demo#P01', facilityKey: 'GH_PY', fullName: 'Government General Hospital Puducherry Node', stateCode: 'PY' },
    { username: 'hospital_igmcri_01', password: 'BHISSM@Demo#IGM01', facilityKey: 'IGMCRI_PY', fullName: 'IGMCRI Govt Medical College Node', stateCode: 'PY' },
    { username: 'hospital_pims_01', password: 'BHISSM@Demo#PIMS01', facilityKey: 'PIMS_PY', fullName: 'PIMS Kalapet Medical College Node', stateCode: 'PY' },
    { username: 'hospital_smvmch_01', password: 'BHISSM@Demo#SMV01', facilityKey: 'SMVMCH_PY', fullName: 'Sri Manakula Vinayagar SMVMCH Node', stateCode: 'PY' },
    { username: 'hospital_rggwch_01', password: 'BHISSM@Demo#RGW01', facilityKey: 'RGGWCH_PY', fullName: 'Rajiv Gandhi Govt Women & Children Hospital Node', stateCode: 'PY' },
    { username: 'hospital_eastcoast_01', password: 'BHISSM@Demo#ECH01', facilityKey: 'EAST_COAST_PY', fullName: 'East Coast Multi-Specialty Hospital Node', stateCode: 'PY' },
    { username: 'hospital_auroville_01', password: 'BHISSM@Demo#AV01', facilityKey: 'AUROVILLE_HC', fullName: 'Auroville Health Centre Node', stateCode: 'PY' },
    // Tamil Nadu & Regional Corridor
    { username: 'hospital_rajivgandhi_01', password: 'BHISSM@Demo#TN02', facilityKey: 'RAJIV_CHN', fullName: 'Rajiv Gandhi Govt General Hospital Node', stateCode: 'TN' },
    { username: 'hospital_stanley_01', password: 'BHISSM@Demo#TN01', facilityKey: 'STANLEY_CHN', fullName: 'Govt Stanley Medical College Hospital Node', stateCode: 'TN' },
    { username: 'hospital_mh_chennai_01', password: 'BHISSM@Demo#MH01', facilityKey: 'MILITARY_HOSP_CHN', fullName: 'Military Hospital Chennai (Defence) Command Node', stateCode: 'TN' },
    { username: 'hospital_railway_perambur_01', password: 'BHISSM@Demo#SR01', facilityKey: 'RAILWAY_HOSP_PER', fullName: 'Southern Railway HQ Hospital Perambur Node', stateCode: 'TN' },
    { username: 'hospital_apollo_chennai_01', password: 'BHISSM@Demo#APO01', facilityKey: 'APOLLO_MAIN_CHN', fullName: 'Apollo Hospitals Main Greams Road Node', stateCode: 'TN' },
    { username: 'hospital_miot_chennai_01', password: 'BHISSM@Demo#MIOT01', facilityKey: 'MIOT_INTERNATIONAL', fullName: 'MIOT International Multi-Speciality Node', stateCode: 'TN' },
    { username: 'hospital_esic_kknagar_01', password: 'BHISSM@Demo#ESI01', facilityKey: 'ESIC_KKNAGAR', fullName: 'ESIC Super Specialty Hospital K.K. Nagar Node', stateCode: 'TN' },
    { username: 'hospital_villupuram_01', password: 'BHISSM@Demo#V01', facilityKey: 'GH_VLR', fullName: 'Villupuram Govt Medical College Hospital Node', stateCode: 'TN' },
    { username: 'hospital_slims_01', password: 'BHISSM@Demo#SLM01', facilityKey: 'SLIMS_OSUDU', fullName: 'Sri Lakshmi Narayana SLIMS Medical College Node', stateCode: 'TN' },
    { username: 'hospital_tindivanam_01', password: 'BHISSM@Demo#TIN01', facilityKey: 'GH_TINDIVANAM', fullName: 'Tindivanam District HQ Hospital Node', stateCode: 'TN' },
    { username: 'hospital_cuddalore_01', password: 'BHISSM@Demo#C01', facilityKey: 'GH_CDL', fullName: 'Cuddalore District General Hospital Node', stateCode: 'TN' },
    { username: 'hospital_rmmch_01', password: 'BHISSM@Demo#RMM01', facilityKey: 'RMMCH_CHIDAMBARAM', fullName: 'Rajah Muthiah GMC Chidambaram Node', stateCode: 'TN' },
    { username: 'hospital_stjoseph_01', password: 'BHISSM@Demo#STJ01', facilityKey: 'ST_JOSEPH_CDL', fullName: "St. Joseph's Multi Speciality Hospital Node", stateCode: 'TN' },
    { username: 'hospital_panruti_01', password: 'BHISSM@Demo#PAN01', facilityKey: 'GH_PANRUTI', fullName: 'Panruti Government Taluk Hospital Node', stateCode: 'TN' },
    { username: 'hospital_santigiri_01', password: 'BHISSM@Demo#AV02', facilityKey: 'AUROVILLE_SANTIGIRI', fullName: 'Santigiri Healing Centre Node', stateCode: 'TN' },
    // Karnataka
    { username: 'hospital_victoria_01', password: 'BHISSM@Demo#KA01', facilityKey: 'VICTORIA_BLR', fullName: 'Victoria Hospital Bengaluru Command Node', stateCode: 'KA' },
    { username: 'hospital_bowring_01', password: 'BHISSM@Demo#KA02', facilityKey: 'BOWRING_BLR', fullName: 'Bowring & Lady Curzon Hospital Node', stateCode: 'KA' },
    // Kerala
    { username: 'hospital_gmct_01', password: 'BHISSM@Demo#KL01', facilityKey: 'GMC_TVM', fullName: 'Govt Medical College Thiruvananthapuram Node', stateCode: 'KL' },
    // Andhra Pradesh
    { username: 'hospital_kgh_01', password: 'BHISSM@Demo#AP01', facilityKey: 'KGH_VSP', fullName: 'King George Hospital Visakhapatnam Node', stateCode: 'AP' },
    // Telangana
    { username: 'hospital_osmania_01', password: 'BHISSM@Demo#TG01', facilityKey: 'TG_OSMANIA', fullName: 'Osmania General Hospital Hyderabad Node', stateCode: 'TG' },
    // Gujarat
    { username: 'hospital_civil_ahm_01', password: 'BHISSM@Demo#GJ01', facilityKey: 'GJ_CIVIL_AHM', fullName: 'Civil Hospital Ahmedabad Node', stateCode: 'GJ' },
    // Rajasthan
    { username: 'hospital_sms_01', password: 'BHISSM@Demo#RJ01', facilityKey: 'RJ_SMS_JAI', fullName: 'SMS Medical College Hospital Jaipur Node', stateCode: 'RJ' },
    // West Bengal
    { username: 'hospital_calcutta_mc_01', password: 'BHISSM@Demo#WB01', facilityKey: 'WB_CMC', fullName: 'Calcutta Medical College Hospital Node', stateCode: 'WB' },
    // Bihar
    { username: 'hospital_pmch_01', password: 'BHISSM@Demo#BR01', facilityKey: 'BR_PMCH', fullName: 'Patna Medical College Hospital Node', stateCode: 'BR' },
    // Madhya Pradesh
    { username: 'hospital_hamidia_01', password: 'BHISSM@Demo#MP01', facilityKey: 'MP_HAMIDIA', fullName: 'Hamidia Hospital Bhopal Node', stateCode: 'MP' },
    // Odisha
    { username: 'hospital_scb_01', password: 'BHISSM@Demo#OD01', facilityKey: 'OD_SCB_CTC', fullName: 'SCB Medical College Hospital Cuttack Node', stateCode: 'OD' },
    // Assam
    { username: 'hospital_gmch_01', password: 'BHISSM@Demo#AS01', facilityKey: 'AS_GMCH', fullName: 'Gauhati Medical College Hospital Node', stateCode: 'AS' },
    // Chandigarh
    { username: 'hospital_pgimer_01', password: 'BHISSM@Demo#CH01', facilityKey: 'CH_PGIMER', fullName: 'PGIMER Chandigarh Apex Node', stateCode: 'CH' },
    // Jammu & Kashmir
    { username: 'hospital_gmc_jammu_01', password: 'BHISSM@Demo#JK01', facilityKey: 'JK_GMC_JAM', fullName: 'GMC Hospital Jammu Node', stateCode: 'JK' },
    // Uttarakhand
    { username: 'hospital_doon_01', password: 'BHISSM@Demo#UK01', facilityKey: 'UK_DOON', fullName: 'Govt Doon Hospital Dehradun Node', stateCode: 'UK' },
  ];

  for (const h of hospitalUserDefs) {
    userData.push({
      username: h.username,
      password: h.password,
      fullName: h.fullName,
      role: 'hospital',
      facilityKey: h.facilityKey,
      stateCode: h.stateCode,
    });
  }

  for (const u of userData) {
    const hash = defaultPasswordHash(u.password);
    const facId = u.facilityKey ? facilityMap[u.facilityKey] || null : null;
    const sId = states[u.stateCode] || null;

    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        passwordHash: hash,
        fullName: u.fullName,
        role: u.role,
        facilityId: facId,
        stateId: sId,
      },
      create: {
        username: u.username,
        passwordHash: hash,
        fullName: u.fullName,
        role: u.role,
        facilityId: facId,
        stateId: sId,
      },
    });
  }

  // ─── 6. 33 Essential Medicines & Vaccines Catalog ──────────────────────────
  const medicineData = [
    // Antibiotics (10)
    { key: 'AZITH500', name: 'Azithromycin 500mg', genericName: 'Azithromycin Dihydrate', strength: '500mg', dosageForm: 'tablet', category: 'antibiotic', unitType: 'tablet', criticality: 'high', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'AZITH250', name: 'Azithromycin 250mg', genericName: 'Azithromycin Dihydrate', strength: '250mg', dosageForm: 'capsule', category: 'antibiotic', unitType: 'capsule', criticality: 'standard', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'AMOX500', name: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate', strength: '500mg', dosageForm: 'capsule', category: 'antibiotic', unitType: 'capsule', criticality: 'high', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'AUGM625', name: 'Amoxiclav 625mg (Amoxicillin + Clavulanate)', genericName: 'Co-Amoxiclav', strength: '625mg', dosageForm: 'tablet', category: 'antibiotic', unitType: 'tablet', criticality: 'high', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'CEFTR1G', name: 'Ceftriaxone 1g IV Injection', genericName: 'Ceftriaxone Sodium', strength: '1g/vial', dosageForm: 'injection', category: 'antibiotic', unitType: 'vial', criticality: 'critical', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'CIPRO500', name: 'Ciprofloxacin 500mg', genericName: 'Ciprofloxacin HCl', strength: '500mg', dosageForm: 'tablet', category: 'antibiotic', unitType: 'tablet', criticality: 'high', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'DOXY100', name: 'Doxycycline 100mg', genericName: 'Doxycycline Hyclate', strength: '100mg', dosageForm: 'capsule', category: 'antibiotic', unitType: 'capsule', criticality: 'standard', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'METRO400', name: 'Metronidazole 400mg', genericName: 'Metronidazole', strength: '400mg', dosageForm: 'tablet', category: 'antibiotic', unitType: 'tablet', criticality: 'standard', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'MEROP1G', name: 'Meropenem 1g IV Injection', genericName: 'Meropenem Trihydrate', strength: '1g/vial', dosageForm: 'injection', category: 'antibiotic', unitType: 'vial', criticality: 'critical', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'VANCO500', name: 'Vancomycin 500mg IV Injection', genericName: 'Vancomycin HCl', strength: '500mg', dosageForm: 'injection', category: 'antibiotic', unitType: 'vial', criticality: 'critical', storageRequirement: 'room_temperature', isVaccine: 0 },

    // Emergency & Resuscitation Fluids / Critical Care (9)
    { key: 'ORS', name: 'ORS Sachet (WHO Formula)', genericName: 'Oral Rehydration Salts', strength: '20.5g/sachet', dosageForm: 'sachet', category: 'emergency', unitType: 'sachet', criticality: 'critical', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'RINGER', name: "Ringer's Lactate 500ml IV", genericName: 'Compound Sodium Lactate', strength: '500ml', dosageForm: 'infusion', category: 'emergency', unitType: 'bottle', criticality: 'critical', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'SALINE', name: 'Normal Saline 0.9% 500ml IV', genericName: 'Sodium Chloride 0.9%', strength: '500ml', dosageForm: 'infusion', category: 'emergency', unitType: 'bottle', criticality: 'critical', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'DNS500', name: 'Dextrose Normal Saline (DNS) 500ml', genericName: 'Dextrose 5% + NaCl 0.9%', strength: '500ml', dosageForm: 'infusion', category: 'emergency', unitType: 'bottle', criticality: 'high', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'ADRENA', name: 'Adrenaline 1mg/ml Injection', genericName: 'Epinephrine Bitartrate', strength: '1mg/ml', dosageForm: 'injection', category: 'emergency', unitType: 'ampoule', criticality: 'critical', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'ATROP', name: 'Atropine Sulphate 0.6mg/ml', genericName: 'Atropine Sulphate', strength: '0.6mg/ml', dosageForm: 'injection', category: 'emergency', unitType: 'ampoule', criticality: 'critical', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'DEXMETH', name: 'Dexamethasone 4mg/ml Injection', genericName: 'Dexamethasone Sodium Phosphate', strength: '4mg/ml', dosageForm: 'injection', category: 'emergency', unitType: 'ampoule', criticality: 'critical', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'HYDRO100', name: 'Hydrocortisone 100mg IV Injection', genericName: 'Hydrocortisone Sodium Succinate', strength: '100mg', dosageForm: 'injection', category: 'emergency', unitType: 'vial', criticality: 'critical', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'ASV_POLY', name: 'Anti-Snake Venom (ASV) Polyvalent', genericName: 'Snake Venom Antiserum', strength: '10ml Lyophilized', dosageForm: 'injection', category: 'emergency', unitType: 'vial', criticality: 'critical', storageRequirement: 'cold_chain', isVaccine: 0 },

    // Analgesics, GI & Respiratory (5)
    { key: 'PARA500', name: 'Paracetamol 500mg', genericName: 'Acetaminophen', strength: '500mg', dosageForm: 'tablet', category: 'analgesic', unitType: 'tablet', criticality: 'high', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'DICLO50', name: 'Diclofenac Sodium 50mg', genericName: 'Diclofenac Sodium', strength: '50mg', dosageForm: 'tablet', category: 'analgesic', unitType: 'tablet', criticality: 'standard', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'MORPH', name: 'Morphine Sulphate 10mg/ml', genericName: 'Morphine Sulphate', strength: '10mg/ml', dosageForm: 'injection', category: 'analgesic', unitType: 'ampoule', criticality: 'critical', storageRequirement: 'controlled', isVaccine: 0 },
    { key: 'PANT40', name: 'Pantoprazole 40mg IV/Tablet', genericName: 'Pantoprazole Sodium', strength: '40mg', dosageForm: 'tablet', category: 'analgesic', unitType: 'tablet', criticality: 'standard', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'ONDAN4', name: 'Ondansetron 4mg Injection', genericName: 'Ondansetron HCl', strength: '4mg/2ml', dosageForm: 'injection', category: 'emergency', unitType: 'ampoule', criticality: 'high', storageRequirement: 'room_temperature', isVaccine: 0 },

    // Cardiac & Diabetes (5)
    { key: 'INS_REG', name: 'Insulin Regular (Human) 100 IU/ml', genericName: 'Recombinant Human Insulin', strength: '100 IU/ml', dosageForm: 'injection', category: 'diabetes', unitType: 'vial', criticality: 'critical', storageRequirement: 'cold_chain', isVaccine: 0 },
    { key: 'METFOR500', name: 'Metformin Hydrochloride 500mg', genericName: 'Metformin HCl', strength: '500mg', dosageForm: 'tablet', category: 'diabetes', unitType: 'tablet', criticality: 'high', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'AMLOD5', name: 'Amlodipine Besylate 5mg', genericName: 'Amlodipine', strength: '5mg', dosageForm: 'tablet', category: 'cardiac', unitType: 'tablet', criticality: 'high', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'ATORVA20', name: 'Atorvastatin 20mg', genericName: 'Atorvastatin Calcium', strength: '20mg', dosageForm: 'tablet', category: 'cardiac', unitType: 'tablet', criticality: 'standard', storageRequirement: 'room_temperature', isVaccine: 0 },
    { key: 'FURO40', name: 'Furosemide 40mg (Lasix)', genericName: 'Furosemide', strength: '40mg', dosageForm: 'tablet', category: 'cardiac', unitType: 'tablet', criticality: 'high', storageRequirement: 'room_temperature', isVaccine: 0 },

    // Vaccines (4)
    { key: 'POLIO_VAC', name: 'Oral Polio Vaccine (bOPV)', genericName: 'Poliovirus Vaccine Live Oral', strength: '20 doses/vial', dosageForm: 'drops', category: 'vaccine', unitType: 'vial', criticality: 'critical', storageRequirement: 'cold_chain', isVaccine: 1 },
    { key: 'MEASLES_VAC', name: 'Measles-Rubella (MR) Vaccine', genericName: 'Live Attenuated MR Vaccine', strength: '10 doses/vial', dosageForm: 'injection', category: 'vaccine', unitType: 'vial', criticality: 'critical', storageRequirement: 'cold_chain', isVaccine: 1 },
    { key: 'HEPA_VAC', name: 'Hepatitis B Vaccine (rDNA)', genericName: 'Hepatitis B Surface Antigen', strength: '10ml/vial', dosageForm: 'injection', category: 'vaccine', unitType: 'vial', criticality: 'critical', storageRequirement: 'cold_chain', isVaccine: 1 },
    { key: 'TT_VAC', name: 'Tetanus Toxoid (TT) Vaccine', genericName: 'Tetanus Vaccine Adsorbed', strength: '5ml/vial', dosageForm: 'injection', category: 'vaccine', unitType: 'vial', criticality: 'high', storageRequirement: 'cold_chain', isVaccine: 1 },
  ];

  const medicineMap: Record<string, string> = {};
  for (const m of medicineData) {
    let med = await prisma.medicine.findFirst({ where: { name: m.name } });
    if (!med) {
      med = await prisma.medicine.create({
        data: {
          name: m.name,
          genericName: m.genericName,
          strength: m.strength,
          dosageForm: m.dosageForm,
          category: m.category,
          unitType: m.unitType,
          criticality: m.criticality,
          storageRequirement: m.storageRequirement,
          isVaccine: m.isVaccine,
        },
      });
    }
    medicineMap[m.key] = med.id;
  }

  const allMeds = await prisma.medicine.findMany({ where: { isActive: 1 } });

  // ─── 7. Provision ALL 36 State & UT Reserve Depots with Baseline Stockpiles ──
  console.log('📦 Provisioning State Medical Reserve Depots across all 36 States & UTs...');
  const now = new Date();
  const expDate = new Date(now.getTime() + 450 * 86400000);

  for (const [code, depotId] of Object.entries(depotMap)) {
    const stateObj = ALL_STATES.find((s) => s.code === code);
    if (!stateObj) continue;

    const existingInvs = await prisma.inventory.findMany({ where: { facilityId: depotId } });
    const existingMedIds = new Set(existingInvs.map((i) => i.medicineId));

    for (const med of allMeds) {
      const baseStock = med.criticality === 'critical' ? 12000 : med.criticality === 'high' ? 8000 : 5000;

      if (!existingMedIds.has(med.id)) {
        const inv = await prisma.inventory.create({
          data: {
            facilityId: depotId,
            medicineId: med.id,
            currentStock: baseStock,
            reservedStock: 0,
            safetyThreshold: 1000,
            reorderLevel: 1500,
            avgDailyConsumption: 50,
            leadTimeDays: 5,
            emergencyLeadTimeDays: 2,
            supplier: 'Central Strategic Medical Services Corporation',
            deliveryReliability: 0.98,
          },
        });

        await prisma.inventoryBatch.create({
          data: {
            inventoryId: inv.id,
            facilityId: depotId,
            medicineId: med.id,
            batchNumber: `SR-${code}-${med.name.slice(0, 3).toUpperCase()}-01`,
            manufacturer: `${stateObj.name} State Reserve Stockpile`,
            receivedDate: now,
            expiryDate: expDate,
            quantity: baseStock,
            reservedQuantity: 0,
            storageLocation: med.isVaccine ? 'State Cold-Chain Vault (2-8°C)' : 'State Reserve Bay A',
            status: 'usable',
          },
        });
      } else {
        const inv = existingInvs.find((i) => i.medicineId === med.id);
        if (inv && inv.currentStock < 1000) {
          await prisma.inventory.update({
            where: { id: inv.id },
            data: { currentStock: baseStock },
          });
        }
      }
    }
  }

  // ─── 8. Provision Hospital Inventories & FEFO Batches Across All Hospitals ──
  console.log('🏥 Provisioning Essential Inventories, Batches, Capacities & Ambulances across 100+ Hospitals...');

  const baselineTemplates = [
    { key: 'AZITH500', baseStock: 6500, safety: 1200, avgDaily: 90, lead: 7, mfr: 'Cipla Ltd' },
    { key: 'AMOX500', baseStock: 9000, safety: 1500, avgDaily: 120, lead: 8, mfr: 'Alkem Labs' },
    { key: 'AUGM625', baseStock: 4500, safety: 1000, avgDaily: 80, lead: 8, mfr: 'GSK India' },
    { key: 'CEFTR1G', baseStock: 2800, safety: 700, avgDaily: 55, lead: 5, mfr: 'Lupin Ltd' },
    { key: 'CIPRO500', baseStock: 6200, safety: 1100, avgDaily: 75, lead: 7, mfr: 'Sun Pharma' },
    { key: 'MEROP1G', baseStock: 500, safety: 150, avgDaily: 14, lead: 5, mfr: 'Cipla Criticare' },
    { key: 'VANCO500', baseStock: 400, safety: 120, avgDaily: 10, lead: 6, mfr: 'Viatris' },
    { key: 'ORS', baseStock: 12000, safety: 2000, avgDaily: 180, lead: 4, mfr: 'FDC Electral' },
    { key: 'RINGER', baseStock: 4200, safety: 800, avgDaily: 75, lead: 5, mfr: 'Baxter India' },
    { key: 'SALINE', baseStock: 5500, safety: 1000, avgDaily: 95, lead: 5, mfr: 'Fresenius Kabi' },
    { key: 'DNS500', baseStock: 3000, safety: 600, avgDaily: 50, lead: 5, mfr: 'Baxter India' },
    { key: 'ADRENA', baseStock: 450, safety: 100, avgDaily: 8, lead: 5, mfr: 'Neon Labs' },
    { key: 'ATROP', baseStock: 380, safety: 80, avgDaily: 7, lead: 5, mfr: 'Neon Labs' },
    { key: 'DEXMETH', baseStock: 1500, safety: 350, avgDaily: 30, lead: 6, mfr: 'Zydus Cadila' },
    { key: 'HYDRO100', baseStock: 800, safety: 200, avgDaily: 18, lead: 6, mfr: 'Abbott India' },
    { key: 'ASV_POLY', baseStock: 160, safety: 50, avgDaily: 3, lead: 10, mfr: 'Bharat Serums' },
    { key: 'PARA500', baseStock: 20000, safety: 3500, avgDaily: 280, lead: 5, mfr: 'Micro Labs' },
    { key: 'DICLO50', baseStock: 7000, safety: 1200, avgDaily: 90, lead: 6, mfr: 'Novartis' },
    { key: 'MORPH', baseStock: 280, safety: 80, avgDaily: 5, lead: 12, mfr: 'Verve Healthcare' },
    { key: 'PANT40', baseStock: 9500, safety: 1800, avgDaily: 120, lead: 6, mfr: 'Alkem' },
    { key: 'ONDAN4', baseStock: 3600, safety: 700, avgDaily: 45, lead: 6, mfr: 'Cipla' },
    { key: 'INS_REG', baseStock: 750, safety: 180, avgDaily: 14, lead: 9, mfr: 'Biocon' },
    { key: 'METFOR500', baseStock: 14000, safety: 2500, avgDaily: 170, lead: 7, mfr: 'USV' },
    { key: 'AMLOD5', baseStock: 11000, safety: 2000, avgDaily: 140, lead: 7, mfr: 'Pfizer' },
    { key: 'ATORVA20', baseStock: 8500, safety: 1500, avgDaily: 100, lead: 7, mfr: 'Lupin' },
    { key: 'FURO40', baseStock: 3800, safety: 700, avgDaily: 45, lead: 6, mfr: 'Sanofi' },
    { key: 'POLIO_VAC', baseStock: 1800, safety: 350, avgDaily: 25, lead: 10, mfr: 'Serum Institute' },
    { key: 'MEASLES_VAC', baseStock: 1200, safety: 250, avgDaily: 18, lead: 10, mfr: 'Serum Institute' },
    { key: 'HEPA_VAC', baseStock: 1500, safety: 300, avgDaily: 20, lead: 10, mfr: 'Bharat Biotech' },
    { key: 'TT_VAC', baseStock: 2200, safety: 400, avgDaily: 30, lead: 8, mfr: 'Biological E' },
  ];

  for (const h of ALL_HOSPITALS) {
    if (h.key === 'NATIONAL_STORE') continue;
    const facId = facilityMap[h.key];
    if (!facId) continue;

    const existingInvs = await prisma.inventory.findMany({ where: { facilityId: facId } });
    const existingMedIds = new Set(existingInvs.map((i) => i.medicineId));

    // Scale inventory based on hospital tier
    const scale = h.level === 'apex' ? 1.4 : h.level === 'state' ? 1.0 : 0.7;

    for (let idx = 0; idx < baselineTemplates.length; idx++) {
      const tpl = baselineTemplates[idx];
      const medId = medicineMap[tpl.key];
      if (!medId) continue;

      if (!existingMedIds.has(medId)) {
        const safety = Math.round(tpl.safety * scale);
        // Introduce small deficits on 2 medicines to show active reorder & redistribution alerts
        const isDeficit = idx === 5 || idx === 15;
        const stock = isDeficit ? Math.round(safety * 0.65) : Math.round(tpl.baseStock * scale);
        const reorder = Math.round(safety * 2.2);
        const avgDaily = Math.max(2, Math.round(tpl.avgDaily * scale));

        const inv = await prisma.inventory.create({
          data: {
            facilityId: facId,
            medicineId: medId,
            currentStock: stock,
            safetyThreshold: safety,
            reorderLevel: reorder,
            avgDailyConsumption: avgDaily,
            leadTimeDays: tpl.lead,
            supplier: `${h.state} State Health Logistics`,
          },
        });

        // 2 Batches per medicine for realistic FEFO rotation
        const q1 = Math.round(stock * 0.4);
        const q2 = stock - q1;
        const exp1 = idx % 4 === 0 ? new Date(Date.now() + 24 * 86400000) : new Date('2026-11-30');
        const exp2 = new Date('2027-07-31');

        await prisma.inventoryBatch.createMany({
          data: [
            {
              inventoryId: inv.id,
              facilityId: facId,
              medicineId: medId,
              batchNumber: `LOT-${tpl.key.slice(0, 4)}-${h.key.slice(0, 3)}-A`,
              manufacturer: tpl.mfr,
              receivedDate: new Date('2025-01-20'),
              expiryDate: exp1,
              quantity: q1,
              status: 'usable',
            },
            {
              inventoryId: inv.id,
              facilityId: facId,
              medicineId: medId,
              batchNumber: `LOT-${tpl.key.slice(0, 4)}-${h.key.slice(0, 3)}-B`,
              manufacturer: tpl.mfr,
              receivedDate: new Date('2025-03-01'),
              expiryDate: exp2,
              quantity: q2,
              status: 'usable',
            },
          ],
        });
      }
    }

    // Hospital Capacity Beds
    const totalBeds = h.level === 'apex' ? 650 : h.level === 'state' ? 400 : h.level === 'phc' ? 30 : 120;
    const icuBeds = h.level === 'apex' ? 60 : h.level === 'state' ? 35 : h.level === 'phc' ? 2 : 12;
    const traumaBeds = h.level === 'apex' ? 40 : h.level === 'state' ? 25 : h.level === 'phc' ? 2 : 8;
    const ventBeds = h.level === 'apex' ? 30 : h.level === 'state' ? 18 : h.level === 'phc' ? 1 : 6;

    const capacities = [
      { type: 'general', total: totalBeds, avail: Math.round(totalBeds * 0.18), occ: Math.round(totalBeds * 0.78), res: Math.round(totalBeds * 0.04) },
      { type: 'icu', total: icuBeds, avail: Math.round(icuBeds * 0.15), occ: Math.round(icuBeds * 0.8), res: Math.round(icuBeds * 0.05) },
      { type: 'trauma', total: traumaBeds, avail: Math.round(traumaBeds * 0.25), occ: Math.round(traumaBeds * 0.7), res: Math.round(traumaBeds * 0.05) },
      { type: 'ventilator', total: ventBeds, avail: Math.round(ventBeds * 0.2), occ: Math.round(ventBeds * 0.75), res: Math.round(ventBeds * 0.05) },
    ];

    for (const c of capacities) {
      await prisma.hospitalCapacity.upsert({
        where: { facilityId_careType: { facilityId: facId, careType: c.type } },
        update: { totalBeds: c.total, availableBeds: c.avail, occupiedBeds: c.occ, reservedBeds: c.res },
        create: { facilityId: facId, careType: c.type, totalBeds: c.total, availableBeds: c.avail, occupiedBeds: c.occ, reservedBeds: c.res },
      });
    }

    // Ambulances
    const amb1Reg = `${h.state}01${h.key.slice(0, 3)}101`.toUpperCase();
    const amb2Reg = `${h.state}01${h.key.slice(0, 3)}102`.toUpperCase();

    await prisma.ambulance.upsert({
      where: { registration: amb1Reg },
      update: { status: 'available', currentZone: `${h.name.slice(0, 20)} Zone A` },
      create: { facilityId: facId, registration: amb1Reg, ambulanceType: 'ALS', status: 'available', currentZone: `${h.name.slice(0, 20)} Zone A`, deploymentTimeMinutes: 15 },
    });

    await prisma.ambulance.upsert({
      where: { registration: amb2Reg },
      update: { status: 'available', currentZone: `${h.name.slice(0, 20)} Zone B` },
      create: { facilityId: facId, registration: amb2Reg, ambulanceType: 'BLS', status: 'available', currentZone: `${h.name.slice(0, 20)} Zone B`, deploymentTimeMinutes: 15 },
    });

    // Blood Bank
    if (h.hasBloodBank) {
      const lic = `${h.state}/BB/${h.key.slice(0, 6)}/2022`;
      let bb = await prisma.bloodBank.findFirst({ where: { licenseNumber: lic } });
      if (!bb) {
        bb = await prisma.bloodBank.create({
          data: {
            facilityId: facId,
            name: `${h.name} Blood Transfusion Center`,
            type: 'government',
            licenseNumber: lic,
            isActive: 1,
          },
        });
      }

      const bloodStocks = [
        { group: 'A+', comp: 'whole_blood', qty: 18 },
        { group: 'A+', comp: 'packed_rbc', qty: 25 },
        { group: 'B+', comp: 'packed_rbc', qty: 22 },
        { group: 'O+', comp: 'packed_rbc', qty: 35 },
        { group: 'O-', comp: 'packed_rbc', qty: 8 },
        { group: 'AB+', comp: 'platelets', qty: 10 },
      ];

      for (const bs of bloodStocks) {
        await prisma.bloodInventory.upsert({
          where: { bloodBankId_bloodGroup_component: { bloodBankId: bb.id, bloodGroup: bs.group, component: bs.comp } },
          update: { availableUnits: bs.qty },
          create: {
            bloodBankId: bb.id,
            facilityId: facId,
            bloodGroup: bs.group,
            component: bs.comp,
            availableUnits: bs.qty,
            reservedUnits: 0,
            status: bs.qty <= 2 ? 'critical' : bs.qty <= 5 ? 'low' : 'available',
          },
        });
      }
    }
  }

  // ─── 9. National Strategic Reserves Catalog ───────────────────────────────
  const reserveDefs = [
    { med: 'RINGER', total: 60000, prot: 12000, emg: 42000, alloc: 6000 },
    { med: 'ORS', total: 100000, prot: 20000, emg: 70000, alloc: 10000 },
    { med: 'AZITH500', total: 80000, prot: 15000, emg: 55000, alloc: 10000 },
    { med: 'CEFTR1G', total: 35000, prot: 7000, emg: 25000, alloc: 3000 },
    { med: 'ADRENA', total: 15000, prot: 3000, emg: 10000, alloc: 2000 },
    { med: 'SALINE', total: 50000, prot: 10000, emg: 35000, alloc: 5000 },
    { med: 'PARA500', total: 250000, prot: 40000, emg: 180000, alloc: 30000 },
    { med: 'ASV_POLY', total: 8000, prot: 1500, emg: 5500, alloc: 1000 },
  ];

  for (const r of reserveDefs) {
    const medId = medicineMap[r.med];
    if (!medId) continue;
    await prisma.nationalReserve.upsert({
      where: { medicineId: medId },
      update: { totalQuantity: r.total, protectedQuantity: r.prot, emergencyAvailable: r.emg, allocatedQuantity: r.alloc },
      create: { medicineId: medId, totalQuantity: r.total, protectedQuantity: r.prot, emergencyAvailable: r.emg, allocatedQuantity: r.alloc },
    });
  }

  // ─── 10. Strict Manual-Only Command Protocol ──────────────────────────────
  await prisma.emergency.updateMany({
    where: { status: { in: ['active', 'initiated'] } },
    data: { status: 'closed', closedAt: new Date() },
  });

  await prisma.alert.deleteMany({
    where: { alertType: 'emergency' },
  });

  syncMasterDatabaseFiles();
  console.log('✅ BHISSM Pan-India Database fully provisioned across all 36 States & UTs and 100+ Hospitals!');
}

// Run if invoked directly
if (require.main === module) {
  seed()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error('Seed error:', e);
      prisma.$disconnect();
      process.exit(1);
    });
}
