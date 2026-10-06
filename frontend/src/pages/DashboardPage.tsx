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
  TrendingDown,
  Activity,
  CheckCircle2,
  Syringe,
  Building,
  Check,
  Globe,
  Landmark,
  MapPin,
  Send,
  Layers,
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(DEFAULT_FALLBACK_STATS);
  const [alerts, setAlerts] = useState<any[]>(DEFAULT_FALLBACK_ALERTS);
  const [emergencies, setEmergencies] = useState<any[]>(DEFAULT_FALLBACK_EMERGENCIES);
  const [nationalDisasters, setNationalDisasters] = useState<any[]>([]);
  const [statesList, setStatesList] = useState<any[]>(DEFAULT_FALLBACK_STATES);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [nationalReserves, setNationalReserves] = useState<any[]>([]);
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
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const isNationalScope = user?.role === 'national' && !selectedStateId;
  const currentStateObj = statesList.find((s) => s.id === selectedStateId);

  return (
    <div className="space-y-6">
      {/* Top BHISSM Flagship Command Hero Bar */}
      <div className="card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#FFF9F1] via-[#FDF3E7] to-[#FAE8EB]/60 border-2 border-bhissm-border shadow-sm">
        <div className="flex items-start sm:items-center gap-4">
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bhissm-emblem-box text-[#FFF9F1] flex-col items-center justify-center border-2 border-[#E8A7B5] shrink-0">
            <span className="font-black text-lg tracking-tighter leading-none">BH</span>
            <span className="text-[8px] font-mono uppercase tracking-widest text-[#F4D5DC] mt-0.5 font-bold">
              COMMAND
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-lg tracking-tight bhissm-brand-title">
                BHISSM
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-bhissm-secondary">
                • {user?.role ? user.role.toUpperCase() : 'COMMAND'} COMMAND CONSOLE
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {isNationalScope ? 'APEX STRATEGIC NETWORK OVERVIEW' : 'STATE & REGIONAL TELEMETRY'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-bhissm-dark mt-1 font-sans tracking-tight">
              {isNationalScope
                ? 'National Medicine Strategic Stockpile & Distribution Network'
                : selectedStateId && currentStateObj
                ? `${currentStateObj.name} Health Logistics & Command Center`
                : user?.role === 'hospital'
                ? `${user.facility_name || 'Hospital Facility'} Inventory & Command`
                : `${user?.state_name || 'State'} Health Logistics Command Center`}
            </h1>
            <p className="text-xs text-bhissm-secondary mt-0.5">
              {isNationalScope
                ? 'Central strategic reserve management, inter-state replenishment fulfillment, and national disaster response (>500 affected).'
                : `Active node: ${user?.facility_name || user?.state_name || 'Regional Command'} • Real-time FEFO rotation, dynamic safety buffers, and cross-border mutual aid.`}
            </p>
          </div>
        </div>

        {/* State Filter Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {user?.role === 'national' && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-lg border border-bhissm-border text-xs shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-bhissm-secondary" />
              <select
                className="font-mono text-xs font-semibold bg-transparent focus:outline-none cursor-pointer"
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
              >
                <option value="">National Overview (All States)</option>
                {statesList
                  .filter((s) => s.code !== 'NA')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {(user?.role === 'national' || user?.role === 'state') && (
            <Link
              to="/admin/master-data"
              className="flex items-center gap-1.5 text-xs font-mono font-bold py-2 px-3 rounded-lg bg-white border border-bhissm-border hover:bg-[#FDF6ED] text-bhissm-dark transition-colors shadow-2xs"
              title="Open Master Data & Infrastructure Governance Console"
            >
              <Database className="w-3.5 h-3.5 text-[#B65C62]" />
              <span>Master Governance</span>
            </Link>
          )}

          {user?.role === 'national' ? (
            <Link
              to="/national-reserve"
              className="btn-primary flex items-center gap-1.5 text-xs font-mono font-bold py-2.5 px-3.5 rounded-lg"
            >
              <FileCheck className="w-4 h-4" />
              <span>Release National Reserve</span>
            </Link>
          ) : (
            <>
              <Link
                to="/emergency"
                className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-800 hover:to-red-700 text-white px-3.5 py-2.5 rounded-lg flex items-center gap-2 text-xs font-mono font-black uppercase tracking-wider shadow-sm border border-red-300 transition-all"
              >
                <Siren className="w-4 h-4 animate-bounce" />
                <span>Emergency Ops</span>
              </Link>
              <Link
                to="/inventory"
                className="btn-primary flex items-center gap-1.5 text-xs font-mono font-bold py-2.5 px-3.5 rounded-lg"
              >
                <Boxes className="w-4 h-4" />
                <span>Track Inventory</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Regional Healthcare Corridor Callout Banner (Chennai - Villupuram - Puducherry - Cuddalore) */}
      <div className="card p-4 bg-gradient-to-r from-stone-900 via-stone-800 to-[#4A2D35] text-white border-2 border-stone-700 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded">
                REGIONAL COMMAND CORRIDOR
              </span>
              <span className="text-[10px] font-mono text-stone-300">
                102 Health Centers • NH-45 &amp; NH-45A
              </span>
            </div>
            <h2 className="text-base font-extrabold text-white mt-1">
              Chennai • Villupuram • Puducherry • Cuddalore Healthcare Grid
            </h2>
            <p className="text-xs text-stone-300 mt-0.5">
              Live telemetry for Apex Medical Colleges, Military Hospital Chennai, Southern Railway Hospital, Port Trust, ESIC, Private Multi-Specialty, and CHCs/PHCs.
            </p>
          </div>
        </div>

        <Link
          to="/corridor"
          className="self-start md:self-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold font-mono text-xs rounded-lg flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <span>Open Corridor Dashboard</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          NATIONAL OVERVIEW MODE: Focus on Medicine Distribution & National Emergencies (>500)
          ────────────────────────────────────────────────────────────────────── */}
      {isNationalScope ? (
        <div className="space-y-6">
          {/* National KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="stat-card border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between">
                <span className="stat-label text-emerald-950 font-bold">Strategic Reserve</span>
                <Landmark className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="stat-value text-emerald-900">
                {(stats?.national_network?.total_strategic_stockpile || 380000).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-800 font-mono">Total Central Units</div>
            </div>

            <div className="stat-card border-l-4 border-l-blue-600">
              <div className="flex items-center justify-between">
                <span className="stat-label text-blue-950 font-bold">Releasable Quota</span>
                <Send className="w-4 h-4 text-blue-700" />
              </div>
              <div className="stat-value text-blue-900">
                {(stats?.national_network?.immediately_releasable_quota || 275000).toLocaleString()}
              </div>
              <div className="text-[11px] text-blue-800 font-mono">Disaster Available</div>
            </div>

            <div className="stat-card border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <span className="stat-label text-amber-950 font-bold">Protected Buffer</span>
                <ShieldCheck className="w-4 h-4 text-amber-700" />
              </div>
              <div className="stat-value text-amber-900">
                {(stats?.national_network?.total_strategic_stockpile
                  ? stats.national_network.total_strategic_stockpile - stats.national_network.immediately_releasable_quota
                  : 105000
                ).toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-800 font-mono">Statutory Minimum</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-label">States / UTs</span>
                <Globe className="w-4 h-4 text-bhissm-secondary" />
              </div>
              <div className="stat-value">{statesList.filter((s) => s.code !== 'NA').length || 8}</div>
              <div className="text-[11px] text-bhissm-secondary font-mono">Integrated Nodes</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-label">Stockout Risks</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="stat-value text-amber-900">{stats?.medicine?.low_stock_count ?? 0}</div>
              <div className="text-[11px] text-amber-700 font-mono">Regional Alerts</div>
            </div>

            {/* National Disasters KPI (>500 affected) */}
            <div className="stat-card border-l-4 border-l-red-600 bg-red-50/60">
              <div className="flex items-center justify-between">
                <span className="stat-label text-red-950 font-bold">National Disasters</span>
                <Siren className="w-4 h-4 text-red-700 animate-bounce" />
              </div>
              <div className="stat-value text-red-900">{nationalDisasters.length}</div>
              <div className="text-[11px] text-red-800 font-mono font-bold">&gt;500 Casualties</div>
            </div>
          </div>

          {/* MAJOR NATIONAL DISASTERS BANNER (>500 Casualties Affected) */}
          <div className="card bg-gradient-to-r from-red-50 via-[#FFF9F1] to-red-50/70 border-2 border-red-400 p-4 space-y-3 emergency-banner-glow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-red-600 text-white shrink-0 emergency-beacon-core">
                  <span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-50"></span>
                  <Siren className="w-5 h-5 relative z-10" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-700 text-white text-[10px] font-mono font-black uppercase">
                      <span className="w-2 h-2 rounded-full siren-light-left"></span>
                      <span className="w-2 h-2 rounded-full siren-light-right"></span>
                      <span>CODE RED ESCALATION</span>
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-black text-red-950 uppercase tracking-wide font-mono mt-0.5">
                    National Disaster Incident Command (&gt;500 Casualties Escalation)
                  </h2>
                </div>
              </div>
              <Link
                to="/emergency"
                className="bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 font-mono shrink-0 w-fit"
              >
                <span>Open National Emergency Console</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>


            <p className="text-xs text-red-900/80 leading-relaxed">
              <strong>National Escalation Rule:</strong> Only major catastrophic disasters with <strong>&gt; 500 casualties</strong> are escalated to the National Strategic Command. Routine municipal and single-hospital incidents are managed by respective State Controllers.
            </p>

            {nationalDisasters.length === 0 ? (
              <div className="text-center py-6 text-xs text-emerald-800 font-mono bg-white/80 rounded border border-emerald-200 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>No major national-scale disasters (&gt;500 casualties) currently active across the Union.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {nationalDisasters.map((emg) => (
                  <div
                    key={emg.id}
                    className="p-3 bg-white rounded border border-red-300 shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-bhissm-dark font-sans">{emg.title}</span>
                      <span className="badge-critical font-mono uppercase">
                        {emg.estimated_casualties} Affected
                      </span>
                    </div>
                    <div className="text-bhissm-secondary">
                      <strong>Corridor:</strong> {emg.location} ({emg.state_name || 'Multi-State'})
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] pt-1 border-t border-gray-100">
                      <div className="bg-red-50 p-1 rounded text-red-900 font-bold">
                        Crit: {emg.loadCritical || 0}
                      </div>
                      <div className="bg-amber-50 p-1 rounded text-amber-900 font-bold">
                        Ser: {emg.loadSerious || 0}
                      </div>
                      <div className="bg-emerald-50 p-1 rounded text-emerald-900 font-bold">
                        Min: {emg.loadMinor || 0}
                      </div>
                      <div className="bg-gray-100 p-1 rounded text-gray-800 font-bold">
                        Dec: {emg.loadDeceased || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Core Section: Medicine Distribution Network & Central Stockpile */}
          <div className="card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bhissm-border pb-2.5">
              <div>
                <h2 className="text-sm font-bold text-bhissm-dark uppercase tracking-wider font-mono flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-bhissm-dark" />
                  Strategic National Medical Stockpile Status & Releasable Quotas
                </h2>
                <p className="text-xs text-bhissm-secondary">
                  Apex reserves maintained for interstate trauma, natural disasters, and regional rebalancing.
                </p>
              </div>

              <Link
                to="/national-reserve"
                className="btn-outline text-xs flex items-center gap-1 font-mono font-bold"
              >
                <Send className="w-3.5 h-3.5" /> Execute Release Voucher
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-bhissm-border bg-[#F8F1E7]">
                    <th className="table-header">Strategic Formulation</th>
                    <th className="table-header">Clinical Tier</th>
                    <th className="table-header text-right">Central Total Stockpile</th>
                    <th className="table-header text-right">Protected Minimum Buffer</th>
                    <th className="table-header text-right">Immediately Releasable</th>
                    <th className="table-header text-right">Active Allocated Releases</th>
                    <th className="table-header text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bhissm-border/40 font-mono">
                  {nationalReserves.map((res) => (
                    <tr key={res.id} className="hover:bg-[#FDF9F3]">
                      <td className="table-cell font-sans font-bold text-bhissm-dark">
                        {res.medicine_name}
                      </td>
                      <td className="table-cell capitalize font-sans text-bhissm-secondary">
                        {res.category} ({res.criticality})
                      </td>
                      <td className="table-cell text-right font-bold text-bhissm-dark">
                        {res.total_quantity?.toLocaleString()}
                      </td>
                      <td className="table-cell text-right text-amber-800 font-bold">
                        {res.protected_quantity?.toLocaleString()}
                      </td>
                      <td className="table-cell text-right text-emerald-800 font-bold">
                        {res.immediately_available?.toLocaleString()}
                      </td>
                      <td className="table-cell text-right text-bhissm-secondary">
                        {res.allocated_quantity?.toLocaleString() || 0}
                      </td>
                      <td className="table-cell text-center whitespace-nowrap">
                        <Link
                          to={`/national-reserve?release_med=${res.medicine_id || res.id}`}
                          state={{ releaseMedicineId: res.medicine_id || res.id }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-sans text-xs font-bold shadow-xs whitespace-nowrap transition-colors"
                          title={`Authorize central release quota for ${res.medicine_name}`}
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Authorize Release</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regional Network Coverage Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card space-y-3">
              <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-bhissm-dark font-mono flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-bhissm-dark" />
                  State & UT Supply Chain Coverage Index ({statesList.filter((s) => s.code !== 'NA').length} Jurisdictions)
                </h3>
                <span className="text-[10px] font-mono text-bhissm-secondary">FEDERATED GRID • CLICK TO FILTER</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1 text-xs max-h-[420px] overflow-y-auto pr-1">
                {statesList
                  .filter((s) => s.code !== 'NA')
                  .map((st) => (
                    <div
                      key={st.code}
                      onClick={() => setSelectedStateId(st.id)}
                      className={`p-2.5 rounded border transition-colors cursor-pointer space-y-1 ${
                        selectedStateId === st.id
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                          : 'border-bhissm-border bg-white hover:bg-bhissm-pink/40'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-bhissm-dark truncate">{st.name}</span>
                        <span className="text-[9px] font-mono bg-gray-100 text-bhissm-dark px-1.5 py-0.5 rounded shrink-0">
                          {st.code}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-bhissm-secondary font-mono">
                        <span>{st.type === 'ut' ? 'UT Depot' : 'State Depot'} Active</span>
                        <span className="text-emerald-800 font-semibold">● Operational</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick Strategic Actions Card */}
            <div className="card space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-bhissm-secondary border-b border-bhissm-border pb-1.5 font-mono">
                National Command Actions
              </h3>
              <div className="space-y-2 text-xs">
                <Link
                  to="/national-reserve"
                  className="p-2.5 rounded border border-bhissm-border bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-emerald-950">Strategic Reserve Release</div>
                    <div className="text-[11px] text-emerald-800">Execute signed release voucher</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-emerald-800" />
                </Link>

                <Link
                  to="/forecast"
                  className="p-2.5 rounded border border-bhissm-border bg-white hover:bg-bhissm-pink transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-bhissm-dark">Inter-State Fulfillment Planner</div>
                    <div className="text-[11px] text-bhissm-secondary">Simulate multi-source rebalancing</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-bhissm-secondary" />
                </Link>

                <Link
                  to="/audit-alerts"
                  className="p-2.5 rounded border border-bhissm-border bg-white hover:bg-bhissm-pink transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-bhissm-dark">National Audit Ledger</div>
                    <div className="text-[11px] text-bhissm-secondary">Immutable compliance audit log</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-bhissm-secondary" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ──────────────────────────────────────────────────────────────────────
           STATE / HOSPITAL REGIONAL DASHBOARD MODE
           ────────────────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Main KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-label">Medicines</span>
                <Boxes className="w-4 h-4 text-bhissm-secondary" />
              </div>
              <div className="stat-value">{stats?.medicine?.total_medicines ?? 0}</div>
              <div className="text-[11px] text-bhissm-secondary flex items-center gap-1">Active formulations</div>
            </div>

            <div className="stat-card border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <span className="stat-label text-amber-800">Low Stock</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="stat-value text-amber-900">{stats?.medicine?.low_stock_count ?? 0}</div>
              <div className="text-[11px] text-amber-700 font-mono">
                {stats?.medicine?.critical_low_stock ?? 0} critical tier
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-label">Vaccine Doses</span>
                <Syringe className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="stat-value text-emerald-900">
                {(stats?.vaccines?.total_doses ?? 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-700 font-mono">
                {stats?.vaccines?.total_vaccines ?? 0} cold-chain lines
              </div>
            </div>

            <div className="stat-card border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <span className="stat-label text-red-800">Blood Units</span>
                <Droplet className="w-4 h-4 text-red-600" />
              </div>
              <div className="stat-value text-red-900">{stats?.blood?.total_units ?? 0}</div>
              <div className="text-[11px] text-red-700 font-mono">
                {stats?.blood?.critical_groups ?? 0} groups deficit
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-label">Ambulances</span>
                <Truck className="w-4 h-4 text-blue-700" />
              </div>
              <div className="stat-value text-blue-900">
                {stats?.ambulances?.available ?? 0}
                <span className="text-xs text-bhissm-secondary font-normal font-mono">
                  /{stats?.ambulances?.total ?? 0}
                </span>
              </div>
              <div className="text-[11px] text-blue-700 font-mono">
                {stats?.ambulances?.deployed ?? 0} deployed in field
              </div>
            </div>

            <div className="stat-card border-l-4 border-l-rose-400">
              <div className="flex items-center justify-between">
                <span className="stat-label text-rose-800">Expiring 30D</span>
                <Clock className="w-4 h-4 text-rose-600" />
              </div>
              <div className="stat-value text-rose-900">{stats?.expiring_batches_30d ?? 0}</div>
              <div className="text-[11px] text-rose-700 font-mono">FEFO prioritized</div>
            </div>
          </div>

          {/* Regional Active Emergencies Banner */}
          {emergencies.length > 0 && (
            <div className="card bg-gradient-to-r from-red-50 via-[#FFF9F1] to-red-50/70 border-2 border-red-400 p-4 space-y-3.5 emergency-banner-glow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-red-600 text-white shrink-0 emergency-beacon-core">
                    <span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-50"></span>
                    <Siren className="w-5 h-5 relative z-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-700 text-white text-[10px] font-mono font-black uppercase">
                        <span className="w-2 h-2 rounded-full siren-light-left"></span>
                        <span className="w-2 h-2 rounded-full siren-light-right"></span>
                        <span>CODE RED • LIVE SIREN</span>
                      </span>
                      <span className="text-[10px] font-mono bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded-full font-bold">
                        STATE + ADJACENT DISTRICTS LINKED
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-black text-red-950 uppercase tracking-wide font-mono mt-0.5">
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
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 ${
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
                    <div className="flex justify-between text-[11px] text-bhissm-secondary font-mono pt-1.5 border-t border-gray-100">
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


          {/* Dual Column: Urgent Alerts & Protocol Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card space-y-4">
              <div className="flex items-center justify-between border-b border-bhissm-border pb-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-bhissm-dark" />
                  <h2 className="text-sm font-bold text-bhissm-dark uppercase tracking-wider font-mono">
                    Regional Stock & Supply Alerts
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
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                  No unread urgent inventory alerts at this time. All thresholds within normal range.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded border text-xs flex items-start justify-between gap-3 ${
                        alert.severity === 'critical'
                          ? 'bg-red-50/60 border-red-200'
                          : alert.severity === 'warning'
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-blue-50/60 border-blue-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                              alert.severity === 'critical'
                                ? 'bg-red-200 text-red-900'
                                : alert.severity === 'warning'
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-blue-200 text-blue-900'
                            }`}
                          >
                            {alert.alert_type?.replace('_', ' ')}
                          </span>
                          <span className="font-bold text-bhissm-dark">{alert.title}</span>
                        </div>
                        <p className="text-bhissm-secondary leading-relaxed">{alert.message}</p>
                        <div className="text-[10px] text-bhissm-secondary/70 font-mono">
                          {new Date(alert.created_at).toLocaleString()} • {alert.facility_name || 'Regional Command'}
                        </div>
                      </div>

                      <button
                        onClick={() => markAlertRead(alert.id)}
                        className="btn-outline text-[11px] py-1 px-2 shrink-0 flex items-center gap-1 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300 font-mono"
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

            {/* Right Column: Fast Decision Support & Quick Actions */}
            <div className="space-y-4">
              <div className="card space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-bhissm-secondary border-b border-bhissm-border pb-1.5 font-mono">
                  Protocol Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <Link
                    to="/forecast"
                    className="p-2.5 rounded border border-bhissm-border bg-[#FFF9F1] hover:bg-[#F4D5DC]/60 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-bhissm-dark">Safe Stock Calculator</div>
                      <div className="text-[11px] text-bhissm-secondary">Compute dynamically transferable quota</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-bhissm-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>

                  <Link
                    to="/emergency"
                    className="p-2.5 rounded border border-bhissm-border bg-[#FFF9F1] hover:bg-[#F4D5DC]/60 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-bhissm-dark">Initiate Emergency</div>
                      <div className="text-[11px] text-bhissm-secondary">Two-step verifiable disaster activation</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-bhissm-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>

                  <Link
                    to="/blood-bank"
                    className="p-2.5 rounded border border-bhissm-border bg-[#FFF9F1] hover:bg-[#F4D5DC]/60 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-bhissm-dark">Request Blood Units</div>
                      <div className="text-[11px] text-bhissm-secondary">Auto-match nearest licensed donor blood banks</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-bhissm-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Dynamic Safe Stock Logic Card */}
              <div className="card space-y-2 bg-[#F8F1E7]/70 text-xs">
                <div className="flex items-center gap-1.5 text-bhissm-dark font-bold font-mono">
                  <Activity className="w-3.5 h-3.5 text-bhissm-secondary" />
                  FORMULA AUDIT TRAIL
                </div>
                <p className="text-[11px] text-bhissm-secondary leading-relaxed">
                  <strong>Dynamic Safety Stock:</strong>
                  <br />
                  <code className="text-[10px] bg-white px-1 py-0.5 rounded border border-bhissm-border block mt-1">
                    Protected = Forecast × LeadTime + SafetyBuffer + Reserved
                  </code>
                </p>
                <p className="text-[11px] text-bhissm-secondary">
                  Facilities never donate below protected safety reserve. Automated donor protection enabled.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
