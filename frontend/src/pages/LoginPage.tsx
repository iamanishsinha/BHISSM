import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import {
  Globe,
  Landmark,
  Hospital,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Sparkles,
  Search,
  MapPin,
  Filter
} from 'lucide-react';

interface CredentialItem {
  label: string;
  user: string;
  pass: string;
  role: 'National' | 'State' | 'Hospital';
  region: 'National' | 'North' | 'South' | 'West' | 'East' | 'Central' | 'North-East' | 'Union Territories';
  stateName: string;
  jurisdiction: string;
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('state_puducherry_admin');
  const [password, setPassword] = useState('BHISSM@State#PY');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'national' | 'state' | 'hospital'>('all');

  // If already logged in, redirect immediately to dashboard
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handlePerformLogin = async (userToAuth: string, passToAuth: string) => {
    setError('');
    setLoading(true);
    try {
      await login(userToAuth, passToAuth);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      if (!err.response) {
        setError(`Cannot reach BHISSM API (${err.message || 'Network Error'}). Please check /api/health.`);
      } else {
        const errorText =
          err.response?.data?.error ||
          err.response?.data?.message ||
          `HTTP ${err.response.status}: Authentication failed`;
        setError(errorText);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePerformLogin(username, password);
  };

  const demoCredentials: CredentialItem[] = [
    // ─── 1. National Command Grid
    {
      label: 'National Strategic Stockpile Monitor',
      user: 'national_monitor_01',
      pass: 'BHISSM@National#01',
      role: 'National',
      region: 'National',
      stateName: 'Union Government',
      jurisdiction: 'Apex Authority • Central Reserves, Interstate Dispatches & Disaster Escalation (>500)',
    },
    {
      label: 'National Health Logistics Directorate',
      user: 'national_director_01',
      pass: 'BHISSM@National#Dir01',
      role: 'National',
      region: 'National',
      stateName: 'Union Government',
      jurisdiction: 'Central Disaster Health Coordinator • Nationwide Stockpile Logistics',
    },

    // ─── 2. Southern Region States & UTs
    {
      label: 'Puducherry State Health Command',
      user: 'state_py_admin',
      pass: 'BHISSM@State#PY',
      role: 'State',
      region: 'South',
      stateName: 'Puducherry',
      jurisdiction: 'Puducherry UT Health Department • State Reserve Depot & Regional Redistribution',
    },
    {
      label: 'JIPMER Apex Hospital Node',
      user: 'hospital_jipmer_01',
      pass: 'BHISSM@Demo#J01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Puducherry',
      jurisdiction: 'JIPMER Apex Institute of National Importance, Puducherry',
    },
    {
      label: 'Indira Gandhi GH Puducherry Node',
      user: 'hospital_puducherry_01',
      pass: 'BHISSM@Demo#P01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Puducherry',
      jurisdiction: 'Indira Gandhi Govt General Hospital, White Town, Puducherry',
    },
    {
      label: 'PIMS Kalapet Medical College Node',
      user: 'hospital_pims_01',
      pass: 'BHISSM@Demo#PIMS01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Puducherry',
      jurisdiction: 'Pondicherry Institute of Medical Sciences, Kalapet, Puducherry',
    },
    {
      label: 'Tamil Nadu State Health Command',
      user: 'state_tn_admin',
      pass: 'BHISSM@State#TN',
      role: 'State',
      region: 'South',
      stateName: 'Tamil Nadu',
      jurisdiction: 'Tamil Nadu State Health Directorate • TNMSC Warehouses & District Network',
    },
    {
      label: 'Rajiv Gandhi GH Chennai Node',
      user: 'hospital_rajivgandhi_01',
      pass: 'BHISSM@Demo#TN02',
      role: 'Hospital',
      region: 'South',
      stateName: 'Tamil Nadu',
      jurisdiction: 'Rajiv Gandhi Govt General Hospital (Madras Medical College), Chennai',
    },
    {
      label: 'Govt Stanley Medical College Node',
      user: 'hospital_stanley_01',
      pass: 'BHISSM@Demo#TN01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Tamil Nadu',
      jurisdiction: 'Government Stanley Medical College Hospital, Royapuram, Chennai',
    },
    {
      label: 'Military Hospital Chennai (Defence) Node',
      user: 'hospital_mh_chennai_01',
      pass: 'BHISSM@Demo#MH01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Tamil Nadu',
      jurisdiction: 'Military Hospital Chennai, Nandambakkam • Armed Forces Medical Services',
    },
    {
      label: 'Southern Railway HQ Hospital Node',
      user: 'hospital_railway_perambur_01',
      pass: 'BHISSM@Demo#SR01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Tamil Nadu',
      jurisdiction: 'Southern Railway Headquarters Hospital, Perambur, Chennai',
    },
    {
      label: 'Apollo Hospitals Main Chennai Node',
      user: 'hospital_apollo_chennai_01',
      pass: 'BHISSM@Demo#APO01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Tamil Nadu',
      jurisdiction: 'Apollo Hospitals Main, Greams Road • Private Multi-Specialty Tertiary',
    },
    {
      label: 'Villupuram Govt Medical College Node',
      user: 'hospital_villupuram_01',
      pass: 'BHISSM@Demo#V01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Tamil Nadu',
      jurisdiction: 'Government Villupuram Medical College Hospital (GVMCH), Mundiyampakkam',
    },
    {
      label: 'Cuddalore District General Hospital Node',
      user: 'hospital_cuddalore_01',
      pass: 'BHISSM@Demo#C01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Tamil Nadu',
      jurisdiction: 'Government District Headquarters Hospital, Manjakuppam, Cuddalore',
    },
    {
      label: 'Karnataka State Health Command',
      user: 'state_ka_admin',
      pass: 'BHISSM@State#KA',
      role: 'State',
      region: 'South',
      stateName: 'Karnataka',
      jurisdiction: 'Karnataka Health & Family Welfare Directorate, Bengaluru',
    },
    {
      label: 'Victoria Hospital Bengaluru Node',
      user: 'hospital_victoria_01',
      pass: 'BHISSM@Demo#KA01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Karnataka',
      jurisdiction: 'Victoria Hospital (Bangalore Medical College - BMCRI), Bengaluru',
    },
    {
      label: 'Kerala State Health Command',
      user: 'state_kl_admin',
      pass: 'BHISSM@State#KL',
      role: 'State',
      region: 'South',
      stateName: 'Kerala',
      jurisdiction: 'Kerala Health Services Directorate, Thiruvananthapuram',
    },
    {
      label: 'GMC Thiruvananthapuram Node',
      user: 'hospital_gmct_01',
      pass: 'BHISSM@Demo#KL01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Kerala',
      jurisdiction: 'Government Medical College, Medical College PO, Thiruvananthapuram',
    },
    {
      label: 'Andhra Pradesh State Health Authority',
      user: 'state_ap_admin',
      pass: 'BHISSM@State#AP',
      role: 'State',
      region: 'South',
      stateName: 'Andhra Pradesh',
      jurisdiction: 'Andhra Pradesh State Health Authority, Vijayawada',
    },
    {
      label: 'King George Hospital Vizag Node',
      user: 'hospital_kgh_01',
      pass: 'BHISSM@Demo#AP01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Andhra Pradesh',
      jurisdiction: 'King George Hospital (Andhra Medical College), Visakhapatnam',
    },
    {
      label: 'Telangana State Health Command',
      user: 'state_tg_admin',
      pass: 'BHISSM@State#TG',
      role: 'State',
      region: 'South',
      stateName: 'Telangana',
      jurisdiction: 'Telangana Health & Family Welfare Department, Hyderabad',
    },
    {
      label: 'Osmania General Hospital Node',
      user: 'hospital_osmania_01',
      pass: 'BHISSM@Demo#TG01',
      role: 'Hospital',
      region: 'South',
      stateName: 'Telangana',
      jurisdiction: 'Osmania General Hospital, Afzal Gunj, Hyderabad',
    },
    {
      label: 'Lakshadweep UT Health Command',
      user: 'state_ld_admin',
      pass: 'BHISSM@State#LD',
      role: 'State',
      region: 'South',
      stateName: 'Lakshadweep',
      jurisdiction: 'Lakshadweep Health Services Directorate, Kavaratti',
    },

    // ─── 3. Northern Region States & UTs
    {
      label: 'Delhi UT Health Command',
      user: 'state_dl_admin',
      pass: 'BHISSM@State#DL',
      role: 'State',
      region: 'North',
      stateName: 'Delhi',
      jurisdiction: 'Delhi State Health Mission & Central Drug Depot, New Delhi',
    },
    {
      label: 'AIIMS New Delhi Apex Node',
      user: 'hospital_aiims_01',
      pass: 'BHISSM@Demo#DL01',
      role: 'Hospital',
      region: 'North',
      stateName: 'Delhi',
      jurisdiction: 'All India Institute of Medical Sciences (AIIMS Delhi), Ansari Nagar',
    },
    {
      label: 'Safdarjung Hospital Node',
      user: 'hospital_sjh_01',
      pass: 'BHISSM@Demo#DL02',
      role: 'Hospital',
      region: 'North',
      stateName: 'Delhi',
      jurisdiction: 'Safdarjung Hospital & VMMC, New Delhi',
    },
    {
      label: 'Uttar Pradesh State Health Command',
      user: 'state_up_admin',
      pass: 'BHISSM@State#UP',
      role: 'State',
      region: 'North',
      stateName: 'Uttar Pradesh',
      jurisdiction: 'Uttar Pradesh Medical Health & Family Welfare, Lucknow',
    },
    {
      label: 'KGMU Lucknow Command Node',
      user: 'hospital_kgmu_01',
      pass: 'BHISSM@Demo#UP01',
      role: 'Hospital',
      region: 'North',
      stateName: 'Uttar Pradesh',
      jurisdiction: "King George's Medical University (KGMU), Chowk, Lucknow",
    },
    {
      label: 'RMLIMS Lucknow Node',
      user: 'hospital_rmlims_01',
      pass: 'BHISSM@Demo#UP02',
      role: 'Hospital',
      region: 'North',
      stateName: 'Uttar Pradesh',
      jurisdiction: 'Dr. Ram Manohar Lohia Institute of Medical Sciences, Gomti Nagar',
    },
    {
      label: 'Haryana State Health Command',
      user: 'state_hr_admin',
      pass: 'BHISSM@State#HR',
      role: 'State',
      region: 'North',
      stateName: 'Haryana',
      jurisdiction: 'Haryana Health Services Directorate, Panchkula / Chandigarh',
    },
    {
      label: 'Punjab State Health Command',
      user: 'state_pb_admin',
      pass: 'BHISSM@State#PB',
      role: 'State',
      region: 'North',
      stateName: 'Punjab',
      jurisdiction: 'Punjab Health & Family Welfare Department, Chandigarh',
    },
    {
      label: 'Himachal Pradesh Health Command',
      user: 'state_hp_admin',
      pass: 'BHISSM@State#HP',
      role: 'State',
      region: 'North',
      stateName: 'Himachal Pradesh',
      jurisdiction: 'Himachal Pradesh Directorate of Health Services, Shimla',
    },
    {
      label: 'Uttarakhand State Health Command',
      user: 'state_uk_admin',
      pass: 'BHISSM@State#UK',
      role: 'State',
      region: 'North',
      stateName: 'Uttarakhand',
      jurisdiction: 'Uttarakhand Medical Health & Family Welfare, Dehradun',
    },
    {
      label: 'Govt Doon Hospital Dehradun Node',
      user: 'hospital_doon_01',
      pass: 'BHISSM@Demo#UK01',
      role: 'Hospital',
      region: 'North',
      stateName: 'Uttarakhand',
      jurisdiction: 'Government Doon Medical College & Hospital, Dehradun',
    },
    {
      label: 'Jammu & Kashmir UT Health Command',
      user: 'state_jk_admin',
      pass: 'BHISSM@State#JK',
      role: 'State',
      region: 'North',
      stateName: 'Jammu and Kashmir',
      jurisdiction: 'Health & Medical Education Department J&K, Srinagar / Jammu',
    },
    {
      label: 'GMC Hospital Jammu Node',
      user: 'hospital_gmc_jammu_01',
      pass: 'BHISSM@Demo#JK01',
      role: 'Hospital',
      region: 'North',
      stateName: 'Jammu and Kashmir',
      jurisdiction: 'Government Medical College & Associated Hospitals, Bakshi Nagar, Jammu',
    },
    {
      label: 'Ladakh UT Health Command',
      user: 'state_la_admin',
      pass: 'BHISSM@State#LA',
      role: 'State',
      region: 'North',
      stateName: 'Ladakh',
      jurisdiction: 'Health Services Directorate, UT of Ladakh, Leh',
    },
    {
      label: 'Chandigarh UT Health Command',
      user: 'state_ch_admin',
      pass: 'BHISSM@State#CH',
      role: 'State',
      region: 'North',
      stateName: 'Chandigarh',
      jurisdiction: 'Chandigarh Administration Health Department, Chandigarh',
    },
    {
      label: 'PGIMER Chandigarh Apex Node',
      user: 'hospital_pgimer_01',
      pass: 'BHISSM@Demo#CH01',
      role: 'Hospital',
      region: 'North',
      stateName: 'Chandigarh',
      jurisdiction: 'Postgraduate Institute of Medical Education & Research (PGIMER), Chandigarh',
    },

    // ─── 4. Western Region States & UTs
    {
      label: 'Maharashtra Public Health Directorate',
      user: 'state_mh_admin',
      pass: 'BHISSM@State#MH',
      role: 'State',
      region: 'West',
      stateName: 'Maharashtra',
      jurisdiction: 'Public Health Department, Government of Maharashtra, Mumbai',
    },
    {
      label: 'KEM Hospital Mumbai Command Node',
      user: 'hospital_kem_01',
      pass: 'BHISSM@Demo#MH01',
      role: 'Hospital',
      region: 'West',
      stateName: 'Maharashtra',
      jurisdiction: 'King Edward Memorial Hospital & Seth GS Medical College, Parel, Mumbai',
    },
    {
      label: 'Sir JJ Hospital Mumbai Node',
      user: 'hospital_jj_01',
      pass: 'BHISSM@Demo#MH02',
      role: 'Hospital',
      region: 'West',
      stateName: 'Maharashtra',
      jurisdiction: 'Sir J.J. Group of Government Hospitals & Grant Medical College, Mumbai',
    },
    {
      label: 'Gujarat Health & Family Welfare',
      user: 'state_gj_admin',
      pass: 'BHISSM@State#GJ',
      role: 'State',
      region: 'West',
      stateName: 'Gujarat',
      jurisdiction: 'Health & Family Welfare Department, Gandhinagar',
    },
    {
      label: 'Civil Hospital Ahmedabad Node',
      user: 'hospital_civil_ahm_01',
      pass: 'BHISSM@Demo#GJ01',
      role: 'Hospital',
      region: 'West',
      stateName: 'Gujarat',
      jurisdiction: 'Civil Hospital & BJ Medical College, Asarwa, Ahmedabad',
    },
    {
      label: 'Rajasthan Medical & Health Command',
      user: 'state_rj_admin',
      pass: 'BHISSM@State#RJ',
      role: 'State',
      region: 'West',
      stateName: 'Rajasthan',
      jurisdiction: 'Medical Health & Family Welfare Department, Jaipur',
    },
    {
      label: 'SMS Hospital Jaipur Node',
      user: 'hospital_sms_01',
      pass: 'BHISSM@Demo#RJ01',
      role: 'Hospital',
      region: 'West',
      stateName: 'Rajasthan',
      jurisdiction: 'Sawai Man Singh (SMS) Hospital & Medical College, Jaipur',
    },
    {
      label: 'Goa Directorate of Health Services',
      user: 'state_ga_admin',
      pass: 'BHISSM@State#GA',
      role: 'State',
      region: 'West',
      stateName: 'Goa',
      jurisdiction: 'Directorate of Health Services, Campal, Panaji, Goa',
    },
    {
      label: 'Dadra & Nagar Haveli & Daman & Diu UT',
      user: 'state_dn_admin',
      pass: 'BHISSM@State#DN',
      role: 'State',
      region: 'West',
      stateName: 'Dadra and Nagar Haveli and Daman and Diu',
      jurisdiction: 'Health & Medical Services Directorate, Silvassa',
    },

    // ─── 5. Eastern Region States & UTs
    {
      label: 'West Bengal Health & Family Welfare',
      user: 'state_wb_admin',
      pass: 'BHISSM@State#WB',
      role: 'State',
      region: 'East',
      stateName: 'West Bengal',
      jurisdiction: 'Department of Health & Family Welfare, Swasthya Bhawan, Kolkata',
    },
    {
      label: 'Calcutta Medical College Node',
      user: 'hospital_calcutta_mc_01',
      pass: 'BHISSM@Demo#WB01',
      role: 'Hospital',
      region: 'East',
      stateName: 'West Bengal',
      jurisdiction: 'Medical College and Hospital (Calcutta Medical College), College St, Kolkata',
    },
    {
      label: 'Bihar Health Department Command',
      user: 'state_br_admin',
      pass: 'BHISSM@State#BR',
      role: 'State',
      region: 'East',
      stateName: 'Bihar',
      jurisdiction: 'State Health Society Bihar, Vikas Bhawan, Patna',
    },
    {
      label: 'Patna Medical College Hospital Node',
      user: 'hospital_pmch_01',
      pass: 'BHISSM@Demo#BR01',
      role: 'Hospital',
      region: 'East',
      stateName: 'Bihar',
      jurisdiction: 'Patna Medical College & Hospital (PMCH), Ashok Rajpath, Patna',
    },
    {
      label: 'Jharkhand Health Services Command',
      user: 'state_jh_admin',
      pass: 'BHISSM@State#JH',
      role: 'State',
      region: 'East',
      stateName: 'Jharkhand',
      jurisdiction: 'Department of Health Medical Education & Family Welfare, Ranchi',
    },
    {
      label: 'Odisha Health & Family Welfare',
      user: 'state_od_admin',
      pass: 'BHISSM@State#OD',
      role: 'State',
      region: 'East',
      stateName: 'Odisha',
      jurisdiction: 'Health & Family Welfare Department, Secretariat, Bhubaneswar',
    },
    {
      label: 'SCB Medical College Cuttack Node',
      user: 'hospital_scb_01',
      pass: 'BHISSM@Demo#OD01',
      role: 'Hospital',
      region: 'East',
      stateName: 'Odisha',
      jurisdiction: 'SCB Medical College & Hospital, Mangalabag, Cuttack',
    },
    {
      label: 'Andaman & Nicobar UT Health Command',
      user: 'state_an_admin',
      pass: 'BHISSM@State#AN',
      role: 'State',
      region: 'East',
      stateName: 'Andaman and Nicobar Islands',
      jurisdiction: 'Directorate of Health Services, A&N Administration, Port Blair',
    },

    // ─── 6. Central Region States
    {
      label: 'Madhya Pradesh Public Health Command',
      user: 'state_mp_admin',
      pass: 'BHISSM@State#MP',
      role: 'State',
      region: 'Central',
      stateName: 'Madhya Pradesh',
      jurisdiction: 'Public Health and Medical Education Department, Bhopal',
    },
    {
      label: 'Hamidia Hospital Bhopal Node',
      user: 'hospital_hamidia_01',
      pass: 'BHISSM@Demo#MP01',
      role: 'Hospital',
      region: 'Central',
      stateName: 'Madhya Pradesh',
      jurisdiction: 'Hamidia Hospital (Gandhi Medical College), Sultania Road, Bhopal',
    },
    {
      label: 'Chhattisgarh Health & Family Welfare',
      user: 'state_cg_admin',
      pass: 'BHISSM@State#CG',
      role: 'State',
      region: 'Central',
      stateName: 'Chhattisgarh',
      jurisdiction: 'Department of Health & Family Welfare, Mahanadi Bhawan, Raipur',
    },

    // ─── 7. North-Eastern Region States
    {
      label: 'Assam Health & Family Welfare Command',
      user: 'state_as_admin',
      pass: 'BHISSM@State#AS',
      role: 'State',
      region: 'North-East',
      stateName: 'Assam',
      jurisdiction: 'Health & Family Welfare Department, Janata Bhawan, Dispur, Guwahati',
    },
    {
      label: 'Gauhati Medical College Hospital Node',
      user: 'hospital_gmch_01',
      pass: 'BHISSM@Demo#AS01',
      role: 'Hospital',
      region: 'North-East',
      stateName: 'Assam',
      jurisdiction: 'Gauhati Medical College & Hospital (GMCH), Bhangagarh, Guwahati',
    },
    {
      label: 'Arunachal Pradesh Health Command',
      user: 'state_ar_admin',
      pass: 'BHISSM@State#AR',
      role: 'State',
      region: 'North-East',
      stateName: 'Arunachal Pradesh',
      jurisdiction: 'Directorate of Health Services, Naharlagun, Itanagar',
    },
    {
      label: 'Manipur Health Services Command',
      user: 'state_mn_admin',
      pass: 'BHISSM@State#MN',
      role: 'State',
      region: 'North-East',
      stateName: 'Manipur',
      jurisdiction: 'Directorate of Health Services, Lamphelpat, Imphal',
    },
    {
      label: 'Meghalaya Health & Family Welfare',
      user: 'state_ml_admin',
      pass: 'BHISSM@State#ML',
      role: 'State',
      region: 'North-East',
      stateName: 'Meghalaya',
      jurisdiction: 'Department of Health & Family Welfare, Shillong',
    },
    {
      label: 'Mizoram Health & Family Welfare',
      user: 'state_mz_admin',
      pass: 'BHISSM@State#MZ',
      role: 'State',
      region: 'North-East',
      stateName: 'Mizoram',
      jurisdiction: 'Directorate of Health Services, Dinthar, Aizawl',
    },
    {
      label: 'Nagaland Health & Family Welfare',
      user: 'state_nl_admin',
      pass: 'BHISSM@State#NL',
      role: 'State',
      region: 'North-East',
      stateName: 'Nagaland',
      jurisdiction: 'Department of Health & Family Welfare, Kohima',
    },
    {
      label: 'Tripura Health & Family Welfare',
      user: 'state_tr_admin',
      pass: 'BHISSM@State#TR',
      role: 'State',
      region: 'North-East',
      stateName: 'Tripura',
      jurisdiction: 'Directorate of Health Services, Gurkhabasti, Agartala',
    },
    {
      label: 'Sikkim Health & Family Welfare',
      user: 'state_sk_admin',
      pass: 'BHISSM@State#SK',
      role: 'State',
      region: 'North-East',
      stateName: 'Sikkim',
      jurisdiction: 'Health Care, Human Services and Family Welfare, Gangtok',
    },
  ];

  const [credentialsList, setCredentialsList] = useState<CredentialItem[]>(demoCredentials);

  // Dynamically load live credentials directly from the master database!
  useEffect(() => {
    const fetchLiveDirectory = async () => {
      try {
        const res = await API.get('/auth/directory');
        if (Array.isArray(res.data) && res.data.length > 0) {
          const enhanced = res.data.map((item: any) => {
            const fallback = demoCredentials.find((d) => d.user === item.user);
            return {
              ...item,
              region: fallback?.region || (item.stateCode === 'NA' ? 'National' : 'South'),
            };
          });
          setCredentialsList(enhanced);
        }
      } catch (e) {
        // Gracefully fallback to baseline demoCredentials
      }
    };
    fetchLiveDirectory();
  }, []);

  const regions = ['All', 'National', 'North', 'South', 'West', 'East', 'Central', 'North-East'] as const;

  const filteredCredentials = credentialsList.filter((c) => {
    const matchesRegion = activeRegion === 'All' || c.region === activeRegion;
    const matchesRole = roleFilter === 'all' || c.role.toLowerCase() === roleFilter;
    const matchesSearch =
      !searchTerm ||
      c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.stateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegion && matchesRole && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-bhissm-bg py-8 sm:py-12 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-center font-sans antialiased text-bhissm-dark">
      {/* ── EDITORIAL RETRO HERO HEADER ───────────────────────────────────────── */}
      <div className="w-full max-w-6xl mb-8 card p-6 sm:p-8 bg-bhissm-surface border border-bhissm-maroon/25 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-display text-5xl sm:text-6xl md:text-7xl text-bhissm-maroon leading-none tracking-tight">
                BHISSM
              </span>
              <span className="text-bhissm-gold text-2xl font-bold">✳</span>
              <span className="text-xs bg-bhissm-maroon text-[#F6E9DC] px-2.5 py-1 rounded-full font-mono font-bold tracking-wider">
                PAN-INDIA COMMAND GRID
              </span>
            </div>

            <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-bhissm-maroon mt-2">
              Bharat Health Initiative for SupplyChain Sourcing &amp; Management
            </div>

            <p className="text-xs sm:text-sm text-bhissm-secondary mt-1 max-w-2xl leading-relaxed">
              Fully operational healthcare logistics architecture covering <strong>36 States &amp; Union Territories</strong>, <strong>36 State Reserve Depots</strong>, and <strong>100+ Hospitals</strong> with live FEFO tracking, two-step disaster mobilization, and interstate mutual aid.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 shrink-0">
            <span className="badge-warning font-mono">
              FEDERATED NATIONAL HEALTH GRID
            </span>
            <span className="badge-success font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-bhissm-success" />
              <span>36 STATES &amp; UTs CONNECTED</span>
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: DIRECT LOGIN (4 COLS) ─────────────────────────────── */}
        <div className="lg:col-span-4 card space-y-5 border border-bhissm-maroon/25">
          <div className="border-b border-bhissm-border pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-bhissm-maroon uppercase font-mono tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-bhissm-maroon" />
              Direct Sign In
            </h2>
            <span className="text-xs font-mono text-bhissm-secondary">SECURE JWT</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-bhissm-secondary mb-1.5 uppercase font-mono">
                Username Identifier
              </label>
              <input
                type="text"
                className="input-field font-mono"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-bhissm-secondary mb-1.5 uppercase font-mono">
                Security Password
              </label>
              <input
                type="password"
                className="input-field font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-900 text-xs rounded-lg border border-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {loading ? 'AUTHENTICATING TELEMETRY...' : 'SIGN IN TO COMMAND DASHBOARD'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-3 border-t border-bhissm-border text-xs text-bhissm-secondary space-y-1.5 font-mono">
            <div>• <strong>Hospital Node:</strong> Single facility pharmacy, ICU beds &amp; ambulances</div>
            <div>• <strong>State Command:</strong> All hospitals in state, State Reserve Depot &amp; redistribution</div>
            <div>• <strong>National Grid:</strong> Apex strategic medical stockpile &amp; interstate disaster relief</div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: INTERACTIVE CREDENTIALS DIRECTORY (8 COLS) ───────── */}
        <div className="lg:col-span-8 card space-y-4 border border-bhissm-maroon/25">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bhissm-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-bhissm-maroon uppercase font-mono tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-bhissm-accent" />
                Select Jurisdiction or Hospital Node
              </h2>
              <p className="text-xs text-bhissm-secondary mt-0.5">
                Click <strong>"Quick Login"</strong> to instantly authenticate, or click any card to auto-fill.
              </p>
            </div>
            <span className="text-xs font-mono bg-bhissm-bg border border-bhissm-border px-2.5 py-1 rounded-full font-bold text-bhissm-secondary">
              {filteredCredentials.length} Nodes Available
            </span>
          </div>

          {/* Search Bar & Role Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-bhissm-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="input-field pl-8.5 py-2 text-xs font-mono"
                placeholder="Search by state, hospital, city or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {(['all', 'national', 'state', 'hospital'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`tab-pill uppercase ${roleFilter === r ? 'tab-pill-active' : ''}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Region Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#EFE8E0] rounded-xl border border-bhissm-border text-xs font-mono">
            {regions.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveRegion(tab)}
                className={`px-3 py-1 rounded-lg transition-colors font-semibold ${
                  activeRegion === tab
                    ? 'bg-bhissm-maroon text-[#F6E9DC] shadow-xs'
                    : 'text-bhissm-secondary hover:text-bhissm-dark hover:bg-bhissm-maroon/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Credentials Cards List */}
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredCredentials.length === 0 ? (
              <div className="p-8 text-center text-xs text-bhissm-secondary font-mono">
                No matching logins found. Try clearing your search term.
              </div>
            ) : (
              filteredCredentials.map((c) => (
                <div
                  key={c.user}
                  className="p-3 border border-bhissm-border/70 rounded-xl bg-white hover:bg-bhissm-surface transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
                >
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => {
                      setUsername(c.user);
                      setPassword(c.pass);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-bhissm-dark text-sm">{c.label}</span>
                      <span
                        className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                          c.role === 'National'
                            ? 'bg-bhissm-maroon text-[#F6E9DC]'
                            : c.role === 'State'
                            ? 'bg-[#DCE3C6] text-[#4B5A22]'
                            : 'bg-[#D6E8E5] text-[#26605C]'
                        }`}
                      >
                        {c.role}
                      </span>
                      <span className="text-xs text-bhissm-secondary font-mono">
                        ({c.stateName})
                      </span>
                    </div>
                    <div className="text-xs text-bhissm-secondary mt-0.5 line-clamp-1">
                      {c.jurisdiction}
                    </div>
                    <div className="text-xs font-mono text-bhissm-secondary/80 mt-1 flex items-center gap-2">
                      <span>User: <strong className="text-bhissm-dark">{c.user}</strong></span>
                      <span>•</span>
                      <span>Pass: <strong className="text-bhissm-dark">{c.pass}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePerformLogin(c.user, c.pass)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      Quick Login →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
