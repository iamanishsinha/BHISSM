import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../lib/api';
import {
  Landmark,
  Send,
  CheckCircle,
  History,
  Building,
  Unlock,
  X,
  FileCheck,
  ArrowRight,
  Boxes,
  Truck,
  Globe,
  MapPin,
  Database,
} from 'lucide-react';

export default function NationalReservePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [handledDeepLink, setHandledDeepLink] = useState(false);

  const [activeTab, setActiveTab] = useState<'state_reserve' | 'central_stockpile'>(
    user?.role === 'state' ? 'state_reserve' : 'central_stockpile'
  );

  // Central National Reserve State
  const [reserves, setReserves] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [statesList, setStatesList] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);

  // State Reserve Stockpile & Redistribution State
  const [selectedStateIdForView, setSelectedStateIdForView] = useState<string>(user?.state_id || '');
  const [stateReserveData, setStateReserveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal 1: Central -> State Reserve Release Modal (for National Login)
  const [showCentralReleaseModal, setShowCentralReleaseModal] = useState(false);
  const [releaseForm, setReleaseForm] = useState({
    medicine_id: '',
    quantity: 5000,
    destination_state_id: '',
    reason: 'Central Strategic Stockpile allocation to State Reserve Depot for regional hospital distribution',
  });

  // Modal 2: State Reserve -> Hospital Redistribution Modal (for State Login & National)
  const [showRedistributeModal, setShowRedistributeModal] = useState(false);
  const [redistributeForm, setRedistributeForm] = useState({
    medicine_id: '',
    medicine_name: '',
    available_in_state: 0,
    destination_facility_id: '',
    quantity: 500,
    notes: 'State Reserve Stockpile redistribution to jurisdiction hospital pharmacy',
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const fetchAllData = async (overrideStateId?: string) => {
    try {
      setLoading(true);
      const effectiveStateId = overrideStateId || selectedStateIdForView || user?.state_id;

      const [resRes, relRes, statesRes, facRes] = await Promise.all([
        API.get('/national-reserve'),
        API.get('/national-reserve/releases'),
        API.get('/states'),
        API.get('/facilities', {
          params: effectiveStateId ? { state_id: effectiveStateId } : { all_states: 'true' },
        }),
      ]);

      setReserves(resRes.data);
      setReleases(relRes.data);
      const validStates = statesRes.data.filter((s: any) => s.code !== 'NA');
      setStatesList(validStates);

      const defaultStateId =
        effectiveStateId ||
        validStates.find((s: any) => s.code === 'PY')?.id ||
        validStates[0]?.id ||
        '';
      if (!selectedStateIdForView && defaultStateId) {
        setSelectedStateIdForView(defaultStateId);
      }

      const hospitalList = facRes.data.filter((f: any) => f.type !== 'state_reserve');
      setFacilities(hospitalList);

      if (resRes.data.length > 0) {
        setReleaseForm((prev) => ({
          ...prev,
          medicine_id: prev.medicine_id || resRes.data[0].medicine_id,
          destination_state_id: prev.destination_state_id || defaultStateId,
        }));
      }

      if (defaultStateId) {
        const stateStockRes = await API.get('/national-reserve/state-stock', {
          params: { state_id: defaultStateId },
        });
        setStateReserveData(stateStockRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'state') {
      setActiveTab('state_reserve');
    }
    fetchAllData();
  }, [user]);

  const handleStateViewChange = async (newStateId: string) => {
    setSelectedStateIdForView(newStateId);
    await fetchAllData(newStateId);
  };

  // Open Central -> State Release Modal
  const handleOpenCentralRelease = (resItem: any) => {
    setFeedbackMsg(null);
    setReleaseForm({
      medicine_id: resItem.medicine_id || resItem.medicineId || resItem.id,
      quantity: Math.min(5000, resItem.immediately_available || 5000),
      destination_state_id:
        selectedStateIdForView ||
        statesList.find((s) => s.code === 'PY')?.id ||
        statesList[0]?.id ||
        '',
      reason: `Central Strategic Reserve release to State Reserve Stockpile for ${resItem.medicine_name || 'Strategic Formulation'}`,
    });
    setShowCentralReleaseModal(true);
  };

  // Auto-open Central Release modal when routed with ?release_med query parameter or navigation state
  useEffect(() => {
    const targetMedId = searchParams.get('release_med') || (location.state as any)?.releaseMedicineId;
    if (targetMedId && !handledDeepLink && reserves.length > 0) {
      const match = reserves.find(
        (r) => r.medicine_id === targetMedId || r.medicineId === targetMedId || r.id === targetMedId
      );
      if (match) {
        setActiveTab('central_stockpile');
        handleOpenCentralRelease(match);
        setHandledDeepLink(true);
      }
    }
  }, [searchParams, location.state, reserves, handledDeepLink, statesList, selectedStateIdForView]);

  // Submit Central -> State Reserve Release
  const handleSubmitCentralRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMsg(null);
    try {
      const res = await API.post('/national-reserve/release', {
        medicine_id: releaseForm.medicine_id,
        quantity: Number(releaseForm.quantity),
        destination_state_id: releaseForm.destination_state_id,
        reason: releaseForm.reason,
      });
      setFeedbackMsg({
        type: 'success',
        text:
          res.data?.message ||
          'Medicine released from Central Stockpile to State Reserve Stock successfully!',
      });
      setSelectedStateIdForView(releaseForm.destination_state_id);
      setTimeout(() => {
        setShowCentralReleaseModal(false);
        setFeedbackMsg(null);
        fetchAllData(releaseForm.destination_state_id);
      }, 1200);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to release from Central Reserve',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open State Reserve -> Hospital Redistribution Modal
  const handleOpenRedistributeModal = (stockItem?: any) => {
    setFeedbackMsg(null);
    const firstStock = stockItem || stateReserveData?.stock?.[0];
    const stateHospitals = facilities.filter(
      (f) => f.stateId === (stateReserveData?.state?.id || selectedStateIdForView)
    );
    const pool = stateHospitals.length > 0 ? stateHospitals : facilities;

    setRedistributeForm({
      medicine_id: firstStock?.medicine_id || '',
      medicine_name: firstStock?.medicine_name || '',
      available_in_state: firstStock?.available_to_distribute || 0,
      destination_facility_id: pool[0]?.id || '',
      quantity: Math.min(500, firstStock?.available_to_distribute || 500),
      notes: 'State Reserve Stock redistribution to hospital under state jurisdiction',
    });
    setShowRedistributeModal(true);
  };

  // Submit State Reserve -> Hospital Redistribution
  const handleSubmitRedistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMsg(null);
    try {
      const res = await API.post('/national-reserve/state-redistribute', {
        medicine_id: redistributeForm.medicine_id,
        destination_facility_id: redistributeForm.destination_facility_id,
        quantity: Number(redistributeForm.quantity),
        notes: redistributeForm.notes,
        state_id: stateReserveData?.state?.id || selectedStateIdForView,
      });
      setFeedbackMsg({
        type: 'success',
        text:
          res.data?.message ||
          'Medicine redistributed from State Reserve to Hospital inventory!',
      });
      setTimeout(() => {
        setShowRedistributeModal(false);
        setFeedbackMsg(null);
        fetchAllData(stateReserveData?.state?.id || selectedStateIdForView);
      }, 1200);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to redistribute from State Reserve',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const stateHospitalsForDropdown = facilities.filter(
    (f) =>
      !stateReserveData?.state?.id ||
      f.stateId === stateReserveData.state.id ||
      f.state_id === stateReserveData.state.id
  );

  return (
    <div className="space-y-6">
      {/* Top 2-Tier Supply Flow Banner: Central -> State Reserve -> Hospital */}
      <div className="card p-5 bg-gradient-to-r from-[#F6F0E9] via-[#F2FBF6] to-[#F6F0E9] border-2 border-emerald-300 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-emerald-950 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded">
                2-TIER STRATEGIC DISTRIBUTION PIPELINE
              </span>
              <span className="text-xs font-mono font-bold text-bhissm-dark bg-white border border-bhissm-border px-2.5 py-0.5 rounded flex items-center gap-1.5">
                <span>1. CENTRAL RELEASE</span>
                <ArrowRight className="w-3 h-3 text-emerald-700" />
                <span>2. STATE RESERVE STOCK</span>
                <ArrowRight className="w-3 h-3 text-blue-700" />
                <span>3. HOSPITAL REDISTRIBUTION</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-bhissm-dark mt-1.5 flex items-center gap-2">
              <Landmark className="w-6 h-6 text-emerald-800" />
              Central Stockpile &amp; State Reserve Redistribution Command
            </h1>
            <p className="text-xs text-bhissm-secondary mt-0.5">
              Central releases medicine directly into the <strong>State Reserve Stockpile</strong>. State Controllers then redistribute from the State Reserve to <strong>Hospitals under their jurisdiction</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {user?.role === 'national' ? (
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-950 bg-emerald-100 px-3 py-2 rounded-lg border border-emerald-300">
                <Unlock className="w-4 h-4 text-emerald-800" />
                <span>CENTRAL RELEASE &amp; STATE OVERSIGHT ACTIVE</span>
              </div>
            ) : (
              <button
                onClick={() => handleOpenRedistributeModal()}
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Redistribute State Reserve to Hospital</span>
              </button>
            )}
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-200/80">
          <div className="flex bg-[#EFE8E0] p-1 rounded-lg border border-bhissm-border text-xs font-mono font-bold gap-1">
            <button
              onClick={() => setActiveTab('state_reserve')}
              className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'state_reserve'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-bhissm-secondary hover:text-bhissm-dark'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>
                State Reserve Stock &amp; Hospital Redistribution (
                {stateReserveData?.state?.name || user?.state_name || 'State'})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('central_stockpile')}
              className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'central_stockpile'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-bhissm-secondary hover:text-bhissm-dark'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Central National Stockpile ({reserves.length} Formulations)</span>
            </button>
          </div>

          {/* State Selector for National Users */}
          {user?.role === 'national' && (
            <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-bhissm-border">
              <MapPin className="w-3.5 h-3.5 text-blue-700" />
              <span className="text-bhissm-secondary font-bold">Inspect State Reserve:</span>
              <select
                className="bg-transparent font-bold text-bhissm-dark focus:outline-none cursor-pointer"
                value={selectedStateIdForView}
                onChange={(e) => handleStateViewChange(e.target.value)}
              >
                {statesList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link
            to="/admin/master-data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-bhissm-border hover:bg-[#F6F0E9] text-xs font-mono font-bold text-bhissm-dark transition-colors shadow-2xs"
            title="Open Master Data & Infrastructure Governance Console"
          >
            <Database className="w-3.5 h-3.5 text-[#8A0F1A]" />
            <span>Master Data Console</span>
          </Link>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          TAB 1: STATE RESERVE STOCKPILE & HOSPITAL REDISTRIBUTION
          ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'state_reserve' && (
        <div className="space-y-6">
          {/* State Depot Summary Banner */}
          <div className="card p-4 bg-blue-50/70 border-2 border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-700 text-white">
                  STATE RESERVE DEPOT
                </span>
                <span className="text-xs font-mono font-bold text-blue-950">
                  {stateReserveData?.depot?.name || 'State Medical Reserve Depot'}
                </span>
              </div>
              <p className="text-xs text-blue-900 mt-1">
                All medicines released by Central Command arrive here in the{' '}
                <strong>{stateReserveData?.state?.name} State Reserve Stockpile</strong>. Click{' '}
                <strong>"Allocate to Hospital"</strong> on any medicine below to redistribute stock to hospitals under {stateReserveData?.state?.name} jurisdiction.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white px-3 py-2 rounded-lg border border-blue-200 text-right font-mono">
                <div className="text-xs text-blue-800 uppercase font-bold">
                  Total State Reserve Units
                </div>
                <div className="text-lg font-black text-blue-950">
                  {(
                    stateReserveData?.stock?.reduce(
                      (acc: number, s: any) => acc + (s.current_stock || 0),
                      0
                    ) || 0
                  ).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => handleOpenRedistributeModal()}
                className="btn-primary text-xs font-mono font-bold py-2.5 px-3.5 flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Allocate to Hospital</span>
              </button>
            </div>
          </div>

          {/* State Reserve Medicine Stock Grid */}
          <div className="card p-0 overflow-hidden border border-bhissm-border">
            <div className="p-3.5 bg-[#EFE8E0] border-b border-bhissm-border flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-bhissm-dark font-mono flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-800" />
                {stateReserveData?.state?.name || 'State'} Reserve Stockpile Inventory (
                {stateReserveData?.stock?.length || 0} Formulations)
              </h2>
              <span className="text-xs font-mono text-bhissm-secondary font-bold">
                FEFO BATCH TRACKED • READY FOR HOSPITAL REDISTRIBUTION
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-bhissm-border bg-bhissm-bg">
                    <th className="table-header">Medicine / Vaccine</th>
                    <th className="table-header">Category &amp; Criticality</th>
                    <th className="table-header text-right">State Reserve Stock</th>
                    <th className="table-header text-right">Available to Distribute</th>
                    <th className="table-header text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bhissm-border/40">
                  {stateReserveData?.stock?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-[#F6F0E9]">
                      <td className="table-cell">
                        <div className="font-bold text-bhissm-dark">{item.medicine_name}</div>
                        <div className="text-xs text-bhissm-secondary font-mono">
                          {item.generic_name} ({item.unit_type})
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="capitalize font-medium text-bhissm-dark">
                          {item.category}
                        </span>
                        <span
                          className={`ml-2 text-xs font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                            item.criticality === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : item.criticality === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {item.criticality}
                        </span>
                      </td>
                      <td className="table-cell text-right font-mono font-bold text-sm text-bhissm-dark">
                        {item.current_stock?.toLocaleString()} {item.unit_type}
                      </td>
                      <td className="table-cell text-right font-mono font-bold text-emerald-800">
                        {item.available_to_distribute?.toLocaleString()} {item.unit_type}
                      </td>
                      <td className="table-cell text-center">
                        <button
                          onClick={() => handleOpenRedistributeModal(item)}
                          className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-mono font-bold py-1 px-3 rounded inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Redistribute to Hospital</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* State Reserve Activity Ledger (Central Receipts + Hospital Redistributions) */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-bhissm-dark font-mono flex items-center gap-2">
                <History className="w-4 h-4 text-bhissm-dark" />
                State Reserve Receipt &amp; Hospital Redistribution Ledger
              </h3>
              <span className="text-xs font-mono text-bhissm-secondary">
                CENTRAL INFLOWS &amp; HOSPITAL OUTFLOWS
              </span>
            </div>

            {!stateReserveData?.ledger || stateReserveData.ledger.length === 0 ? (
              <div className="text-center py-6 text-xs text-bhissm-secondary font-mono">
                No recent redistribution movements recorded yet. Use "Redistribute to Hospital" above to allocate stock.
              </div>
            ) : (
              <div className="divide-y divide-bhissm-border/60 text-xs">
                {stateReserveData.ledger.map((tx: any) => {
                  const isCentralReceipt = tx.transaction_type === 'central_release_to_state';
                  return (
                    <div
                      key={tx.id}
                      className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono uppercase px-2 py-0.5 rounded font-bold ${
                              isCentralReceipt
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-blue-100 text-blue-900 border border-blue-300'
                            }`}
                          >
                            {isCentralReceipt
                              ? '⬇ RECEIVED FROM CENTRAL RESERVE'
                              : '⬆ REDISTRIBUTED TO HOSPITAL'}
                          </span>
                          <span className="font-bold text-bhissm-dark">{tx.medicine_name}</span>
                        </div>
                        <div className="text-bhissm-secondary mt-0.5">{tx.notes}</div>
                        <div className="text-xs font-mono text-bhissm-secondary/80">
                          {new Date(tx.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div
                        className={`font-mono font-black text-sm ${
                          tx.quantity > 0 ? 'text-emerald-800' : 'text-blue-900'
                        }`}
                      >
                        {tx.quantity > 0
                          ? `+${tx.quantity.toLocaleString()}`
                          : tx.quantity.toLocaleString()}{' '}
                        {tx.unit_type}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          TAB 2: CENTRAL NATIONAL STOCKPILE & RELEASE TO STATE RESERVE
          ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'central_stockpile' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {reserves.map((res) => (
              <div
                key={res.id}
                className="card p-3.5 space-y-2.5 border border-bhissm-border flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-bhissm-secondary uppercase font-bold">
                      {res.category}
                    </span>
                    <span className="text-[11px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold">
                      CENTRAL DEPOT
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-bhissm-dark leading-tight mt-1">
                    {res.medicine_name}
                  </h3>
                </div>

                <div className="space-y-1 font-mono text-xs pt-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-bhissm-secondary">Central Stockpile:</span>
                    <strong className="text-bhissm-dark">
                      {res.total_quantity?.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bhissm-secondary">Protected Buffer:</span>
                    <span className="text-amber-800 font-bold">
                      {res.protected_quantity?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bhissm-secondary">Releasable to States:</span>
                    <span className="text-emerald-800 font-bold">
                      {res.immediately_available?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {user?.role === 'national' && (
                  <button
                    onClick={() => handleOpenCentralRelease(res)}
                    className="btn-primary text-xs py-2 w-full mt-2 font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Release to State Reserve
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Central-to-State Releases Ledger */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-bhissm-dark font-mono flex items-center gap-2">
                <History className="w-4 h-4 text-bhissm-dark" />
                Central-to-State Reserve Release Ledger ({releases.length})
              </h2>
              <span className="text-xs font-mono text-bhissm-secondary">
                CREDITED DIRECTLY TO STATE RESERVE DEPOTS
              </span>
            </div>

            {releases.length === 0 ? (
              <div className="text-center py-8 text-xs text-bhissm-secondary font-mono">
                No central reserve release vouchers executed yet.
              </div>
            ) : (
              <div className="divide-y divide-bhissm-border/60">
                {releases.map((rel) => (
                  <div
                    key={rel.id}
                    className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-bhissm-dark">
                          {rel.medicine_name}
                        </span>
                        <span className="font-mono font-bold text-emerald-800 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{rel.quantity?.toLocaleString()} Units → {rel.destination_state_name} State Reserve
                        </span>
                        <span className="text-xs font-mono uppercase px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-900">
                          {rel.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-bhissm-secondary mt-1">
                        <strong>Credited State Depot:</strong> {rel.destination_facility_name} ({rel.destination_state_name})
                        <br />
                        <strong>Justification:</strong> {rel.reason}
                      </div>
                      <div className="text-xs text-bhissm-secondary font-mono mt-0.5">
                        Authorized by {rel.released_by_name || 'National Reserve Officer'} •{' '}
                        {new Date(rel.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Central Release -> State Reserve Stock (National Login) */}
      {showCentralReleaseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-5 shadow-xl border-2 border-emerald-600 space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2.5">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-800" />
                <div>
                  <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono">
                    Release Central Stock to State Reserve
                  </h3>
                  <p className="text-xs text-bhissm-secondary">
                    Credits the selected State's Medical Reserve Depot for hospital redistribution
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCentralReleaseModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            {feedbackMsg && (
              <div
                className={`p-2.5 rounded text-xs font-medium ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-red-50 text-red-900 border border-red-300'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmitCentralRelease} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-bhissm-dark mb-1">
                  1. Select Central Reserve Medicine
                </label>
                <select
                  className="select-field"
                  value={releaseForm.medicine_id}
                  onChange={(e) => setReleaseForm({ ...releaseForm, medicine_id: e.target.value })}
                >
                  {reserves.map((r) => (
                    <option key={r.medicine_id} value={r.medicine_id}>
                      {r.medicine_name} (Available: {r.immediately_available?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-bhissm-dark mb-1">
                  2. Destination State (Credits State Reserve Stockpile)
                </label>
                <select
                  className="select-field font-semibold"
                  value={releaseForm.destination_state_id}
                  onChange={(e) =>
                    setReleaseForm({ ...releaseForm, destination_state_id: e.target.value })
                  }
                  required
                >
                  {statesList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code}) — {st.name} State Medical Reserve Depot
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-bhissm-dark mb-1">
                  3. Quantity to Release to State Reserve
                </label>
                <input
                  type="number"
                  min="10"
                  className="input-field font-mono font-bold"
                  value={releaseForm.quantity}
                  onChange={(e) =>
                    setReleaseForm({ ...releaseForm, quantity: Number(e.target.value) })
                  }
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-bhissm-dark mb-1">
                  4. Release Order Justification
                </label>
                <textarea
                  className="input-field h-16"
                  value={releaseForm.reason}
                  onChange={(e) => setReleaseForm({ ...releaseForm, reason: e.target.value })}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-bhissm-border">
                <button
                  type="button"
                  onClick={() => setShowCentralReleaseModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs font-mono font-bold"
                >
                  {submitting ? 'Releasing to State...' : 'Authorize Release to State Reserve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: State Reserve -> Hospital Redistribution Modal */}
      {showRedistributeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-5 shadow-xl border-2 border-blue-600 space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2.5">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-700" />
                <div>
                  <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono">
                    Redistribute State Reserve to Hospital
                  </h3>
                  <p className="text-xs text-bhissm-secondary">
                    Source: {stateReserveData?.depot?.name || 'State Reserve Depot'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowRedistributeModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            {feedbackMsg && (
              <div
                className={`p-2.5 rounded text-xs font-medium ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-red-50 text-red-900 border border-red-300'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmitRedistribution} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-bhissm-dark mb-1">
                  1. Select Medicine from State Reserve Stock
                </label>
                <select
                  className="select-field"
                  value={redistributeForm.medicine_id}
                  onChange={(e) => {
                    const found = stateReserveData?.stock?.find(
                      (s: any) => s.medicine_id === e.target.value
                    );
                    setRedistributeForm({
                      ...redistributeForm,
                      medicine_id: e.target.value,
                      medicine_name: found?.medicine_name || '',
                      available_in_state: found?.available_to_distribute || 0,
                    });
                  }}
                  required
                >
                  {stateReserveData?.stock?.map((s: any) => (
                    <option key={s.medicine_id} value={s.medicine_id}>
                      {s.medicine_name} (State Reserve Avail: {s.available_to_distribute?.toLocaleString()} {s.unit_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-bhissm-dark mb-1">
                  2. Select Recipient Hospital (Under {stateReserveData?.state?.name} Jurisdiction)
                </label>
                <select
                  className="select-field font-semibold"
                  value={redistributeForm.destination_facility_id}
                  onChange={(e) =>
                    setRedistributeForm({
                      ...redistributeForm,
                      destination_facility_id: e.target.value,
                    })
                  }
                  required
                >
                  {(stateHospitalsForDropdown.length > 0
                    ? stateHospitalsForDropdown
                    : facilities
                  ).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.district_name || f.state_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-bhissm-dark mb-1">
                  3. Quantity to Allocate to Hospital
                </label>
                <input
                  type="number"
                  min="1"
                  max={redistributeForm.available_in_state || 100000}
                  className="input-field font-mono font-bold"
                  value={redistributeForm.quantity}
                  onChange={(e) =>
                    setRedistributeForm({ ...redistributeForm, quantity: Number(e.target.value) })
                  }
                  required
                />
                <div className="text-xs font-mono text-blue-800 mt-1">
                  Available in State Reserve: {redistributeForm.available_in_state?.toLocaleString()} units
                </div>
              </div>

              <div>
                <label className="block font-bold text-bhissm-dark mb-1">
                  4. Dispatch &amp; Challan Notes
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={redistributeForm.notes}
                  onChange={(e) =>
                    setRedistributeForm({ ...redistributeForm, notes: e.target.value })
                  }
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-bhissm-border">
                <button
                  type="button"
                  onClick={() => setShowRedistributeModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-xs font-mono font-bold cursor-pointer"
                >
                  {submitting ? 'Transferring...' : 'Confirm Redistribution to Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

