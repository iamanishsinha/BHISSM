import bcrypt from 'bcryptjs';
import { getDb } from './connection';

const prisma = getDb();

export async function seed() {
  console.log('🌱 Verifying & seeding BHISSM multi-state and national demo data (30+ medicines & hospital networks)...');

  // ─── States ───────────────────────────────────────────────────────────────
  const stateData = [
    { name: 'Puducherry', code: 'PY', type: 'ut' },
    { name: 'Tamil Nadu', code: 'TN', type: 'state' },
    { name: 'Karnataka', code: 'KA', type: 'state' },
    { name: 'Andhra Pradesh', code: 'AP', type: 'state' },
    { name: 'Kerala', code: 'KL', type: 'state' },
    { name: 'Maharashtra', code: 'MH', type: 'state' },
    { name: 'West Bengal', code: 'WB', type: 'state' },
    { name: 'Uttar Pradesh', code: 'UP', type: 'state' },
    { name: 'NATIONAL', code: 'NA', type: 'national' },
  ];

  for (const s of stateData) {
    await prisma.state.upsert({ where: { code: s.code }, update: { name: s.name, type: s.type }, create: s });
  }

  const states: Record<string, string> = {};
  const allStates = await prisma.state.findMany();
  for (const s of allStates) states[s.code] = s.id;

  // ─── Districts ────────────────────────────────────────────────────────────
  const districtData = [
    // Puducherry
    { state: 'PY', name: 'Puducherry', code: 'PY-PD' },
    { state: 'PY', name: 'Karaikal', code: 'PY-KK' },
    // Tamil Nadu
    { state: 'TN', name: 'Chennai', code: 'TN-CHN' },
    { state: 'TN', name: 'Villupuram', code: 'TN-VLR' },
    { state: 'TN', name: 'Cuddalore', code: 'TN-CDL' },
    { state: 'TN', name: 'Coimbatore', code: 'TN-CBE' },
    { state: 'TN', name: 'Madurai', code: 'TN-MDU' },
    // Karnataka
    { state: 'KA', name: 'Bengaluru Urban', code: 'KA-BLR' },
    { state: 'KA', name: 'Mysuru', code: 'KA-MYS' },
    { state: 'KA', name: 'Belagavi', code: 'KA-BGM' },
    { state: 'KA', name: 'Dakshina Kannada', code: 'KA-DK' },
    // Andhra Pradesh
    { state: 'AP', name: 'Visakhapatnam', code: 'AP-VSP' },
    { state: 'AP', name: 'Krishna (Vijayawada)', code: 'AP-KRI' },
    // Kerala
    { state: 'KL', name: 'Thiruvananthapuram', code: 'KL-TVM' },
    { state: 'KL', name: 'Ernakulam (Kochi)', code: 'KL-EKM' },
    // Maharashtra
    { state: 'MH', name: 'Mumbai City', code: 'MH-MUM' },
    { state: 'MH', name: 'Pune', code: 'MH-PUN' },
  ];

  for (const d of districtData) {
    await prisma.district.upsert({
      where: { code: d.code },
      update: { name: d.name, stateId: states[d.state] },
      create: { name: d.name, code: d.code, stateId: states[d.state] },
    });
  }

  const districts: Record<string, string> = {};
  const allDistricts = await prisma.district.findMany();
  for (const d of allDistricts) districts[d.code] = d.id;

  // ─── Facilities ───────────────────────────────────────────────────────────
  const facilityData = [
    // Puducherry & Auroville Bioregion
    { key: 'JIPMER', name: 'JIPMER (Jawaharlal Institute of Postgraduate Medical Education & Research)', type: 'medical_college', level: 'state', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.9416, lng: 79.8083 },
    { key: 'PIMS_PY', name: 'PIMS (Pondicherry Institute of Medical Sciences, Kalapet, Puducherry)', type: 'medical_college', level: 'state', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 12.0315, lng: 79.8562 },
    { key: 'RGGWCH_PY', name: 'Rajiv Gandhi Government Women and Children Hospital, Puducherry', type: 'government_hospital', level: 'state', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.9338, lng: 79.8095 },
    { key: 'EAST_COAST_PY', name: 'East Coast Hospitals, Puducherry (Private)', type: 'private_hospital', level: 'district', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.9284, lng: 79.7965 },
    { key: 'AUROVILLE_HC', name: 'Auroville Health Centre (Aspiration, Auroville Area)', type: 'community_hospital', level: 'district', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 12.0069, lng: 79.8106 },
    { key: 'GH_PY', name: 'Government General Hospital Puducherry', type: 'government_hospital', level: 'state', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.9341, lng: 79.8307 },
    { key: 'IGMCRI', name: 'Indira Gandhi Medical College & Research Institute Puducherry', type: 'medical_college', level: 'state', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.9219, lng: 79.7889 },
    { key: 'CHC_OZHU', name: 'CHC Ozhukarai Puducherry', type: 'chc', level: 'district', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.9778, lng: 79.7944 },
    { key: 'PHC_ARIY', name: 'PHC Ariyankuppam Puducherry', type: 'phc', level: 'phc', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.9127, lng: 79.8021 },
    { key: 'GH_KRK', name: 'Government Hospital Karaikal', type: 'government_hospital', level: 'district', district: 'PY-KK', state: 'PY', hasBloodBank: 0, lat: 10.9254, lng: 79.8380 },
    // Tamil Nadu (including Adjacent Border Districts: Villupuram / Auroville Border & Cuddalore)
    { key: 'AUROVILLE_SANTIGIRI', name: 'Santigiri & Quiet Healing Hospital (Auroville Area - Villupuram Border)', type: 'private_hospital', level: 'district', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 12.0150, lng: 79.8250 },
    { key: 'GH_VLR', name: 'Government Medical College Hospital Villupuram', type: 'government_hospital', level: 'district', district: 'TN-VLR', state: 'TN', hasBloodBank: 1, lat: 11.9385, lng: 79.4923 },
    { key: 'GH_CDL', name: 'Government General Hospital Cuddalore', type: 'government_hospital', level: 'district', district: 'TN-CDL', state: 'TN', hasBloodBank: 1, lat: 11.7480, lng: 79.7714 },
    { key: 'STANLEY_CHN', name: 'Government Stanley Medical College & Hospital Chennai', type: 'medical_college', level: 'state', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.1067, lng: 80.2889 },
    { key: 'RAJIV_CHN', name: 'Rajiv Gandhi Government General Hospital Chennai', type: 'government_hospital', level: 'state', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0827, lng: 80.2707 },
    { key: 'CMCH_CBE', name: 'Coimbatore Medical College Hospital', type: 'medical_college', level: 'district', district: 'TN-CBE', state: 'TN', hasBloodBank: 1, lat: 11.0016, lng: 76.9629 },
    // Karnataka
    { key: 'VICTORIA_BLR', name: 'Victoria Hospital (Bangalore Medical College)', type: 'medical_college', level: 'state', district: 'KA-BLR', state: 'KA', hasBloodBank: 1, lat: 12.9634, lng: 77.5752 },
    { key: 'BOWRING_BLR', name: 'Bowring & Lady Curzon Hospital Bengaluru', type: 'government_hospital', level: 'state', district: 'KA-BLR', state: 'KA', hasBloodBank: 1, lat: 12.9830, lng: 77.6050 },
    { key: 'KC_GEN_BLR', name: 'KC General Hospital Malleshwaram Bengaluru', type: 'government_hospital', level: 'district', district: 'KA-BLR', state: 'KA', hasBloodBank: 0, lat: 13.0035, lng: 77.5688 },
    { key: 'KR_HOSP_MYS', name: 'Krishnarajendra (KR) Hospital Mysuru', type: 'medical_college', level: 'district', district: 'KA-MYS', state: 'KA', hasBloodBank: 1, lat: 12.3117, lng: 76.6522 },
    // Andhra Pradesh
    { key: 'KGH_VSP', name: 'King George Hospital Visakhapatnam', type: 'medical_college', level: 'state', district: 'AP-VSP', state: 'AP', hasBloodBank: 1, lat: 17.7088, lng: 83.3033 },
    { key: 'GGH_VIJ', name: 'Government General Hospital Vijayawada', type: 'government_hospital', level: 'district', district: 'AP-KRI', state: 'AP', hasBloodBank: 1, lat: 16.5186, lng: 80.6200 },
    // Kerala
    { key: 'GMC_TVM', name: 'Government Medical College Thiruvananthapuram', type: 'medical_college', level: 'state', district: 'KL-TVM', state: 'KL', hasBloodBank: 1, lat: 8.5241, lng: 76.9205 },
    // Maharashtra
    { key: 'KEM_MUM', name: 'King Edward Memorial (KEM) Hospital Mumbai', type: 'medical_college', level: 'state', district: 'MH-MUM', state: 'MH', hasBloodBank: 1, lat: 19.0028, lng: 72.8427 },
    // National
    { key: 'NATIONAL_STORE', name: 'National Medical Reserve Store (Central Delhi)', type: 'government_hospital', level: 'national', district: null, state: 'NA', hasBloodBank: 0, lat: 28.6139, lng: 77.2090 },
  ];

  const facilityMap: Record<string, string> = {};

  for (const f of facilityData) {
    let fac = await prisma.facility.findFirst({ where: { name: f.name } });
    if (!fac) {
      fac = await prisma.facility.create({
        data: {
          name: f.name,
          type: f.type,
          level: f.level,
          districtId: f.district ? districts[f.district] : null,
          stateId: states[f.state],
          hasBloodBank: f.hasBloodBank,
          lat: f.lat,
          lng: f.lng,
        },
      });
    } else {
      fac = await prisma.facility.update({
        where: { id: fac.id },
        data: {
          type: f.type,
          level: f.level,
          districtId: f.district ? districts[f.district] : null,
          stateId: states[f.state],
          hasBloodBank: f.hasBloodBank,
          lat: f.lat,
          lng: f.lng,
        },
      });
    }
    facilityMap[f.key] = fac.id;
  }

  // ─── Users & Role Logins ──────────────────────────────────────────────────
  const defaultPasswordHash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  const userData = [
    // 1. National Command
    { username: 'national_monitor_01', password: 'BHISSM@National#01', fullName: 'Dr. Vijay Sharma', role: 'national', facilityKey: null, stateCode: 'NA' },
    { username: 'national_director_01', password: 'BHISSM@National#Dir01', fullName: 'Dr. Anita Sen', role: 'national', facilityKey: null, stateCode: 'NA' },

    // 2. State Command Admins
    { username: 'state_puducherry_admin', password: 'BHISSM@State#P01', fullName: 'Dr. Anand Krishnan', role: 'state', facilityKey: null, stateCode: 'PY' },
    { username: 'state_tamilnadu_admin', password: 'BHISSM@State#TN01', fullName: 'Dr. M. Senthil Nathan', role: 'state', facilityKey: null, stateCode: 'TN' },
    { username: 'state_karnataka_admin', password: 'BHISSM@State#KA01', fullName: 'Dr. K. S. Manjunath', role: 'state', facilityKey: null, stateCode: 'KA' },
    { username: 'state_andhra_admin', password: 'BHISSM@State#AP01', fullName: 'Dr. Ch. Venkateswara Rao', role: 'state', facilityKey: null, stateCode: 'AP' },
    { username: 'state_kerala_admin', password: 'BHISSM@State#KL01', fullName: 'Dr. V. S. Radhakrishnan', role: 'state', facilityKey: null, stateCode: 'KL' },
    { username: 'state_maharashtra_admin', password: 'BHISSM@State#MH01', fullName: 'Dr. Sanjay Deshmukh', role: 'state', facilityKey: null, stateCode: 'MH' },

    // 3. Hospital Nodes - Puducherry & Auroville Area
    { username: 'hospital_puducherry_01', password: 'BHISSM@Demo#P01', fullName: 'Dr. Ramesh Kumar', role: 'hospital', facilityKey: 'GH_PY', stateCode: 'PY' },
    { username: 'hospital_jipmer_01', password: 'BHISSM@Demo#J01', fullName: 'Dr. Priya Anand', role: 'hospital', facilityKey: 'JIPMER', stateCode: 'PY' },
    { username: 'hospital_pims_01', password: 'BHISSM@Demo#PIMS01', fullName: 'Dr. Rebecca Thomas', role: 'hospital', facilityKey: 'PIMS_PY', stateCode: 'PY' },
    { username: 'hospital_rggwch_01', password: 'BHISSM@Demo#RGW01', fullName: 'Dr. Latha Narayanan', role: 'hospital', facilityKey: 'RGGWCH_PY', stateCode: 'PY' },
    { username: 'hospital_eastcoast_01', password: 'BHISSM@Demo#ECH01', fullName: 'Dr. Karthik Natarajan', role: 'hospital', facilityKey: 'EAST_COAST_PY', stateCode: 'PY' },
    { username: 'hospital_auroville_01', password: 'BHISSM@Demo#AV01', fullName: 'Dr. Meera Sundaram', role: 'hospital', facilityKey: 'AUROVILLE_HC', stateCode: 'PY' },

    // 4. Hospital Nodes - Tamil Nadu (including Adjacent Border Districts: Villupuram, Cuddalore, Auroville Border)
    { username: 'hospital_cuddalore_01', password: 'BHISSM@Demo#C01', fullName: 'Dr. Suresh Babu', role: 'hospital', facilityKey: 'GH_CDL', stateCode: 'TN' },
    { username: 'hospital_villupuram_01', password: 'BHISSM@Demo#V01', fullName: 'Dr. Kavitha Devi', role: 'hospital', facilityKey: 'GH_VLR', stateCode: 'TN' },
    { username: 'hospital_santigiri_01', password: 'BHISSM@Demo#AV02', fullName: 'Dr. S. Prakash', role: 'hospital', facilityKey: 'AUROVILLE_SANTIGIRI', stateCode: 'TN' },
    { username: 'hospital_stanley_01', password: 'BHISSM@Demo#TN01', fullName: 'Dr. Rajesh Venkataraman', role: 'hospital', facilityKey: 'STANLEY_CHN', stateCode: 'TN' },
    { username: 'hospital_rajivgandhi_01', password: 'BHISSM@Demo#TN02', fullName: 'Dr. Aruna Chandrasekar', role: 'hospital', facilityKey: 'RAJIV_CHN', stateCode: 'TN' },

    // 5. Hospital Nodes - Karnataka
    { username: 'hospital_victoria_01', password: 'BHISSM@Demo#KA01', fullName: 'Dr. Gururaj Patil', role: 'hospital', facilityKey: 'VICTORIA_BLR', stateCode: 'KA' },
    { username: 'hospital_bowring_01', password: 'BHISSM@Demo#KA02', fullName: 'Dr. Deepa Shivanand', role: 'hospital', facilityKey: 'BOWRING_BLR', stateCode: 'KA' },

    // 6. Hospital Nodes - Andhra, Kerala, Maharashtra
    { username: 'hospital_kgh_01', password: 'BHISSM@Demo#AP01', fullName: 'Dr. K. Subba Rao', role: 'hospital', facilityKey: 'KGH_VSP', stateCode: 'AP' },
    { username: 'hospital_gmct_01', password: 'BHISSM@Demo#KL01', fullName: 'Dr. Thomas Mathew', role: 'hospital', facilityKey: 'GMC_TVM', stateCode: 'KL' },
    { username: 'hospital_kem_01', password: 'BHISSM@Demo#MH01', fullName: 'Dr. Hemant Kulkarni', role: 'hospital', facilityKey: 'KEM_MUM', stateCode: 'MH' },
  ];

  for (const u of userData) {
    const hash = defaultPasswordHash(u.password);
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        passwordHash: hash,
        fullName: u.fullName,
        role: u.role,
        facilityId: u.facilityKey ? facilityMap[u.facilityKey] : null,
        stateId: states[u.stateCode],
      },
      create: {
        username: u.username,
        passwordHash: hash,
        fullName: u.fullName,
        role: u.role,
        facilityId: u.facilityKey ? facilityMap[u.facilityKey] : null,
        stateId: states[u.stateCode],
      },
    });
  }

  // ─── 30 Essential Medicines & Vaccines Catalog ────────────────────────────
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

    // Emergency & Critical Care Fluids / Resuscitation (9)
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

  // ─── Comprehensive Inventory Seeding Across Major Hospitals (25+ Medicines Each) ───
  const baselineTemplates = [
    { key: 'AZITH500', baseStock: 8500, safety: 1500, avgDaily: 110, lead: 7, mfr: 'Cipla Ltd' },
    { key: 'AZITH250', baseStock: 6200, safety: 1000, avgDaily: 80, lead: 7, mfr: 'Alembic Pharma' },
    { key: 'AMOX500', baseStock: 12000, safety: 2000, avgDaily: 150, lead: 8, mfr: 'Alkem Labs' },
    { key: 'AUGM625', baseStock: 5400, safety: 1200, avgDaily: 95, lead: 8, mfr: 'GSK India' },
    { key: 'CEFTR1G', baseStock: 3200, safety: 800, avgDaily: 65, lead: 5, mfr: 'Lupin Ltd' },
    { key: 'CIPRO500', baseStock: 7800, safety: 1400, avgDaily: 90, lead: 7, mfr: 'Ranbaxy / Sun' },
    { key: 'DOXY100', baseStock: 6500, safety: 1000, avgDaily: 70, lead: 7, mfr: 'Dr. Reddys' },
    { key: 'METRO400', baseStock: 9000, safety: 1500, avgDaily: 120, lead: 6, mfr: 'JB Chemicals' },
    { key: 'MEROP1G', baseStock: 650, safety: 200, avgDaily: 18, lead: 5, mfr: 'Cipla Criticare' },
    { key: 'VANCO500', baseStock: 480, safety: 150, avgDaily: 12, lead: 6, mfr: 'Viatris' },
    { key: 'ORS', baseStock: 14500, safety: 2500, avgDaily: 210, lead: 4, mfr: 'FDC Electral' },
    { key: 'RINGER', baseStock: 4800, safety: 900, avgDaily: 85, lead: 5, mfr: 'Baxter India' },
    { key: 'SALINE', baseStock: 6200, safety: 1100, avgDaily: 110, lead: 5, mfr: 'Fresenius Kabi' },
    { key: 'DNS500', baseStock: 3400, safety: 700, avgDaily: 60, lead: 5, mfr: 'Baxter India' },
    { key: 'ADRENA', baseStock: 520, safety: 120, avgDaily: 10, lead: 5, mfr: 'Neon Labs' },
    { key: 'ATROP', baseStock: 450, safety: 100, avgDaily: 8, lead: 5, mfr: 'Neon Labs' },
    { key: 'DEXMETH', baseStock: 1800, safety: 400, avgDaily: 35, lead: 6, mfr: 'Zydus Cadila' },
    { key: 'HYDRO100', baseStock: 950, safety: 250, avgDaily: 22, lead: 6, mfr: 'Abbott India' },
    { key: 'ASV_POLY', baseStock: 180, safety: 60, avgDaily: 4, lead: 10, mfr: 'Bharat Serums' },
    { key: 'PARA500', baseStock: 25000, safety: 4000, avgDaily: 320, lead: 5, mfr: 'Micro Labs (Dolo)' },
    { key: 'DICLO50', baseStock: 8200, safety: 1500, avgDaily: 105, lead: 6, mfr: 'Novartis / Torrent' },
    { key: 'MORPH', baseStock: 320, safety: 100, avgDaily: 6, lead: 12, mfr: 'Verve Healthcare' },
    { key: 'PANT40', baseStock: 11000, safety: 2000, avgDaily: 140, lead: 6, mfr: 'Alkem (Pan-40)' },
    { key: 'ONDAN4', baseStock: 4200, safety: 800, avgDaily: 55, lead: 6, mfr: 'Cipla (Emeset)' },
    { key: 'INS_REG', baseStock: 850, safety: 200, avgDaily: 16, lead: 9, mfr: 'Biocon Insugen' },
    { key: 'METFOR500', baseStock: 16000, safety: 3000, avgDaily: 190, lead: 7, mfr: 'USV (Glycomet)' },
    { key: 'AMLOD5', baseStock: 13500, safety: 2500, avgDaily: 160, lead: 7, mfr: 'Pfizer / Cipla' },
    { key: 'ATORVA20', baseStock: 9800, safety: 1800, avgDaily: 115, lead: 7, mfr: 'Ranbaxy / Lupin' },
    { key: 'FURO40', baseStock: 4400, safety: 800, avgDaily: 50, lead: 6, mfr: 'Sanofi India' },
    { key: 'POLIO_VAC', baseStock: 2200, safety: 400, avgDaily: 30, lead: 10, mfr: 'Serum Institute' },
    { key: 'MEASLES_VAC', baseStock: 1500, safety: 300, avgDaily: 22, lead: 10, mfr: 'Serum Institute' },
    { key: 'HEPA_VAC', baseStock: 1800, safety: 350, avgDaily: 25, lead: 10, mfr: 'Bharat Biotech' },
    { key: 'TT_VAC', baseStock: 2600, safety: 500, avgDaily: 35, lead: 8, mfr: 'Biological E' },
  ];

  const hospitalConfigs = [
    { facKey: 'JIPMER', scale: 1.3, supplier: 'Central Medical Store / TNMSC', lowKeys: ['MEROP1G', 'ASV_POLY'] },
    { facKey: 'PIMS_PY', scale: 1.15, supplier: 'PIMS Pharmacy & Puducherry Medical Store', lowKeys: ['VANCO500', 'ASV_POLY'] },
    { facKey: 'RGGWCH_PY', scale: 0.95, supplier: 'DHS Puducherry Maternal & Child Store', lowKeys: ['AZITH250', 'CEFTR1G'] },
    { facKey: 'EAST_COAST_PY', scale: 0.85, supplier: 'East Coast Critical Care Pharmacy', lowKeys: ['MEROP1G', 'ADRENA'] },
    { facKey: 'AUROVILLE_HC', scale: 0.6, supplier: 'Auroville Integral Health Pharmacy', lowKeys: ['AZITH500', 'ORS'] },
    { facKey: 'AUROVILLE_SANTIGIRI', scale: 0.6, supplier: 'TNMSC Villupuram / Auroville Trust', lowKeys: ['RINGER'] },
    { facKey: 'GH_PY', scale: 0.85, supplier: 'DHS Puducherry Medical Store', lowKeys: ['AZITH500', 'ADRENA', 'CEFTR1G'] },
    { facKey: 'IGMCRI', scale: 0.75, supplier: 'DHS Puducherry', lowKeys: ['VANCO500'] },
    { facKey: 'STANLEY_CHN', scale: 1.4, supplier: 'TNMSC Chennai Depot', lowKeys: ['ORS', 'INS_REG'] },
    { facKey: 'RAJIV_CHN', scale: 1.6, supplier: 'TNMSC Central Warehouse', lowKeys: ['MEROP1G'] },
    { facKey: 'GH_VLR', scale: 0.65, supplier: 'TNMSC Villupuram', lowKeys: ['AZITH500', 'RINGER'] },
    { facKey: 'GH_CDL', scale: 0.7, supplier: 'TNMSC Cuddalore', lowKeys: ['AMOX500', 'ORS'] },
    { facKey: 'VICTORIA_BLR', scale: 1.35, supplier: 'KSMSCL Bengaluru', lowKeys: ['CEFTR1G', 'ASV_POLY'] },
    { facKey: 'BOWRING_BLR', scale: 0.8, supplier: 'KSMSCL Bengaluru', lowKeys: ['AZITH500', 'AMOX500'] },
    { facKey: 'KGH_VSP', scale: 1.1, supplier: 'APMSIDC Visakhapatnam', lowKeys: ['RINGER'] },
    { facKey: 'GMC_TVM', scale: 1.15, supplier: 'KMSCL Thiruvananthapuram', lowKeys: ['INS_REG'] },
    { facKey: 'KEM_MUM', scale: 1.5, supplier: 'Haffkine / BMSICL Mumbai', lowKeys: ['VANCO500'] },
  ];

  for (const hc of hospitalConfigs) {
    const facId = facilityMap[hc.facKey];
    if (!facId) continue;

    for (let idx = 0; idx < baselineTemplates.length; idx++) {
      const tpl = baselineTemplates[idx];
      const medId = medicineMap[tpl.key];
      if (!medId) continue;

      const isLow = hc.lowKeys.includes(tpl.key);
      const safety = Math.round(tpl.safety * hc.scale);
      const stock = isLow ? Math.round(safety * 0.72) : Math.round(tpl.baseStock * hc.scale);
      const reorder = Math.round(safety * 2.2);
      const avgDaily = Math.max(2, Math.round(tpl.avgDaily * hc.scale));

      let inv = await prisma.inventory.findUnique({
        where: { facilityId_medicineId: { facilityId: facId, medicineId: medId } },
      });

      if (!inv) {
        inv = await prisma.inventory.create({
          data: {
            facilityId: facId,
            medicineId: medId,
            currentStock: stock,
            safetyThreshold: safety,
            reorderLevel: reorder,
            avgDailyConsumption: avgDaily,
            leadTimeDays: tpl.lead,
            supplier: hc.supplier,
          },
        });
      } else {
        inv = await prisma.inventory.update({
          where: { id: inv.id },
          data: {
            currentStock: stock,
            safetyThreshold: safety,
            reorderLevel: reorder,
            avgDailyConsumption: avgDaily,
          },
        });
      }

      // Ensure at least 2 FEFO batches exist per medicine for realistic FEFO rotation
      const batch1Code = `LOT-${tpl.key.slice(0, 5)}-${hc.facKey.slice(0, 4)}-A`;
      const batch2Code = `LOT-${tpl.key.slice(0, 5)}-${hc.facKey.slice(0, 4)}-B`;

      const existingBatch = await prisma.inventoryBatch.findFirst({
        where: { inventoryId: inv.id },
      });

      if (!existingBatch) {
        const q1 = Math.round(stock * 0.35);
        const q2 = stock - q1;
        // Make some batches expire within 25 days to trigger 30-day FEFO warnings
        const exp1 = idx % 7 === 0 ? new Date(Date.now() + 22 * 86400000) : new Date('2026-12-31');
        const exp2 = new Date('2027-06-30');

        await prisma.inventoryBatch.createMany({
          data: [
            {
              inventoryId: inv.id,
              facilityId: facId,
              medicineId: medId,
              batchNumber: batch1Code,
              manufacturer: tpl.mfr,
              receivedDate: new Date('2025-01-15'),
              expiryDate: exp1,
              quantity: q1,
              status: 'usable',
            },
            {
              inventoryId: inv.id,
              facilityId: facId,
              medicineId: medId,
              batchNumber: batch2Code,
              manufacturer: tpl.mfr,
              receivedDate: new Date('2025-03-10'),
              expiryDate: exp2,
              quantity: q2,
              status: 'usable',
            },
          ],
        });
      }
    }
  }

  // Seed 14-day consumption records so Forecast Engine has rich data across hospitals
  const forecastFacilities = [
    'GH_PY',
    'JIPMER',
    'PIMS_PY',
    'RGGWCH_PY',
    'EAST_COAST_PY',
    'AUROVILLE_HC',
    'GH_VLR',
    'GH_CDL',
    'VICTORIA_BLR',
    'STANLEY_CHN',
  ];
  for (const fKey of forecastFacilities) {
    const facId = facilityMap[fKey];
    if (!facId) continue;
    const existingCount = await prisma.consumptionRecord.count({ where: { facilityId: facId } });
    if (existingCount < 50) {
      const recordsToInsert: any[] = [];
      for (const tpl of baselineTemplates.slice(0, 18)) {
        const medId = medicineMap[tpl.key];
        if (!medId) continue;
        for (let d = 14; d >= 1; d--) {
          const dt = new Date(Date.now() - d * 86400000).toISOString().split('T')[0];
          const variance = 0.85 + ((d * 7) % 30) / 100;
          recordsToInsert.push({
            facilityId: facId,
            medicineId: medId,
            date: dt,
            quantity: Math.max(1, Math.round(tpl.avgDaily * variance)),
          });
        }
      }
      for (const rec of recordsToInsert) {
        await prisma.consumptionRecord.upsert({
          where: {
            facilityId_medicineId_date: {
              facilityId: rec.facilityId,
              medicineId: rec.medicineId,
              date: rec.date,
            },
          },
          update: {},
          create: rec,
        });
      }
    }
  }

  // ─── Hospital Capacities ──────────────────────────────────────────────────
  const capacityEntries = [
    { fac: 'JIPMER', type: 'general', total: 450, avail: 82, occ: 348, res: 20 },
    { fac: 'JIPMER', type: 'icu', total: 40, avail: 6, occ: 32, res: 2 },
    { fac: 'JIPMER', type: 'trauma', total: 30, avail: 8, occ: 20, res: 2 },
    { fac: 'JIPMER', type: 'ventilator', total: 20, avail: 4, occ: 14, res: 2 },
    { fac: 'PIMS_PY', type: 'general', total: 380, avail: 68, occ: 294, res: 18 },
    { fac: 'PIMS_PY', type: 'icu', total: 32, avail: 7, occ: 23, res: 2 },
    { fac: 'PIMS_PY', type: 'trauma', total: 24, avail: 6, occ: 16, res: 2 },
    { fac: 'PIMS_PY', type: 'ventilator', total: 16, avail: 4, occ: 11, res: 1 },
    { fac: 'RGGWCH_PY', type: 'general', total: 340, avail: 55, occ: 270, res: 15 },
    { fac: 'RGGWCH_PY', type: 'icu', total: 25, avail: 5, occ: 18, res: 2 },
    { fac: 'RGGWCH_PY', type: 'pediatric', total: 120, avail: 22, occ: 92, res: 6 },
    { fac: 'EAST_COAST_PY', type: 'general', total: 200, avail: 38, occ: 152, res: 10 },
    { fac: 'EAST_COAST_PY', type: 'icu', total: 22, avail: 5, occ: 15, res: 2 },
    { fac: 'EAST_COAST_PY', type: 'trauma', total: 16, avail: 4, occ: 11, res: 1 },
    { fac: 'AUROVILLE_HC', type: 'general', total: 80, avail: 24, occ: 52, res: 4 },
    { fac: 'AUROVILLE_HC', type: 'trauma', total: 10, avail: 4, occ: 5, res: 1 },
    { fac: 'AUROVILLE_SANTIGIRI', type: 'general', total: 90, avail: 28, occ: 58, res: 4 },
    { fac: 'GH_PY', type: 'general', total: 280, avail: 42, occ: 224, res: 14 },
    { fac: 'GH_PY', type: 'icu', total: 16, avail: 3, occ: 12, res: 1 },
    { fac: 'GH_PY', type: 'trauma', total: 18, avail: 5, occ: 12, res: 1 },
    { fac: 'GH_VLR', type: 'general', total: 310, avail: 58, occ: 238, res: 14 },
    { fac: 'GH_VLR', type: 'icu', total: 20, avail: 4, occ: 15, res: 1 },
    { fac: 'GH_CDL', type: 'general', total: 290, avail: 50, occ: 226, res: 14 },
    { fac: 'GH_CDL', type: 'icu', total: 18, avail: 4, occ: 13, res: 1 },
    { fac: 'VICTORIA_BLR', type: 'general', total: 600, avail: 110, occ: 460, res: 30 },
    { fac: 'VICTORIA_BLR', type: 'icu', total: 60, avail: 12, occ: 45, res: 3 },
    { fac: 'VICTORIA_BLR', type: 'trauma', total: 50, avail: 15, occ: 32, res: 3 },
    { fac: 'VICTORIA_BLR', type: 'ventilator', total: 35, avail: 8, occ: 25, res: 2 },
    { fac: 'BOWRING_BLR', type: 'general', total: 320, avail: 55, occ: 250, res: 15 },
    { fac: 'BOWRING_BLR', type: 'icu', total: 24, avail: 5, occ: 18, res: 1 },
    { fac: 'STANLEY_CHN', type: 'general', total: 550, avail: 95, occ: 425, res: 30 },
    { fac: 'STANLEY_CHN', type: 'icu', total: 50, avail: 9, occ: 39, res: 2 },
    { fac: 'STANLEY_CHN', type: 'trauma', total: 40, avail: 11, occ: 27, res: 2 },
    { fac: 'RAJIV_CHN', type: 'general', total: 750, avail: 135, occ: 580, res: 35 },
    { fac: 'RAJIV_CHN', type: 'icu', total: 70, avail: 14, occ: 52, res: 4 },
  ];

  for (const c of capacityEntries) {
    const facId = facilityMap[c.fac];
    if (!facId) continue;
    await prisma.hospitalCapacity.upsert({
      where: { facilityId_careType: { facilityId: facId, careType: c.type } },
      update: { totalBeds: c.total, availableBeds: c.avail, occupiedBeds: c.occ, reservedBeds: c.res },
      create: { facilityId: facId, careType: c.type, totalBeds: c.total, availableBeds: c.avail, occupiedBeds: c.occ, reservedBeds: c.res },
    });
  }

  // ─── Ambulances ───────────────────────────────────────────────────────────
  const ambulanceEntries = [
    { fac: 'JIPMER', reg: 'PY01AB1234', type: 'ALS', status: 'available', zone: 'Puducherry Central' },
    { fac: 'JIPMER', reg: 'PY01AB1235', type: 'BLS', status: 'available', zone: 'Puducherry North' },
    { fac: 'PIMS_PY', reg: 'PY01PM2001', type: 'ALS', status: 'available', zone: 'Kalapet ECR Highway' },
    { fac: 'PIMS_PY', reg: 'PY01PM2002', type: 'BLS', status: 'available', zone: 'Kalapet - Auroville Link' },
    { fac: 'RGGWCH_PY', reg: 'PY01RG3001', type: 'ALS', status: 'available', zone: 'Ellaipillaichavady Neonatal' },
    { fac: 'EAST_COAST_PY', reg: 'PY01EC4001', type: 'ALS', status: 'available', zone: 'Moolakulam - Villianur' },
    { fac: 'AUROVILLE_HC', reg: 'PY01AV5001', type: 'BLS', status: 'available', zone: 'Auroville Bioregion' },
    { fac: 'AUROVILLE_SANTIGIRI', reg: 'TN32AV6001', type: 'BLS', status: 'available', zone: 'Auroville - Vanur Border' },
    { fac: 'GH_PY', reg: 'PY01CD5678', type: 'ALS', status: 'available', zone: 'Puducherry East' },
    { fac: 'GH_PY', reg: 'PY01CD5679', type: 'BLS', status: 'in_use', zone: 'Puducherry South' },
    { fac: 'VICTORIA_BLR', reg: 'KA01GA4001', type: 'ALS', status: 'available', zone: 'Bengaluru Central' },
    { fac: 'VICTORIA_BLR', reg: 'KA01GA4002', type: 'ALS', status: 'available', zone: 'Bengaluru South' },
    { fac: 'VICTORIA_BLR', reg: 'KA01GA4003', type: 'BLS', status: 'available', zone: 'Bengaluru West' },
    { fac: 'BOWRING_BLR', reg: 'KA01GB5001', type: 'ALS', status: 'available', zone: 'Bengaluru East' },
    { fac: 'BOWRING_BLR', reg: 'KA01GB5002', type: 'BLS', status: 'available', zone: 'Bengaluru North' },
    { fac: 'STANLEY_CHN', reg: 'TN09MN4001', type: 'ALS', status: 'available', zone: 'Chennai North' },
    { fac: 'RAJIV_CHN', reg: 'TN09OP5001', type: 'ALS', status: 'available', zone: 'Chennai Central' },
    { fac: 'GH_VLR', reg: 'TN32EF2001', type: 'ALS', status: 'available', zone: 'Villupuram Border' },
    { fac: 'GH_CDL', reg: 'TN19GH3001', type: 'ALS', status: 'available', zone: 'Cuddalore Border' },
  ];

  for (const a of ambulanceEntries) {
    const facId = facilityMap[a.fac];
    if (!facId) continue;
    await prisma.ambulance.upsert({
      where: { registration: a.reg },
      update: { status: a.status, currentZone: a.zone, ambulanceType: a.type },
      create: { facilityId: facId, registration: a.reg, ambulanceType: a.type, status: a.status, currentZone: a.zone, deploymentTimeMinutes: 15 },
    });
  }

  // ─── Blood Banks ──────────────────────────────────────────────────────────
  const bloodBankDefs = [
    { key: 'BB_JIPMER', fac: 'JIPMER', name: 'JIPMER Regional Blood Transfusion Center', license: 'PY/BB/001/2018' },
    { key: 'BB_PIMS', fac: 'PIMS_PY', name: 'PIMS Kalapet Blood Bank & Component Center', license: 'PY/BB/003/2020' },
    { key: 'BB_RGGWCH', fac: 'RGGWCH_PY', name: 'Rajiv Gandhi Women & Children Hospital Blood Bank', license: 'PY/BB/004/2020' },
    { key: 'BB_EASTCOAST', fac: 'EAST_COAST_PY', name: 'East Coast Hospitals Trauma Blood Bank', license: 'PY/BB/005/2021' },
    { key: 'BB_GHPY', fac: 'GH_PY', name: 'Government General Hospital Puducherry Blood Bank', license: 'PY/BB/002/2019' },
    { key: 'BB_GHVLR', fac: 'GH_VLR', name: 'Villupuram Medical College Blood Bank', license: 'TN/BB/VLR/001' },
    { key: 'BB_GHCDL', fac: 'GH_CDL', name: 'Cuddalore Government Hospital Blood Bank', license: 'TN/BB/CDL/001' },
    { key: 'BB_VIC_BLR', fac: 'VICTORIA_BLR', name: 'Victoria Hospital Blood Bank Bengaluru', license: 'KA/BB/BLR/001' },
    { key: 'BB_BOW_BLR', fac: 'BOWRING_BLR', name: 'Bowring Hospital Blood Bank Bengaluru', license: 'KA/BB/BLR/002' },
    { key: 'BB_STN_CHN', fac: 'STANLEY_CHN', name: 'Stanley Medical College Blood Bank Chennai', license: 'TN/BB/CHN/001' },
    { key: 'BB_RAJ_CHN', fac: 'RAJIV_CHN', name: 'Rajiv Gandhi Hospital Blood Bank Chennai', license: 'TN/BB/CHN/002' },
  ];

  for (const bb of bloodBankDefs) {
    const facId = facilityMap[bb.fac];
    if (!facId) continue;
    let bank = await prisma.bloodBank.findFirst({ where: { licenseNumber: bb.license } });
    if (!bank) {
      bank = await prisma.bloodBank.create({
        data: { facilityId: facId, name: bb.name, type: 'government', licenseNumber: bb.license, isActive: 1 },
      });
    }

    const bloodStocks = [
      { group: 'A+', comp: 'whole_blood', qty: 15 },
      { group: 'A+', comp: 'packed_rbc', qty: 22 },
      { group: 'B+', comp: 'packed_rbc', qty: 18 },
      { group: 'O+', comp: 'packed_rbc', qty: 30 },
      { group: 'O-', comp: 'packed_rbc', qty: 6 },
      { group: 'AB+', comp: 'platelets', qty: 8 },
      { group: 'B-', comp: 'packed_rbc', qty: 4 },
      { group: 'A-', comp: 'packed_rbc', qty: 5 },
    ];

    for (const bs of bloodStocks) {
      await prisma.bloodInventory.upsert({
        where: { bloodBankId_bloodGroup_component: { bloodBankId: bank.id, bloodGroup: bs.group, component: bs.comp } },
        update: { availableUnits: bs.qty },
        create: {
          bloodBankId: bank.id,
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

  // ─── National Reserves (Expanded) ─────────────────────────────────────────
  const reserveDefs = [
    { med: 'RINGER', total: 50000, prot: 10000, emg: 35000, alloc: 5000 },
    { med: 'ORS', total: 80000, prot: 15000, emg: 55000, alloc: 10000 },
    { med: 'AZITH500', total: 60000, prot: 12000, emg: 42000, alloc: 6000 },
    { med: 'CEFTR1G', total: 25000, prot: 5000, emg: 18000, alloc: 2000 },
    { med: 'ADRENA', total: 10000, prot: 2000, emg: 7000, alloc: 1000 },
    { med: 'SALINE', total: 40000, prot: 8000, emg: 28000, alloc: 4000 },
    { med: 'PARA500', total: 200000, prot: 30000, emg: 150000, alloc: 20000 },
    { med: 'ASV_POLY', total: 5000, prot: 1000, emg: 3500, alloc: 500 },
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

  // ─── Emergencies Across States (With Designated Primary, Secondary, Supporting & Cross-Border Adjacent Hospitals) ───
  const emgData = [
    // Major National Disaster (>500 casualties - National Dashboard Escalation)
    {
      title: 'Super Cyclone Fengal Coastal Surge — Severe National Disaster',
      type: 'natural_disaster',
      location: 'Coromandel Coastal Corridor (Multi-State: Tamil Nadu & Puducherry Coastline)',
      primaryKey: 'STANLEY_CHN',
      secondaryKey: 'RAJIV_CHN',
      supportingKeys: ['JIPMER', 'PIMS_PY', 'GH_CDL', 'GH_VLR'],
      stateCode: 'TN',
      severity: 'critical',
      status: 'active',
      cas: 1450,
      crit: 180,
      ser: 340,
      min: 910,
      dec: 20,
      descText: 'Catastrophic coastal cyclone landfall causing widespread flooding and trauma across North Tamil Nadu and Puducherry.',
      requirements: [
        {
          resource_type: 'medicine',
          medicine_key: 'RINGER',
          desc: "Ringer's Lactate 500ml IV Infusions for Coastal Trauma Resuscitation",
          qty: 15000,
          priority: 'critical',
        },
        {
          resource_type: 'medicine',
          medicine_key: 'AZITH500',
          desc: 'Azithromycin 500mg for Flood Waterborne Prophylaxis',
          qty: 12000,
          priority: 'critical',
        },
        {
          resource_type: 'ambulance',
          medicine_key: null,
          desc: 'ALS Ambulances with Ventilator Support for Coastal Evacuation',
          qty: 25,
          priority: 'critical',
        },
        {
          resource_type: 'staff',
          medicine_key: null,
          desc: 'Trauma Surgeons & Intensivists Medical Team',
          qty: 30,
          priority: 'urgent',
        },
      ],
    },
    // Puducherry Accidents (Visible in Puducherry AND Adjacent Tamil Nadu Districts: Villupuram, Cuddalore, Auroville)
    {
      title: 'ECR Highway Multi-Vehicle Collision (Kalapet - Puducherry)',
      type: 'mass_casualty',
      location: 'Kalapet Toll Plaza, ECR Highway, Puducherry - Villupuram Border',
      primaryKey: 'PIMS_PY',
      secondaryKey: 'JIPMER',
      supportingKeys: ['GH_PY', 'EAST_COAST_PY', 'RGGWCH_PY', 'AUROVILLE_HC', 'GH_VLR', 'GH_CDL'],
      stateCode: 'PY',
      severity: 'critical',
      status: 'active',
      cas: 38,
      crit: 9,
      ser: 14,
      min: 13,
      dec: 2,
      descText: 'Multi-vehicle highway collision near PIMS Kalapet & Auroville junction. Adjacent Tamil Nadu districts (Villupuram & Cuddalore) mobilized for cross-border mutual aid.',
      requirements: [
        {
          resource_type: 'ambulance',
          medicine_key: null,
          desc: 'ALS Ambulance Fleet for Highway Trauma Transport',
          qty: 6,
          priority: 'critical',
        },
        {
          resource_type: 'medicine',
          medicine_key: 'CEFTR1G',
          desc: 'Ceftriaxone 1g IV Injection for Surgical Trauma Prophylaxis',
          qty: 600,
          priority: 'urgent',
        },
        {
          resource_type: 'medicine',
          medicine_key: 'AZITH500',
          desc: 'Azithromycin 500mg for Wound & Respiratory Prophylaxis',
          qty: 500,
          priority: 'urgent',
        },
        {
          resource_type: 'staff',
          medicine_key: null,
          desc: 'Emergency Medicine Physicians & Orthopedic Trauma Surgeons',
          qty: 6,
          priority: 'urgent',
        },
      ],
    },
    {
      title: 'Auroville - Kottakuppam Cross-Border Bus Rollover Accident',
      type: 'mass_casualty',
      location: 'Auroville Radial Road & Kalapet Link, Puducherry',
      primaryKey: 'JIPMER',
      secondaryKey: 'EAST_COAST_PY',
      supportingKeys: ['PIMS_PY', 'RGGWCH_PY', 'AUROVILLE_HC', 'AUROVILLE_SANTIGIRI', 'GH_VLR'],
      stateCode: 'PY',
      severity: 'high',
      status: 'active',
      cas: 24,
      crit: 5,
      ser: 9,
      min: 10,
      dec: 0,
      descText: 'Inter-state passenger bus rollover near Auroville area. Pediatric and maternal passengers routed to RGGWCH; trauma cases routed to JIPMER, PIMS, and East Coast Hospitals with adjacent Villupuram district aid.',
      requirements: [
        {
          resource_type: 'medicine',
          medicine_key: 'RINGER',
          desc: "Ringer's Lactate 500ml IV Infusions for Shock Resuscitation",
          qty: 800,
          priority: 'critical',
        },
        {
          resource_type: 'ambulance',
          medicine_key: null,
          desc: 'BLS & Neonatal Critical Care Ambulances',
          qty: 4,
          priority: 'critical',
        },
      ],
    },
    {
      title: 'Bengaluru Chemical Plant Vapor Leak',
      type: 'industrial',
      location: 'Peenya Industrial Area Stage 2, Bengaluru',
      primaryKey: 'VICTORIA_BLR',
      secondaryKey: 'BOWRING_BLR',
      supportingKeys: ['KC_GEN_BLR'],
      stateCode: 'KA',
      severity: 'critical',
      status: 'active',
      cas: 45,
      crit: 10,
      ser: 18,
      min: 17,
      dec: 0,
      descText: 'Industrial chemical vapor inhalation incident in Peenya industrial corridor.',
      requirements: [
        {
          resource_type: 'medicine',
          medicine_key: 'ADRENA',
          desc: 'Adrenaline 1mg/ml for Anaphylaxis and Bronchospasm',
          qty: 120,
          priority: 'critical',
        },
        {
          resource_type: 'staff',
          medicine_key: null,
          desc: 'Pulmonologists and Critical Care Nurses',
          qty: 6,
          priority: 'urgent',
        },
      ],
    },
    {
      title: 'Coastal Cuddalore Storm Surge Alert',
      type: 'natural_disaster',
      location: 'Coastal Cuddalore Port & PHCs (Adjacent to Puducherry Border)',
      primaryKey: 'GH_CDL',
      secondaryKey: 'GH_VLR',
      supportingKeys: ['GH_PY', 'JIPMER', 'PIMS_PY', 'EAST_COAST_PY'],
      stateCode: 'TN',
      severity: 'high',
      status: 'active',
      cas: 15,
      crit: 2,
      ser: 5,
      min: 8,
      dec: 0,
      descText: 'Coastal flooding alert on Cuddalore-Puducherry border requiring prophylactic ORS and Azithromycin deployment.',
      requirements: [
        {
          resource_type: 'medicine',
          medicine_key: 'ORS',
          desc: 'ORS Sachet Replenishment for Waterborne Disease Surge',
          qty: 2000,
          priority: 'urgent',
        },
      ],
    },
  ];

  for (const em of emgData) {
    const primaryFacId = facilityMap[em.primaryKey];
    const secondaryFacId = facilityMap[em.secondaryKey];
    const supportingFacIds = em.supportingKeys.map((k) => facilityMap[k]).filter(Boolean);
    const stateId = states[em.stateCode];

    const structuredDescription = JSON.stringify({
      text: em.descText,
      primary_facility_id: primaryFacId,
      secondary_facility_id: secondaryFacId,
      supporting_facility_ids: supportingFacIds,
    });

    // Also match legacy title if 'ECR Highway Multi-Vehicle Collision' existed without suffix
    let emergency = await prisma.emergency.findFirst({
      where: {
        OR: [
          { title: em.title },
          ...(em.title.startsWith('ECR Highway Multi-Vehicle Collision')
            ? [{ title: 'ECR Highway Multi-Vehicle Collision' }]
            : []),
        ],
      },
    });
    if (!emergency) {
      emergency = await prisma.emergency.create({
        data: {
          title: em.title,
          emergencyType: em.type,
          location: em.location,
          facilityId: primaryFacId,
          stateId: stateId,
          severity: em.severity,
          status: em.status,
          description: structuredDescription,
          estimatedCasualties: em.cas,
          loadCritical: em.crit,
          loadSerious: em.ser,
          loadMinor: em.min,
          loadDeceased: em.dec,
          activatedAt: new Date(),
          confirmedAt: new Date(),
        },
      });
    } else {
      emergency = await prisma.emergency.update({
        where: { id: emergency.id },
        data: {
          title: em.title,
          location: em.location,
          facilityId: primaryFacId,
          stateId: stateId,
          status: em.status,
          description: structuredDescription,
          estimatedCasualties: em.cas,
        },
      });
    }

    // Seed sample requirements
    if (em.requirements && emergency) {
      for (const req of em.requirements) {
        const medId = req.medicine_key ? medicineMap[req.medicine_key] : null;
        const existingReq = await prisma.emergencyRequirement.findFirst({
          where: { emergencyId: emergency.id, description: req.desc },
        });
        if (!existingReq) {
          await prisma.emergencyRequirement.create({
            data: {
              emergencyId: emergency.id,
              resourceType: req.resource_type,
              medicineId: req.resource_type === 'medicine' ? medId : null,
              description: req.desc,
              quantityRequired: req.qty,
              quantityConfirmed: 0,
              priority: req.priority,
            },
          });
        }
      }
    }
  }

  // Repair any user-created emergencies in Puducherry/Auroville/Kalapet that had a missing or 'NA' stateId or 'initiated' status
  const allExistingEmergencies = await prisma.emergency.findMany({
    where: { status: { not: 'closed' } },
    include: { facility: true },
  });
  for (const existingEm of allExistingEmergencies) {
    const locAndTitle = `${existingEm.title} ${existingEm.location}`.toLowerCase();
    const isPuducherryKeyword =
      locAndTitle.includes('puducherry') ||
      locAndTitle.includes('pondicherry') ||
      locAndTitle.includes('kalapet') ||
      locAndTitle.includes('auroville') ||
      locAndTitle.includes('ozhukarai') ||
      locAndTitle.includes('jipmer') ||
      locAndTitle.includes('pims');

    let targetStateId = existingEm.stateId;
    if (existingEm.facility?.stateId && existingEm.stateId === states['NA']) {
      targetStateId = existingEm.facility.stateId;
    } else if (isPuducherryKeyword && existingEm.estimatedCasualties < 500) {
      targetStateId = states['PY'];
    }

    if (targetStateId !== existingEm.stateId || existingEm.status === 'initiated') {
      await prisma.emergency.update({
        where: { id: existingEm.id },
        data: {
          stateId: targetStateId,
          status: 'active',
        },
      });
    }
  }

  // ─── Alerts ───────────────────────────────────────────────────────────────
  const alertEntries = [
    { stateCode: 'PY', type: 'emergency', sev: 'critical', title: 'Puducherry: Mass Casualty Incident Active on ECR Highway (Kalapet)', msg: '38 casualties reported. Primary: PIMS Kalapet, Secondary: JIPMER, Supporting: RGGWCH, East Coast Hospitals, Auroville HC & Adjacent TN Districts.' },
    { stateCode: 'TN', type: 'emergency', sev: 'critical', title: 'Cross-Border Mutual Aid: Puducherry ECR & Auroville Accidents', msg: 'Adjacent Tamil Nadu districts (Villupuram & Cuddalore) activated to assist Puducherry hospitals with ambulances and trauma supplies.' },
    { stateCode: 'KA', type: 'emergency', sev: 'critical', title: 'Karnataka: Chemical Vapor Inhalation Alert in Peenya', msg: 'Primary: Victoria Hospital, Secondary: Bowring Hospital.' },
    { stateCode: 'TN', type: 'supply_disruption', sev: 'warning', title: 'Tamil Nadu: Coastal Cuddalore Monsoon Cyclone Advisory', msg: 'District emergency stores instructed to maintain 14-day IV fluid & Azithromycin reserves.' },
    { stateCode: 'KA', type: 'stockout_risk', sev: 'warning', title: 'Karnataka: Bowring Hospital Azithromycin 500mg Low Buffer', msg: 'Current stock below safety threshold. Lead time 7 days.' },
  ];

  for (const al of alertEntries) {
    const stateId = states[al.stateCode];
    const existing = await prisma.alert.findFirst({ where: { title: al.title } });
    if (!existing) {
      await prisma.alert.create({
        data: {
          stateId,
          alertType: al.type,
          severity: al.sev,
          title: al.title,
          message: al.msg,
          isRead: 0,
        },
      });
    }
  }

  // Clean up any existing requirements where resourceType !== 'medicine' had a medicineId attached
  await prisma.emergencyRequirement.updateMany({
    where: {
      resourceType: { not: 'medicine' },
      medicineId: { not: null },
    },
    data: {
      medicineId: null,
    },
  });

  console.log('✅ BHISSM multi-state demo data (33 medicines, PIMS, RGGWCH, East Coast, Auroville hospitals & cross-border emergency corridors) seeded successfully!');
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
