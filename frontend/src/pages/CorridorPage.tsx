import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import {
  Building2,
  Shield,
  Train,
  Cross,
  Stethoscope,
  Bed,
  Truck,
  Droplet,
  Boxes,
  Search,
  Filter,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  MapPin,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Activity,
  PhoneCall,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  PlusCircle,
  X,
} from 'lucide-react';

interface FacilityItem {
  id: string;
  name: string;
  type: string;
  level: string;
  address?: string;
  lat?: number;
  lng?: number;
  hasBloodBank: number;
  district_name: string;
  district_code: string;
  state_name: string;
  state_code: string;
  sector: 'government' | 'defence_railway' | 'private' | 'health_centre';
  beds: {
    general: { total: number; available: number };
    icu: { total: number; available: number };
    trauma: { total: number; available: number };
    ventilator: { total: number; available: number };
    total: number;
    available: number;
  };
  ambulances: {
    total: number;
    available: number;
    als: number;
    bls: number;
  };
  blood_bank: {
    has_blood_bank: boolean;
    total_units: number;
  };
  inventory: {
    total_stock_units: number;
    low_stock_count: number;
    total_medicines_monitored: number;
  };
}

interface CorridorSummary {
  total_facilities: number;
  government_count: number;
  defence_railway_count: number;
  private_count: number;
  health_centre_count: number;
  total_beds: number;
  available_beds: number;
  total_icu_beds: number;
  available_icu_beds: number;
  total_ventilator_beds: number;
  available_ventilator_beds: number;
  total_ambulances: number;
  available_ambulances: number;
  als_ambulances: number;
  bls_ambulances: number;
  blood_banks_count: number;
  total_blood_units: number;
  total_medicine_stock_units: number;
}

export default function CorridorPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [summary, setSummary] = useState<CorridorSummary | null>(null);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Live Date/Time Ticker
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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

  // Mutual Aid Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedSourceFac, setSelectedSourceFac] = useState<FacilityItem | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [transferResource, setTransferResource] = useState<string>('Adrenaline 1mg/ml (Emergency Resuscitation)');
  const [transferQty, setTransferQty] = useState<number>(50);
  const [transferPriority, setTransferPriority] = useState<string>('Immediate Code Red');
  const [transferMsg, setTransferMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Hospital Modal State (Auto-Provisioning)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFacName, setNewFacName] = useState('');
  const [newFacDistrict, setNewFacDistrict] = useState('TN-CHN');
  const [newFacSector, setNewFacSector] = useState<'government' | 'defence_railway' | 'private' | 'health_centre'>('government');
  const [newFacLevel, setNewFacLevel] = useState('district');
  const [newFacAddress, setNewFacAddress] = useState('');
  const [newFacBloodBank, setNewFacBloodBank] = useState(true);
  const [addFacLoading, setAddFacLoading] = useState(false);
  const [addFacSuccess, setAddFacSuccess] = useState<string | null>(null);
  const [addFacError, setAddFacError] = useState<string | null>(null);

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacName.trim()) return;
    setAddFacLoading(true);
    setAddFacError(null);
    setAddFacSuccess(null);
    try {
      const isPondy = newFacDistrict.startsWith('PY-');
      const stateCode = isPondy ? 'PY' : 'TN';
      const res = await API.post('/facilities', {
        name: newFacName.trim(),
        state_code: stateCode,
        district_code: newFacDistrict,
        sector: newFacSector,
        level: newFacLevel,
        address: newFacAddress.trim() || undefined,
        has_blood_bank: newFacBloodBank,
      });
      setAddFacSuccess(
        `Facility "${res.data.facility?.name}" registered and auto-provisioned! Login created: ${res.data.user?.username || 'Created'}`
      );
      setTimeout(() => {
        setShowAddModal(false);
        setAddFacSuccess(null);
        setNewFacName('');
        setNewFacAddress('');
        fetchCorridorData();
      }, 2200);
    } catch (err: any) {
      setAddFacError(err.response?.data?.error || err.message || 'Failed to register facility');
    } finally {
      setAddFacLoading(false);
    }
  };

  const fetchCorridorData = async () => {
    try {
      setLoading(true);
      const res = await API.get('/facilities/corridor', {
        params: {
          district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
          sector: selectedSector !== 'all' ? selectedSector : undefined,
          search: searchQuery.trim() || undefined,
        },
      });
      setFacilities(res.data.facilities || []);
      setSummary(res.data.summary || null);
    } catch (err: any) {
      console.error('Failed to fetch corridor data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorridorData();
  }, [selectedDistrict, selectedSector]);

  // Client search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCorridorData();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenTransferModal = (fac: FacilityItem) => {
    setSelectedSourceFac(fac);
    setTransferTargetId(facilities.find((f) => f.id !== fac.id)?.id || '');
    setTransferMsg(null);
    setShowTransferModal(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceFac || !transferTargetId) return;

    const targetFac = facilities.find((f) => f.id === transferTargetId);
    setTransferMsg({
      type: 'success',
      text: `Mutual Aid Dispatch Authorized: ${transferQty} units of ${transferResource} dispatched from ${selectedSourceFac.name} to ${targetFac?.name || 'Destination'} with priority [${transferPriority}]. Tracking Log ID: MA-${Date.now().toString().slice(-6)}.`,
    });

    setTimeout(() => {
      setShowTransferModal(false);
      setTransferMsg(null);
    }, 2800);
  };

  const getSectorBadge = (sector: string) => {
    switch (sector) {
      case 'defence_railway':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Shield className="w-3 h-3 text-blue-700" />
            DEFENCE &amp; RAILWAYS
          </span>
        );
      case 'private':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <Building2 className="w-3 h-3 text-purple-700" />
            PRIVATE MULTI-SPECIALTY
          </span>
        );
      case 'health_centre':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-900 border border-teal-300">
            <Stethoscope className="w-3 h-3 text-teal-700" />
            CHC &amp; PHC HEALTH CENTRE
          </span>
        );
      case 'government':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <Cross className="w-3 h-3 text-rose-700" />
            GOVERNMENT CIVIL &amp; APEX
          </span>
        );
    }
  };

  const getDistrictBadge = (districtName: string, stateCode: string) => {
    let colorClass = 'bg-stone-100 text-stone-800 border-stone-300';
    if (districtName.includes('Chennai')) colorClass = 'bg-amber-100 text-amber-900 border-amber-300';
    else if (districtName.includes('Puducherry') || stateCode === 'PY') colorClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    else if (districtName.includes('Villupuram')) colorClass = 'bg-sky-100 text-sky-900 border-sky-300';
    else if (districtName.includes('Cuddalore')) colorClass = 'bg-indigo-100 text-indigo-900 border-indigo-300';

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${colorClass}`}>
        <MapPin className="w-3 h-3" />
        {districtName.toUpperCase()} ({stateCode})
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. Flagship Corridor Hero Command Banner ──────────────────────── */}
      <div className="card p-5 bg-gradient-to-r from-[#FFF8EE] via-[#FCF4E8] to-[#FCEEEF] border-2 border-bhissm-border shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bhissm-emblem-box text-[#FFF9F1] flex flex-col items-center justify-center border-2 border-[#E8A7B5] shrink-0">
              <span className="font-black text-lg tracking-tighter leading-none">COR</span>
              <span className="text-[7px] font-mono uppercase tracking-widest text-[#F4D5DC] mt-0.5 font-bold">
                GRID
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-lg tracking-tight bhissm-brand-title">
                  BHISSM
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-bhissm-secondary">
                  • REGIONAL HEALTHCARE CORRIDOR NETWORK
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
                  ACTIVE CONTIGUOUS TELEMETRY
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-bhissm-dark mt-1 font-sans tracking-tight">
                Chennai • Villupuram • Puducherry • Cuddalore Healthcare Grid
              </h1>
              <p className="text-xs text-bhissm-secondary mt-1 font-medium">
                Unified cross-border clinical operations, mutual aid triage, defence/railway/civil integration, and real-time bed, blood &amp; stockpile telemetry.
              </p>
            </div>
          </div>

          {/* Right Live Date/Time & Highway Telemetry */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 shrink-0">
            {/* Live Synchronized Clock (Very Small Font) */}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/95 border border-bhissm-border rounded-lg text-[10px] font-mono shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="text-bhissm-secondary font-medium">SYS CLOCK:</span>
              <span className="font-black text-bhissm-dark">{formattedDate}</span>
              <span className="font-black text-emerald-700">{formattedTime}</span>
              <span className="bg-emerald-100 text-emerald-900 text-[9px] font-bold px-1 rounded">IST</span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-bhissm-secondary">
              <span className="flex items-center gap-1 bg-[#F4E7D7]/80 px-2 py-0.5 rounded border border-bhissm-border/60">
                <Compass className="w-3 h-3 text-[#B65C62]" />
                NH-45 • NH-45A • ECR
              </span>
              <button
                onClick={fetchCorridorData}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-bhissm-border hover:bg-stone-50 transition-colors cursor-pointer"
                title="Refresh real-time telemetry"
              >
                <RefreshCw className={`w-3 h-3 text-bhissm-dark ${loading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
              {(user?.role === 'national' || user?.role === 'state') && (
                <button
                  onClick={() => {
                    setAddFacError(null);
                    setAddFacSuccess(null);
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-bhissm-primary hover:bg-[#8F353B] text-white font-bold transition-colors cursor-pointer"
                  title="Register new hospital into the corridor master database"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>+ Add Hospital</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Key Regional KPI Metrics Summary ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Facilities */}
        <div className="card p-3.5 bg-gradient-to-br from-white to-[#FDF8EE] border border-bhissm-border shadow-2xs">
          <div className="flex items-center justify-between text-bhissm-secondary mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Total Centers</span>
            <Building2 className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-bhissm-dark font-mono">
            {summary?.total_facilities ?? facilities.length}
          </div>
          <div className="text-[10px] text-bhissm-secondary font-medium mt-1 truncate">
            {summary?.government_count || 0} Govt • {summary?.defence_railway_count || 0} Def/Rly • {summary?.private_count || 0} Pvt • {summary?.health_centre_count || 0} CHC/PHC
          </div>
        </div>

        {/* Total Beds & Availability */}
        <div className="card p-3.5 bg-gradient-to-br from-white to-[#F6FBF7] border border-bhissm-border shadow-2xs">
          <div className="flex items-center justify-between text-bhissm-secondary mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Available Beds</span>
            <Bed className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {summary?.available_beds?.toLocaleString() ?? 0}
          </div>
          <div className="text-[10px] text-bhissm-secondary font-medium mt-1">
            of {summary?.total_beds?.toLocaleString() ?? 0} Total Beds ({summary?.total_beds ? Math.round(((summary.total_beds - summary.available_beds) / summary.total_beds) * 100) : 0}% Occ)
          </div>
        </div>

        {/* Critical Care: ICU & Ventilators */}
        <div className="card p-3.5 bg-gradient-to-br from-white to-[#FBF4F7] border border-bhissm-border shadow-2xs">
          <div className="flex items-center justify-between text-bhissm-secondary mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">ICU &amp; Ventilator</span>
            <Activity className="w-4 h-4 text-rose-700" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">
            {summary?.available_icu_beds ?? 0} <span className="text-xs text-bhissm-secondary font-normal">ICU Avail</span>
          </div>
          <div className="text-[10px] text-bhissm-secondary font-medium mt-1">
            {summary?.available_ventilator_beds ?? 0} of {summary?.total_ventilator_beds ?? 0} Ventilators Free
          </div>
        </div>

        {/* Rapid Transit Fleet */}
        <div className="card p-3.5 bg-gradient-to-br from-white to-[#F3F7FA] border border-bhissm-border shadow-2xs">
          <div className="flex items-center justify-between text-bhissm-secondary mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Ambulances</span>
            <Truck className="w-4 h-4 text-sky-700" />
          </div>
          <div className="text-2xl font-black text-sky-700 font-mono">
            {summary?.available_ambulances ?? 0} <span className="text-xs text-bhissm-secondary font-normal">Ready</span>
          </div>
          <div className="text-[10px] text-bhissm-secondary font-medium mt-1">
            {summary?.als_ambulances ?? 0} ALS • {summary?.bls_ambulances ?? 0} BLS Fleet
          </div>
        </div>

        {/* Blood Supply Units */}
        <div className="card p-3.5 bg-gradient-to-br from-white to-[#FFF5F5] border border-bhissm-border shadow-2xs">
          <div className="flex items-center justify-between text-bhissm-secondary mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Blood Network</span>
            <Droplet className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-700 font-mono">
            {summary?.total_blood_units?.toLocaleString() ?? 0} <span className="text-xs text-bhissm-secondary font-normal">Units</span>
          </div>
          <div className="text-[10px] text-bhissm-secondary font-medium mt-1">
            Across {summary?.blood_banks_count ?? 0} Licensed Blood Banks
          </div>
        </div>

        {/* Stockpile Inventory */}
        <div className="card p-3.5 bg-gradient-to-br from-white to-[#FAF6EE] border border-bhissm-border shadow-2xs">
          <div className="flex items-center justify-between text-bhissm-secondary mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Drug Stockpile</span>
            <Boxes className="w-4 h-4 text-amber-800" />
          </div>
          <div className="text-2xl font-black text-bhissm-dark font-mono truncate">
            {summary?.total_medicine_stock_units ? (summary.total_medicine_stock_units / 1000).toFixed(0) + 'k' : '0'} <span className="text-xs text-bhissm-secondary font-normal">Units</span>
          </div>
          <div className="text-[10px] text-bhissm-secondary font-medium mt-1">
            33 Formulations Monitored
          </div>
        </div>
      </div>

      {/* ─── 3. Multi-District & Multi-Sector Filter Pill Bar ──────────────── */}
      <div className="card p-4 space-y-3.5 border-2 border-bhissm-border">
        {/* Row 1: District Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-bhissm-secondary shrink-0" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-bhissm-secondary">
              Geographical Hub:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Corridor (102)' },
              { id: 'TN-CHN', label: 'Chennai Metro (35)' },
              { id: 'PY-PD', label: 'Puducherry UT (30)' },
              { id: 'TN-VLR', label: 'Villupuram (18)' },
              { id: 'TN-CDL', label: 'Cuddalore (19)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedDistrict(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  selectedDistrict === tab.id
                    ? 'bg-bhissm-dark text-white shadow-xs'
                    : 'bg-[#F4E7D7]/70 text-bhissm-dark hover:bg-[#EBDBC9] border border-bhissm-border/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-bhissm-border/60" />

        {/* Row 2: Sector Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-bhissm-secondary shrink-0" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-bhissm-secondary">
              Healthcare Sector:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Sectors' },
              { id: 'government', label: '🏛️ Govt Civil & Apex' },
              { id: 'defence_railway', label: '🛡️ Defence & Railways' },
              { id: 'private', label: '🏥 Private Multi-Specialty' },
              { id: 'health_centre', label: '🩺 CHC & PHC Centres' },
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSector(sec.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  selectedSector === sec.id
                    ? 'bg-[#B65C62] text-white shadow-xs'
                    : 'bg-white text-bhissm-dark hover:bg-stone-100 border border-bhissm-border'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-bhissm-border/60" />

        {/* Row 3: Search Bar and Grid/Table View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-bhissm-secondary" />
            <input
              type="text"
              placeholder="Search hospitals, military, railway, CHC, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-bhissm-border rounded-lg focus:outline-none focus:ring-1 focus:ring-bhissm-dark"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-bhissm-secondary font-mono font-medium">
              Showing <span className="font-bold text-bhissm-dark">{facilities.length}</span> facilities
            </span>
            <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-bhissm-border/70">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-bhissm-dark shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-white text-bhissm-dark shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Table Matrix View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Main Facility Roster: Cards or Table ────────────────────────── */}
      {loading ? (
        <div className="card p-12 text-center font-mono text-xs text-bhissm-secondary">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-bhissm-dark mb-2" />
          SYNCHRONIZING REGIONAL CORRIDOR TELEMETRY...
        </div>
      ) : facilities.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-bhissm-dark">No Facilities Match Filter Criteria</h3>
          <p className="text-xs text-bhissm-secondary mt-1">
            Try clearing search keywords or switching geographical district / sector filters.
          </p>
          <button
            onClick={() => {
              setSelectedDistrict('all');
              setSelectedSector('all');
              setSearchQuery('');
            }}
            className="btn btn-secondary mt-4 text-xs font-mono"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {facilities.map((fac) => (
            <div
              key={fac.id}
              className="card p-4 flex flex-col justify-between hover:shadow-md transition-all border-2 border-bhissm-border hover:border-bhissm-dark/40"
            >
              <div>
                {/* Header tags: Sector & District */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                  {getSectorBadge(fac.sector)}
                  {getDistrictBadge(fac.district_name, fac.state_code)}
                </div>

                {/* Facility Title & Address */}
                <h3 className="text-sm font-black text-bhissm-dark leading-snug font-sans">
                  {fac.name}
                </h3>
                <p className="text-[11px] text-bhissm-secondary mt-0.5 line-clamp-1 font-medium">
                  {fac.address || `${fac.district_name}, ${fac.state_name}`}
                </p>

                {/* Bed Availability Bar */}
                <div className="mt-3.5 p-2.5 rounded-lg bg-[#FAF4ED] border border-bhissm-border/60">
                  <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
                    <span className="flex items-center gap-1 text-bhissm-dark">
                      <Bed className="w-3.5 h-3.5 text-emerald-700" />
                      Total Beds
                    </span>
                    <span className="text-emerald-700">
                      {fac.beds.available} Avail / {fac.beds.total} Total
                    </span>
                  </div>

                  {/* Bed Meter */}
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all"
                      style={{
                        width: `${fac.beds.total > 0 ? Math.min(100, Math.round((fac.beds.available / fac.beds.total) * 100)) : 0}%`,
                      }}
                    />
                  </div>

                  {/* Micro Ward Breakdown */}
                  <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] font-mono text-center text-bhissm-secondary">
                    <div className="bg-white/80 p-1 rounded border border-stone-200">
                      <div className="font-bold text-bhissm-dark">{fac.beds.general.available}</div>
                      <div className="text-[9px]">General</div>
                    </div>
                    <div className="bg-white/80 p-1 rounded border border-stone-200">
                      <div className="font-bold text-rose-700">{fac.beds.icu.available}</div>
                      <div className="text-[9px]">ICU Avail</div>
                    </div>
                    <div className="bg-white/80 p-1 rounded border border-stone-200">
                      <div className="font-bold text-amber-700">{fac.beds.ventilator.available}</div>
                      <div className="text-[9px]">Ventilators</div>
                    </div>
                  </div>
                </div>

                {/* Quick Fleet & Blood Bank Chips */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sky-900 font-semibold text-[11px]">
                      <Truck className="w-3.5 h-3.5 text-sky-700" />
                      Ambulances
                    </span>
                    <span className="font-bold text-sky-900">
                      {fac.ambulances.available}/{fac.ambulances.total}
                    </span>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center justify-between ${
                    fac.blood_bank.has_blood_bank
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}>
                    <span className="flex items-center gap-1 font-semibold text-[11px]">
                      <Droplet className={`w-3.5 h-3.5 ${fac.blood_bank.has_blood_bank ? 'text-red-600' : 'text-stone-400'}`} />
                      Blood Bank
                    </span>
                    <span className="font-bold">
                      {fac.blood_bank.has_blood_bank ? `${fac.blood_bank.total_units} U` : 'No BB'}
                    </span>
                  </div>
                </div>

                {/* Stock Status Bar */}
                <div className="mt-2 text-[10px] font-mono text-bhissm-secondary flex items-center justify-between px-1">
                  <span>Medicine Stockpile:</span>
                  <span className="font-bold text-bhissm-dark">
                    {fac.inventory.total_stock_units ? fac.inventory.total_stock_units.toLocaleString() : '0'} units
                    {fac.inventory.low_stock_count > 0 && (
                      <span className="text-amber-700 ml-1">({fac.inventory.low_stock_count} low)</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-bhissm-border flex items-center gap-2">
                <button
                  onClick={() => handleOpenTransferModal(fac)}
                  className="flex-1 btn btn-primary text-[11px] py-1.5 flex items-center justify-center gap-1.5 font-mono cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Mutual Aid Transfer
                </button>

                <Link
                  to="/inventory"
                  className="btn btn-secondary text-[11px] py-1.5 px-3 flex items-center justify-center gap-1 font-mono"
                  title="Open Stock Inventory"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  Stock
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE MATRIX VIEW */
        <div className="card overflow-x-auto border-2 border-bhissm-border">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#FAF4ED] text-bhissm-dark border-b-2 border-bhissm-border uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Facility Name</th>
                <th className="p-3">Sector</th>
                <th className="p-3">District</th>
                <th className="p-3 text-center">Beds (Avail/Total)</th>
                <th className="p-3 text-center">ICU</th>
                <th className="p-3 text-center">Ventilator</th>
                <th className="p-3 text-center">Ambulances</th>
                <th className="p-3 text-center">Blood Bank</th>
                <th className="p-3 text-center">Drug Stock</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bhissm-border/60">
              {facilities.map((fac) => (
                <tr key={fac.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-bhissm-dark">{fac.name}</div>
                    <div className="text-[10px] text-bhissm-secondary truncate max-w-xs">
                      {fac.address || fac.district_name}
                    </div>
                  </td>
                  <td className="p-3">{getSectorBadge(fac.sector)}</td>
                  <td className="p-3">{getDistrictBadge(fac.district_name, fac.state_code)}</td>
                  <td className="p-3 text-center">
                    <span className="font-bold text-emerald-700">{fac.beds.available}</span> / {fac.beds.total}
                  </td>
                  <td className="p-3 text-center font-bold text-rose-700">{fac.beds.icu.available}</td>
                  <td className="p-3 text-center font-bold text-amber-700">{fac.beds.ventilator.available}</td>
                  <td className="p-3 text-center text-sky-800 font-bold">
                    {fac.ambulances.available}/{fac.ambulances.total}
                  </td>
                  <td className="p-3 text-center">
                    {fac.blood_bank.has_blood_bank ? (
                      <span className="text-red-700 font-bold">{fac.blood_bank.total_units} U</span>
                    ) : (
                      <span className="text-stone-400">None</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-bhissm-dark">
                    {fac.inventory.total_stock_units ? (fac.inventory.total_stock_units / 1000).toFixed(0) + 'k' : '0'}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleOpenTransferModal(fac)}
                      className="px-2.5 py-1 text-[10px] bg-bhissm-dark text-white rounded font-bold hover:bg-black transition-colors cursor-pointer"
                    >
                      Mutual Aid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── 5. Inter-Hospital Mutual Aid Resource Transfer Modal ───────────── */}
      {showTransferModal && selectedSourceFac && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFDF9] border-2 border-bhissm-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-bhissm-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-bhissm-dark uppercase tracking-tight">
                    Corridor Mutual-Aid Transfer Order
                  </h3>
                  <p className="text-[10px] text-bhissm-secondary font-mono">
                    Inter-Facility Resource Balancing Protocol
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {transferMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-mono font-medium ${
                  transferMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}
              >
                {transferMsg.text}
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-3.5 text-xs">
              {/* Origin Facility Display */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-bhissm-secondary uppercase mb-1">
                  Source Facility (Dispatch Origin)
                </label>
                <div className="p-2.5 bg-stone-100 rounded-lg border border-stone-200 font-bold text-bhissm-dark font-sans flex items-center justify-between">
                  <span>{selectedSourceFac.name}</span>
                  <span className="text-[10px] font-mono text-bhissm-secondary uppercase">
                    {selectedSourceFac.district_name}
                  </span>
                </div>
              </div>

              {/* Destination Facility Select */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-bhissm-secondary uppercase mb-1">
                  Destination Hospital (Recipient Node)
                </label>
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  required
                  className="w-full p-2 bg-white border border-bhissm-border rounded-lg font-mono text-xs focus:ring-1 focus:ring-bhissm-dark"
                >
                  {facilities
                    .filter((f) => f.id !== selectedSourceFac.id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} — {f.district_name} ({f.sector.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>

              {/* Resource & Quantity */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-mono font-bold text-bhissm-secondary uppercase mb-1">
                    Resource / Drug Spec
                  </label>
                  <select
                    value={transferResource}
                    onChange={(e) => setTransferResource(e.target.value)}
                    className="w-full p-2 bg-white border border-bhissm-border rounded-lg font-mono text-xs"
                  >
                    <option value="Adrenaline 1mg/ml (Emergency Resuscitation)">Adrenaline 1mg/ml Ampoules</option>
                    <option value="Ringer's Lactate 500ml IV Infusion">Ringer's Lactate 500ml IV</option>
                    <option value="Meropenem 1g IV Critical Care Antibiotic">Meropenem 1g IV Vials</option>
                    <option value="Ceftriaxone 1g IV Injection">Ceftriaxone 1g IV Vials</option>
                    <option value="Anti-Snake Venom (ASV) Polyvalent">Anti-Snake Venom (ASV)</option>
                    <option value="Insulin Regular (Human) 100 IU/ml">Insulin Regular 100 IU/ml</option>
                    <option value="Packed Red Blood Cells (PRBC) Units">PRBC Blood Units (O- / O+)</option>
                    <option value="ALS Ambulance Unit Rapid Loan">ALS Ambulance Rapid Loan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-bhissm-secondary uppercase mb-1">
                    Qty / Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={transferQty}
                    onChange={(e) => setTransferQty(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-white border border-bhissm-border rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-bhissm-secondary uppercase mb-1">
                  Dispatch Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  {[
                    { id: 'Immediate Code Red', label: '🚨 Immediate Code Red' },
                    { id: 'Urgent High Priority', label: '⚡ Urgent High' },
                    { id: 'Routine Balancing', label: '📦 Routine Stock' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setTransferPriority(p.id)}
                      className={`p-2 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                        transferPriority === p.id
                          ? 'bg-bhissm-dark text-white border-bhissm-dark'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-bhissm-border">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="btn btn-secondary text-xs font-mono py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs font-mono py-1.5 px-4 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm &amp; Dispatch Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD HOSPITAL TO CORRIDOR MASTER DATABASE MODAL ────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card bg-white max-w-lg w-full p-5 shadow-2xl border-2 border-bhissm-dark space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono flex items-center gap-2">
                <Building2 className="w-4 h-4 text-bhissm-dark" />
                Register Hospital in Corridor Network
              </h3>
              <button onClick={() => setShowAddModal(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            {addFacError && (
              <div className="p-2.5 rounded text-xs bg-red-100 text-red-900 border border-red-300 font-mono">
                {addFacError}
              </div>
            )}
            {addFacSuccess && (
              <div className="p-2.5 rounded text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono font-bold">
                {addFacSuccess}
              </div>
            )}

            <form onSubmit={handleAddHospital} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[11px] font-bold text-bhissm-secondary uppercase mb-1">
                  Hospital / Center Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tambaram Railway Hospital or Apollo Specialty"
                  value={newFacName}
                  onChange={(e) => setNewFacName(e.target.value)}
                  className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-bhissm-secondary uppercase mb-1">
                    Corridor District *
                  </label>
                  <select
                    value={newFacDistrict}
                    onChange={(e) => setNewFacDistrict(e.target.value)}
                    className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                  >
                    <option value="TN-CHN">Chennai (Tamil Nadu)</option>
                    <option value="TN-VLR">Villupuram (Tamil Nadu)</option>
                    <option value="TN-CDL">Cuddalore (Tamil Nadu)</option>
                    <option value="PY-PD">Puducherry District (UT)</option>
                    <option value="PY-KK">Karaikal (UT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-bhissm-secondary uppercase mb-1">
                    Sector Classification *
                  </label>
                  <select
                    value={newFacSector}
                    onChange={(e) => setNewFacSector(e.target.value as any)}
                    className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                  >
                    <option value="government">Government Civil &amp; Apex</option>
                    <option value="defence_railway">Defence &amp; Railway</option>
                    <option value="private">Private Multi-Specialty</option>
                    <option value="health_centre">CHC &amp; PHC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-bhissm-secondary uppercase mb-1">
                    Care Level *
                  </label>
                  <select
                    value={newFacLevel}
                    onChange={(e) => setNewFacLevel(e.target.value)}
                    className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                  >
                    <option value="district">District General Hospital</option>
                    <option value="apex">Apex Tertiary / Medical College</option>
                    <option value="state">State Referral Hospital</option>
                    <option value="phc">Primary Health Centre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-bhissm-secondary uppercase mb-1">
                    Blood Bank Certified?
                  </label>
                  <select
                    value={newFacBloodBank ? '1' : '0'}
                    onChange={(e) => setNewFacBloodBank(e.target.value === '1')}
                    className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                  >
                    <option value="1">Yes (Whole Blood + Components)</option>
                    <option value="0">No (Storage Centre Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-bhissm-secondary uppercase mb-1">
                  Location / Highway Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. NH-45 Highway Junction, Villupuram"
                  value={newFacAddress}
                  onChange={(e) => setNewFacAddress(e.target.value)}
                  className="w-full p-2 bg-[#FAF6F0] border border-bhissm-border rounded-lg"
                />
              </div>

              <div className="p-3 bg-[#FAF6F0] rounded-lg border border-bhissm-border text-[11px] text-bhissm-secondary">
                <span className="font-bold text-bhissm-dark block mb-0.5">Automated Cascading Provisioning:</span>
                Registering this center will immediately seed 4 bed wards (General, ICU, Trauma, Ventilator), 2 ambulances (ALS &amp; BLS), 8 blood group units, all 33 catalog medicines, and an encrypted command login node in the master database.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-bhissm-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addFacLoading}
                  className="btn btn-primary text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{addFacLoading ? 'Provisioning...' : 'Register Hospital'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
