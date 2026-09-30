import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../lib/api';
import {
  Droplet,
  PlusCircle,
  Send,
  X,
  PackagePlus,
  CheckCircle2
} from 'lucide-react';

export default function BloodBankPage() {
  const { user } = useAuth();
  const [bloodInventory, setBloodInventory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [lowOnly, setLowOnly] = useState(false);

  // New Request Modal
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqForm, setReqForm] = useState({
    blood_group: 'O-',
    component: 'packed_rbc',
    units_required: 4,
    priority: 'urgent',
    reason: 'Emergency trauma resuscitation',
  });

  // Manual Blood Stock Entry Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualMsg, setManualMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [manualForm, setManualForm] = useState({
    facility_id: '',
    blood_group: 'O+',
    component: 'packed_rbc',
    units_added: 10,
    source_type: 'Voluntary Donation Camp',
    donor_or_vendor_ref: '',
    collection_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
  });

  // Offer Modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedBloodReq, setSelectedBloodReq] = useState<any>(null);
  const [matchingSources, setMatchingSources] = useState<any[]>([]);
  const [selectedSourceBankId, setSelectedSourceBankId] = useState('');
  const [offerUnits, setOfferUnits] = useState(2);

  const fetchBloodData = async () => {
    try {
      setLoading(true);
      const [invRes, sumRes, reqRes, facRes] = await Promise.all([
        API.get('/blood-bank/inventory', {
          params: {
            blood_group: selectedGroup || undefined,
            component: selectedComponent || undefined,
            low_only: lowOnly ? 'true' : undefined,
          },
        }),
        API.get('/blood-bank/summary'),
        API.get('/blood-bank/requests'),
        API.get('/facilities'),
      ]);
      setBloodInventory(invRes.data);
      setSummary(sumRes.data);
      setRequests(reqRes.data);
      const hospList = (facRes.data || []).filter((f: any) => f.type !== 'state_reserve');
      setFacilities(hospList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBloodData();
  }, [selectedGroup, selectedComponent, lowOnly]);

  const handleOpenManualEntry = () => {
    setManualMsg(null);
    setManualForm({
      facility_id: user?.facility_id || facilities[0]?.id || '',
      blood_group: 'O+',
      component: 'packed_rbc',
      units_added: 10,
      source_type: 'Voluntary Donation Camp',
      donor_or_vendor_ref: `BAG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      collection_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
    });
    setShowManualModal(true);
  };

  const handleManualEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualMsg(null);
    try {
      const res = await API.post('/blood-bank/manual-entry', {
        facility_id: manualForm.facility_id || undefined,
        blood_group: manualForm.blood_group,
        component: manualForm.component,
        units_added: Number(manualForm.units_added),
        source_type: manualForm.source_type,
        donor_or_vendor_ref: manualForm.donor_or_vendor_ref,
        collection_date: manualForm.collection_date,
        expiry_date: manualForm.expiry_date,
      });
      setManualMsg({
        type: 'success',
        text: res.data?.message || 'Blood units manually recorded in hospital Blood Bank!',
      });
      setTimeout(() => {
        setShowManualModal(false);
        setManualMsg(null);
        fetchBloodData();
      }, 1100);
    } catch (err: any) {
      setManualMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to record manual blood stock entry',
      });
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post('/blood-bank/request', {
        ...reqForm,
        units_required: Number(reqForm.units_required),
      });
      setShowReqModal(false);
      fetchBloodData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit blood request');
    }
  };

  const handleOpenOfferModal = async (reqItem: any) => {
    setSelectedBloodReq(reqItem);
    try {
      const res = await API.get(`/blood-bank/requests/${reqItem.id}/sources`);
      setMatchingSources(res.data.fulfillment_plan || []);
      if (res.data.fulfillment_plan?.length > 0) {
        setSelectedSourceBankId(res.data.fulfillment_plan[0].blood_bank_id);
        setOfferUnits(Math.min(res.data.fulfillment_plan[0].requestable_units, reqItem.units_required - reqItem.units_confirmed));
      }
      setShowOfferModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBloodReq || !selectedSourceBankId) return;
    try {
      await API.post(`/blood-bank/requests/${selectedBloodReq.id}/offer`, {
        blood_bank_id: selectedSourceBankId,
        units_offered: Number(offerUnits),
        eta_minutes: 30,
      });
      setShowOfferModal(false);
      fetchBloodData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit blood offer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-bhissm-secondary">
              REGIONAL BLOOD COLD CHAIN &amp; TRANSFUSION NETWORK
            </span>
            <span className="text-[10px] bg-red-100 text-red-900 border border-red-300 px-1.5 py-0.2 rounded font-mono font-bold">
              CROSS-MATCH &amp; LOGISTICS
            </span>
          </div>
          <h1 className="text-xl font-bold text-bhissm-dark mt-1 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-red-600" />
            Inter-Facility Blood Bank &amp; Manual Stock Entry Subsystem
          </h1>
          <p className="text-xs text-bhissm-secondary mt-0.5">
            Real-time component tracking, manual blood bag collection/vendor entry, and mutual aid dispatches across regional medical colleges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenManualEntry}
            className="btn-primary flex items-center gap-1.5 text-xs font-bold bg-bhissm-dark hover:bg-black text-white"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Manual Blood Stock Entry</span>
          </button>

          <button
            onClick={() => setShowReqModal(true)}
            className="btn-danger flex items-center gap-2 text-xs font-bold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Requisition Blood Units</span>
          </button>
        </div>
      </div>

      {/* Aggregate Blood Availability Summary Grid */}
      <div className="card space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-bhissm-dark font-mono border-b border-bhissm-border pb-1.5 flex items-center justify-between">
          <span>Regional Availability Matrix (By Blood Group)</span>
          <span className="text-[10px] text-bhissm-secondary font-normal font-sans">
            Units Ready for Transfusion Dispatch
          </span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => {
            const groupItems = summary.filter((s) => s.blood_group === group);
            const totalAvail = groupItems.reduce((acc, s) => acc + s.total_available, 0);
            const isDeficit = totalAvail <= 5;
            return (
              <div
                key={group}
                className={`p-2.5 rounded border text-center font-mono ${
                  totalAvail === 0
                    ? 'bg-red-100 border-red-400 text-red-950 font-bold'
                    : isDeficit
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-white border-bhissm-border text-bhissm-dark'
                }`}
              >
                <div className="text-sm font-bold">{group}</div>
                <div className="text-lg font-bold mt-0.5">{totalAvail}</div>
                <div className="text-[9px] uppercase tracking-wider text-bhissm-secondary mt-0.5">
                  {totalAvail === 0 ? 'Exhausted' : isDeficit ? 'Deficit' : 'Units'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Requisitions and Active Transfers */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-bhissm-dark font-mono">
            Active Blood Requests &amp; Mutual Aid Dispatches ({requests.length})
          </h2>
          <span className="text-[10px] font-mono text-bhissm-secondary">
            STATEWIDE REQUISITION PIPELINE
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-6 text-xs text-bhissm-secondary font-mono">
            No pending blood supply requests. All hospital blood reserves adequate.
          </div>
        ) : (
          <div className="divide-y divide-bhissm-border/60">
            {requests.map((req) => (
              <div key={req.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-red-900 font-mono">
                      {req.blood_group} • {req.component.replace('_', ' ').toUpperCase()}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                        req.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {req.priority}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                        req.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'source_identified'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <div className="text-bhissm-secondary mt-1">
                    <strong>Requesting Hospital:</strong> {req.facility_name} • Reason: {req.reason || 'Surgical requirement'}
                  </div>
                  <div className="text-[10px] text-bhissm-secondary font-mono mt-0.5">
                    Filed by {req.requested_by_name || 'Resident Medical Officer'} • {new Date(req.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <div className="font-bold text-sm text-bhissm-dark">
                      {req.units_confirmed} / {req.units_required} Units
                    </div>
                    <div className="text-[10px] text-bhissm-secondary">
                      {req.units_required - req.units_confirmed > 0
                        ? `Deficit: ${req.units_required - req.units_confirmed} units`
                        : 'Fulfilled'}
                    </div>
                  </div>

                  {req.status !== 'completed' && req.units_confirmed < req.units_required && (
                    <button
                      onClick={() => handleOpenOfferModal(req)}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 font-mono shrink-0"
                    >
                      <Send className="w-3 h-3" /> Fulfill via Network
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Blood Inventory Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-3 border-b border-bhissm-border bg-[#F8F1E7]/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="font-bold uppercase tracking-wider text-bhissm-dark font-mono">
            Facility Blood Bank Stock Inventory
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="select-field w-auto"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="">All Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <select
              className="select-field w-auto"
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
            >
              <option value="">All Components</option>
              <option value="whole_blood">Whole Blood</option>
              <option value="packed_rbc">Packed Red Blood Cells (PRBC)</option>
              <option value="platelets">Platelets (RDP/SDP)</option>
              <option value="plasma">Fresh Frozen Plasma (FFP)</option>
            </select>

            <button
              onClick={() => setLowOnly(!lowOnly)}
              className={`px-3 py-1.5 rounded border transition-colors ${
                lowOnly
                  ? 'bg-red-100 border-red-400 text-red-900 font-bold'
                  : 'border-bhissm-border text-bhissm-secondary hover:bg-bhissm-pink'
              }`}
            >
              Deficit Only
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-bhissm-border bg-bhissm-bg">
                <th className="table-header">Blood Bank &amp; Facility</th>
                <th className="table-header">Blood Group</th>
                <th className="table-header">Component</th>
                <th className="table-header text-right">Available Units</th>
                <th className="table-header text-right">Reserved Units</th>
                <th className="table-header text-right">Requestable Quota</th>
                <th className="table-header text-center">Stock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bhissm-border/40">
              {bloodInventory.map((item) => (
                <tr key={item.id} className="hover:bg-[#FDF9F3]">
                  <td className="table-cell">
                    <div className="font-semibold text-bhissm-dark">{item.blood_bank_name}</div>
                    <div className="text-[10px] text-bhissm-secondary font-mono">
                      {item.facility_name} ({item.state_name})
                    </div>
                  </td>
                  <td className="table-cell font-mono font-bold text-red-900">
                    {item.bloodGroup}
                  </td>
                  <td className="table-cell capitalize">
                    {item.component.replace('_', ' ')}
                  </td>
                  <td className="table-cell text-right font-mono font-bold">
                    {item.availableUnits}
                  </td>
                  <td className="table-cell text-right font-mono text-bhissm-secondary">
                    {item.reservedUnits}
                  </td>
                  <td className="table-cell text-right font-mono font-bold text-emerald-800">
                    {item.requestable_units}
                  </td>
                  <td className="table-cell text-center">
                    {item.status === 'exhausted' ? (
                      <span className="badge-critical font-mono">EXHAUSTED</span>
                    ) : item.status === 'critical' ? (
                      <span className="badge-critical font-mono">CRITICAL</span>
                    ) : item.status === 'low' ? (
                      <span className="badge-warning font-mono">LOW BUFFER</span>
                    ) : (
                      <span className="badge-success font-mono">AVAILABLE</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANUAL BLOOD STOCK ENTRY MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card bg-white max-w-lg w-full p-5 shadow-2xl border-2 border-red-700 space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2.5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-900 font-bold">
                  MANUAL BLOOD BANK INWARD STOCK ENTRY
                </span>
                <h3 className="font-bold text-base text-bhissm-dark mt-1 flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-red-600" />
                  Record New Blood Units (Camp / Direct Vendor / Donor)
                </h3>
              </div>
              <button onClick={() => setShowManualModal(false)}>
                <X className="w-5 h-5 text-bhissm-secondary hover:text-bhissm-dark" />
              </button>
            </div>

            {manualMsg && (
              <div
                className={`p-3 rounded text-xs font-medium ${
                  manualMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {manualMsg.text}
              </div>
            )}

            <form onSubmit={handleManualEntrySubmit} className="space-y-3 text-xs">
              {user?.role !== 'hospital' && facilities.length > 0 && (
                <div>
                  <label className="block font-semibold mb-1">Hospital / Blood Bank Facility</label>
                  <select
                    className="select-field"
                    value={manualForm.facility_id}
                    onChange={(e) => setManualForm({ ...manualForm, facility_id: e.target.value })}
                    required
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.state_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Blood Group *</label>
                  <select
                    className="select-field font-mono font-bold"
                    value={manualForm.blood_group}
                    onChange={(e) => setManualForm({ ...manualForm, blood_group: e.target.value })}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Component *</label>
                  <select
                    className="select-field"
                    value={manualForm.component}
                    onChange={(e) => setManualForm({ ...manualForm, component: e.target.value })}
                  >
                    <option value="packed_rbc">Packed RBC (PRBC)</option>
                    <option value="whole_blood">Whole Blood</option>
                    <option value="platelets">Platelets (RDP/SDP)</option>
                    <option value="plasma">Fresh Frozen Plasma</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Units Added *</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field font-mono font-bold"
                    value={manualForm.units_added}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, units_added: Number(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Collection / Procurement Source</label>
                  <select
                    className="select-field"
                    value={manualForm.source_type}
                    onChange={(e) => setManualForm({ ...manualForm, source_type: e.target.value })}
                  >
                    <option value="Voluntary Donation Camp">Voluntary Donation Camp</option>
                    <option value="In-House Donor Collection">In-House Donor Collection</option>
                    <option value="Authorized Blood Center Vendor">Authorized Blood Center Vendor</option>
                    <option value="Red Cross / Regional Blood Grid">Red Cross / Regional Blood Grid</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Bag Lot / Screening Ref #</label>
                  <input
                    type="text"
                    className="input-field font-mono"
                    value={manualForm.donor_or_vendor_ref}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, donor_or_vendor_ref: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Collection Date</label>
                  <input
                    type="date"
                    className="input-field font-mono"
                    value={manualForm.collection_date}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, collection_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Component Expiry Date</label>
                  <input
                    type="date"
                    className="input-field font-mono"
                    value={manualForm.expiry_date}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, expiry_date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-bhissm-border">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-danger text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Add Blood Units to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-4 shadow-xl border border-red-500 space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono">
                Initiate Blood Requisition
              </h3>
              <button onClick={() => setShowReqModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Blood Group</label>
                  <select
                    className="select-field"
                    value={reqForm.blood_group}
                    onChange={(e) => setReqForm({ ...reqForm, blood_group: e.target.value })}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Component</label>
                  <select
                    className="select-field"
                    value={reqForm.component}
                    onChange={(e) => setReqForm({ ...reqForm, component: e.target.value })}
                  >
                    <option value="whole_blood">Whole Blood</option>
                    <option value="packed_rbc">Packed Red Cells (PRBC)</option>
                    <option value="platelets">Platelets</option>
                    <option value="plasma">Fresh Frozen Plasma</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Units Required</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={reqForm.units_required}
                    onChange={(e) => setReqForm({ ...reqForm, units_required: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Priority</label>
                  <select
                    className="select-field"
                    value={reqForm.priority}
                    onChange={(e) => setReqForm({ ...reqForm, priority: e.target.value })}
                  >
                    <option value="urgent">Urgent Transfusion</option>
                    <option value="critical">Stat / Immediate</option>
                    <option value="routine">Elective OT Preparation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Clinical Context &amp; Ward</label>
                <input
                  type="text"
                  className="input-field"
                  value={reqForm.reason}
                  onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-bhissm-border">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-danger text-xs font-bold">
                  Broadcast Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer / Fulfill Modal */}
      {showOfferModal && selectedBloodReq && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card bg-white max-w-lg w-full p-4 shadow-xl border border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono">
                Fulfill Blood Request via Donor Bank
              </h3>
              <button onClick={() => setShowOfferModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            <p className="text-xs text-bhissm-secondary">
              Requisition: <strong>{selectedBloodReq.units_required} units of {selectedBloodReq.blood_group} ({selectedBloodReq.component})</strong> for {selectedBloodReq.facility_name}.
            </p>

            {matchingSources.length === 0 ? (
              <div className="p-3 bg-red-50 text-red-800 text-xs rounded border border-red-200">
                No matching blood banks currently have requestable units for this group and component. Consider national blood grid transfer.
              </div>
            ) : (
              <form onSubmit={handleSubmitOffer} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium mb-1">Select Donor Blood Bank</label>
                  <select
                    className="select-field"
                    value={selectedSourceBankId}
                    onChange={(e) => {
                      setSelectedSourceBankId(e.target.value);
                      const s = matchingSources.find((m) => m.blood_bank_id === e.target.value);
                      if (s) setOfferUnits(Math.min(s.requestable_units, selectedBloodReq.units_required));
                    }}
                  >
                    {matchingSources.map((s) => (
                      <option key={s.blood_bank_id} value={s.blood_bank_id}>
                        {s.blood_bank_name} ({s.state_name}) — {s.requestable_units} Units Available
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Units to Allocate &amp; Reserve</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={offerUnits}
                    onChange={(e) => setOfferUnits(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-bhissm-border">
                  <button
                    type="button"
                    onClick={() => setShowOfferModal(false)}
                    className="btn-outline text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary text-xs font-bold">
                    Reserve &amp; Dispatch Blood
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
