export interface AuthUserData {
  id: string;
  username: string;
  role: 'hospital' | 'state' | 'national';
  facility_id: string | null;
  state_id: string | null;
  full_name: string;
  facility_name?: string;
  state_name?: string;
}

export interface DemoAccount {
  user: string;
  pass: string;
  role: 'hospital' | 'state' | 'national';
  fullName: string;
  stateName?: string;
  stateId?: string;
  facilityName?: string;
  facilityId?: string;
}

export const KNOWN_ACCOUNTS: DemoAccount[] = [
  // National
  {
    user: 'national_monitor_01',
    pass: 'BHISSM@National#01',
    role: 'national',
    fullName: 'National Strategic Stockpile Monitor',
    stateName: 'Union Government',
  },
  {
    user: 'national_director_01',
    pass: 'BHISSM@National#Dir01',
    role: 'national',
    fullName: 'National Health Logistics Directorate',
    stateName: 'Union Government',
  },

  // Puducherry
  {
    user: 'state_puducherry_admin',
    pass: 'BHISSM@State#PY',
    role: 'state',
    fullName: 'Puducherry State Health Command',
    stateName: 'Puducherry',
    stateId: 'puducherry-state-id',
  },
  {
    user: 'state_py_admin',
    pass: 'BHISSM@State#PY',
    role: 'state',
    fullName: 'Puducherry State Health Command',
    stateName: 'Puducherry',
    stateId: 'puducherry-state-id',
  },
  {
    user: 'hospital_puducherry_01',
    pass: 'BHISSM@Demo#P01',
    role: 'hospital',
    fullName: 'Government General Hospital Puducherry Node',
    facilityName: 'Indira Gandhi Govt General Hospital, Puducherry',
    facilityId: 'fac-iggh-py',
    stateName: 'Puducherry',
  },
  {
    user: 'hospital_jipmer_01',
    pass: 'BHISSM@Demo#J01',
    role: 'hospital',
    fullName: 'JIPMER Apex Hospital Command Node',
    facilityName: 'JIPMER Apex Institute, Puducherry',
    facilityId: 'fac-jipmer-py',
    stateName: 'Puducherry',
  },
  {
    user: 'hospital_pims_01',
    pass: 'BHISSM@Demo#PIMS01',
    role: 'hospital',
    fullName: 'PIMS Kalapet Medical College Node',
    facilityName: 'Pondicherry Institute of Medical Sciences (PIMS)',
    facilityId: 'fac-pims-py',
    stateName: 'Puducherry',
  },

  // Tamil Nadu
  {
    user: 'state_tamilnadu_admin',
    pass: 'BHISSM@State#TN',
    role: 'state',
    fullName: 'Tamil Nadu State Health Command',
    stateName: 'Tamil Nadu',
    stateId: 'tamil-nadu-state-id',
  },
  {
    user: 'state_tn_admin',
    pass: 'BHISSM@State#TN',
    role: 'state',
    fullName: 'Tamil Nadu State Health Command',
    stateName: 'Tamil Nadu',
    stateId: 'tamil-nadu-state-id',
  },
  {
    user: 'hospital_rajivgandhi_01',
    pass: 'BHISSM@Demo#TN02',
    role: 'hospital',
    fullName: 'Rajiv Gandhi Govt General Hospital Node',
    facilityName: 'Rajiv Gandhi Govt General Hospital, Chennai',
    facilityId: 'fac-rggh-chn',
    stateName: 'Tamil Nadu',
  },
  {
    user: 'hospital_stanley_01',
    pass: 'BHISSM@Demo#TN01',
    role: 'hospital',
    fullName: 'Govt Stanley Medical College Hospital Node',
    facilityName: 'Govt Stanley Medical College Hospital, Chennai',
    facilityId: 'fac-stanley-chn',
    stateName: 'Tamil Nadu',
  },
  {
    user: 'hospital_villupuram_01',
    pass: 'BHISSM@Demo#V01',
    role: 'hospital',
    fullName: 'Villupuram Govt Medical College Hospital Node',
    facilityName: 'Villupuram Govt Medical College Hospital (GVMCH)',
    facilityId: 'fac-gvmch-vil',
    stateName: 'Tamil Nadu',
  },
  {
    user: 'hospital_cuddalore_01',
    pass: 'BHISSM@Demo#C01',
    role: 'hospital',
    fullName: 'Cuddalore District General Hospital Node',
    facilityName: 'Cuddalore District Headquarters Hospital',
    facilityId: 'fac-dh-cuddalore',
    stateName: 'Tamil Nadu',
  },
  {
    user: 'hospital_mh_chennai_01',
    pass: 'BHISSM@Demo#MH01',
    role: 'hospital',
    fullName: 'Military Hospital Chennai (Defence) Command Node',
    facilityName: 'Military Hospital Chennai (AFMS Defence)',
    facilityId: 'fac-mh-chennai',
    stateName: 'Tamil Nadu',
  },
  {
    user: 'hospital_railway_perambur_01',
    pass: 'BHISSM@Demo#SR01',
    role: 'hospital',
    fullName: 'Southern Railway HQ Hospital Perambur Node',
    facilityName: 'Southern Railway Headquarters Hospital, Perambur',
    facilityId: 'fac-railway-perambur',
    stateName: 'Tamil Nadu',
  },
  {
    user: 'hospital_apollo_chennai_01',
    pass: 'BHISSM@Demo#APO01',
    role: 'hospital',
    fullName: 'Apollo Hospitals Main Greams Road Node',
    facilityName: 'Apollo Hospitals Main, Greams Road, Chennai',
    facilityId: 'fac-apollo-chennai',
    stateName: 'Tamil Nadu',
  },

  // Delhi & AIIMS
  {
    user: 'state_dl_admin',
    pass: 'BHISSM@State#DL',
    role: 'state',
    fullName: 'Delhi UT Health Command',
    stateName: 'Delhi',
    stateId: 'delhi-state-id',
  },
  {
    user: 'hospital_aiims_01',
    pass: 'BHISSM@Demo#DL01',
    role: 'hospital',
    fullName: 'AIIMS New Delhi Command Node',
    facilityName: 'AIIMS New Delhi Apex Institute',
    facilityId: 'fac-aiims-delhi',
    stateName: 'Delhi',
  },

  // Karnataka & Victoria
  {
    user: 'state_ka_admin',
    pass: 'BHISSM@State#KA',
    role: 'state',
    fullName: 'Karnataka State Health Command',
    stateName: 'Karnataka',
    stateId: 'karnataka-state-id',
  },
  {
    user: 'hospital_victoria_01',
    pass: 'BHISSM@Demo#KA01',
    role: 'hospital',
    fullName: 'Victoria Hospital Bengaluru Command Node',
    facilityName: 'Victoria Hospital (BMCRI), Bengaluru',
    facilityId: 'fac-victoria-blr',
    stateName: 'Karnataka',
  },

  // Maharashtra & KEM
  {
    user: 'state_mh_admin',
    pass: 'BHISSM@State#MH',
    role: 'state',
    fullName: 'Maharashtra State Health Command',
    stateName: 'Maharashtra',
    stateId: 'maharashtra-state-id',
  },
  {
    user: 'hospital_kem_01',
    pass: 'BHISSM@Demo#MH01',
    role: 'hospital',
    fullName: 'KEM Hospital Mumbai Command Node',
    facilityName: 'KEM Hospital & Seth GS Medical College, Mumbai',
    facilityId: 'fac-kem-mum',
    stateName: 'Maharashtra',
  },
];

export function findKnownAccount(username: string, password?: string): DemoAccount | null {
  const cleanUser = username.trim().toLowerCase();
  const acc = KNOWN_ACCOUNTS.find((a) => a.user.toLowerCase() === cleanUser);
  if (!acc) {
    // If starts with state_
    if (cleanUser.startsWith('state_')) {
      const code = cleanUser.replace('state_', '').replace('_admin', '').toUpperCase();
      return {
        user: username,
        pass: password || `BHISSM@State#${code}`,
        role: 'state',
        fullName: `${code} State Health Command`,
        stateName: `${code} State Command`,
        stateId: `state-${code.toLowerCase()}`,
      };
    }
    // If starts with hospital_
    if (cleanUser.startsWith('hospital_')) {
      return {
        user: username,
        pass: password || 'BHISSM@Demo#01',
        role: 'hospital',
        fullName: `${username.toUpperCase()} Node`,
        facilityName: `${username.toUpperCase()} Facility`,
        facilityId: `fac-${cleanUser}`,
      };
    }
    return null;
  }
  return acc;
}
