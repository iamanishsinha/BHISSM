import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../lib/api';
import {
  Database,
  Building2,
  Shield,
  Cross,
  Stethoscope,
  Bed,
  Truck,
  Boxes,
  Users,
  Search,
  Filter,
  PlusCircle,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  KeyRound,
  RefreshCw,
  Clock,
  MapPin,
  X,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

interface OverviewData {
  jurisdiction: string;
  facilities: {
    total: number;
    active: number;
    sectors: { government: number; defence_railway: number; private: number; health_centre: number };
    levels: { apex: number; state: number; district: number; phc: number };
    blood_banks: number;
  };
  catalog: {
    total_medicines: number;
    active_medicines: number;
    vaccines: number;
    cold_chain: number;
  };
  beds: {
    sanctioned: number;
    occupied: number;
    available_vacant: number;
    reserved: number;
    icu_sanctioned: number;
    ventilator_sanctioned: number;
    occupancy_rate: number;
  };
  ambulances: {
    total: number;
    als: number;
    bls: number;
    available: number;
  };
  command_nodes: {
    total_users: number;
    hospital_nodes: number;
  };
}

export default function MasterAdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'facilities' | 'medicines' | 'beds_fleets' | 'users'>('facilities');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);

  // States & Districts cache for dropdowns
  const [statesList, setStatesList] = useState<any[]>([]);
  const [districtsList, setDistrictsList] = useState<any[]>([]);

  // ─── TAB 1: Facilities State ───────────────────────────────────────────────
  const [facilities, setFacilities] = useState<any[]>([]);
  const [facSearch, setFacSearch] = useState('');
  const [facSector, setFacSector] = useState('all');
  const [facLevel, setFacLevel] = useState('all');
  const [facState, setFacState] = useState(user?.role === 'state' ? user.state_id || 'all' : 'all');
  const [showAddFacModal, setShowAddFacModal] = useState(false);
  const [showEditFacModal, setShowEditFacModal] = useState(false);
  const [selectedFacForEdit, setSelectedFacForEdit] = useState<any>(null);

  // Add Facility Form
  const [newFacForm, setNewFacForm] = useState({
    name: '',
    state_id: user?.role === 'state' ? user.state_id || '' : '',
    district_id: '',
    sector: 'government',
    level: 'district',
    address: '',
    contact: '+91-94430-10800',
    has_blood_bank: true,
    gen_beds: 120,
    icu_beds: 20,
    trauma_beds: 10,
    vent_beds: 8,
  });
  const [addFacLoading, setAddFacLoading] = useState(false);
  const [addFacFeedback, setAddFacFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── TAB 2: Medicines Catalog State ────────────────────────────────────────
  const [medicines, setMedicines] = useState<any[]>([]);
  const [medSearch, setMedSearch] = useState('');
  const [medCategory, setMedCategory] = useState('all');
  const [medCriticality, setMedCriticality] = useState('all');
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    name: '',
    generic_name: '',
    brand: '',
    dosage_form: 'Injection / Ampoule',
    category: 'Critical Resuscitation',
    unit_type: 'vial',
    criticality: 'critical',
    storage_requirement: 'room_temperature',
    is_vaccine: false,
    baseline_units: 1200,
  });
  const [addMedLoading, setAddMedLoading] = useState(false);
  const [addMedFeedback, setAddMedFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── TAB 3: Bed Sanctioning & Fleet State ─────────────────────────────────
  const [bedCapacities, setBedCapacities] = useState<any[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [bedSearchFac, setBedSearchFac] = useState('all');
  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [sanctionTarget, setSanctionTarget] = useState<any>(null);
  const [sanctionForm, setSanctionForm] = useState({
    new_total_beds: 100,
    order_reference: 'TN-DME-SEC-ORD-2026/89',
    reason: 'Formal Administrative Re-Sanctioning Order of Bed Quota',
  });
  const [sanctionLoading, setSanctionLoading] = useState(false);
  const [sanctionFeedback, setSanctionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── TAB 4: Command Users Directory State ──────────────────────────────────
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // Live IST Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Fetch Master Overview
  const fetchOverview = async () => {
    try {
      const res = await API.get('/master-data/overview');
      setOverview(res.data);
    } catch (e) {
      console.error('Failed to load master overview', e);
    }
  };

  // Fetch Dropdowns
  const fetchDropdowns = async () => {
    try {
      const [sRes, dRes] = await Promise.all([API.get('/states'), API.get('/districts')]);
      setStatesList(sRes.data || []);
      setDistrictsList(dRes.data || []);
      if (!newFacForm.state_id && sRes.data?.length > 0) {
        const defaultSt = user?.role === 'state' ? user.state_id : sRes.data[0].id;
        setNewFacForm((prev) => ({ ...prev, state_id: defaultSt }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Tab Specific Data
  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'facilities') {
        const res = await API.get('/master-data/facilities', {
          params: {
            search: facSearch.trim() || undefined,
            sector: facSector !== 'all' ? facSector : undefined,
            level: facLevel !== 'all' ? facLevel : undefined,
            state_id: facState !== 'all' ? facState : undefined,
          },
        });
        setFacilities(res.data || []);
      } else if (activeTab === 'medicines') {
        const res = await API.get('/master-data/medicines', {
          params: {
            search: medSearch.trim() || undefined,
            category: medCategory !== 'all' ? medCategory : undefined,
            criticality: medCriticality !== 'all' ? medCriticality : undefined,
          },
        });
        setMedicines(res.data || []);
      } else if (activeTab === 'beds_fleets') {
        const [bRes, aRes] = await Promise.all([
          API.get('/master-data/beds', {
            params: { facility_id: bedSearchFac !== 'all' ? bedSearchFac : undefined },
          }),
          API.get('/master-data/ambulances'),
        ]);
        setBedCapacities(bRes.data || []);
        setAmbulances(aRes.data || []);
      } else if (activeTab === 'users') {
        const res = await API.get('/master-data/users', {
          params: {
            search: userSearch.trim() || undefined,
            role: userRoleFilter !== 'all' ? userRoleFilter : undefined,
          },
        });
        setUsersList(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load tab data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchDropdowns();
  }, [user]);

  useEffect(() => {
    fetchTabData();
  }, [activeTab, facSector, facLevel, facState, medCategory, medCriticality, bedSearchFac, userRoleFilter]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTabData();
    }, 280);
    return () => clearTimeout(timer);
  }, [facSearch, medSearch, userSearch]);

  // ─── HANDLERS: TAB 1 FACILITIES ───────────────────────────────────────────
  const handleOpenAddFacility = () => {
    setAddFacFeedback(null);
    const targetState = user?.role === 'state' ? user.state_id : (statesList[0]?.id || '');
    const relevantDist = districtsList.filter((d) => d.stateId === targetState);
    setNewFacForm({
      name: '',
      state_id: targetState,
      district_id: relevantDist[0]?.id || '',
      sector: 'government',
      level: 'district',
      address: '',
      contact: '+91-94430-10800',
      has_blood_bank: true,
      gen_beds: 120,
      icu_beds: 20,
      trauma_beds: 10,
      vent_beds: 8,
    });
    setShowAddFacModal(true);
  };

  const handleSubmitAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacForm.name.trim()) return;
    setAddFacLoading(true);
    setAddFacFeedback(null);
    try {
      const res = await API.post('/master-data/facilities', {
        name: newFacForm.name.trim(),
        state_id: newFacForm.state_id,
        district_id: newFacForm.district_id,
        sector: newFacForm.sector,
        level: newFacForm.level,
        address: newFacForm.address.trim() || undefined,
        contact: newFacForm.contact.trim() || undefined,
        has_blood_bank: newFacForm.has_blood_bank,
        initial_beds: {
          general: Number(newFacForm.gen_beds),
          icu: Number(newFacForm.icu_beds),
          trauma: Number(newFacForm.trauma_beds),
          ventilator: Number(newFacForm.vent_beds),
        },
      });

      setAddFacFeedback({
        type: 'success',
        text: `Facility "${res.data.facility?.name}" registered and auto-provisioned! Command login node created: ${res.data.command_user?.username || 'Created'} (Standard Password: BHISSM@Demo#${res.data.facility?.state?.code || 'IN'}).`,
      });

      fetchOverview();
      fetchTabData();
      setTimeout(() => {
        setShowAddFacModal(false);
        setAddFacFeedback(null);
      }, 2500);
    } catch (err: any) {
      setAddFacFeedback({
        type: 'error',
        text: err.response?.data?.error || 'Failed to register facility',
      });
    } finally {
      setAddFacLoading(false);
    }
  };

  const handleToggleFacilityStatus = async (fac: any) => {
    try {
      const res = await API.patch(`/master-data/facilities/${fac.id}/toggle-status`);
      alert(res.data.message);
      fetchTabData();
      fetchOverview();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to update status');
    }
  };

  // ─── HANDLERS: TAB 2 MEDICINES ────────────────────────────────────────────
  const handleSubmitAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedForm.name.trim() || !newMedForm.generic_name.trim()) return;
    setAddMedLoading(true);
    setAddMedFeedback(null);
    try {
      const res = await API.post('/master-data/medicines', {
        name: newMedForm.name.trim(),
        generic_name: newMedForm.generic_name.trim(),
        brand: newMedForm.brand.trim() || undefined,
        dosage_form: newMedForm.dosage_form,
        category: newMedForm.category,
        unit_type: newMedForm.unit_type,
        criticality: newMedForm.criticality,
        storage_requirement: newMedForm.storage_requirement,
        is_vaccine: newMedForm.is_vaccine,
        baseline_units: Number(newMedForm.baseline_units),
      });

      setAddMedFeedback({
        type: 'success',
        text: res.data.message || 'Medicine enrolled in catalog and distributed nationwide!',
      });
      fetchOverview();
      fetchTabData();
      setTimeout(() => {
        setShowAddMedModal(false);
        setAddMedFeedback(null);
      }, 2200);
    } catch (err: any) {
      setAddMedFeedback({
        type: 'error',
        text: err.response?.data?.error || 'Failed to add medicine',
      });
    } finally {
      setAddMedLoading(false);
    }
  };

  // ─── HANDLERS: TAB 3 BED SANCTIONING ──────────────────────────────────────
  const handleOpenSanctionModal = (capItem: any) => {
    setSanctionTarget(capItem);
    setSanctionFeedback(null);
    setSanctionForm({
      new_total_beds: capItem.totalBeds,
      order_reference: `TN-GOV-ORD-${Date.now().toString().slice(-4)}`,
      reason: 'Capacity expansion approved under National Emergency Healthcare Masterplan',
    });
    setShowSanctionModal(true);
  };

  const handleSubmitSanction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanctionTarget) return;
    setSanctionLoading(true);
    setSanctionFeedback(null);
    try {
      const res = await API.post(
        `/facilities/${sanctionTarget.facilityId}/capacity/${sanctionTarget.careType}/sanction`,
        {
          total_beds: Number(sanctionForm.new_total_beds),
          order_reference: sanctionForm.order_reference,
          reason: sanctionForm.reason,
        }
      );

      setSanctionFeedback({
        type: 'success',
        text: res.data.message || 'Sanctioned bed quota revised successfully.',
      });
      fetchOverview();
      fetchTabData();
      setTimeout(() => {
        setShowSanctionModal(false);
        setSanctionFeedback(null);
      }, 1800);
    } catch (err: any) {
      setSanctionFeedback({
        type: 'error',
        text: err.response?.data?.error || 'Failed to revise bed sanction quota',
      });
    } finally {
      setSanctionLoading(false);
    }
  };

  // ─── HANDLERS: TAB 4 USER CREDENTIALS ─────────────────────────────────────
  const handleResetUserPassword = async (u: any) => {
    if (!window.confirm(`Reset password for node ${u.username}?`)) return;
    try {
      const res = await API.post('/master-data/users/reset-password', {
        user_id: u.id,
      });
      setResetFeedback(`Password for "${res.data.username}" reset to: ${res.data.new_password}`);
      setTimeout(() => setResetFeedback(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset password');
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. Hero Governance Command Banner ──────────────────────────────── */}
      <div className="card p-5 bg-gradient-to-r from-[#FFF8EE] via-[#FCF4E8] to-[#FCEEEF] border-2 border-bhissm-border shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bhissm-emblem-box text-[#FFF9F1] flex flex-col items-center justify-center border-2 border-[#E8A7B5] shrink-0">
              <span className="font-black text-lg tracking-tighter leading-none">MDB</span>
              <span className="text-[7px] font-mono uppercase tracking-widest text-[#F4D5DC] mt-0.5 font-bold">
                ROOT
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-lg tracking-tight bhissm-brand-title">
                  BHISSM
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-bhissm-secondary">
                  • MASTER DATA &amp; INFRASTRUCTURE GOVERNANCE CONSOLE
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
                  SINGLE SOURCE OF TRUTH (SQL MASTER)
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-bhissm-dark mt-1 font-sans tracking-tight">
                Consolidated Master Database Administration
              </h1>
              <p className="text-xs text-bhissm-secondary mt-1 font-medium">
                Centrally manage nationwide hospitals, 33 catalog medicines, state-sanctioned bed quotas, and command user credentials. Additions automatically cascade across all tiers.
              </p>
            </div>
          </div>

          {/* Right Live Date/Time & Sync */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/95 border border-bhissm-border rounded-lg text-[10px] font-mono shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="text-bhissm-secondary font-medium">SYS CLOCK:</span>
              <span className="font-black text-bhissm-dark">{formattedDate}</span>
              <span className="font-black text-emerald-700">{formattedTime}</span>
              <span className="bg-emerald-100 text-emerald-900 text-[9px] font-bold px-1 rounded">IST</span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-bhissm-secondary">
              <span className="bg-[#F4E7D7]/80 px-2 py-0.5 rounded border border-bhissm-border/60">
                JURISDICTION: <strong className="text-bhissm-dark">{overview?.jurisdiction || 'GOVERNANCE'}</strong>
              </span>
              <button
                onClick={() => {
                  fetchOverview();
                  fetchTabData();
                }}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-white border border-bhissm-border hover:bg-stone-50 transition-colors cursor-pointer"
                title="Refresh Master DB"
              >
                <RefreshCw className={`w-3 h-3 text-bhissm-dark ${loading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Top Metric KPI Counters Ribbon ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="card p-3.5 bg-gradient-to-br from-white to-[#FDF8EE] border border-bhissm-border shadow-2xs">
          <div className="flex items-center justify-between text-bhissm-secondary mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Hospitals &amp; Centers</span>
            <Building2 className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-bhissm-dark">
            {overview?.facilities.total || 0}
          </div>
          <div className="text-[10px] text-bhissm-secondary font-medium mt-1 truncate">
            {overview?.facilities.sectors.government || 0} Govt • {overview?.facilities.sectors.defence_railway || 0} Def/Rly • {overview?.facilities.sectors.private || 0} Pvt • {overview?.facilities.sectors.health_centre || 0} CHC
          </div>
        </div>

        <div className="card p-3.5 bg-gradient-to-br from-white to-[#F6FBF7] border border-bhissm-border shadow-2xs">
          <div className="flex items-center justify-between text-bhissm-secondary mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Master Drug Catalog</span>
            <Boxes className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-900">
            {overview?.catalog.total_medicines || 0}
          </div>
          <div className="text-[10px] text-bhissm-secondary font-medium mt-1 truncate">
            {overview?.catalog.active_medicines || 0} Formulations • {overview?.catalog.vaccines || 0} Vaccines
          </div>
        </div>

        <div className="card p-3.5 bg-gradient-to-br from-white to-[#FDF4F5] border border-bhissm-border shadow-2xs">
          <div className="flex items-center justify-between text-bhissm-secondary mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Bed Census &amp; Vacancy</span>
            <Bed className="w-4 h-4 text-[#B65C62]" />
          </div>
          <div className="text-2xl font-black text-bhissm-dark">
            {overview?.beds.sanctioned || 0}
          </div>
          <div className="text-[10px] text-bhissm-secondary font-medium mt-1 truncate">
            <span className="text-emerald-700 font-bold">{overview?.beds.available_vacant || 0} Vacant</span> • {overview?.beds.occupied || 0} Occupied ({overview?.beds.occupancy_rate || 0}%)
          </div>
        </div>

        <div className="card p-3.5 bg-gradient-to-br from-white to-[#F7F5FE] border border-bhissm-border shadow-2xs">
          <div className="flex items-center justify-between text-bhissm-secondary mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Command Node Logins</span>
            <Users className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-2xl font-black text-purple-950">
            {overview?.command_nodes.total_users || 0}
          </div>
          <div className="text-[10px] text-bhissm-secondary font-medium mt-1 truncate">
            {overview?.command_nodes.hospital_nodes || 0} Hospital Nodes • Provisioned
          </div>
        </div>
      </div>

      {resetFeedback && (
        <div className="p-3 bg-emerald-100 border border-emerald-400 text-emerald-900 rounded-lg text-xs font-mono font-bold flex items-center justify-between">
          <span>{resetFeedback}</span>
          <button onClick={() => setResetFeedback(null)} className="cursor-pointer">✕</button>
        </div>
      )}

      {/* ─── 3. Navigation Switcher Tabs (4 Pillars) ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-bhissm-border pb-2">
        <div className="flex bg-[#F5EBE1] p-1 rounded-xl border border-bhissm-border font-mono text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('facilities')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'facilities'
                ? 'bg-bhissm-dark text-white shadow-xs'
                : 'text-bhissm-secondary hover:text-bhissm-dark'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Facilities &amp; Hospitals Master</span>
          </button>

          <button
            onClick={() => setActiveTab('medicines')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'medicines'
                ? 'bg-bhissm-dark text-white shadow-xs'
                : 'text-bhissm-secondary hover:text-bhissm-dark'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>2. Medicine &amp; Vaccine Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('beds_fleets')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'beds_fleets'
                ? 'bg-bhissm-dark text-white shadow-xs'
                : 'text-bhissm-secondary hover:text-bhissm-dark'
            }`}
          >
            <Bed className="w-4 h-4" />
            <span>3. Bed Sanctioning &amp; Fleets</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-bhissm-dark text-white shadow-xs'
                : 'text-bhissm-secondary hover:text-bhissm-dark'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>4. Command Node Credentials</span>
          </button>
        </div>

        {/* Action Button for Active Tab */}
        <div>
          {activeTab === 'facilities' && (
            <button
              onClick={handleOpenAddFacility}
              className="btn btn-primary text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Register Hospital (Auto-Provision)</span>
            </button>
          )}

          {activeTab === 'medicines' && (
            <button
              onClick={() => {
                if (user?.role !== 'national') {
                  alert('Only National Command Authority can enroll new catalog formulations.');
                  return;
                }
                setAddMedFeedback(null);
                setShowAddMedModal(true);
              }}
              className="btn btn-primary text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Catalog Formulation</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── TAB 1: FACILITIES & HOSPITALS MASTER ───────────────────────────── */}
      {activeTab === 'facilities' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="card p-3 bg-white border border-bhissm-border flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-3.5 h-3.5 text-bhissm-secondary absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search facility name..."
                value={facSearch}
                onChange={(e) => setFacSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF6F0] border border-bhissm-border rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-bhissm-secondary font-bold">Sector:</span>
              <select
                value={facSector}
                onChange={(e) => setFacSector(e.target.value)}
                className="p-1.5 bg-[#FAF6F0] border border-bhissm-border rounded-lg text-xs"
              >
                <option value="all">All Sectors</option>
                <option value="government">Government Civil &amp; Apex</option>
                <option value="defence_railway">Defence &amp; Railway</option>
                <option value="private">Private Multi-Specialty</option>
                <option value="health_centre">CHC &amp; PHC</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-bhissm-secondary font-bold">Level:</span>
              <select
                value={facLevel}
                onChange={(e) => setFacLevel(e.target.value)}
                className="p-1.5 bg-[#FAF6F0] border border-bhissm-border rounded-lg text-xs"
              >
                <option value="all">All Levels</option>
                <option value="apex">Apex Tertiary</option>
                <option value="state">State Referral</option>
                <option value="district">District Hospital</option>
                <option value="phc">PHC / Health Centre</option>
              </select>
            </div>

            {user?.role === 'national' && (
              <div className="flex items-center gap-2">
                <span className="text-bhissm-secondary font-bold">State:</span>
                <select
                  value={facState}
                  onChange={(e) => setFacState(e.target.value)}
                  className="p-1.5 bg-[#FAF6F0] border border-bhissm-border rounded-lg text-xs"
                >
                  <option value="all">All States &amp; UTs</option>
                  {statesList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Facilities Table */}
          <div className="card overflow-hidden p-0 border border-bhissm-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAF3EA] text-bhissm-dark font-bold uppercase tracking-wider text-[11px] border-b border-bhissm-border">
                  <tr>
                    <th className="p-3">Hospital / Facility</th>
                    <th className="p-3">Sector</th>
                    <th className="p-3">Tier</th>
                    <th className="p-3">Jurisdiction</th>
                    <th className="p-3 text-center">Sanctioned Beds</th>
                    <th className="p-3 text-center">Vacant Beds</th>
                    <th className="p-3 text-center">Ambulances</th>
                    <th className="p-3">Command Login</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bhissm-border/60">
                  {facilities.map((fac) => (
                    <tr key={fac.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3 font-sans font-bold text-bhissm-dark">
                        <div>{fac.name}</div>
                        {fac.address && <div className="text-[10px] font-mono text-bhissm-secondary font-normal">{fac.address}</div>}
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase border bg-stone-100 text-stone-800 border-stone-300">
                          {fac.sector.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="uppercase text-[10px] font-bold text-bhissm-secondary">{fac.level}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-bhissm-dark">{fac.district_name || 'District'}</span>
                        <span className="text-bhissm-secondary text-[10px] block">({fac.state_code})</span>
                      </td>
                      <td className="p-3 text-center font-bold text-bhissm-dark">
                        {fac.beds.sanctioned}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {fac.beds.available}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold">
                        {fac.ambulances_count}
                      </td>
                      <td className="p-3 text-[11px] text-blue-900 font-bold">
                        {fac.command_username || '—'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            fac.isActive === 1
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-red-100 text-red-900'
                          }`}
                        >
                          {fac.isActive === 1 ? 'OPERATIONAL' : 'STANDBY'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleFacilityStatus(fac)}
                          className="px-2 py-1 rounded text-[10px] border border-bhissm-border bg-white hover:bg-stone-50 cursor-pointer"
                        >
                          {fac.isActive === 1 ? 'Decommission' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {facilities.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-bhissm-secondary font-mono">
                        No facilities found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: MEDICINE & VACCINE CATALOG MASTER ───────────────────────── */}
      {activeTab === 'medicines' && (
        <div className="space-y-4">
          <div className="card p-3 bg-white border border-bhissm-border flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-3.5 h-3.5 text-bhissm-secondary absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search drug or generic chemical name..."
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF6F0] border border-bhissm-border rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-bhissm-secondary font-bold">Criticality:</span>
              <select
                value={medCriticality}
                onChange={(e) => setMedCriticality(e.target.value)}
                className="p-1.5 bg-[#FAF6F0] border border-bhissm-border rounded-lg text-xs"
              >
                <option value="all">All Criticalities</option>
                <option value="critical">Critical Code Red</option>
                <option value="high">High Priority</option>
                <option value="standard">Standard Essential</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden p-0 border border-bhissm-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAF3EA] text-bhissm-dark font-bold uppercase tracking-wider text-[11px] border-b border-bhissm-border">
                  <tr>
                    <th className="p-3">Medicine / Formulation</th>
                    <th className="p-3">Generic Name</th>
                    <th className="p-3">Dosage &amp; Unit</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Storage Requirement</th>
                    <th className="p-3">Criticality</th>
                    <th className="p-3 text-center">Facilities Stocked</th>
                    <th className="p-3 text-right">Total National Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bhissm-border/60">
                  {medicines.map((med) => (
                    <tr key={med.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3 font-sans font-bold text-bhissm-dark">
                        <div className="flex items-center gap-1.5">
                          {med.isVaccine === 1 && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-300 text-[9px] font-mono font-bold">
                              VACCINE
                            </span>
                          )}
                          <span>{med.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-bhissm-secondary italic font-sans">{med.genericName}</td>
                      <td className="p-3">{med.dosageForm} ({med.unitType})</td>
                      <td className="p-3 text-[11px]">{med.category}</td>
                      <td className="p-3 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-300 font-bold uppercase">
                          {med.storageRequirement.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            med.criticality === 'critical'
                              ? 'bg-red-100 text-red-900 border border-red-300'
                              : med.criticality === 'high'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {med.criticality.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-blue-900">
                        {med.facilities_stocked_count}
                      </td>
                      <td className="p-3 text-right font-black text-bhissm-dark">
                        {med.total_national_stock.toLocaleString()} {med.unitType}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: BED SANCTIONING & FLEET MASTER ───────────────────────────── */}
      {activeTab === 'beds_fleets' && (
        <div className="space-y-6">
          {/* Bed Governance Notice */}
          <div className="card p-4 bg-amber-50/80 border-2 border-amber-300 rounded-xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-amber-900 font-bold block uppercase font-mono">
                State Authority Bed Sanction Protocol &amp; Census Vacancy Maintenance
              </strong>
              <p className="text-amber-900/90 mt-0.5">
                Total bed capacity is locked for hospital nodes. Hospital duty officers may only update daily Occupied and Reserved beds. Available (Vacant) beds are calculated dynamically: <span className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">Vacant = Total Sanctioned - Occupied - Reserved</span>. To revise Sanctioned Capacity, State Command must execute an Administrative Order with order reference notes below.
              </p>
            </div>
          </div>

          {/* Sanctioned Bed Allocations Table */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-xs uppercase font-mono flex items-center gap-2">
                <Bed className="w-4 h-4 text-bhissm-dark" />
                Sanctioned Bed Capacities &amp; Dynamic Vacancies per Ward
              </h3>
              <span className="text-[11px] font-mono text-bhissm-secondary">
                {bedCapacities.length} Monitored Wards
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAF3EA] text-bhissm-dark font-bold uppercase tracking-wider text-[11px] border-b border-bhissm-border">
                  <tr>
                    <th className="p-3">Hospital</th>
                    <th className="p-3">Ward / Care Type</th>
                    <th className="p-3 text-center">Sanctioned Quota</th>
                    <th className="p-3 text-center">Occupied</th>
                    <th className="p-3 text-center">Reserved</th>
                    <th className="p-3 text-center">Vacant (Available)</th>
                    <th className="p-3 text-right">Governance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bhissm-border/60">
                  {bedCapacities.map((cap) => (
                    <tr key={cap.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3 font-sans font-bold text-bhissm-dark">
                        <div>{cap.facility?.name}</div>
                        <div className="text-[10px] font-mono text-bhissm-secondary font-normal">
                          {cap.facility?.district?.name} ({cap.facility?.state?.code})
                        </div>
                      </td>
                      <td className="p-3 font-bold uppercase text-[11px]">
                        {cap.careType.replace('_', ' ')}
                      </td>
                      <td className="p-3 text-center font-bold text-bhissm-dark">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 border border-stone-300">
                          <Lock className="w-2.5 h-2.5 text-stone-600" />
                          {cap.totalBeds}
                        </span>
                      </td>
                      <td className="p-3 text-center text-bhissm-secondary">{cap.occupiedBeds}</td>
                      <td className="p-3 text-center text-amber-800">{cap.reservedBeds}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {cap.availableBeds} Vacant
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenSanctionModal(cap)}
                          className="btn btn-secondary text-[11px] font-mono py-1 px-2.5 flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-bhissm-dark" />
                          <span>Revise Sanction</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: COMMAND NODE CREDENTIALS ────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="card p-3 bg-white border border-bhissm-border flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-3.5 h-3.5 text-bhissm-secondary absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search username or display node title..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF6F0] border border-bhissm-border rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-bhissm-secondary font-bold">Node Role:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="p-1.5 bg-[#FAF6F0] border border-bhissm-border rounded-lg text-xs"
              >
                <option value="all">All Roles</option>
                <option value="hospital">Hospital Command Node</option>
                <option value="state">State Operations Centre</option>
                <option value="national">National Command Authority</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden p-0 border border-bhissm-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAF3EA] text-bhissm-dark font-bold uppercase tracking-wider text-[11px] border-b border-bhissm-border">
                  <tr>
                    <th className="p-3">Node Username</th>
                    <th className="p-3">Display Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Jurisdiction / Hospital</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Credential Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bhissm-border/60">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3 font-bold text-blue-900">{u.username}</td>
                      <td className="p-3 font-sans font-semibold text-bhissm-dark">{u.fullName}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'national'
                              ? 'bg-black text-white'
                              : u.role === 'state'
                              ? 'bg-emerald-800 text-white'
                              : 'bg-stone-200 text-stone-900'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.facility ? (
                          <span className="font-sans font-medium">{u.facility.name}</span>
                        ) : u.state ? (
                          <span>{u.state.name} State Command</span>
                        ) : (
                          <span>National Health Grid</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">
                          ACTIVE
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleResetUserPassword(u)}
                          className="px-2.5 py-1 rounded text-[10px] border border-bhissm-border bg-white hover:bg-stone-50 cursor-pointer font-bold text-bhissm-dark"
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: REGISTER NEW HOSPITAL WITH SMART DEFAULTS ─────────────── */}
      {showAddFacModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card bg-white max-w-xl w-full p-5 shadow-2xl border-2 border-bhissm-dark space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono flex items-center gap-2">
                <Building2 className="w-4 h-4 text-bhissm-dark" />
                Register Hospital in Master Database
              </h3>
              <button onClick={() => setShowAddFacModal(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            {addFacFeedback && (
              <div
                className={`p-3 rounded text-xs font-mono font-bold ${
                  addFacFeedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                    : 'bg-red-100 text-red-900 border border-red-400'
                }`}
              >
                {addFacFeedback.text}
              </div>
            )}

            <form onSubmit={handleSubmitAddFacility} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                  Facility Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tambaram Railway Divisional Hospital"
                  value={newFacForm.name}
                  onChange={(e) => setNewFacForm({ ...newFacForm, name: e.target.value })}
                  className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                    State / UT *
                  </label>
                  <select
                    value={newFacForm.state_id}
                    disabled={user?.role === 'state'}
                    onChange={(e) => setNewFacForm({ ...newFacForm, state_id: e.target.value })}
                    className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                  >
                    {statesList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                    District
                  </label>
                  <select
                    value={newFacForm.district_id}
                    onChange={(e) => setNewFacForm({ ...newFacForm, district_id: e.target.value })}
                    className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                  >
                    <option value="">Select District</option>
                    {districtsList
                      .filter((d) => !newFacForm.state_id || d.stateId === newFacForm.state_id)
                      .map((dt) => (
                        <option key={dt.id} value={dt.id}>
                          {dt.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                    Sector Classification *
                  </label>
                  <select
                    value={newFacForm.sector}
                    onChange={(e) => setNewFacForm({ ...newFacForm, sector: e.target.value })}
                    className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                  >
                    <option value="government">Government Civil &amp; Apex</option>
                    <option value="defence_railway">Defence &amp; Railway</option>
                    <option value="private">Private Multi-Specialty</option>
                    <option value="health_centre">CHC &amp; PHC</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                    Hierarchy Level *
                  </label>
                  <select
                    value={newFacForm.level}
                    onChange={(e) => setNewFacForm({ ...newFacForm, level: e.target.value })}
                    className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                  >
                    <option value="district">District General Hospital</option>
                    <option value="apex">Apex Tertiary / Medical College</option>
                    <option value="state">State Referral Center</option>
                    <option value="phc">Primary Health Center (PHC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                  Physical Address / Location
                </label>
                <input
                  type="text"
                  placeholder="Grand Southern Trunk Rd, Tambaram Sanatorium"
                  value={newFacForm.address}
                  onChange={(e) => setNewFacForm({ ...newFacForm, address: e.target.value })}
                  className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                />
              </div>

              <div className="p-3 bg-[#FAF6F0] rounded-xl border border-bhissm-border space-y-2">
                <span className="font-bold text-[11px] uppercase tracking-wider text-bhissm-dark block">
                  Smart Capacity Defaults (Customizable)
                </span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <label className="text-[10px] text-bhissm-secondary block font-bold">General</label>
                    <input
                      type="number"
                      min="0"
                      value={newFacForm.gen_beds}
                      onChange={(e) => setNewFacForm({ ...newFacForm, gen_beds: Number(e.target.value) })}
                      className="w-full p-1.5 bg-white border border-bhissm-border rounded text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-bhissm-secondary block font-bold">ICU</label>
                    <input
                      type="number"
                      min="0"
                      value={newFacForm.icu_beds}
                      onChange={(e) => setNewFacForm({ ...newFacForm, icu_beds: Number(e.target.value) })}
                      className="w-full p-1.5 bg-white border border-bhissm-border rounded text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-bhissm-secondary block font-bold">Trauma</label>
                    <input
                      type="number"
                      min="0"
                      value={newFacForm.trauma_beds}
                      onChange={(e) => setNewFacForm({ ...newFacForm, trauma_beds: Number(e.target.value) })}
                      className="w-full p-1.5 bg-white border border-bhissm-border rounded text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-bhissm-secondary block font-bold">Ventilator</label>
                    <input
                      type="number"
                      min="0"
                      value={newFacForm.vent_beds}
                      onChange={(e) => setNewFacForm({ ...newFacForm, vent_beds: Number(e.target.value) })}
                      className="w-full p-1.5 bg-white border border-bhissm-border rounded text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="has_bb"
                  checked={newFacForm.has_blood_bank}
                  onChange={(e) => setNewFacForm({ ...newFacForm, has_blood_bank: e.target.checked })}
                  className="rounded text-bhissm-dark"
                />
                <label htmlFor="has_bb" className="font-bold text-bhissm-dark">
                  Provision Certified Blood Transfusion Center (8 Blood Groups)
                </label>
              </div>

              <div className="pt-3 border-t border-bhissm-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFacModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addFacLoading}
                  className="btn btn-primary text-xs font-bold cursor-pointer"
                >
                  {addFacLoading ? 'Provisioning...' : 'Register & Auto-Provision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD MEDICINE TO NATIONAL MASTER CATALOG ───────────────── */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card bg-white max-w-lg w-full p-5 shadow-2xl border-2 border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono flex items-center gap-2">
                <Boxes className="w-4 h-4 text-bhissm-dark" />
                Enroll Formulation into Master Catalog
              </h3>
              <button onClick={() => setShowAddMedModal(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            {addMedFeedback && (
              <div
                className={`p-3 rounded text-xs font-mono font-bold ${
                  addMedFeedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                    : 'bg-red-100 text-red-900 border border-red-400'
                }`}
              >
                {addMedFeedback.text}
              </div>
            )}

            <form onSubmit={handleSubmitAddMedicine} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                  Commercial / Clinical Formulation Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fentanyl 50mcg/ml Injection"
                  value={newMedForm.name}
                  onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
                  className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                  Generic Active Chemical Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fentanyl Citrate"
                  value={newMedForm.generic_name}
                  onChange={(e) => setNewMedForm({ ...newMedForm, generic_name: e.target.value })}
                  className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                    Therapeutic Category
                  </label>
                  <input
                    type="text"
                    value={newMedForm.category}
                    onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
                    className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                    Criticality Level
                  </label>
                  <select
                    value={newMedForm.criticality}
                    onChange={(e) => setNewMedForm({ ...newMedForm, criticality: e.target.value })}
                    className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                  >
                    <option value="critical">Critical Code Red</option>
                    <option value="high">High Priority</option>
                    <option value="standard">Standard Essential</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                    Storage Requirement
                  </label>
                  <select
                    value={newMedForm.storage_requirement}
                    onChange={(e) => setNewMedForm({ ...newMedForm, storage_requirement: e.target.value })}
                    className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                  >
                    <option value="room_temperature">Room Temperature (15-25°C)</option>
                    <option value="cold_chain_2_8">Cold Chain Refrigerated (2-8°C)</option>
                    <option value="frozen_subzero">Sub-Zero Frozen (-20°C)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                    Initial Baseline Allocation
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={newMedForm.baseline_units}
                    onChange={(e) => setNewMedForm({ ...newMedForm, baseline_units: Number(e.target.value) })}
                    className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_vac"
                  checked={newMedForm.is_vaccine}
                  onChange={(e) => setNewMedForm({ ...newMedForm, is_vaccine: e.target.checked })}
                  className="rounded text-bhissm-dark"
                />
                <label htmlFor="is_vac" className="font-bold text-bhissm-dark">
                  Classified as Immunization Vaccine
                </label>
              </div>

              <div className="pt-3 border-t border-bhissm-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMedLoading}
                  className="btn btn-primary text-xs font-bold cursor-pointer"
                >
                  {addMedLoading ? 'Distributing...' : 'Enroll & Distribute Nationally'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: FORMAL ADMINISTRATIVE BED RE-SANCTION PROTOCOL ────────── */}
      {showSanctionModal && sanctionTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-5 shadow-2xl border-2 border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono flex items-center gap-2">
                <Lock className="w-4 h-4 text-bhissm-dark" />
                State Bed Quota Re-Sanction Protocol
              </h3>
              <button onClick={() => setShowSanctionModal(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            {sanctionFeedback && (
              <div
                className={`p-3 rounded text-xs font-mono font-bold ${
                  sanctionFeedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                    : 'bg-red-100 text-red-900 border border-red-400'
                }`}
              >
                {sanctionFeedback.text}
              </div>
            )}

            <form onSubmit={handleSubmitSanction} className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-[#FAF6F0] rounded-xl border border-bhissm-border space-y-1">
                <div className="text-bhissm-secondary font-bold uppercase text-[10px]">
                  Target Facility &amp; Ward
                </div>
                <div className="font-bold text-bhissm-dark text-sm font-sans">
                  {sanctionTarget.facility?.name}
                </div>
                <div className="text-[11px] font-mono text-purple-900 font-bold uppercase">
                  {sanctionTarget.careType.replace('_', ' ')} Ward
                </div>
                <div className="text-[10px] text-bhissm-secondary pt-1 flex justify-between">
                  <span>Current Sanctioned: <strong>{sanctionTarget.totalBeds}</strong></span>
                  <span>Occupied: <strong>{sanctionTarget.occupiedBeds}</strong></span>
                  <span>Vacant: <strong className="text-emerald-700">{sanctionTarget.availableBeds}</strong></span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                  New Sanctioned Total Beds *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={sanctionForm.new_total_beds}
                  onChange={(e) =>
                    setSanctionForm({ ...sanctionForm, new_total_beds: Number(e.target.value) })
                  }
                  className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg text-sm font-bold"
                />
                <span className="text-[10px] text-bhissm-secondary block mt-1">
                  New Vacant beds will automatically be: <strong>{Math.max(0, sanctionForm.new_total_beds - sanctionTarget.occupiedBeds - sanctionTarget.reservedBeds)}</strong>
                </span>
              </div>

              <div>
                <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                  Administrative Order Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TN-DME-SEC-ORD-2026/89"
                  value={sanctionForm.order_reference}
                  onChange={(e) =>
                    setSanctionForm({ ...sanctionForm, order_reference: e.target.value })
                  }
                  className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-bhissm-secondary uppercase mb-1">
                  Operational Justification / Reason *
                </label>
                <textarea
                  required
                  rows={2}
                  value={sanctionForm.reason}
                  onChange={(e) =>
                    setSanctionForm({ ...sanctionForm, reason: e.target.value })
                  }
                  className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-bhissm-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSanctionModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sanctionLoading}
                  className="btn btn-primary text-xs font-bold cursor-pointer"
                >
                  {sanctionLoading ? 'Re-Sanctioning...' : 'Authorize Re-Sanction Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
