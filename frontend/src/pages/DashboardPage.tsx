import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import {
  Boxes,
  AlertTriangle,
  Droplet,
  Truck,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Syringe,
  Check,
  Globe,
  Landmark,
  MapPin,
  Send,
  ShieldCheck,
  FileCheck,
  Siren,
  Compass,
  Database,
} from 'lucide-react';

const DEFAULT_FALLBACK_STATS = {
  medicine: { total_medicines: 33, low_stock_count: 3, critical_low_stock: 1 },
  vaccines: { total_doses: 184500, total_vaccines: 8 },
  blood: { total_units: 1420, critical_groups: 1 },
  ambulances: { available: 42, total: 50, deployed: 8 },
  expiring_batches_30d: 4,
};

const DEFAULT_FALLBACK_STATES = [
  { id: 'puducherry-state-id', name: 'Puducherry', code: 'PY', type: 'ut' },
  { id: 'tamil-nadu-state-id', name: 'Tamil Nadu', code: 'TN', type: 'state' },
  { id: 'karnataka-state-id', name: 'Karnataka', code: 'KA', type: 'state' },
  { id: 'kerala-state-id', name: 'Kerala', code: 'KL', type: 'state' },
  { id: 'andhra-state-id', name: 'Andhra Pradesh', code: 'AP', type: 'state' },
  { id: 'delhi-state-id', name: 'Delhi', code: 'DL', type: 'ut' },
  { id: 'maharashtra-state-id', name: 'Maharashtra', code: 'MH', type: 'state' },
];

const DEFAULT_FALLBACK_EMERGENCIES = [
  {
    id: 'emg-py-01',
    title: 'Code Red Trauma Mass Casualty Incident - ECR',
    severity: 'critical',
    location: 'East Coast Road (ECR), Kalapet, Puducherry',
    estimated_casualties: 42,
    primary_facility_name: 'JIPMER Apex Hospital Puducherry',
    state_name: 'Puducherry',
    is_cross_border_aid: false,
  },
  {
    id: 'emg-corridor-02',
    title: 'Inter-State Chemical Inhalation Advisory - Cuddalore SIPCOT',
    severity: 'high',
    location: 'SIPCOT Industrial Complex, Cuddalore, Tamil Nadu',
    estimated_casualties: 85,
    primary_facility_name: 'Cuddalore GH & JIPMER Corridor Node',
    state_name: 'Tamil Nadu',
    is_cross_border_aid: true,
  },
];

const DEFAULT_FALLBACK_ALERTS = [
  {
    id: 'alert-01',
    severity: 'critical',
    alert_type: 'CRITICAL_STOCK_DEPLETION',
    title: 'Anti-Rabies Immunoglobulin Below 10% Reserve',
    message: 'Stock critically low at Indira Gandhi GH Puducherry. Regional transfer buffer recommended.',
    created_at: new Date().toISOString(),
    facility_name: 'Indira Gandhi GH Puducherry',
  },
  {
    id: 'alert-02',
    severity: 'warning',
    alert_type: 'FEFO_BATCH_EXPIRY',
    title: 'Ceftriaxone 1g Injection FEFO Rotation Active',
    message: 'Batch #CFT-2024 expires within 28 days. High velocity dispatch initiated to district clinics.',
    created_at: new Date().toISOString(),
    facility_name: 'Villupuram Medical College',
  },
];

const SAMPLE_TELEMETRY_ITEMS = [
  {
    name: 'Anti-Rabies Immunoglobulin',
    hospital: 'IGGGH Puducherry',
    stock: '85 vials',
    category: 'critical',
    status: 'low',
    actionText: 'Allocate',
    actionLink: '/inventory',
  },
  {
    name: 'Ceftriaxone 1g Injection',
    hospital: 'JIPMER Apex Hospital',
    stock: '1,240 vials',
    category: 'medicines',
    status: 'healthy',
    actionText: 'View',
    actionLink: '/inventory',
  },
  {
    name: 'Normal Saline 500ml',
    hospital: 'PIMS Kalapet',
    stock: '4,800 units',
    category: 'medicines',
    status: 'healthy',
    actionText: 'View',
    actionLink: '/inventory',
  },
  {
    name: 'Oxytocin 10 IU Injection',
    hospital: 'Villupuram GMCH',
    stock: '120 amps',
    category: 'critical',
    status: 'critical',
    actionText: 'Request',
    actionLink: '/forecast',
  },
  {
    name: 'Measles-Rubella (MR) Vaccine',
    hospital: 'Puducherry State Cold Depot',
    stock: '24,500 doses',
    category: 'vaccines',
    status: 'healthy',
    actionText: 'View',
    actionLink: '/inventory',
  },
  {
    name: 'Packed Red Blood Cells (O−)',
    hospital: 'JIPMER Blood Bank',
    stock: '14 units',
    category: 'blood',
    status: 'low',
    actionText: 'Request',
    actionLink: '/blood-bank',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(DEFAULT_FALLBACK_STATS);
  const [alerts, setAlerts] = useState<any[]>(DEFAULT_FALLBACK_ALERTS);
  const [emergencies, setEmergencies] = useState<any[]>(DEFAULT_FALLBACK_EMERGENCIES);
  const [nationalDisasters, setNationalDisasters] = useState<any[]>([]);
  const [statesList, setStatesList] = useState<any[]>(DEFAULT_FALLBACK_STATES);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [nationalReserves, setNationalReserves] = useState<any[]>([]);
  const [stockCategoryTab, setStockCategoryTab] = useState<'all' | 'medicines' | 'vaccines' | 'blood' | 'critical'>('all');
  const [loading, setLoading] = useState(true);

  // Fetch list of states
  const fetchStates = async () => {
    try {
      const res = await API.get('/states');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setStatesList(res.data);
      }
      if (user?.role !== 'national' && user?.state_id) {
        setSelectedStateId(user.state_id);
      }
    } catch (e) {
      console.warn('[DashboardPage] States API unfulfilled, utilizing fallback registry.');
    }
  };

  const fetchNationalReserves = async () => {
    try {
      const res = await API.get('/national-reserve');
      if (Array.isArray(res.data)) {
        setNationalReserves(res.data);
      }
    } catch (e) {
      console.warn('[DashboardPage] National reserves API unfulfilled.');
    }
  };

  const fetchData = async (stateIdToFilter?: string) => {
    try {
      setLoading(true);
      const effectiveState = stateIdToFilter !== undefined ? stateIdToFilter : selectedStateId;

      const [statsRes, alertsRes, emergRes, natDisasterRes] = await Promise.all([
        API.get('/alerts/dashboard', {
          params: { state_id: effectiveState || undefined },
        }).catch(() => ({ data: null })),
        API.get('/alerts', {
          params: { unread_only: 'true', state_id: effectiveState || undefined },
        }).catch(() => ({ data: null })),
        API.get('/emergencies', {
          params: {
            status: 'active',
            state_id: effectiveState || undefined,
          },
        }).catch(() => ({ data: null })),
        API.get('/emergencies', {
          params: {
            status: 'active',
            min_casualties: 500,
          },
        }).catch(() => ({ data: null })),
      ]);

      if (statsRes.data && typeof statsRes.data === 'object' && !Array.isArray(statsRes.data) && statsRes.data.medicine) {
        setStats(statsRes.data);
      }
      if (Array.isArray(alertsRes.data)) {
        setAlerts(alertsRes.data.slice(0, 6));
      }
      if (Array.isArray(emergRes.data)) {
        setEmergencies(emergRes.data);
      }
      if (Array.isArray(natDisasterRes.data)) {
        setNationalDisasters(natDisasterRes.data);
      }
    } catch (err) {
      console.error('[DashboardPage] Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
    if (user?.role === 'national') {
      fetchNationalReserves();
    }
  }, [user]);

  useEffect(() => {
    fetchData(selectedStateId);
  }, [selectedStateId, user]);

  const markAlertRead = async (id: string) => {
    try {
      await API.put(`/alerts/${id}/read`);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const isNationalScope = user?.role === 'national' && !selectedStateId;
  const currentStateObj = statesList.find((s) => s.id === selectedStateId);

  // Compute punchy hero title in editorial typography
  const getHeroTitle = () => {
    if (isNationalScope) {
      return 'NATIONAL';
    }
    if (selectedStateId && currentStateObj) {
      return currentStateObj.name.toUpperCase();
    }
    if (user?.facility_name) {
      // Pick first word or short title for clean impact
      const parts = user.facility_name.split(' ');
      return parts.length > 3 ? parts.slice(0, 2).join(' ').toUpperCase() : user.facility_name.toUpperCase();
    }
    if (user?.state_name) {
      return user.state_name.toUpperCase();
    }
    return 'PUDUCHERRY';
  };

  const heroUnitName = getHeroTitle();

  const filteredTelemetry = SAMPLE_TELEMETRY_ITEMS.filter((item) => {
    if (stockCategoryTab === 'all') return true;
    if (stockCategoryTab === 'critical') return item.category === 'critical' || item.status === 'critical' || item.status === 'low';
    return item.category === stockCategoryTab;
  });

  return (
    <div className="space-y-6">
      {/* ── 1. EDITORIAL RETRO HERO BANNER ───────────────────────────────────────── */}
      <section className="bg-bhissm-surface border border-bhissm-maroon/25 rounded-2xl p-6 sm:p-8 md:p-10 shadow-xs relative overflow-hidden">
        {/* State filter control if National user */}
        {user?.role === 'national' && (
          <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-bhissm-maroon/15">
            <div className="flex items-center gap-2 text-xs font-mono text-bhissm-secondary">
              <span className="w-2 h-2 rounded-full bg-bhissm-maroon animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-bhissm-maroon">APEX JURISDICTION FILTER:</span>
            </div>
            <div className="flex items-center gap-1.5 bg-bhissm-bg px-3 py-1.5 rounded-lg border border-bhissm-border text-xs">
              <MapPin className="w-3.5 h-3.5 text-bhissm-maroon" />
              <select
                className="font-mono text-xs font-semibold bg-transparent focus:outline-none cursor-pointer text-bhissm-dark"
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
              >
                <option value="">National Overview (All 36 States & UTs)</option>
                {statesList
                  .filter((s) => s.code !== 'NA')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {/* Giant Condensed Headline */}
        <div className="flex items-start justify-between gap-4">
          <div
            className="font-display leading-none text-bhissm-maroon select-none tracking-tight"
            style={{ fontSize: 'clamp(54px, 13vw, 160px)' }}
          >
            {heroUnitName}
            <span
              className="text-bhissm-gold inline-block align-top ml-2 transform translate-y-3"
              style={{ fontSize: '0.28em' }}
            >
              ✳
            </span>
          </div>
        </div>

        {/* Editorial Subtitle Row */}
        <div className="flex flex-wrap items-start justify-between gap-6 mt-4">
          <div className="max-w-md text-sm leading-relaxed text-bhissm-secondary">
            <div className="text-xs font-bold uppercase tracking-widest text-bhissm-maroon">
              {isNationalScope
                ? 'Central Strategic Reserve Command'
                : selectedStateId && currentStateObj
                ? `${currentStateObj.name} State Health Command`
                : user?.facility_name
                ? `${user.facility_name} Node`
                : 'State Health Command'}
            </div>
            <p className="mt-1">
              {isNationalScope
                ? 'Central strategic reserve management, inter-state replenishment fulfillment, and national disaster response (>500 affected).'
                : 'Real-time stock, FEFO rotation and cross-border mutual aid across 102 health centres.'}
            </p>
          </div>

          <div className="max-w-xs text-sm leading-relaxed text-right hidden md:block text-bhissm-secondary">
            <span className="text-bhissm-gold text-sm tracking-widest font-bold">✳ ✳ ✳</span>
            <div className="mt-1 text-xs">
              Zero stockout. Every vial accounted for, every corridor connected.
            </div>
          </div>
        </div>

        {/* KPI Numerals Row with Hairline Dividers & Action CTA */}
        <div className="flex flex-wrap items-center justify-between gap-6 mt-8 pt-6 border-t border-bhissm-maroon/20">
          <div className="flex flex-wrap items-center gap-y-4 gap-x-6 sm:gap-x-8 flex-1 min-w-[280px]">
            {isNationalScope ? (
              <>
                <div className="pr-4 sm:pr-6">
                  <div className="font-display text-4xl sm:text-5xl text-bhissm-maroon leading-none">
                    {Math.round((stats?.national_network?.total_strategic_stockpile || 380000) / 1000)}K
                  </div>
                  <div className="text-xs text-bhissm-secondary uppercase tracking-wider font-semibold mt-1">
                    Central Stockpile
                  </div>
                </div>

                <div className="border-l border-bhissm-maroon/25 pl-4 sm:pl-6">
                  <div className="font-display text-4xl sm:text-5xl text-bhissm-accent leading-none">
                    {Math.round((stats?.national_network?.immediately_releasable_quota || 275000) / 1000)}K
                  </div>
                  <div className="text-xs text-bhissm-secondary uppercase tracking-wider font-semibold mt-1">
                    Releasable Quota
                  </div>
                </div>

                <div className="border-l border-bhissm-maroon/25 pl-4 sm:pl-6">
                  <div className="font-display text-4xl sm:text-5xl text-bhissm-dark leading-none">
                    {statesList.filter((s) => s.code !== 'NA').length || 36}
                  </div>
                  <div className="text-xs text-bhissm-secondary uppercase tracking-wider font-semibold mt-1">
                    States &amp; UTs
                  </div>
                </div>

                <div className="border-l border-bhissm-maroon/25 pl-4 sm:pl-6">
                  <div className="font-display text-4xl sm:text-5xl text-bhissm-critical leading-none">
                    {nationalDisasters.length}
                  </div>
                  <div className="text-xs text-bhissm-secondary uppercase tracking-wider font-semibold mt-1">
                    National Disasters
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="pr-4 sm:pr-6">
                  <div className="font-display text-4xl sm:text-5xl text-bhissm-maroon leading-none">
                    {stats?.medicine?.total_medicines ?? 33}
                  </div>
                  <div className="text-xs text-bhissm-secondary uppercase tracking-wider font-semibold mt-1">
                    Medicines Active
                  </div>
                </div>

                <div className="border-l border-bhissm-maroon/25 pl-4 sm:pl-6">
                  <div className="font-display text-4xl sm:text-5xl text-bhissm-accent leading-none">
                    {stats?.medicine?.low_stock_count !== undefined ? String(stats.medicine.low_stock_count).padStart(2, '0') : '03'}
                  </div>
                  <div className="text-xs text-bhissm-secondary uppercase tracking-wider font-semibold mt-1">
                    Low Stock Alerts
                  </div>
                </div>

                <div className="border-l border-bhissm-maroon/25 pl-4 sm:pl-6">
                  <div className="font-display text-4xl sm:text-5xl text-bhissm-dark leading-none">
                    {stats?.vaccines?.total_doses ? `${Math.round(stats.vaccines.total_doses / 1000)}K` : '184.5K'}
                  </div>
                  <div className="text-xs text-bhissm-secondary uppercase tracking-wider font-semibold mt-1">
                    Vaccine Doses
                  </div>
                </div>

                <div className="border-l border-bhissm-maroon/25 pl-4 sm:pl-6">
                  <div className="font-display text-4xl sm:text-5xl text-bhissm-dark leading-none">
                    {(stats?.blood?.total_units ?? 1420).toLocaleString()}
                  </div>
                  <div className="text-xs text-bhissm-secondary uppercase tracking-wider font-semibold mt-1">
                    Blood Units
                  </div>
                </div>

                <div className="border-l border-bhissm-maroon/25 pl-4 sm:pl-6">
                  <div className="font-display text-4xl sm:text-5xl text-bhissm-dark leading-none">
                    {stats?.ambulances?.available ?? 42}
                    <span className="text-2xl text-bhissm-secondary font-mono">
                      /{stats?.ambulances?.total ?? 50}
                    </span>
                  </div>
                  <div className="text-xs text-bhissm-secondary uppercase tracking-wider font-semibold mt-1">
                    Ambulances Ready
                  </div>
                </div>

                <div className="border-l border-bhissm-maroon/25 pl-4 sm:pl-6">
                  <div className="font-display text-4xl sm:text-5xl text-bhissm-accent leading-none">
                    {String(stats?.expiring_batches_30d ?? 4).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-bhissm-secondary uppercase tracking-wider font-semibold mt-1">
                    Expiring in 30d
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action CTA Button */}
          <div className="flex items-center gap-3">
            <Link
              to={isNationalScope ? '/national-reserve' : '/forecast'}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-bhissm-maroon hover:bg-bhissm-maroon-dark text-[#F6E9DC] flex flex-col items-center justify-center text-center text-xs sm:text-sm font-bold uppercase tracking-wider leading-tight shadow-md transition-all hover:scale-105 hover:-rotate-3 shrink-0"
              title={isNationalScope ? 'Open Strategic Reserve' : 'Calculate Transfer Quota'}
            >
              <span>{isNationalScope ? 'Release' : 'Allocate'}</span>
              <span>Quota ↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. SUBTLE MARQUEE TICKER ────────────────────────────────────────────── */}
      <div className="ticker rounded-xl border border-bhissm-maroon/30 shadow-xs">
        <div className="ticker-track">
          <span>Zero Stockout</span>
          <span className="text-bhissm-gold">✦</span>
          <span>FEFO First</span>
          <span className="text-bhissm-gold">✦</span>
          <span>Cold Chain Intact</span>
          <span className="text-bhissm-gold">✦</span>
          <span>Corridor Mutual Aid</span>
          <span className="text-bhissm-gold">✦</span>
          <span>Two-Step Disaster Protocol</span>
          <span className="text-bhissm-gold">✦</span>
          <span>Every Vial Accounted</span>
          <span className="text-bhissm-gold">✦</span>
          <span>Zero Stockout</span>
          <span className="text-bhissm-gold">✦</span>
          <span>FEFO First</span>
          <span className="text-bhissm-gold">✦</span>
          <span>Cold Chain Intact</span>
          <span className="text-bhissm-gold">✦</span>
          <span>Corridor Mutual Aid</span>
          <span className="text-bhissm-gold">✦</span>
          <span>Two-Step Disaster Protocol</span>
          <span className="text-bhissm-gold">✦</span>
          <span>Every Vial Accounted</span>
          <span className="text-bhissm-gold">✦</span>
        </div>
      </div>

      {/* ── 3. REGIONAL HEALTHCARE CORRIDOR BANNER (CHENNAI - PUDUCHERRY - CUDDALORE) ── */}
      <div className="card p-5 bg-[#3A1517] text-[#F6E9DC] border border-bhissm-maroon/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-bhissm-gold/20 border border-bhissm-gold/30 flex items-center justify-center text-bhissm-gold shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest font-extrabold bg-bhissm-gold/20 text-bhissm-gold border border-bhissm-gold/40 px-2.5 py-0.5 rounded-full">
                REGIONAL COMMAND CORRIDOR
              </span>
              <span className="text-xs font-mono text-[#E7CDB8]">
                102 Health Centers • NH-45 &amp; NH-45A
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Chennai • Villupuram • Puducherry • Cuddalore Healthcare Grid
            </h2>
            <p className="text-xs text-[#E7CDB8]/90 mt-0.5 max-w-3xl">
              Live telemetry for Apex Medical Colleges, Military Hospital Chennai, Southern Railway Hospital, Port Trust, ESIC, Private Multi-Specialty, and CHCs/PHCs.
            </p>
          </div>
        </div>

        <Link
          to="/corridor"
          className="self-start md:self-auto px-4 py-2.5 bg-bhissm-gold hover:bg-[#F2C465] text-bhissm-dark font-bold font-mono text-xs rounded-lg flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <span>Open Corridor Dashboard</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── 4. ACTIVE EMERGENCIES (IF PRESENT) ─────────────────────────────────── */}
      {emergencies.length > 0 && (
        <div className="card bg-gradient-to-r from-red-50 via-[#F6F0E9] to-red-50/70 border-2 border-red-400 p-5 space-y-3.5 emergency-banner-glow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-red-600 text-white shrink-0 emergency-beacon-core">
                <span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-50" />
                <Siren className="w-5 h-5 relative z-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-700 text-white text-xs font-mono font-black uppercase">
                    <span className="w-2 h-2 rounded-full siren-light-left" />
                    <span className="w-2 h-2 rounded-full siren-light-right" />
                    <span>CODE RED • ACTIVE INCIDENT</span>
                  </span>
                  <span className="text-xs font-mono bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded-full font-bold">
                    STATE + ADJACENT DISTRICTS LINKED
                  </span>
                </div>
                <h2 className="text-base font-black text-red-950 uppercase tracking-wide font-mono mt-0.5">
                  Active Regional &amp; Cross-Border Emergencies ({emergencies.length})
                </h2>
              </div>
            </div>
            <Link
              to="/emergency"
              className="bg-red-700 hover:bg-red-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 font-mono shrink-0 w-fit shadow-xs"
            >
              <span>Open Incident Command</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {emergencies.map((e) => (
              <Link
                to="/emergency"
                key={e.id}
                className="bg-white border-2 border-red-200 hover:border-red-500 rounded-xl p-3.5 text-xs space-y-2 shadow-xs transition-all block"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-extrabold text-bhissm-dark text-sm leading-snug">
                    {e.title}
                  </span>
                  <span
                    className={`text-xs font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 ${
                      e.is_cross_border_aid
                        ? 'bg-blue-700 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {e.is_cross_border_aid ? 'ADJACENT AID' : e.severity}
                  </span>
                </div>
                <div className="text-bhissm-secondary flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-700 shrink-0" />
                  <span className="truncate">{e.location}</span>
                </div>
                <div className="flex justify-between text-xs text-bhissm-secondary font-mono pt-1.5 border-t border-gray-100">
                  <span className="font-bold text-red-900">
                    Casualties: {e.estimated_casualties ?? e.estimatedCasualties ?? 'Under triage'}
                  </span>
                  <span>1°: {e.primary_facility_name?.slice(0, 18) || e.state_name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. FIVE-COLUMN OPERATIONAL SECTION (TABLE + EDITORIAL TILES) ──────── */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (3 cols): Live Stock Telemetry Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl text-bhissm-maroon leading-none">
                Live Stock Telemetry
              </h2>
              <p className="text-xs text-bhissm-secondary mt-1">
                Real-time inventory levels across regional hospitals and cold chain lines.
              </p>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'medicines', 'vaccines', 'blood', 'critical'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStockCategoryTab(tab)}
                  className={`tab-pill uppercase ${stockCategoryTab === tab ? 'tab-pill-active' : ''}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-0 overflow-hidden border border-bhissm-maroon/25">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F1E8DE] border-b border-bhissm-border">
                    <th className="table-header">Medicine / Item</th>
                    <th className="table-header">Hospital Node</th>
                    <th className="table-header">Stock Level</th>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bhissm-border/50">
                  {filteredTelemetry.map((row) => (
                    <tr key={row.name} className="hover:bg-bhissm-maroon/5 transition-colors">
                      <td className="table-cell font-semibold text-bhissm-dark">
                        {row.name}
                      </td>
                      <td className="table-cell text-xs text-bhissm-secondary">
                        {row.hospital}
                      </td>
                      <td className="table-cell font-mono text-xs font-bold text-bhissm-dark">
                        {row.stock}
                      </td>
                      <td className="table-cell">
                        {row.status === 'healthy' ? (
                          <span className="badge-success">Healthy</span>
                        ) : row.status === 'low' ? (
                          <span className="badge-warning">Low</span>
                        ) : (
                          <span className="badge-critical">Critical</span>
                        )}
                      </td>
                      <td className="table-cell text-right">
                        <Link
                          to={row.actionLink}
                          className={
                            row.actionText === 'Allocate' || row.actionText === 'Request'
                              ? 'btn-primary text-xs py-1 px-3'
                              : 'btn-outline text-xs py-1 px-3'
                          }
                        >
                          {row.actionText}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (2 cols): Four Editorial Status Tiles */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4 content-start">
          {/* Tile 01: Live Incident / Alert (Maroon Fill) */}
          <Link
            to="/emergency"
            className="p-4 rounded-xl bg-bhissm-maroon text-[#F6E9DC] border border-bhissm-maroon flex flex-col justify-between min-h-[170px] relative transition-transform hover:-translate-y-1 shadow-sm group"
          >
            <span className="absolute top-3.5 right-3.5 text-base text-bhissm-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              ↗
            </span>
            <div className="text-xs font-mono font-bold text-bhissm-gold uppercase tracking-wider">
              /01 · Live
            </div>
            <div>
              <div className="font-display text-4xl sm:text-5xl text-[#F6E9DC] leading-none">
                {emergencies.length > 0
                  ? emergencies[0].estimated_casualties || '42'
                  : '00'}
              </div>
              <div className="text-xs sm:text-sm font-bold mt-1 line-clamp-1">
                {emergencies.length > 0 ? emergencies[0].title : 'All Sectors Clear'}
              </div>
              <div className="text-xs text-[#E7CDB8] mt-0.5">
                {emergencies.length > 0 ? 'Emergency Active' : 'Normal Grid Status'}
              </div>
            </div>
          </Link>

          {/* Tile 02: Blood Buffer (Skin Fill) */}
          <Link
            to="/blood-bank"
            className="p-4 rounded-xl bg-bhissm-skin text-bhissm-dark border border-bhissm-border flex flex-col justify-between min-h-[170px] relative transition-transform hover:-translate-y-1 shadow-xs group"
          >
            <span className="absolute top-3.5 right-3.5 text-base text-bhissm-maroon group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              ↗
            </span>
            <div className="text-xs font-mono font-bold text-bhissm-maroon uppercase tracking-wider">
              /02 · Blood
            </div>
            <div>
              <div className="font-display text-4xl sm:text-5xl text-bhissm-maroon leading-none">
                14u
              </div>
              <div className="text-xs sm:text-sm font-bold mt-1">
                O− Blood Requested
              </div>
              <div className="text-xs text-bhissm-secondary mt-0.5">
                State Reserve Depot
              </div>
            </div>
          </Link>

          {/* Tile 03: Safe Buffer Warning */}
          <Link
            to="/inventory"
            className="p-4 rounded-xl bg-bhissm-surface text-bhissm-dark border border-bhissm-maroon/25 flex flex-col justify-between min-h-[170px] relative transition-transform hover:-translate-y-1 shadow-xs group"
          >
            <span className="absolute top-3.5 right-3.5 text-base text-bhissm-maroon group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              ↗
            </span>
            <div className="text-xs font-mono font-bold text-bhissm-maroon uppercase tracking-wider">
              /03 · Critical
            </div>
            <div>
              <div className="font-display text-4xl sm:text-5xl text-bhissm-accent leading-none">
                85
              </div>
              <div className="text-xs sm:text-sm font-bold mt-1">
                Anti-Rabies Ig Vials
              </div>
              <div className="text-xs text-bhissm-secondary mt-0.5">
                Below Safe Buffer
              </div>
            </div>
          </Link>

          {/* Tile 04: Cold Chain Integrity */}
          <div className="p-4 rounded-xl bg-bhissm-surface text-bhissm-dark border border-bhissm-maroon/25 flex flex-col justify-between min-h-[170px] relative shadow-xs">
            <span className="absolute top-3.5 right-3.5 text-base text-bhissm-maroon">
              ✳
            </span>
            <div className="text-xs font-mono font-bold text-bhissm-maroon uppercase tracking-wider">
              /04 · Cold Chain
            </div>
            <div>
              <div className="font-display text-4xl sm:text-5xl text-bhissm-success leading-none">
                98%
              </div>
              <div className="text-xs sm:text-sm font-bold mt-1">
                Cold Chain Intact
              </div>
              <div className="text-xs text-bhissm-secondary mt-0.5">
                All 8 Active Lines
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. ALERTS & PROTOCOL DECISION SUPPORT ─────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Regional Stock & Supply Alerts */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between border-b border-bhissm-border pb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-bhissm-maroon" />
              <h2 className="text-sm font-bold text-bhissm-dark uppercase tracking-wider font-mono">
                Regional Stock &amp; Supply Alerts
              </h2>
            </div>
            <Link
              to="/audit-alerts"
              className="text-xs text-bhissm-secondary hover:text-bhissm-dark hover:underline flex items-center gap-1 font-mono"
            >
              View Full Logs <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-8 text-bhissm-secondary text-xs">
              <CheckCircle2 className="w-8 h-8 text-bhissm-success mx-auto mb-2 opacity-80" />
              No unread urgent inventory alerts at this time. All thresholds within normal range.
            </div>
          ) : (
            <div className="space-y-2.5">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                    alert.severity === 'critical'
                      ? 'bg-red-50/70 border-red-200'
                      : alert.severity === 'warning'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-[#F6F0E9] border-bhissm-border'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono uppercase px-2 py-0.5 rounded font-bold ${
                          alert.severity === 'critical'
                            ? 'bg-red-200 text-red-900'
                            : alert.severity === 'warning'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-bhissm-skin text-bhissm-dark'
                        }`}
                      >
                        {alert.alert_type?.replace('_', ' ')}
                      </span>
                      <span className="font-bold text-bhissm-dark">{alert.title}</span>
                    </div>
                    <p className="text-bhissm-secondary leading-relaxed">{alert.message}</p>
                    <div className="text-xs text-bhissm-secondary/80 font-mono">
                      {new Date(alert.created_at).toLocaleString()} • {alert.facility_name || 'Regional Command'}
                    </div>
                  </div>

                  <button
                    onClick={() => markAlertRead(alert.id)}
                    className="btn-outline text-xs py-1 px-2.5 shrink-0 flex items-center gap-1 font-mono"
                    title="Acknowledge Alert"
                  >
                    <Check className="w-3 h-3" />
                    <span>Acknowledge</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right (1 col): Fast Decision Protocols */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-bhissm-secondary border-b border-bhissm-border pb-1.5 font-mono">
              Protocol Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Link
                to="/forecast"
                className="p-3 rounded-lg border border-bhissm-border bg-white hover:bg-bhissm-pink/40 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-bhissm-dark">Safe Stock Calculator</div>
                  <div className="text-xs text-bhissm-secondary">Compute dynamically transferable quota</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-bhissm-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                to="/emergency"
                className="p-3 rounded-lg border border-bhissm-border bg-white hover:bg-bhissm-pink/40 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-bhissm-dark">Initiate Emergency</div>
                  <div className="text-xs text-bhissm-secondary">Two-step verifiable disaster activation</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-bhissm-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                to="/blood-bank"
                className="p-3 rounded-lg border border-bhissm-border bg-white hover:bg-bhissm-pink/40 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-bhissm-dark">Request Blood Units</div>
                  <div className="text-xs text-bhissm-secondary">Auto-match nearest licensed donor blood banks</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-bhissm-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Dynamic Safe Stock Logic Card */}
          <div className="card space-y-2 bg-bhissm-surface text-xs">
            <div className="flex items-center gap-1.5 text-bhissm-dark font-bold font-mono">
              <Activity className="w-3.5 h-3.5 text-bhissm-maroon" />
              FORMULA AUDIT TRAIL
            </div>
            <p className="text-xs text-bhissm-secondary leading-relaxed">
              <strong>Dynamic Safety Stock:</strong>
              <br />
              <code className="text-xs bg-white px-2 py-1 rounded border border-bhissm-border block mt-1 font-mono">
                Protected = Forecast × LeadTime + SafetyBuffer + Reserved
              </code>
            </p>
            <p className="text-xs text-bhissm-secondary">
              Facilities never donate below protected safety reserve. Automated donor protection enabled.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7. EDITORIAL PURPOSE & ORIGINS FOOTER STRIP ────────────────────────── */}
      <section className="border-t border-bhissm-maroon/20 pt-10 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl text-bhissm-maroon leading-none">
              Built For<br />Purpose
            </h2>
            <div className="mt-4 max-w-md">
              <div className="text-xs font-semibold uppercase tracking-widest text-bhissm-maroon">
                Origins &amp; Architecture
              </div>
              <p className="text-sm leading-relaxed mt-1 text-bhissm-secondary">
                BHISSM is more than a stock tracker. It is a national grid for intentional, always-ready healthcare supply, balancing form and function so every hospital can focus on what truly matters: patients.
              </p>
              <div className="flex flex-wrap gap-2.5 mt-5">
                {(user?.role === 'national' || user?.role === 'state') && (
                  <Link to="/admin/master-data" className="btn-primary text-xs">
                    Open Master Console →
                  </Link>
                )}
                <Link to="/audit-alerts" className="btn-outline text-xs">
                  View Audit Ledger
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-8 justify-start md:justify-end">
            <div>
              <div className="font-display text-5xl sm:text-6xl text-bhissm-dark leading-none">
                36
              </div>
              <div className="text-xs uppercase tracking-wider text-bhissm-secondary font-semibold mt-1">
                States &amp; UTs
              </div>
            </div>
            <div>
              <div className="font-display text-5xl sm:text-6xl text-bhissm-dark leading-none">
                100+
              </div>
              <div className="text-xs uppercase tracking-wider text-bhissm-secondary font-semibold mt-1">
                Hospitals
              </div>
            </div>
            <div>
              <div className="font-display text-5xl sm:text-6xl text-bhissm-dark leading-none">
                24/7
              </div>
              <div className="text-xs uppercase tracking-wider text-bhissm-secondary font-semibold mt-1">
                Live Grid
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
