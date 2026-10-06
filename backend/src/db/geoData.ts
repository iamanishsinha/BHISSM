export interface StateDef {
  name: string;
  code: string;
  type: 'state' | 'ut' | 'national';
  capital?: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East' | 'Union Territories' | 'National';
}

export interface DistrictDef {
  state: string;
  name: string;
  code: string;
}

export interface FacilityDef {
  key: string;
  name: string;
  type: 'medical_college' | 'government_hospital' | 'private_hospital' | 'community_hospital' | 'military_hospital' | 'railway_hospital' | 'chc' | 'phc';
  level: 'apex' | 'state' | 'district' | 'phc' | 'national';
  district: string;
  state: string;
  hasBloodBank: number;
  lat: number;
  lng: number;
  address?: string;
  sector?: 'government' | 'defence_railway' | 'private' | 'health_centre';
}

export interface HospitalLoginDef {
  username: string;
  facilityKey: string;
  stateCode: string;
  password: string;
  label: string;
  fullName: string;
  jurisdiction: string;
  region: string;
}

// ─── 28 States + 8 Union Territories + National Command Grid ─────────────────
export const ALL_STATES: StateDef[] = [
  // National
  { name: 'NATIONAL', code: 'NA', type: 'national', region: 'National' },

  // Northern Region
  { name: 'Delhi', code: 'DL', type: 'ut', capital: 'New Delhi', region: 'North' },
  { name: 'Uttar Pradesh', code: 'UP', type: 'state', capital: 'Lucknow', region: 'North' },
  { name: 'Haryana', code: 'HR', type: 'state', capital: 'Chandigarh', region: 'North' },
  { name: 'Punjab', code: 'PB', type: 'state', capital: 'Chandigarh', region: 'North' },
  { name: 'Himachal Pradesh', code: 'HP', type: 'state', capital: 'Shimla', region: 'North' },
  { name: 'Uttarakhand', code: 'UK', type: 'state', capital: 'Dehradun', region: 'North' },
  { name: 'Jammu and Kashmir', code: 'JK', type: 'ut', capital: 'Srinagar / Jammu', region: 'North' },
  { name: 'Ladakh', code: 'LA', type: 'ut', capital: 'Leh', region: 'North' },
  { name: 'Chandigarh', code: 'CH', type: 'ut', capital: 'Chandigarh', region: 'North' },

  // Southern Region
  { name: 'Puducherry', code: 'PY', type: 'ut', capital: 'Puducherry', region: 'South' },
  { name: 'Tamil Nadu', code: 'TN', type: 'state', capital: 'Chennai', region: 'South' },
  { name: 'Karnataka', code: 'KA', type: 'state', capital: 'Bengaluru', region: 'South' },
  { name: 'Kerala', code: 'KL', type: 'state', capital: 'Thiruvananthapuram', region: 'South' },
  { name: 'Andhra Pradesh', code: 'AP', type: 'state', capital: 'Amaravati', region: 'South' },
  { name: 'Telangana', code: 'TG', type: 'state', capital: 'Hyderabad', region: 'South' },
  { name: 'Lakshadweep', code: 'LD', type: 'ut', capital: 'Kavaratti', region: 'South' },

  // Western Region
  { name: 'Maharashtra', code: 'MH', type: 'state', capital: 'Mumbai', region: 'West' },
  { name: 'Gujarat', code: 'GJ', type: 'state', capital: 'Gandhinagar', region: 'West' },
  { name: 'Goa', code: 'GA', type: 'state', capital: 'Panaji', region: 'West' },
  { name: 'Rajasthan', code: 'RJ', type: 'state', capital: 'Jaipur', region: 'West' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DN', type: 'ut', capital: 'Daman', region: 'West' },

  // Eastern Region
  { name: 'West Bengal', code: 'WB', type: 'state', capital: 'Kolkata', region: 'East' },
  { name: 'Bihar', code: 'BR', type: 'state', capital: 'Patna', region: 'East' },
  { name: 'Jharkhand', code: 'JH', type: 'state', capital: 'Ranchi', region: 'East' },
  { name: 'Odisha', code: 'OD', type: 'state', capital: 'Bhubaneswar', region: 'East' },
  { name: 'Andaman and Nicobar Islands', code: 'AN', type: 'ut', capital: 'Port Blair', region: 'East' },

  // Central Region
  { name: 'Madhya Pradesh', code: 'MP', type: 'state', capital: 'Bhopal', region: 'Central' },
  { name: 'Chhattisgarh', code: 'CG', type: 'state', capital: 'Raipur', region: 'Central' },

  // North-Eastern Region
  { name: 'Assam', code: 'AS', type: 'state', capital: 'Dispur / Guwahati', region: 'North-East' },
  { name: 'Arunachal Pradesh', code: 'AR', type: 'state', capital: 'Itanagar', region: 'North-East' },
  { name: 'Manipur', code: 'MN', type: 'state', capital: 'Imphal', region: 'North-East' },
  { name: 'Meghalaya', code: 'ML', type: 'state', capital: 'Shillong', region: 'North-East' },
  { name: 'Mizoram', code: 'MZ', type: 'state', capital: 'Aizawl', region: 'North-East' },
  { name: 'Nagaland', code: 'NL', type: 'state', capital: 'Kohima', region: 'North-East' },
  { name: 'Tripura', code: 'TR', type: 'state', capital: 'Agartala', region: 'North-East' },
  { name: 'Sikkim', code: 'SK', type: 'state', capital: 'Gangtok', region: 'North-East' },
];

// ─── Key Districts for each State and Union Territory ────────────────────────
export const ALL_DISTRICTS: DistrictDef[] = [
  // Puducherry
  { state: 'PY', name: 'Puducherry', code: 'PY-PD' },
  { state: 'PY', name: 'Karaikal', code: 'PY-KK' },
  { state: 'PY', name: 'Mahe', code: 'PY-MAH' },
  { state: 'PY', name: 'Yanam', code: 'PY-YAN' },
  // Tamil Nadu
  { state: 'TN', name: 'Chennai', code: 'TN-CHN' },
  { state: 'TN', name: 'Villupuram', code: 'TN-VLR' },
  { state: 'TN', name: 'Cuddalore', code: 'TN-CDL' },
  { state: 'TN', name: 'Coimbatore', code: 'TN-CBE' },
  { state: 'TN', name: 'Madurai', code: 'TN-MDU' },
  // Karnataka
  { state: 'KA', name: 'Bengaluru Urban', code: 'KA-BLR' },
  { state: 'KA', name: 'Mysuru', code: 'KA-MYS' },
  { state: 'KA', name: 'Dharwad (Hubballi)', code: 'KA-DHA' },
  { state: 'KA', name: 'Belagavi', code: 'KA-BGM' },
  // Andhra Pradesh
  { state: 'AP', name: 'Visakhapatnam', code: 'AP-VSP' },
  { state: 'AP', name: 'NTR (Vijayawada)', code: 'AP-KRI' },
  { state: 'AP', name: 'Tirupati (Chittoor)', code: 'AP-CTR' },
  { state: 'AP', name: 'Guntur', code: 'AP-GNT' },
  // Telangana
  { state: 'TG', name: 'Hyderabad', code: 'TG-HYD' },
  { state: 'TG', name: 'Secunderabad', code: 'TG-SEC' },
  { state: 'TG', name: 'Warangal', code: 'TG-WAR' },
  { state: 'TG', name: 'Adilabad', code: 'TG-ADI' },
  // Kerala
  { state: 'KL', name: 'Thiruvananthapuram', code: 'KL-TVM' },
  { state: 'KL', name: 'Kozhikode', code: 'KL-KKD' },
  { state: 'KL', name: 'Ernakulam (Kochi)', code: 'KL-EKM' },
  { state: 'KL', name: 'Kottayam', code: 'KL-KTM' },
  // Maharashtra
  { state: 'MH', name: 'Mumbai City', code: 'MH-MUM' },
  { state: 'MH', name: 'Pune', code: 'MH-PUN' },
  { state: 'MH', name: 'Nagpur', code: 'MH-NAG' },
  { state: 'MH', name: 'Aurangabad (Chhatrapati Sambhajinagar)', code: 'MH-AUR' },
  // Gujarat
  { state: 'GJ', name: 'Ahmedabad', code: 'GJ-AHM' },
  { state: 'GJ', name: 'Vadodara', code: 'GJ-BRD' },
  { state: 'GJ', name: 'Surat', code: 'GJ-SUR' },
  { state: 'GJ', name: 'Rajkot', code: 'GJ-RAJ' },
  // Goa
  { state: 'GA', name: 'North Goa', code: 'GA-NG' },
  { state: 'GA', name: 'South Goa', code: 'GA-SG' },
  // Delhi
  { state: 'DL', name: 'New Delhi', code: 'DL-NDL' },
  { state: 'DL', name: 'Central Delhi', code: 'DL-CEN' },
  { state: 'DL', name: 'East Delhi', code: 'DL-EAS' },
  { state: 'DL', name: 'South Delhi', code: 'DL-SOU' },
  // Uttar Pradesh
  { state: 'UP', name: 'Lucknow', code: 'UP-LKO' },
  { state: 'UP', name: 'Kanpur Nagar', code: 'UP-KAN' },
  { state: 'UP', name: 'Agra', code: 'UP-AGR' },
  { state: 'UP', name: 'Varanasi', code: 'UP-VAR' },
  // Rajasthan
  { state: 'RJ', name: 'Jaipur', code: 'RJ-JAI' },
  { state: 'RJ', name: 'Jodhpur', code: 'RJ-JOD' },
  { state: 'RJ', name: 'Bikaner', code: 'RJ-BIK' },
  { state: 'RJ', name: 'Udaipur', code: 'RJ-UDA' },
  // Madhya Pradesh
  { state: 'MP', name: 'Bhopal', code: 'MP-BHO' },
  { state: 'MP', name: 'Indore', code: 'MP-IND' },
  { state: 'MP', name: 'Jabalpur', code: 'MP-JAB' },
  { state: 'MP', name: 'Gwalior', code: 'MP-GWA' },
  // West Bengal
  { state: 'WB', name: 'Kolkata', code: 'WB-KOL' },
  { state: 'WB', name: 'Darjeeling (Siliguri)', code: 'WB-DAR' },
  { state: 'WB', name: 'Purba Bardhaman', code: 'WB-BUR' },
  // Bihar
  { state: 'BR', name: 'Patna', code: 'BR-PAT' },
  { state: 'BR', name: 'Darbhanga', code: 'BR-DAR' },
  { state: 'BR', name: 'Muzaffarpur', code: 'BR-MUZ' },
  // Odisha
  { state: 'OD', name: 'Cuttack', code: 'OD-CTC' },
  { state: 'OD', name: 'Khordha (Bhubaneswar)', code: 'OD-BBI' },
  { state: 'OD', name: 'Ganjam (Berhampur)', code: 'OD-GAN' },
  { state: 'OD', name: 'Sambalpur', code: 'OD-SAM' },
  // Chhattisgarh
  { state: 'CG', name: 'Raipur', code: 'CG-RAI' },
  { state: 'CG', name: 'Bilaspur', code: 'CG-BIL' },
  { state: 'CG', name: 'Bastar (Jagdalpur)', code: 'CG-BAS' },
  // Jharkhand
  { state: 'JH', name: 'Ranchi', code: 'JH-RAN' },
  { state: 'JH', name: 'East Singhbhum (Jamshedpur)', code: 'JH-EAS' },
  { state: 'JH', name: 'Dhanbad', code: 'JH-DHN' },
  // Haryana
  { state: 'HR', name: 'Rohtak', code: 'HR-ROH' },
  { state: 'HR', name: 'Karnal', code: 'HR-KAR' },
  { state: 'HR', name: 'Gurugram', code: 'HR-GUR' },
  { state: 'HR', name: 'Nuh', code: 'HR-NUH' },
  // Punjab
  { state: 'PB', name: 'Patiala', code: 'PB-PAT' },
  { state: 'PB', name: 'Amritsar', code: 'PB-ASR' },
  { state: 'PB', name: 'Ludhiana', code: 'PB-LUD' },
  { state: 'PB', name: 'Faridkot', code: 'PB-FAR' },
  // Himachal Pradesh
  { state: 'HP', name: 'Shimla', code: 'HP-SHI' },
  { state: 'HP', name: 'Kangra (Tanda)', code: 'HP-KAN' },
  { state: 'HP', name: 'Mandi', code: 'HP-MAN' },
  // Uttarakhand
  { state: 'UK', name: 'Dehradun', code: 'UK-DDN' },
  { state: 'UK', name: 'Nainital (Haldwani)', code: 'UK-NTL' },
  { state: 'UK', name: 'Pauri Garhwal (Srinagar)', code: 'UK-PAU' },
  // Jammu & Kashmir
  { state: 'JK', name: 'Jammu', code: 'JK-JAM' },
  { state: 'JK', name: 'Srinagar', code: 'JK-SRI' },
  { state: 'JK', name: 'Anantnag', code: 'JK-ANA' },
  // Ladakh
  { state: 'LA', name: 'Leh', code: 'LA-LEH' },
  { state: 'LA', name: 'Kargil', code: 'LA-KAR' },
  // Chandigarh
  { state: 'CH', name: 'Chandigarh', code: 'CH-CHD' },
  // Assam
  { state: 'AS', name: 'Kamrup Metropolitan (Guwahati)', code: 'AS-KAM' },
  { state: 'AS', name: 'Dibrugarh', code: 'AS-DIB' },
  { state: 'AS', name: 'Cachar (Silchar)', code: 'AS-CAC' },
  { state: 'AS', name: 'Jorhat', code: 'AS-JOR' },
  // Arunachal Pradesh
  { state: 'AR', name: 'Papum Pare (Itanagar)', code: 'AR-ITA' },
  { state: 'AR', name: 'East Siang (Pasighat)', code: 'AR-PSG' },
  { state: 'AR', name: 'Tawang', code: 'AR-TWG' },
  // Manipur
  { state: 'MN', name: 'Imphal West', code: 'MN-IMP' },
  { state: 'MN', name: 'Imphal East', code: 'MN-IE' },
  { state: 'MN', name: 'Churachandpur', code: 'MN-CC' },
  // Meghalaya
  { state: 'ML', name: 'East Khasi Hills (Shillong)', code: 'ML-EKH' },
  { state: 'ML', name: 'West Garo Hills (Tura)', code: 'ML-WGH' },
  // Mizoram
  { state: 'MZ', name: 'Aizawl', code: 'MZ-AIZ' },
  { state: 'MZ', name: 'Lunglei', code: 'MZ-LUN' },
  // Nagaland
  { state: 'NL', name: 'Kohima', code: 'NL-KOH' },
  { state: 'NL', name: 'Dimapur', code: 'NL-DIM' },
  { state: 'NL', name: 'Mokokchung', code: 'NL-MOK' },
  // Tripura
  { state: 'TR', name: 'West Tripura (Agartala)', code: 'TR-WST' },
  { state: 'TR', name: 'Gomati (Udaipur)', code: 'TR-GOM' },
  // Sikkim
  { state: 'SK', name: 'East Sikkim (Gangtok)', code: 'SK-GAN' },
  { state: 'SK', name: 'South Sikkim (Namchi)', code: 'SK-NAM' },
  { state: 'SK', name: 'West Sikkim (Gyalshing)', code: 'SK-GYA' },
  // Andaman and Nicobar Islands
  { state: 'AN', name: 'South Andaman (Port Blair)', code: 'AN-SOU' },
  { state: 'AN', name: 'North & Middle Andaman', code: 'AN-NOR' },
  { state: 'AN', name: 'Nicobar', code: 'AN-NIC' },
  // Dadra and Nagar Haveli and Daman and Diu
  { state: 'DN', name: 'Dadra and Nagar Haveli (Silvassa)', code: 'DN-SIL' },
  { state: 'DN', name: 'Daman', code: 'DN-DAM' },
  { state: 'DN', name: 'Diu', code: 'DN-DIU' },
  // Lakshadweep
  { state: 'LD', name: 'Kavaratti', code: 'LD-KAV' },
  { state: 'LD', name: 'Agatti', code: 'LD-AGA' },
  { state: 'LD', name: 'Amini', code: 'LD-AMI' },
];

// ─── 2 to 4 Real Hospitals per State & UT (+ NA National Depot) ───────────────
export const ALL_HOSPITALS: FacilityDef[] = [
  // ─── National Store (1)
  { key: 'NATIONAL_STORE', name: 'National Medical Reserve Store (Central Delhi)', type: 'government_hospital', level: 'national', district: 'DL-NDL', state: 'NA', hasBloodBank: 0, lat: 28.6139, lng: 77.2090, address: 'Central Medical Stores Depot, New Delhi' },

  // ─── Delhi (4)
  { key: 'DL_AIIMS', name: 'AIIMS (All India Institute of Medical Sciences) New Delhi', type: 'medical_college', level: 'apex', district: 'DL-NDL', state: 'DL', hasBloodBank: 1, lat: 28.5672, lng: 77.2100, address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi' },
  { key: 'DL_SJH', name: 'Safdarjung Hospital & VMMC, New Delhi', type: 'government_hospital', level: 'apex', district: 'DL-NDL', state: 'DL', hasBloodBank: 1, lat: 28.5703, lng: 77.2078, address: 'Ring Road, Opposite AIIMS, New Delhi' },
  { key: 'DL_LNJP', name: 'Lok Nayak Hospital (LNJP / Maulana Azad Medical College)', type: 'medical_college', level: 'state', district: 'DL-CEN', state: 'DL', hasBloodBank: 1, lat: 28.6367, lng: 77.2411, address: 'Jawaharlal Nehru Marg, Delhi Gate, New Delhi' },
  { key: 'DL_GTB', name: 'Guru Teg Bahadur (GTB) Hospital & UCMS, Delhi', type: 'medical_college', level: 'state', district: 'DL-EAS', state: 'DL', hasBloodBank: 1, lat: 28.6833, lng: 77.3117, address: 'Dilshad Garden, Shahdara, Delhi' },

  // ─── Uttar Pradesh (5)
  { key: 'UP_KGMU', name: "King George's Medical University (KGMU), Lucknow", type: 'medical_college', level: 'apex', district: 'UP-LKO', state: 'UP', hasBloodBank: 1, lat: 26.8689, lng: 80.9167, address: 'Shah Mina Road, Chowk, Lucknow' },
  { key: 'UP_RMLIMS', name: 'Dr. Ram Manohar Lohia Institute of Medical Sciences (RMLIMS), Lucknow', type: 'medical_college', level: 'state', district: 'UP-LKO', state: 'UP', hasBloodBank: 1, lat: 26.8622, lng: 80.9989, address: 'Vibhuti Khand, Gomti Nagar, Lucknow' },
  { key: 'UP_GSVM', name: 'GSVM Medical College & LLR Hospital (Hallet), Kanpur', type: 'medical_college', level: 'state', district: 'UP-KAN', state: 'UP', hasBloodBank: 1, lat: 26.4914, lng: 80.3069, address: 'Swaroop Nagar, Kanpur' },
  { key: 'UP_SNMC', name: 'Sarojini Naidu Medical College & Hospital, Agra', type: 'medical_college', level: 'district', district: 'UP-AGR', state: 'UP', hasBloodBank: 1, lat: 27.1833, lng: 78.0069, address: 'Moti Katra, Agra' },
  { key: 'UP_IMS_BHU', name: 'Sir Sunderlal Hospital (IMS Banaras Hindu University), Varanasi', type: 'medical_college', level: 'apex', district: 'UP-VAR', state: 'UP', hasBloodBank: 1, lat: 25.2756, lng: 82.9997, address: 'BHU Campus, Varanasi' },

  // ─── Maharashtra (4)
  { key: 'KEM_MUM', name: 'King Edward Memorial (KEM) Hospital & Seth GS Medical College, Mumbai', type: 'medical_college', level: 'apex', district: 'MH-MUM', state: 'MH', hasBloodBank: 1, lat: 19.0028, lng: 72.8427, address: 'Acharya Donde Marg, Parel, Mumbai' },
  { key: 'MH_JJ_MUM', name: 'Sir J.J. Group of Government Hospitals & Grant Medical College, Mumbai', type: 'medical_college', level: 'apex', district: 'MH-MUM', state: 'MH', hasBloodBank: 1, lat: 18.9622, lng: 72.8339, address: 'JJ Marg, Byculla, Mumbai' },
  { key: 'MH_SASSOON', name: 'Sassoon General Hospital & BJ Medical College, Pune', type: 'medical_college', level: 'state', district: 'MH-PUN', state: 'MH', hasBloodBank: 1, lat: 18.5284, lng: 73.8739, address: 'Near Pune Railway Station, Pune' },
  { key: 'MH_GMCH_NAG', name: 'Government Medical College & Hospital (GMCH), Nagpur', type: 'medical_college', level: 'state', district: 'MH-NAG', state: 'MH', hasBloodBank: 1, lat: 21.1342, lng: 79.0982, address: 'Hanuman Nagar, Medical Square, Nagpur' },

  // ─── Puducherry UT Enclaves (30 Facilities) ──────────────────────────────────
  // Puducherry Main Enclave - Government & Apex
  { key: 'JIPMER', name: 'JIPMER (Jawaharlal Institute of Postgraduate Medical Education & Research)', type: 'medical_college', level: 'apex', sector: 'government', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.9416, lng: 79.8083, address: 'Gorimedu, Dhanvantari Nagar, Puducherry' },
  { key: 'IGMCRI_PY', name: 'Indira Gandhi Medical College & Research Institute (IGMCRI)', type: 'medical_college', level: 'state', sector: 'government', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.9547, lng: 79.7925, address: 'Vazhudavur Road, Kadirkamam, Puducherry' },
  { key: 'GH_PY', name: 'Government General Hospital Puducherry', type: 'government_hospital', level: 'state', sector: 'government', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.9341, lng: 79.8307, address: 'Rue Victor Simonel, White Town, Puducherry' },
  { key: 'RGGWCH_PY', name: 'Rajiv Gandhi Government Women and Children Hospital', type: 'government_hospital', level: 'state', sector: 'government', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.9338, lng: 79.8095, address: 'Ellaipillaichavady, Puducherry' },
  { key: 'CHEST_HOSP_PY', name: 'Government Hospital for Chest Diseases, Gorimedu', type: 'government_hospital', level: 'state', sector: 'government', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.9501, lng: 79.8115, address: 'Gorimedu, Puducherry' },
  { key: 'MGPGIDS_PY', name: 'Mahatma Gandhi Postgraduate Institute of Dental Sciences', type: 'government_hospital', level: 'state', sector: 'government', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.9472, lng: 79.8101, address: 'Gorimedu, Puducherry' },
  { key: 'ESIC_PY', name: 'ESIC Hospital Gorimedu, Puducherry', type: 'government_hospital', level: 'district', sector: 'defence_railway', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.9515, lng: 79.8090, address: 'Gorimedu, Puducherry' },

  // Puducherry Main Enclave - Private Medical Colleges & Multi-Specialty
  { key: 'SMVMCH_PY', name: 'Sri Manakula Vinayagar Medical College and Hospital (SMVMCH)', type: 'medical_college', level: 'state', sector: 'private', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.9168, lng: 79.6385, address: 'Kalitheerthalkuppam, Madagadipet, Puducherry' },
  { key: 'MGMCRI_PY', name: 'Mahatma Gandhi Medical College & Research Institute (MGMCRI - SBV)', type: 'medical_college', level: 'state', sector: 'private', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.8211, lng: 79.7828, address: 'Pillaiyarkuppam, Puducherry' },
  { key: 'AVMC_PY', name: 'Aarupadai Veedu Medical College and Hospital (AVMC)', type: 'medical_college', level: 'state', sector: 'private', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.8385, lng: 79.7915, address: 'Cuddalore Main Road, Kirumampakkam, Puducherry' },
  { key: 'SVMCH_PY', name: 'Sri Venkateshwaraa Medical College Hospital and Research Centre (SVMCH)', type: 'medical_college', level: 'state', sector: 'private', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.9189, lng: 79.7156, address: 'Ariyur, Puducherry' },
  { key: 'PIMS_PY', name: 'Pondicherry Institute of Medical Sciences (PIMS)', type: 'medical_college', level: 'state', sector: 'private', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 12.0315, lng: 79.8562, address: 'East Coast Road, Kalapet, Puducherry' },
  { key: 'EAST_COAST_PY', name: 'East Coast Hospitals Multi-Specialty', type: 'private_hospital', level: 'district', sector: 'private', district: 'PY-PD', state: 'PY', hasBloodBank: 1, lat: 11.9284, lng: 79.7965, address: 'Moolakulam, Puducherry' },
  { key: 'BE_WELL_PY', name: 'Be Well Hospital Puducherry', type: 'private_hospital', level: 'district', sector: 'private', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.9312, lng: 79.8225, address: 'Subbiah Salai, Puducherry' },
  { key: 'AUROVILLE_HC', name: 'Auroville Health Centre (Aspiration)', type: 'community_hospital', level: 'district', sector: 'private', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 12.0069, lng: 79.8106, address: 'Aspiration, Auroville International Township' },

  // Puducherry Main Enclave - Community & Primary Health Centres
  { key: 'CHC_OZHUKARAI', name: 'Community Health Centre (CHC) Ozhukarai', type: 'chc', level: 'district', sector: 'health_centre', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.9560, lng: 79.7980, address: 'Ozhukarai, Puducherry' },
  { key: 'CHC_KARIKALAMPAKKAM', name: 'Community Health Centre (CHC) Karikalampakkam', type: 'chc', level: 'district', sector: 'health_centre', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.8752, lng: 79.7390, address: 'Karikalampakkam, Puducherry' },
  { key: 'CHC_MANNADIPET', name: 'Community Health Centre (CHC) Mannadipet', type: 'chc', level: 'district', sector: 'health_centre', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.9610, lng: 79.6210, address: 'Thirubuvanai, Mannadipet, Puducherry' },
  { key: 'PHC_ARIYANKUPPAM', name: 'Primary Health Centre (PHC) Ariyankuppam', type: 'phc', level: 'phc', sector: 'health_centre', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.8950, lng: 79.8060, address: 'Ariyankuppam, Puducherry' },
  { key: 'PHC_VILLIANUR', name: 'Primary Health Centre (PHC) Villianur', type: 'phc', level: 'phc', sector: 'health_centre', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.9145, lng: 79.7562, address: 'Villianur, Puducherry' },
  { key: 'PHC_BAHOUR', name: 'Primary Health Centre (PHC) Bahour', type: 'phc', level: 'phc', sector: 'health_centre', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.8020, lng: 79.7450, address: 'Bahour, Puducherry' },
  { key: 'PHC_LAWSPET', name: 'Primary Health Centre (PHC) Lawspet', type: 'phc', level: 'phc', sector: 'health_centre', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.9680, lng: 79.8250, address: 'Lawspet, Puducherry' },
  { key: 'PHC_MUDALIARPET', name: 'Primary Health Centre (PHC) Mudaliarpet', type: 'phc', level: 'phc', sector: 'health_centre', district: 'PY-PD', state: 'PY', hasBloodBank: 0, lat: 11.9215, lng: 79.8140, address: 'Mudaliarpet, Puducherry' },

  // Karaikal Enclave
  { key: 'GH_KRK', name: 'Government General Hospital Karaikal', type: 'government_hospital', level: 'district', sector: 'government', district: 'PY-KK', state: 'PY', hasBloodBank: 1, lat: 10.9254, lng: 79.8380, address: 'Church Street, Karaikal' },
  { key: 'VMMCH_KRK', name: "Vinayaka Mission's Medical College & Hospital Karaikal", type: 'medical_college', level: 'state', sector: 'private', district: 'PY-KK', state: 'PY', hasBloodBank: 1, lat: 10.9412, lng: 79.8270, address: 'Keezhakasakudy Medu, Karaikal' },
  { key: 'CHC_THIRUNALLAR', name: 'Community Health Centre (CHC) Thirunallar', type: 'chc', level: 'district', sector: 'health_centre', district: 'PY-KK', state: 'PY', hasBloodBank: 0, lat: 10.9310, lng: 79.7915, address: 'Thirunallar, Karaikal' },

  // Mahe Enclave
  { key: 'GH_MAHE', name: 'Government General Hospital Mahe', type: 'government_hospital', level: 'district', sector: 'government', district: 'PY-MAH', state: 'PY', hasBloodBank: 1, lat: 11.7012, lng: 75.5348, address: 'Cemetery Road, Mahe' },
  { key: 'CHC_PALLOOR', name: 'Community Health Centre (CHC) Palloor', type: 'chc', level: 'district', sector: 'health_centre', district: 'PY-MAH', state: 'PY', hasBloodBank: 0, lat: 11.7250, lng: 75.5420, address: 'Palloor, Mahe' },

  // Yanam Enclave
  { key: 'GH_YANAM', name: 'Government General Hospital Yanam', type: 'government_hospital', level: 'district', sector: 'government', district: 'PY-YAN', state: 'PY', hasBloodBank: 1, lat: 16.7320, lng: 82.2175, address: 'Pillaraya Street, Yanam' },
  { key: 'CHC_YANAM', name: 'Community Health Centre (CHC) Yanam', type: 'chc', level: 'district', sector: 'health_centre', district: 'PY-YAN', state: 'PY', hasBloodBank: 0, lat: 16.7380, lng: 82.2210, address: 'Sub-Centre Road, Yanam' },

  // ─── Chennai Metropolitan Region (35 Facilities) ────────────────────────────
  // Chennai Government Tertiary & Apex
  { key: 'RAJIV_CHN', name: 'Rajiv Gandhi Government General Hospital (Madras Medical College)', type: 'government_hospital', level: 'apex', sector: 'government', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0827, lng: 80.2707, address: 'EVR Periyar Salai, Park Town, Chennai' },
  { key: 'STANLEY_CHN', name: 'Government Stanley Medical College & Hospital', type: 'medical_college', level: 'state', sector: 'government', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.1067, lng: 80.2889, address: 'Old Jail Road, Royapuram, Chennai' },
  { key: 'KILPAUK_CHN', name: 'Government Kilpauk Medical College & Hospital (KMC)', type: 'medical_college', level: 'state', sector: 'government', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0789, lng: 80.2435, address: 'Poonamallee High Road, Kilpauk, Chennai' },
  { key: 'ROYAPETTAH_CHN', name: 'Government Royapettah Hospital', type: 'government_hospital', level: 'state', sector: 'government', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0560, lng: 80.2635, address: 'Westcott Road, Royapettah, Chennai' },
  { key: 'ICH_EGMORE', name: 'Institute of Child Health and Hospital for Children (ICH)', type: 'government_hospital', level: 'state', sector: 'government', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0735, lng: 80.2580, address: 'Halls Road, Egmore, Chennai' },
  { key: 'KGH_TRIPLICANE', name: 'Kasturba Gandhi Hospital for Women and Children', type: 'government_hospital', level: 'state', sector: 'government', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0612, lng: 80.2790, address: 'Triplicane High Road, Chennai' },
  { key: 'RIOH_EGMORE', name: 'Regional Institute of Ophthalmology & Govt Ophthalmic Hospital', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-CHN', state: 'TN', hasBloodBank: 0, lat: 13.0710, lng: 80.2560, address: 'Marshalls Road, Egmore, Chennai' },
  { key: 'PERIPHERAL_ANNANAGAR', name: 'Government Peripheral Hospital Anna Nagar', type: 'community_hospital', level: 'district', sector: 'government', district: 'TN-CHN', state: 'TN', hasBloodBank: 0, lat: 13.0850, lng: 80.2110, address: '2nd Avenue, Anna Nagar, Chennai' },
  { key: 'PERIPHERAL_TONDIARPET', name: 'Government Peripheral Hospital Tondiarpet', type: 'community_hospital', level: 'district', sector: 'government', district: 'TN-CHN', state: 'TN', hasBloodBank: 0, lat: 13.1250, lng: 80.2910, address: 'Tondiarpet High Road, Chennai' },
  { key: 'PERIPHERAL_KKNAGAR', name: 'Government Peripheral Hospital K.K. Nagar', type: 'community_hospital', level: 'district', sector: 'government', district: 'TN-CHN', state: 'TN', hasBloodBank: 0, lat: 13.0380, lng: 80.2010, address: 'K.K. Nagar, Chennai' },
  { key: 'GHTM_TAMBARAM', name: 'Government Hospital of Thoracic Medicine (GHTM)', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-CHN', state: 'TN', hasBloodBank: 0, lat: 12.9250, lng: 80.1280, address: 'GST Road, Tambaram Sanatorium, Chennai' },
  { key: 'KING_INST_GUINDY', name: 'King Institute of Preventive Medicine & Research', type: 'government_hospital', level: 'state', sector: 'government', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0110, lng: 80.2180, address: 'Guindy, Chennai' },

  // Chennai Defence, Railways, Port & Central Institutions
  { key: 'MILITARY_HOSP_CHN', name: 'Military Hospital Chennai (MH Chennai)', type: 'military_hospital', level: 'apex', sector: 'defence_railway', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0160, lng: 80.1890, address: 'Defence Colony, Nandambakkam, Chennai' },
  { key: 'RAILWAY_HOSP_PER', name: 'Southern Railway Headquarters Hospital, Perambur', type: 'railway_hospital', level: 'state', sector: 'defence_railway', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.1090, lng: 80.2395, address: 'Constable Road, Ayanavaram, Perambur, Chennai' },
  { key: 'PORT_TRUST_CHN', name: 'Chennai Port Trust Hospital', type: 'government_hospital', level: 'district', sector: 'defence_railway', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0920, lng: 80.2970, address: 'Port Trust Colony, Rajaji Salai, Chennai Port' },
  { key: 'ESIC_KKNAGAR', name: 'ESIC Super Specialty Hospital & Medical College K.K. Nagar', type: 'medical_college', level: 'apex', sector: 'defence_railway', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0365, lng: 80.2025, address: 'Ashok Pillar Road, K.K. Nagar, Chennai' },
  { key: 'AFS_TAMBARAM_MED', name: 'Air Force Station Medicare Centre & MI Room, Tambaram', type: 'military_hospital', level: 'district', sector: 'defence_railway', district: 'TN-CHN', state: 'TN', hasBloodBank: 0, lat: 12.9180, lng: 80.1190, address: 'Air Force Station, Tambaram, Chennai' },

  // Chennai Major Private Multi-Specialty & Private Medical Colleges
  { key: 'APOLLO_MAIN_CHN', name: 'Apollo Hospitals Main (Greams Road)', type: 'private_hospital', level: 'apex', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0578, lng: 80.2520, address: 'Greams Lane, Thousand Lights, Chennai' },
  { key: 'APOLLO_SPEC_VAN', name: 'Apollo Speciality Hospital Vanagaram', type: 'private_hospital', level: 'state', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0510, lng: 80.1450, address: 'Vanagaram-Ambattur Main Road, Chennai' },
  { key: 'MIOT_INTERNATIONAL', name: 'MIOT International Multi-Speciality Hospital', type: 'private_hospital', level: 'apex', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0232, lng: 80.1834, address: '4/112 Mount Poonamallee Road, Manapakkam, Chennai' },
  { key: 'SIMS_VADAPALANI', name: 'SIMS Hospital (SRM Institutes for Medical Science)', type: 'private_hospital', level: 'state', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0535, lng: 80.2115, address: 'Jawaharlal Nehru Salai, Vadapalani, Chennai' },
  { key: 'FORTIS_MALAR', name: 'Fortis Malar Hospital Adyar', type: 'private_hospital', level: 'state', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0065, lng: 80.2590, address: '1st Main Road, Gandhi Nagar, Adyar, Chennai' },
  { key: 'KAUVERY_ALWARPET', name: 'Kauvery Hospital Alwarpet', type: 'private_hospital', level: 'state', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0360, lng: 80.2530, address: '199 Luz Church Road, Alwarpet, Chennai' },
  { key: 'MGM_HEALTHCARE', name: 'MGM Healthcare Aminjikarai', type: 'private_hospital', level: 'apex', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0725, lng: 80.2240, address: '72 Nelson Manickam Road, Aminjikarai, Chennai' },
  { key: 'GLENEAGLES_PERUMBAKKAM', name: 'Gleneagles Global Health City, Perumbakkam', type: 'private_hospital', level: 'apex', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 12.8950, lng: 80.2010, address: '439 Cheran Nagar, Perumbakkam, Chennai' },
  { key: 'DR_RELA_CHROMEPET', name: 'Dr. Rela Institute & Medical Centre, Chromepet', type: 'private_hospital', level: 'apex', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 12.9520, lng: 80.1410, address: '7 CLC Works Road, Chromepet, Chennai' },
  { key: 'SRMC_PORUR', name: 'Sri Ramachandra Medical Centre (SRMC)', type: 'medical_college', level: 'apex', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0380, lng: 80.1450, address: 'No. 1 Ramachandra Nagar, Porur, Chennai' },
  { key: 'VIJAYA_HOSP_CHN', name: 'Vijaya Hospital Vadapalani', type: 'private_hospital', level: 'state', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 13.0505, lng: 80.2100, address: '43 Jawaharlal Nehru Salai, Vadapalani, Chennai' },
  { key: 'PRASHANTH_VELACHERY', name: 'Prashanth Super Speciality Hospital Velachery', type: 'private_hospital', level: 'district', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 12.9850, lng: 80.2190, address: '36 Velachery Main Road, Chennai' },
  { key: 'CHETTINAD_HEALTH', name: 'Chettinad Health City Super Speciality Hospital', type: 'medical_college', level: 'state', sector: 'private', district: 'TN-CHN', state: 'TN', hasBloodBank: 1, lat: 12.8250, lng: 80.2270, address: 'Rajiv Gandhi Salai (OMR), Kelambakkam, Chennai Area' },

  // Chennai Health Centres (CHCs & PHCs)
  { key: 'CHC_MEDAVAKKAM', name: 'Community Health Centre (CHC) Medavakkam', type: 'chc', level: 'district', sector: 'health_centre', district: 'TN-CHN', state: 'TN', hasBloodBank: 0, lat: 12.9180, lng: 80.1910, address: 'Medavakkam Main Road, Chennai' },
  { key: 'CHC_PUZHAL', name: 'Community Health Centre (CHC) Puzhal', type: 'chc', level: 'district', sector: 'health_centre', district: 'TN-CHN', state: 'TN', hasBloodBank: 0, lat: 13.1590, lng: 80.1990, address: 'GNT Road, Puzhal, Chennai' },
  { key: 'UPHC_ALANDUR', name: 'Urban Primary Health Centre (UPHC) Alandur', type: 'phc', level: 'phc', sector: 'health_centre', district: 'TN-CHN', state: 'TN', hasBloodBank: 0, lat: 13.0030, lng: 80.2010, address: 'MKN Road, Alandur, Chennai' },
  { key: 'UPHC_TNAGAR', name: 'Urban Primary Health Centre (UPHC) T. Nagar', type: 'phc', level: 'phc', sector: 'health_centre', district: 'TN-CHN', state: 'TN', hasBloodBank: 0, lat: 13.0420, lng: 80.2310, address: 'Dr. Nair Road, T. Nagar, Chennai' },
  { key: 'UPHC_MYLAPORE', name: 'Urban Primary Health Centre (UPHC) Mylapore', type: 'phc', level: 'phc', sector: 'health_centre', district: 'TN-CHN', state: 'TN', hasBloodBank: 0, lat: 13.0330, lng: 80.2670, address: 'Mundagakanniamman Koil St, Mylapore, Chennai' },

  // ─── Villupuram District (18 Facilities) ────────────────────────────────────
  // Villupuram Government Hospitals
  { key: 'GH_VLR', name: 'Government Villupuram Medical College and Hospital (GVMCH)', type: 'government_hospital', level: 'apex', sector: 'government', district: 'TN-VLR', state: 'TN', hasBloodBank: 1, lat: 11.9385, lng: 79.4923, address: 'Mundiyampakkam, Villupuram' },
  { key: 'GH_TINDIVANAM', name: 'Government District Headquarters Hospital Tindivanam', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-VLR', state: 'TN', hasBloodBank: 1, lat: 12.2350, lng: 79.6510, address: 'Rosanai, Tindivanam' },
  { key: 'GH_GINGEE', name: 'Government Taluk Hospital Gingee', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 12.2530, lng: 79.4210, address: 'Thiruvannamalai Road, Gingee' },
  { key: 'GH_VANUR', name: 'Government Taluk Hospital Vanur (Puducherry Border)', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 11.9980, lng: 79.7210, address: 'Vanur, Villupuram' },
  { key: 'GH_MARAKKANAM', name: 'Government Taluk Hospital Marakkanam (Coastal ECR)', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 12.1980, lng: 79.9480, address: 'East Coast Road, Marakkanam' },
  { key: 'GH_VIKRAVANDI', name: 'Government Taluk Hospital Vikravandi', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 12.0320, lng: 79.5540, address: 'NH45 Junction, Vikravandi' },
  { key: 'GH_TIRUKKOYILUR', name: 'Government Taluk Hospital Tirukkoyilur', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 11.9610, lng: 79.2050, address: 'Arakandanallur, Tirukkoyilur' },
  { key: 'ECHS_VILLUPURAM', name: 'ECHS Military Polyclinic Villupuram', type: 'military_hospital', level: 'district', sector: 'defence_railway', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 11.9420, lng: 79.5010, address: 'East Pondy Road, Villupuram' },

  // Villupuram Private Hospitals
  { key: 'SLIMS_OSUDU', name: 'Sri Lakshmi Narayana Institute of Medical Sciences (SLIMS)', type: 'medical_college', level: 'state', sector: 'private', district: 'TN-VLR', state: 'TN', hasBloodBank: 1, lat: 11.9690, lng: 79.7480, address: 'Kuduvetti, Osudu Lake Border, Villupuram' },
  { key: 'ES_HOSP_VLR', name: 'ES Hospital Villupuram', type: 'private_hospital', level: 'district', sector: 'private', district: 'TN-VLR', state: 'TN', hasBloodBank: 1, lat: 11.9390, lng: 79.4970, address: '32-B Trichy Trunk Road, Villupuram' },
  { key: 'SURYA_HOSP_VLR', name: 'Surya Multi Speciality Hospital Villupuram', type: 'private_hospital', level: 'district', sector: 'private', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 11.9310, lng: 79.4890, address: 'Salamedu, Villupuram' },
  { key: 'AUROVILLE_SANTIGIRI', name: 'Santigiri Healing Centre (Auroville Border)', type: 'private_hospital', level: 'district', sector: 'private', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 12.0150, lng: 79.8250, address: 'Vanur Taluk, Villupuram - Auroville Border' },

  // Villupuram Health Centres (CHCs & PHCs)
  { key: 'CHC_VALAVANUR', name: 'Community Health Centre (CHC) Valavanur', type: 'chc', level: 'district', sector: 'health_centre', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 11.9210, lng: 79.5810, address: 'Valavanur, Villupuram' },
  { key: 'CHC_MAILAM', name: 'Community Health Centre (CHC) Mailam', type: 'chc', level: 'district', sector: 'health_centre', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 12.1280, lng: 79.6170, address: 'Mailam, Tindivanam Taluk' },
  { key: 'CHC_KANJANUR', name: 'Community Health Centre (CHC) Kanjanur', type: 'chc', level: 'district', sector: 'health_centre', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 12.0820, lng: 79.4650, address: 'Kanjanur, Villupuram' },
  { key: 'PHC_KANDAMANGALAM', name: 'Primary Health Centre (PHC) Kandamangalam (NH45A)', type: 'phc', level: 'phc', sector: 'health_centre', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 11.9180, lng: 79.6820, address: 'Kandamangalam, Villupuram-Puducherry Border' },
  { key: 'PHC_NEMUR', name: 'Primary Health Centre (PHC) Nemur', type: 'phc', level: 'phc', sector: 'health_centre', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 11.9820, lng: 79.4420, address: 'Nemur, Villupuram' },
  { key: 'PHC_ANANTHAPURAM', name: 'Primary Health Centre (PHC) Ananthapuram', type: 'phc', level: 'phc', sector: 'health_centre', district: 'TN-VLR', state: 'TN', hasBloodBank: 0, lat: 12.1850, lng: 79.3890, address: 'Ananthapuram, Gingee Taluk' },

  // ─── Cuddalore District (19 Facilities) ─────────────────────────────────────
  // Cuddalore Government Hospitals
  { key: 'GH_CDL', name: 'Government District Headquarters Hospital Cuddalore', type: 'government_hospital', level: 'apex', sector: 'government', district: 'TN-CDL', state: 'TN', hasBloodBank: 1, lat: 11.7480, lng: 79.7714, address: 'Manjakuppam, Cuddalore' },
  { key: 'RMMCH_CHIDAMBARAM', name: 'Rajah Muthiah Medical College & Hospital (GMC Chidambaram)', type: 'medical_college', level: 'state', sector: 'government', district: 'TN-CDL', state: 'TN', hasBloodBank: 1, lat: 11.3930, lng: 79.7140, address: 'Annamalai Nagar, Chidambaram' },
  { key: 'GH_PANRUTI', name: 'Government Taluk Hospital Panruti (Puducherry Corridor)', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-CDL', state: 'TN', hasBloodBank: 1, lat: 11.7720, lng: 79.5540, address: 'Kumbakonam Road, Panruti' },
  { key: 'GH_CHIDAMBARAM', name: 'Government General Hospital Chidambaram', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.3990, lng: 79.6920, address: 'SP Kovil Street, Chidambaram' },
  { key: 'GH_VRIDHACHALAM', name: 'Government General Hospital Vridhachalam', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-CDL', state: 'TN', hasBloodBank: 1, lat: 11.5210, lng: 79.3280, address: 'Pennadam Road, Vridhachalam' },
  { key: 'GH_KURINJIPADI', name: 'Government Taluk Hospital Kurinjipadi', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.5710, lng: 79.5980, address: 'Kurinjipadi, Cuddalore' },
  { key: 'GH_TITTAKUDI', name: 'Government Taluk Hospital Tittakudi', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.4110, lng: 79.1180, address: 'Tittakudi, Cuddalore' },
  { key: 'GH_BHUVANAGIRI', name: 'Government Taluk Hospital Bhuvanagiri', type: 'government_hospital', level: 'district', sector: 'government', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.4680, lng: 79.6420, address: 'Bhuvanagiri, Cuddalore' },
  { key: 'ECHS_CUDDALORE', name: 'ECHS Military Polyclinic Cuddalore Port', type: 'military_hospital', level: 'district', sector: 'defence_railway', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.7240, lng: 79.7680, address: 'Old Town, Port Area, Cuddalore' },

  // Cuddalore Private Hospitals
  { key: 'ST_JOSEPH_CDL', name: "St. Joseph's Multi Speciality Hospital Cuddalore", type: 'private_hospital', level: 'district', sector: 'private', district: 'TN-CDL', state: 'TN', hasBloodBank: 1, lat: 11.7510, lng: 79.7640, address: 'Manjakuppam, Cuddalore' },
  { key: 'KRISHNA_HOSP_CDL', name: 'Krishna Hospital & Critical Care Centre Cuddalore', type: 'private_hospital', level: 'district', sector: 'private', district: 'TN-CDL', state: 'TN', hasBloodBank: 1, lat: 11.7450, lng: 79.7690, address: 'Imperial Road, Cuddalore' },
  { key: 'ANNAMALAI_MEDICARE', name: 'Annamalai Medicare & Heart Centre Chidambaram', type: 'private_hospital', level: 'district', sector: 'private', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.4010, lng: 79.7020, address: 'West Car Street, Chidambaram' },
  { key: 'AR_HOSP_PANRUTI', name: 'A.R. Hospital & Trauma Centre Panruti', type: 'private_hospital', level: 'district', sector: 'private', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.7680, lng: 79.5590, address: 'Panruti Main Road, Panruti' },

  // Cuddalore Health Centres (CHCs & PHCs)
  { key: 'CHC_NELLIKUPPAM', name: 'Community Health Centre (CHC) Nellikuppam', type: 'chc', level: 'district', sector: 'health_centre', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.7710, lng: 79.6720, address: 'Main Road, Nellikuppam' },
  { key: 'CHC_PARANGIPETTAI', name: 'Community Health Centre (CHC) Parangipettai (Porto Novo)', type: 'chc', level: 'district', sector: 'health_centre', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.4980, lng: 79.7610, address: 'Parangipettai Coastal Road, Cuddalore' },
  { key: 'CHC_MANGALAMPET', name: 'Community Health Centre (CHC) Mangalampet', type: 'chc', level: 'district', sector: 'health_centre', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.5620, lng: 79.2450, address: 'Mangalampet, Vridhachalam' },
  { key: 'PHC_KATTUMANNARKOIL', name: 'Primary Health Centre (PHC) Kattumannarkoil', type: 'phc', level: 'phc', sector: 'health_centre', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.2750, lng: 79.5520, address: 'Kattumannarkoil, Cuddalore' },
  { key: 'PHC_THOOKANAMPAKKAM', name: 'Primary Health Centre (PHC) Thookanampakkam (Pondy Border)', type: 'phc', level: 'phc', sector: 'health_centre', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.8150, lng: 79.6950, address: 'Thookanampakkam, Cuddalore' },
  { key: 'PHC_ALAPAKKAM', name: 'Primary Health Centre (PHC) Alapakkam (Coastal NH45A)', type: 'phc', level: 'phc', sector: 'health_centre', district: 'TN-CDL', state: 'TN', hasBloodBank: 0, lat: 11.6020, lng: 79.7420, address: 'Alapakkam, Cuddalore' },

  // Tamil Nadu Other Districts Baseline
  { key: 'CMCH_CBE', name: 'Coimbatore Medical College Hospital (CMCH)', type: 'medical_college', level: 'state', sector: 'government', district: 'TN-CBE', state: 'TN', hasBloodBank: 1, lat: 11.0016, lng: 76.9629, address: 'Trichy Road, Coimbatore' },
  { key: 'GRH_MDU', name: 'Government Rajaji Hospital (Madurai Medical College)', type: 'medical_college', level: 'state', sector: 'government', district: 'TN-MDU', state: 'TN', hasBloodBank: 1, lat: 9.9252, lng: 78.1198, address: 'Panagal Road, Madurai' },

  // ─── Karnataka (4)
  { key: 'VICTORIA_BLR', name: 'Victoria Hospital (Bangalore Medical College - BMCRI), Bengaluru', type: 'medical_college', level: 'apex', district: 'KA-BLR', state: 'KA', hasBloodBank: 1, lat: 12.9634, lng: 77.5752, address: 'Fort Road, K.R. Market, Bengaluru' },
  { key: 'BOWRING_BLR', name: 'Bowring & Lady Curzon Hospital Bengaluru', type: 'government_hospital', level: 'state', district: 'KA-BLR', state: 'KA', hasBloodBank: 1, lat: 12.9830, lng: 77.6050, address: 'Lady Curzon Road, Shivajinagar, Bengaluru' },
  { key: 'KR_HOSP_MYS', name: 'Krishnarajendra (KR) Hospital & Mysore Medical College, Mysuru', type: 'medical_college', level: 'state', district: 'KA-MYS', state: 'KA', hasBloodBank: 1, lat: 12.3117, lng: 76.6522, address: 'Sayyaji Rao Road, Mysuru' },
  { key: 'KA_KIMS_HUB', name: 'Karnataka Institute of Medical Sciences (KIMS), Hubballi', type: 'medical_college', level: 'district', district: 'KA-DHA', state: 'KA', hasBloodBank: 1, lat: 15.3524, lng: 75.1432, address: 'Vidyanagar, Hubballi' },

  // ─── Kerala (4)
  { key: 'GMC_TVM', name: 'Government Medical College, Thiruvananthapuram', type: 'medical_college', level: 'apex', district: 'KL-TVM', state: 'KL', hasBloodBank: 1, lat: 8.5241, lng: 76.9205, address: 'Medical College PO, Thiruvananthapuram' },
  { key: 'KL_GMC_KKD', name: 'Government Medical College, Kozhikode (Calicut)', type: 'medical_college', level: 'state', district: 'KL-KKD', state: 'KL', hasBloodBank: 1, lat: 11.2727, lng: 75.8364, address: 'Medical College Junction, Kozhikode' },
  { key: 'KL_GMC_EKM', name: 'Government Medical College, Ernakulam (Kochi)', type: 'medical_college', level: 'state', district: 'KL-EKM', state: 'KL', hasBloodBank: 1, lat: 10.0544, lng: 76.3533, address: 'HMT Colony, Kalamassery, Kochi' },
  { key: 'KL_GMC_KTM', name: 'Government Medical College, Kottayam', type: 'medical_college', level: 'district', district: 'KL-KTM', state: 'KL', hasBloodBank: 0, lat: 9.6644, lng: 76.5336, address: 'Gandhinagar, Kottayam' },

  // ─── Andhra Pradesh (4)
  { key: 'KGH_VSP', name: 'King George Hospital (Andhra Medical College), Visakhapatnam', type: 'medical_college', level: 'apex', district: 'AP-VSP', state: 'AP', hasBloodBank: 1, lat: 17.7088, lng: 83.3033, address: 'Maharanipeta, Visakhapatnam' },
  { key: 'GGH_VIJ', name: 'Government General Hospital, Vijayawada', type: 'government_hospital', level: 'state', district: 'AP-KRI', state: 'AP', hasBloodBank: 1, lat: 16.5186, lng: 80.6200, address: 'Gunadala, Vijayawada' },
  { key: 'AP_SVIMS', name: 'Sri Venkateswara Institute of Medical Sciences (SVIMS), Tirupati', type: 'medical_college', level: 'apex', district: 'AP-CTR', state: 'AP', hasBloodBank: 1, lat: 13.6373, lng: 79.4065, address: 'Alipiri Road, Tirupati' },
  { key: 'AP_GGH_GNT', name: 'Government General Hospital, Guntur', type: 'government_hospital', level: 'district', district: 'AP-GNT', state: 'AP', hasBloodBank: 1, lat: 16.3067, lng: 80.4365, address: 'Collectorate Road, Guntur' },

  // ─── Telangana (4)
  { key: 'TG_OSMANIA', name: 'Osmania General Hospital, Hyderabad', type: 'medical_college', level: 'apex', district: 'TG-HYD', state: 'TG', hasBloodBank: 1, lat: 17.3753, lng: 78.4744, address: 'Afzal Gunj, Hyderabad' },
  { key: 'TG_GANDHI', name: 'Gandhi Hospital & Medical College, Secunderabad', type: 'medical_college', level: 'state', district: 'TG-SEC', state: 'TG', hasBloodBank: 1, lat: 17.4239, lng: 78.5039, address: 'Musheerabad, Secunderabad' },
  { key: 'TG_MGM_WAR', name: 'Kakatiya Medical College & MGM Hospital, Warangal', type: 'medical_college', level: 'state', district: 'TG-WAR', state: 'TG', hasBloodBank: 1, lat: 17.9822, lng: 79.5978, address: 'MGM Road, Warangal' },
  { key: 'TG_RIMS_ADI', name: 'RIMS Government General Hospital, Adilabad', type: 'government_hospital', level: 'district', district: 'TG-ADI', state: 'TG', hasBloodBank: 0, lat: 19.6644, lng: 78.5322, address: 'Collectorate Complex, Adilabad' },

  // ─── Gujarat (4)
  { key: 'GJ_CIVIL_AHM', name: 'Civil Hospital & BJ Medical College, Ahmedabad', type: 'medical_college', level: 'apex', district: 'GJ-AHM', state: 'GJ', hasBloodBank: 1, lat: 23.0525, lng: 72.6028, address: 'Asarwa, Ahmedabad' },
  { key: 'GJ_SSG_BRD', name: 'Sir Sayajirao General (SSG) Hospital, Vadodara', type: 'medical_college', level: 'state', district: 'GJ-BRD', state: 'GJ', hasBloodBank: 1, lat: 22.3107, lng: 73.1873, address: 'Jail Road, Anandpura, Vadodara' },
  { key: 'GJ_NCH_SUR', name: 'New Civil Hospital & GMC, Surat', type: 'medical_college', level: 'state', district: 'GJ-SUR', state: 'GJ', hasBloodBank: 1, lat: 21.1702, lng: 72.8311, address: 'Majura Gate, Surat' },
  { key: 'GJ_PDU_RAJ', name: 'PDU Government Medical College Hospital, Rajkot', type: 'medical_college', level: 'district', district: 'GJ-RAJ', state: 'GJ', hasBloodBank: 0, lat: 22.3039, lng: 70.8022, address: 'Hospital Chowk, Jamnagar Road, Rajkot' },

  // ─── Rajasthan (4)
  { key: 'RJ_SMS_JAI', name: 'Sawai Man Singh (SMS) Hospital & Medical College, Jaipur', type: 'medical_college', level: 'apex', district: 'RJ-JAI', state: 'RJ', hasBloodBank: 1, lat: 26.8968, lng: 75.8167, address: 'Jawahar Lal Nehru Marg, Jaipur' },
  { key: 'RJ_SNMC_JOD', name: 'Dr. Sampurnanand Medical College Hospital, Jodhpur', type: 'medical_college', level: 'state', district: 'RJ-JOD', state: 'RJ', hasBloodBank: 1, lat: 26.2736, lng: 73.0189, address: 'Shastri Nagar, Jodhpur' },
  { key: 'RJ_PBM_BIK', name: 'Sardar Patel Medical College & PBM Hospital, Bikaner', type: 'medical_college', level: 'state', district: 'RJ-BIK', state: 'RJ', hasBloodBank: 1, lat: 28.0069, lng: 73.3275, address: 'Medical College Road, Bikaner' },
  { key: 'RJ_RNT_UDA', name: 'RNT Medical College & MB Hospital, Udaipur', type: 'medical_college', level: 'district', district: 'RJ-UDA', state: 'RJ', hasBloodBank: 0, lat: 24.5854, lng: 73.6975, address: 'Court Chowk, Hospital Road, Udaipur' },

  // ─── West Bengal (4)
  { key: 'WB_CMC', name: 'Medical College and Hospital (Calcutta Medical College), Kolkata', type: 'medical_college', level: 'apex', district: 'WB-KOL', state: 'WB', hasBloodBank: 1, lat: 22.5731, lng: 88.3639, address: 'College Street, Bowbazar, Kolkata' },
  { key: 'WB_SSKM', name: 'IPGMER and SSKM Hospital, Kolkata', type: 'medical_college', level: 'apex', district: 'WB-KOL', state: 'WB', hasBloodBank: 1, lat: 22.5392, lng: 88.3442, address: 'Harish Mukherjee Road, Bhowanipore, Kolkata' },
  { key: 'WB_NRS', name: 'Nil Ratan Sircar (NRS) Medical College and Hospital, Kolkata', type: 'medical_college', level: 'state', district: 'WB-KOL', state: 'WB', hasBloodBank: 1, lat: 22.5647, lng: 88.3703, address: 'Acharya Jagadish Chandra Bose Road, Sealdah, Kolkata' },
  { key: 'WB_NBMCH', name: 'North Bengal Medical College & Hospital, Siliguri', type: 'medical_college', level: 'district', district: 'WB-DAR', state: 'WB', hasBloodBank: 1, lat: 26.6872, lng: 88.3792, address: 'Sushrutanagar, Siliguri, Darjeeling' },

  // ─── Bihar (4)
  { key: 'BR_PMCH', name: 'Patna Medical College & Hospital (PMCH), Patna', type: 'medical_college', level: 'apex', district: 'BR-PAT', state: 'BR', hasBloodBank: 1, lat: 25.6207, lng: 85.1589, address: 'Ashok Rajpath, Patna' },
  { key: 'BR_AIIMS', name: 'AIIMS Patna Apex Center, Phulwari Sharif', type: 'medical_college', level: 'apex', district: 'BR-PAT', state: 'BR', hasBloodBank: 1, lat: 25.5606, lng: 85.0442, address: 'Khagaul Road, Phulwari Sharif, Patna' },
  { key: 'BR_DMCH', name: 'Darbhanga Medical College & Hospital (DMCH), Laheriasarai', type: 'medical_college', level: 'state', district: 'BR-DAR', state: 'BR', hasBloodBank: 1, lat: 26.1265, lng: 85.8971, address: 'Benta Chowk, Laheriasarai, Darbhanga' },
  { key: 'BR_SKMCH', name: 'Sri Krishna Medical College & Hospital (SKMCH), Muzaffarpur', type: 'medical_college', level: 'district', district: 'BR-MUZ', state: 'BR', hasBloodBank: 0, lat: 26.1589, lng: 85.3944, address: 'Umanagar, Muzaffarpur' },

  // ─── Madhya Pradesh (4)
  { key: 'MP_HAMIDIA', name: 'Hamidia Hospital (Gandhi Medical College), Bhopal', type: 'medical_college', level: 'apex', district: 'MP-BHO', state: 'MP', hasBloodBank: 1, lat: 23.2625, lng: 77.3917, address: 'Royal Market, Sultania Road, Bhopal' },
  { key: 'MP_MY_IND', name: 'Maharaja Yeshwantrao (MY) Hospital, Indore', type: 'medical_college', level: 'state', district: 'MP-IND', state: 'MP', hasBloodBank: 1, lat: 22.7196, lng: 75.8777, address: 'MY Hospital Road, Sanyogitaganj, Indore' },
  { key: 'MP_NSCB_JAB', name: 'Netaji Subhash Chandra Bose Medical College, Jabalpur', type: 'medical_college', level: 'state', district: 'MP-JAB', state: 'MP', hasBloodBank: 1, lat: 23.1539, lng: 79.8828, address: 'Tilwara Road, Garha, Jabalpur' },
  { key: 'MP_GRMC_GWA', name: 'Gajra Raja Medical College & JAH, Gwalior', type: 'medical_college', level: 'district', district: 'MP-GWA', state: 'MP', hasBloodBank: 0, lat: 26.2045, lng: 78.1633, address: 'Veer Savarkar Marg, Gwalior' },

  // ─── Odisha (4)
  { key: 'OD_SCB_CTC', name: 'SCB Medical College & Hospital, Cuttack', type: 'medical_college', level: 'apex', district: 'OD-CTC', state: 'OD', hasBloodBank: 1, lat: 20.4686, lng: 85.8942, address: 'Mangalabag, Cuttack' },
  { key: 'OD_AIIMS_BBI', name: 'AIIMS Bhubaneswar Apex Hospital', type: 'medical_college', level: 'apex', district: 'OD-BBI', state: 'OD', hasBloodBank: 1, lat: 20.2312, lng: 85.7766, address: 'Sijua, Patrapada, Bhubaneswar' },
  { key: 'OD_MKCG', name: 'MKCG Medical College & Hospital, Berhampur', type: 'medical_college', level: 'state', district: 'OD-GAN', state: 'OD', hasBloodBank: 1, lat: 19.3103, lng: 84.8014, address: 'Medical College Road, Berhampur' },
  { key: 'OD_VIMSAR', name: 'VIMSAR (VSS Institute of Medical Sciences & Research), Burla', type: 'medical_college', level: 'district', district: 'OD-SAM', state: 'OD', hasBloodBank: 0, lat: 21.4988, lng: 83.8744, address: 'Burla, Sambalpur' },

  // ─── Chhattisgarh (4)
  { key: 'CG_JNMMC', name: 'Pt. JN Memorial Medical College & Dr. BRAM Hospital, Raipur', type: 'medical_college', level: 'apex', district: 'CG-RAI', state: 'CG', hasBloodBank: 1, lat: 21.2514, lng: 81.6296, address: 'Jail Road, Katora Talab, Raipur' },
  { key: 'CG_AIIMS', name: 'AIIMS Raipur Apex Hospital', type: 'medical_college', level: 'apex', district: 'CG-RAI', state: 'CG', hasBloodBank: 1, lat: 21.2570, lng: 81.5794, address: 'GE Road, Tatibandh, Raipur' },
  { key: 'CG_CIMS', name: 'Chhattisgarh Institute of Medical Sciences (CIMS), Bilaspur', type: 'medical_college', level: 'state', district: 'CG-BIL', state: 'CG', hasBloodBank: 1, lat: 22.0797, lng: 82.1409, address: 'Sardar Patel Road, Bilaspur' },
  { key: 'CG_BRKM', name: 'Late BR Kashyap Memorial GMC Hospital, Jagdalpur', type: 'medical_college', level: 'district', district: 'CG-BAS', state: 'CG', hasBloodBank: 0, lat: 19.0831, lng: 82.0163, address: 'Dimrapal, Jagdalpur, Bastar' },

  // ─── Jharkhand (3)
  { key: 'JH_RIMS', name: 'Rajendra Institute of Medical Sciences (RIMS), Ranchi', type: 'medical_college', level: 'apex', district: 'JH-RAN', state: 'JH', hasBloodBank: 1, lat: 23.3857, lng: 85.3571, address: 'Bariatu, Ranchi' },
  { key: 'JH_MGM', name: 'Mahatma Gandhi Memorial (MGM) Medical College Hospital, Jamshedpur', type: 'medical_college', level: 'state', district: 'JH-EAS', state: 'JH', hasBloodBank: 1, lat: 22.7844, lng: 86.2081, address: 'Sakchi, Jamshedpur' },
  { key: 'JH_SNMMCH', name: 'Shahid Nirmal Mahto Medical College Hospital, Dhanbad', type: 'medical_college', level: 'district', district: 'JH-DHN', state: 'JH', hasBloodBank: 0, lat: 23.8143, lng: 86.4412, address: 'Saraidhela, Dhanbad' },

  // ─── Haryana (4)
  { key: 'HR_PGIMS', name: 'Pt. B.D. Sharma PGIMS, Rohtak', type: 'medical_college', level: 'apex', district: 'HR-ROH', state: 'HR', hasBloodBank: 1, lat: 28.8872, lng: 76.6067, address: 'Medical Morr, Rohtak' },
  { key: 'HR_KCGMC', name: 'Kalpana Chawla Govt Medical College Hospital, Karnal', type: 'medical_college', level: 'state', district: 'HR-KAR', state: 'HR', hasBloodBank: 1, lat: 29.6857, lng: 76.9905, address: 'Model Town, Karnal' },
  { key: 'HR_SHKM', name: 'Shaheed Hasan Khan Mewati GMC, Nalhar, Nuh', type: 'medical_college', level: 'district', district: 'HR-NUH', state: 'HR', hasBloodBank: 0, lat: 28.0967, lng: 76.9930, address: 'Nalhar, Nuh' },
  { key: 'HR_CIVIL_GUR', name: 'Civil Hospital, Sector 10, Gurugram', type: 'government_hospital', level: 'district', district: 'HR-GUR', state: 'HR', hasBloodBank: 1, lat: 28.4601, lng: 77.0155, address: 'Sector 10A, Gurugram' },

  // ─── Punjab (4)
  { key: 'PB_GMC_PAT', name: 'Govt Medical College & Rajindra Hospital, Patiala', type: 'medical_college', level: 'state', district: 'PB-PAT', state: 'PB', hasBloodBank: 1, lat: 30.3256, lng: 76.3867, address: 'Sangrur Road, Patiala' },
  { key: 'PB_GMC_ASR', name: 'Government Medical College, Amritsar', type: 'medical_college', level: 'state', district: 'PB-ASR', state: 'PB', hasBloodBank: 1, lat: 31.6517, lng: 74.8878, address: 'Majitha Road, Amritsar' },
  { key: 'PB_CIVIL_LUD', name: 'Civil Hospital, Ludhiana', type: 'government_hospital', level: 'district', district: 'PB-LUD', state: 'PB', hasBloodBank: 1, lat: 30.9010, lng: 75.8573, address: 'Old Jail Road, Field Ganj, Ludhiana' },
  { key: 'PB_GGSMCH', name: 'Guru Gobind Singh Medical College & Hospital, Faridkot', type: 'medical_college', level: 'district', district: 'PB-FAR', state: 'PB', hasBloodBank: 0, lat: 30.6769, lng: 74.7583, address: 'Sadiq Road, Faridkot' },

  // ─── Himachal Pradesh (3)
  { key: 'HP_IGMC', name: 'Indira Gandhi Medical College & Hospital (IGMC), Shimla', type: 'medical_college', level: 'state', district: 'HP-SHI', state: 'HP', hasBloodBank: 1, lat: 31.1065, lng: 77.1812, address: 'Ridge Road, Lakkar Bazar, Shimla' },
  { key: 'HP_RPGMC', name: 'Dr. Rajendra Prasad Govt Medical College (RPGMC), Tanda, Kangra', type: 'medical_college', level: 'state', district: 'HP-KAN', state: 'HP', hasBloodBank: 1, lat: 32.1009, lng: 76.3023, address: 'Tanda, Kangra' },
  { key: 'HP_SLBS', name: 'Shri Lal Bahadur Shastri GMC, Nerchowk, Mandi', type: 'medical_college', level: 'district', district: 'HP-MAN', state: 'HP', hasBloodBank: 0, lat: 31.6033, lng: 76.9242, address: 'Nerchowk, Mandi' },

  // ─── Uttarakhand (4)
  { key: 'UK_DOON', name: 'Government Doon Medical College & Hospital, Dehradun', type: 'medical_college', level: 'state', district: 'UK-DDN', state: 'UK', hasBloodBank: 1, lat: 30.3208, lng: 78.0389, address: 'Patehar Bazar, Dehradun' },
  { key: 'UK_AIIMS_RSH', name: 'AIIMS Rishikesh Apex Hospital', type: 'medical_college', level: 'apex', district: 'UK-DDN', state: 'UK', hasBloodBank: 1, lat: 30.0758, lng: 78.2883, address: 'Virbhadra Road, Rishikesh' },
  { key: 'UK_STH_HAL', name: 'Dr. Sushila Tiwari Government Hospital & GMC, Haldwani', type: 'medical_college', level: 'state', district: 'UK-NTL', state: 'UK', hasBloodBank: 1, lat: 29.2189, lng: 79.5128, address: 'Rampur Road, Haldwani, Nainital' },
  { key: 'UK_VCSG', name: 'Veer Chandra Singh Garhwali GMC Hospital, Srinagar', type: 'medical_college', level: 'district', district: 'UK-PAU', state: 'UK', hasBloodBank: 0, lat: 30.2228, lng: 78.7844, address: 'Srinagar, Pauri Garhwal' },

  // ─── Jammu & Kashmir (4)
  { key: 'JK_GMC_JAM', name: 'Government Medical College & Associated Hospitals, Jammu', type: 'medical_college', level: 'apex', district: 'JK-JAM', state: 'JK', hasBloodBank: 1, lat: 32.7357, lng: 74.8572, address: 'Bakshi Nagar, Jammu' },
  { key: 'JK_SKIMS', name: 'Sher-i-Kashmir Institute of Medical Sciences (SKIMS), Srinagar', type: 'medical_college', level: 'apex', district: 'JK-SRI', state: 'JK', hasBloodBank: 1, lat: 34.1356, lng: 74.8028, address: 'Soura, Srinagar' },
  { key: 'JK_SMHS', name: 'Government Medical College & SMHS Hospital, Srinagar', type: 'medical_college', level: 'state', district: 'JK-SRI', state: 'JK', hasBloodBank: 1, lat: 34.0867, lng: 74.8033, address: 'Karan Nagar, Srinagar' },
  { key: 'JK_DH_ANA', name: 'District Hospital, Anantnag', type: 'government_hospital', level: 'district', district: 'JK-ANA', state: 'JK', hasBloodBank: 0, lat: 33.7311, lng: 75.1489, address: 'Janglat Mandi, Anantnag' },

  // ─── Ladakh (3)
  { key: 'LA_SNM_LEH', name: 'Sonam Norboo Memorial (SNM) Hospital, Leh', type: 'government_hospital', level: 'state', district: 'LA-LEH', state: 'LA', hasBloodBank: 1, lat: 34.1528, lng: 77.5772, address: 'Skara, Leh' },
  { key: 'LA_DH_KAR', name: 'District Hospital Kargil', type: 'government_hospital', level: 'district', district: 'LA-KAR', state: 'LA', hasBloodBank: 1, lat: 34.5539, lng: 76.1328, address: 'Baroo, Kargil' },
  { key: 'LA_SDH_DIS', name: 'Sub-District Hospital Diskit, Nubra Valley', type: 'community_hospital', level: 'district', district: 'LA-LEH', state: 'LA', hasBloodBank: 0, lat: 34.5428, lng: 77.5614, address: 'Diskit, Nubra, Ladakh' },

  // ─── Chandigarh (3)
  { key: 'CH_PGIMER', name: 'Postgraduate Institute of Medical Education & Research (PGIMER), Chandigarh', type: 'medical_college', level: 'apex', district: 'CH-CHD', state: 'CH', hasBloodBank: 1, lat: 30.7656, lng: 76.7767, address: 'Madhya Marg, Sector 12, Chandigarh' },
  { key: 'CH_GMCH32', name: 'Government Medical College & Hospital (GMCH Sector 32), Chandigarh', type: 'medical_college', level: 'state', district: 'CH-CHD', state: 'CH', hasBloodBank: 1, lat: 30.7117, lng: 76.7881, address: 'Chandi Path, Sector 32, Chandigarh' },
  { key: 'CH_GMSH16', name: 'Government Multi-Specialty Hospital (GMSH Sector 16), Chandigarh', type: 'government_hospital', level: 'district', district: 'CH-CHD', state: 'CH', hasBloodBank: 1, lat: 30.7497, lng: 76.7825, address: 'Sector 16, Chandigarh' },

  // ─── Goa (3)
  { key: 'GA_GMC', name: 'Goa Medical College & Hospital (GMC), Bambolim', type: 'medical_college', level: 'state', district: 'GA-NG', state: 'GA', hasBloodBank: 1, lat: 15.4674, lng: 73.8560, address: 'NH 66, Bambolim, Tiswadi, Goa' },
  { key: 'GA_SGDH', name: 'South Goa District Hospital, Margao', type: 'government_hospital', level: 'district', district: 'GA-SG', state: 'GA', hasBloodBank: 1, lat: 15.2832, lng: 73.9685, address: 'Fatorda, Margao, South Goa' },
  { key: 'GA_SDH_PON', name: 'Sub-District Hospital, Ponda', type: 'community_hospital', level: 'district', district: 'GA-NG', state: 'GA', hasBloodBank: 0, lat: 15.4026, lng: 74.0152, address: 'Tisk, Ponda, Goa' },

  // ─── Assam (4)
  { key: 'AS_GMCH', name: 'Gauhati Medical College & Hospital (GMCH), Guwahati', type: 'medical_college', level: 'apex', district: 'AS-KAM', state: 'AS', hasBloodBank: 1, lat: 26.1558, lng: 91.7725, address: 'Narakasur Hilltop, Bhangagarh, Guwahati' },
  { key: 'AS_AMCH', name: 'Assam Medical College & Hospital (AMCH), Dibrugarh', type: 'medical_college', level: 'state', district: 'AS-DIB', state: 'AS', hasBloodBank: 1, lat: 27.4623, lng: 94.9392, address: 'Barbari, Dibrugarh' },
  { key: 'AS_SMCH', name: 'Silchar Medical College & Hospital, Silchar', type: 'medical_college', level: 'state', district: 'AS-CAC', state: 'AS', hasBloodBank: 1, lat: 24.7744, lng: 92.7937, address: 'Ghungoor, Silchar, Cachar' },
  { key: 'AS_JMCH', name: 'Jorhat Medical College & Hospital, Jorhat', type: 'medical_college', level: 'district', district: 'AS-JOR', state: 'AS', hasBloodBank: 0, lat: 26.7570, lng: 94.2180, address: 'Kushal Konwar Path, Jorhat' },

  // ─── Arunachal Pradesh (3)
  { key: 'AR_TRIHMS', name: 'Tomo Riba Institute of Health & Medical Sciences (TRIHMS), Naharlagun', type: 'medical_college', level: 'state', district: 'AR-ITA', state: 'AR', hasBloodBank: 1, lat: 27.1042, lng: 93.6934, address: 'Old Assembly Complex, Naharlagun, Itanagar' },
  { key: 'AR_BPGH', name: 'Bakin Pertin General Hospital, Pasighat', type: 'government_hospital', level: 'district', district: 'AR-PSG', state: 'AR', hasBloodBank: 1, lat: 28.0664, lng: 95.3262, address: 'Pasighat, East Siang' },
  { key: 'AR_DH_TWG', name: 'District Hospital, Tawang', type: 'government_hospital', level: 'district', district: 'AR-TWG', state: 'AR', hasBloodBank: 0, lat: 27.5861, lng: 91.8594, address: 'Old Market, Tawang' },

  // ─── Manipur (3)
  { key: 'MN_RIMS', name: 'Regional Institute of Medical Sciences (RIMS), Imphal', type: 'medical_college', level: 'apex', district: 'MN-IMP', state: 'MN', hasBloodBank: 1, lat: 24.8197, lng: 93.9228, address: 'Lamphelpat, Imphal' },
  { key: 'MN_JNIMS', name: 'Jawaharlal Nehru Institute of Medical Sciences (JNIMS), Porompat', type: 'medical_college', level: 'state', district: 'MN-IE', state: 'MN', hasBloodBank: 1, lat: 24.8089, lng: 93.9602, address: 'Porompat, Imphal East' },
  { key: 'MN_DH_CC', name: 'District Hospital, Churachandpur', type: 'government_hospital', level: 'district', district: 'MN-CC', state: 'MN', hasBloodBank: 0, lat: 24.3333, lng: 93.6833, address: 'IB Road, Churachandpur' },

  // ─── Meghalaya (3)
  { key: 'ML_NEIGRIHMS', name: 'NEIGRIHMS (North Eastern Indira Gandhi Regional Institute), Shillong', type: 'medical_college', level: 'apex', district: 'ML-EKH', state: 'ML', hasBloodBank: 1, lat: 25.5997, lng: 91.9372, address: 'Mawdiangdiang, Shillong' },
  { key: 'ML_CIVIL_SHI', name: 'Civil Hospital Shillong, East Khasi Hills', type: 'government_hospital', level: 'state', district: 'ML-EKH', state: 'ML', hasBloodBank: 1, lat: 25.5714, lng: 91.8803, address: 'Secretariat Hills, Shillong' },
  { key: 'ML_TURA_CH', name: 'Tura Civil Hospital, West Garo Hills', type: 'government_hospital', level: 'district', district: 'ML-WGH', state: 'ML', hasBloodBank: 0, lat: 25.5138, lng: 90.2206, address: 'Araimile, Tura' },

  // ─── Mizoram (3)
  { key: 'MZ_ZMC', name: 'Zoram Medical College (ZMC), Falkawn, Aizawl', type: 'medical_college', level: 'state', district: 'MZ-AIZ', state: 'MZ', hasBloodBank: 1, lat: 23.6339, lng: 92.7094, address: 'Falkawn, Aizawl' },
  { key: 'MZ_CIVIL_AIZ', name: 'Aizawl Civil Hospital, Aizawl', type: 'government_hospital', level: 'state', district: 'MZ-AIZ', state: 'MZ', hasBloodBank: 1, lat: 23.7307, lng: 92.7173, address: 'Dawrpui, Aizawl' },
  { key: 'MZ_DH_LUN', name: 'Lunglei District Hospital, Lunglei', type: 'government_hospital', level: 'district', district: 'MZ-LUN', state: 'MZ', hasBloodBank: 0, lat: 22.8872, lng: 92.7386, address: 'Serkawn, Lunglei' },

  // ─── Nagaland (3)
  { key: 'NL_NIMSR', name: 'Naga Hospital Authority Kohima (NIMSR Medical College), Kohima', type: 'medical_college', level: 'state', district: 'NL-KOH', state: 'NL', hasBloodBank: 1, lat: 25.6669, lng: 94.1086, address: 'Hospital Colony, Kohima' },
  { key: 'NL_DH_DIM', name: 'District Hospital Dimapur', type: 'government_hospital', level: 'district', district: 'NL-DIM', state: 'NL', hasBloodBank: 1, lat: 25.9068, lng: 93.7274, address: 'Circular Road, Dimapur' },
  { key: 'NL_DH_MOK', name: 'Imkongliba Memorial District Hospital, Mokokchung', type: 'government_hospital', level: 'district', district: 'NL-MOK', state: 'NL', hasBloodBank: 0, lat: 26.3262, lng: 94.5219, address: 'Yimyu Ward, Mokokchung' },

  // ─── Tripura (3)
  { key: 'TR_AGMC', name: 'Agartala Government Medical College & GBP Hospital, Agartala', type: 'medical_college', level: 'state', district: 'TR-WST', state: 'TR', hasBloodBank: 1, lat: 23.8569, lng: 91.2917, address: 'Kunjaban, Agartala' },
  { key: 'TR_TMC', name: 'Tripura Medical College & Dr. BRAM Teaching Hospital, Hapania', type: 'medical_college', level: 'state', district: 'TR-WST', state: 'TR', hasBloodBank: 1, lat: 23.7844, lng: 91.2806, address: 'Hapania, Agartala' },
  { key: 'TR_DH_GOM', name: 'Gomati District Hospital, Tepania, Udaipur', type: 'government_hospital', level: 'district', district: 'TR-GOM', state: 'TR', hasBloodBank: 0, lat: 23.5350, lng: 91.4928, address: 'Tepania, Udaipur, Gomati' },

  // ─── Sikkim (3)
  { key: 'SK_STNM', name: 'Sir Thutob Namgyal Memorial (STNM) Hospital, Sochakgang, Gangtok', type: 'medical_college', level: 'state', district: 'SK-GAN', state: 'SK', hasBloodBank: 1, lat: 27.3167, lng: 88.6000, address: 'Sochakgang, Sichey, Gangtok' },
  { key: 'SK_DH_NAM', name: 'Namchi District Hospital, South Sikkim', type: 'government_hospital', level: 'district', district: 'SK-NAM', state: 'SK', hasBloodBank: 1, lat: 27.1667, lng: 88.3500, address: 'Namchi, South Sikkim' },
  { key: 'SK_DH_GYA', name: 'Gyalshing District Hospital, West Sikkim', type: 'government_hospital', level: 'district', district: 'SK-GYA', state: 'SK', hasBloodBank: 0, lat: 27.2833, lng: 88.2500, address: 'Gyalshing, West Sikkim' },

  // ─── Andaman and Nicobar Islands (3)
  { key: 'AN_ANIIMS', name: 'G.B. Pant Hospital (ANIIMS), Port Blair', type: 'medical_college', level: 'state', district: 'AN-SOU', state: 'AN', hasBloodBank: 1, lat: 11.6667, lng: 92.7333, address: 'Atlanta Point, Port Blair, South Andaman' },
  { key: 'AN_RP_MAY', name: 'Dr. R.P. Hospital, Mayabunder', type: 'government_hospital', level: 'district', district: 'AN-NOR', state: 'AN', hasBloodBank: 0, lat: 12.9242, lng: 92.9289, address: 'Mayabunder, North & Middle Andaman' },
  { key: 'AN_BJR_NIC', name: 'BJR Hospital, Car Nicobar', type: 'community_hospital', level: 'district', district: 'AN-NIC', state: 'AN', hasBloodBank: 0, lat: 9.1558, lng: 92.7758, address: 'Headquarters, Car Nicobar Island' },

  // ─── Dadra and Nagar Haveli and Daman and Diu (3)
  { key: 'DN_VBCH', name: 'Shri Vinoba Bhave Civil Hospital (NAMO Medical College), Silvassa', type: 'medical_college', level: 'state', district: 'DN-SIL', state: 'DN', hasBloodBank: 1, lat: 20.2667, lng: 73.0167, address: 'Sayli Road, Silvassa' },
  { key: 'DN_GH_DAM', name: 'Government Hospital Marwad, Daman', type: 'government_hospital', level: 'district', district: 'DN-DAM', state: 'DN', hasBloodBank: 1, lat: 20.4283, lng: 72.8397, address: 'Marwad, Nani Daman' },
  { key: 'DN_GH_DIU', name: 'Government Hospital Diu, Diu', type: 'government_hospital', level: 'district', district: 'DN-DIU', state: 'DN', hasBloodBank: 0, lat: 20.7144, lng: 70.9875, address: 'Fort Road, Diu' },

  // ─── Lakshadweep (3)
  { key: 'LD_IGH_KAV', name: 'Indira Gandhi Hospital, Kavaratti Island', type: 'government_hospital', level: 'state', district: 'LD-KAV', state: 'LD', hasBloodBank: 1, lat: 10.5667, lng: 72.6367, address: 'Kavaratti Island, UT of Lakshadweep' },
  { key: 'LD_RGH_AGA', name: 'Rajiv Gandhi Specialty Hospital, Agatti Island', type: 'government_hospital', level: 'district', district: 'LD-AGA', state: 'LD', hasBloodBank: 0, lat: 10.8533, lng: 72.1931, address: 'Agatti Island, Lakshadweep' },
  { key: 'LD_GH_AMI', name: 'Government Community Hospital, Amini Island', type: 'community_hospital', level: 'district', district: 'LD-AMI', state: 'LD', hasBloodBank: 0, lat: 11.1242, lng: 72.7267, address: 'Amini Island, Lakshadweep' },
];

export function getFacilitySector(type: string, name?: string): 'government' | 'defence_railway' | 'private' | 'health_centre' {
  const normType = (type || '').toLowerCase();
  const normName = (name || '').toLowerCase();

  if (
    normType === 'military_hospital' ||
    normType === 'railway_hospital' ||
    normName.includes('military') ||
    normName.includes('railway') ||
    normName.includes('port trust') ||
    normName.includes('esic') ||
    normName.includes('echs') ||
    normName.includes('air force')
  ) {
    return 'defence_railway';
  }

  if (
    normType === 'chc' ||
    normType === 'phc' ||
    normName.includes('community health') ||
    normName.includes('primary health') ||
    normName.includes('chc') ||
    normName.includes('phc') ||
    normName.includes('uphc')
  ) {
    return 'health_centre';
  }

  if (
    normType === 'private_hospital' ||
    normName.includes('apollo') ||
    normName.includes('miot') ||
    normName.includes('sims') ||
    normName.includes('fortis') ||
    normName.includes('kauvery') ||
    normName.includes('mgm healthcare') ||
    normName.includes('gleneagles') ||
    normName.includes('rela') ||
    normName.includes('srmc') ||
    normName.includes('vijaya') ||
    normName.includes('prashanth') ||
    normName.includes('chettinad') ||
    normName.includes('surya') ||
    normName.includes('krishna') ||
    normName.includes('annamalai medicare') ||
    normName.includes('be well') ||
    normName.includes('st. joseph') ||
    normName.includes('auroville') ||
    normName.includes('santigiri') ||
    normName.includes('east coast') ||
    normName.includes('vinayaka mission') ||
    normName.includes('manakula vinayagar') ||
    normName.includes('mahatma gandhi medical') ||
    normName.includes('aarupadai veedu') ||
    normName.includes('venkateshwaraa') ||
    normName.includes('slims') ||
    normName.includes('pims')
  ) {
    return 'private';
  }

  return 'government';
}

