import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../lib/api';
import {
  Truck,
  Users,
  Bed,
  Edit2,
  Save,
  X,
  PlusCircle,
  UserPlus,
  CheckCircle2
} from 'lucide-react';

export default function CapacityPage() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [capacity, setCapacity] = useState<any[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing capacity inline
  const [editingCareType, setEditingCareType] = useState<string | null>(null);
  const [editBedForm, setEditBedForm] = useState({
    available_beds: 0,
    occupied_beds: 0,
    reserved_beds: 0,
  });

  // Manual Entry Modals
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showBedWardModal, setShowBedWardModal] = useState(false);
  const [modalMsg, setModalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [ambForm, setAmbForm] = useState({
    facility_id: '',
    registration: '',
    ambulance_type: 'ALS',
    provider: '108 EMRI / Hospital Fleet',
    current_zone: 'Central Trauma Corridor',
    equipment: 'Ventilator, Defibrillator, Multipara Monitor, Oxygen Cylinders',
  });

  const [staffForm, setStaffForm] = useState({
    facility_id: '',
    name: '',
    staff_type: 'doctor',
    specialty: 'Emergency Medicine & Trauma Surgery',
    deployment_time_minutes: 15,
    contact_phone: '+91-94430-11200',
  });

  const [wardForm, setWardForm] = useState({
    care_type: 'icu',
    available_beds: 15,
    occupied_beds: 25,
    reserved_beds: 5,
  });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [facRes, ambRes, staffRes] = await Promise.all([
        API.get('/facilities'),
        API.get('/facilities/ambulances/list'),
        API.get('/facilities/staff/list'),
      ]);
      const hospList = (facRes.data || []).filter((f: any) => f.type !== 'state_reserve');
      setFacilities(hospList);
      setAmbulances(ambRes.data);
      setStaff(staffRes.data);

      const defaultFacId =
        user?.facility_id || (hospList.length > 0 ? hospList[0].id : '');
      setSelectedFacilityId(defaultFacId);
      if (defaultFacId) {
        fetchFacilityCapacity(defaultFacId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilityCapacity = async (facId: string) => {
    try {
      const res = await API.get(`/facilities/${facId}/capacity`);
      setCapacity(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const handleFacilityChange = (facId: string) => {
    setSelectedFacilityId(facId);
    fetchFacilityCapacity(facId);
  };

  const startEditBed = (item: any) => {
    setEditingCareType(item.careType);
    setEditBedForm({
      available_beds: item.availableBeds,
      occupied_beds: item.occupiedBeds,
      reserved_beds: item.reservedBeds,
    });
  };

  const handleSaveBed = async (careType: string) => {
    try {
      await API.put(`/facilities/${selectedFacilityId}/capacity/${careType}`, {
        available_beds: Number(editBedForm.available_beds),
        occupied_beds: Number(editBedForm.occupied_beds),
        reserved_beds: Number(editBedForm.reserved_beds),
      });
      setEditingCareType(null);
      fetchFacilityCapacity(selectedFacilityId);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update capacity');
    }
  };

  const handleToggleAmbulance = async (amb: any, newStatus: string) => {
    try {
      await API.patch(`/facilities/ambulances/${amb.id}`, { status: newStatus });
      const res = await API.get('/facilities/ambulances/list');
      setAmbulances(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStaff = async (member: any) => {
    try {
      const nextStatus = member.status === 'available' ? 'deployed' : 'available';
      await API.patch(`/facilities/staff/${member.id}`, { status: nextStatus });
      const res = await API.get('/facilities/staff/list');
      setStaff(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Open Manual Ambulance Modal
  const handleOpenAmbModal = () => {
    setModalMsg(null);
    const randPlate = `PY-01-EM-${Math.floor(1000 + Math.random() * 9000)}`;
    setAmbForm({
      facility_id: user?.facility_id || selectedFacilityId || facilities[0]?.id || '',
      registration: randPlate,
      ambulance_type: 'ALS',
      provider: 'Hospital Dedicated Fleet / 108 EMRI',
      current_zone: 'Main Emergency Gate',
      equipment: 'Cardiac Monitor, Ventilator, Defibrillator, Suction Pump, Oxygen',
    });
    setShowAmbulanceModal(true);
  };

  const handleCreateAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalMsg(null);
    try {
      const res = await API.post('/facilities/ambulances', {
        facility_id: ambForm.facility_id || selectedFacilityId,
        registration: ambForm.registration,
        ambulance_type: ambForm.ambulance_type,
        provider: ambForm.provider,
        current_zone: ambForm.current_zone,
        equipment: ambForm.equipment
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setModalMsg({
        type: 'success',
        text: res.data?.message || 'New ambulance registered in hospital fleet!',
      });
      const ambRes = await API.get('/facilities/ambulances/list');
      setAmbulances(ambRes.data);
      setTimeout(() => {
        setShowAmbulanceModal(false);
        setModalMsg(null);
      }, 1000);
    } catch (err: any) {
      setModalMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to register new ambulance',
      });
    }
  };

  // Open Manual Doctor / Staff Modal
  const handleOpenStaffModal = () => {
    setModalMsg(null);
    setStaffForm({
      facility_id: user?.facility_id || selectedFacilityId || facilities[0]?.id || '',
      name: '',
      staff_type: 'doctor',
      specialty: 'Critical Care & Trauma Specialist',
      deployment_time_minutes: 15,
      contact_phone: '+91-94432-88100',
    });
    setShowStaffModal(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalMsg(null);
    try {
      const res = await API.post('/facilities/staff', {
        facility_id: staffForm.facility_id || selectedFacilityId,
        name: staffForm.name,
        staff_type: staffForm.staff_type,
        specialty: staffForm.specialty,
        deployment_time_minutes: Number(staffForm.deployment_time_minutes),
        contact_phone: staffForm.contact_phone,
      });
      setModalMsg({
        type: 'success',
        text: res.data?.message || 'Doctor / Medical specialist onboarded to standby pool!',
      });
      const staffRes = await API.get('/facilities/staff/list');
      setStaff(staffRes.data);
      setTimeout(() => {
        setShowStaffModal(false);
        setModalMsg(null);
      }, 1000);
    } catch (err: any) {
      setModalMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to add medical staff',
      });
    }
  };

  // Open Manual Bed Ward Modal
  const handleOpenWardModal = () => {
    setModalMsg(null);
    setWardForm({
      care_type: 'icu',
      available_beds: 12,
      occupied_beds: 18,
      reserved_beds: 4,
    });
    setShowBedWardModal(true);
  };

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalMsg(null);
    try {
      const targetFac = user?.facility_id || selectedFacilityId;
      await API.post(`/facilities/${targetFac}/capacity`, {
        care_type: wardForm.care_type,
        available_beds: Number(wardForm.available_beds),
        occupied_beds: Number(wardForm.occupied_beds),
        reserved_beds: Number(wardForm.reserved_beds),
      });
      setModalMsg({
        type: 'success',
        text: 'Ward bed capacity updated!',
      });
      fetchFacilityCapacity(targetFac);
      setTimeout(() => {
        setShowBedWardModal(false);
        setModalMsg(null);
      }, 900);
    } catch (err: any) {
      setModalMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to save bed ward capacity',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-bhissm-secondary">
              HEALTHCARE INFRASTRUCTURE, AMBULANCE FLEET &amp; DOCTOR ROSTER
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-900 border border-blue-300 px-1.5 py-0.2 rounded font-mono font-bold">
              MANUAL ONBOARDING &amp; LIVE READINESS
            </span>
          </div>
          <h1 className="text-xl font-bold text-bhissm-dark mt-1 flex items-center gap-2">
            <Truck className="w-5 h-5 text-bhissm-dark" />
            Hospital Capacity, Ambulance Fleet &amp; Doctor Onboarding
          </h1>
          <p className="text-xs text-bhissm-secondary mt-0.5">
            Manually register new ambulances, onboard doctors/specialists, and manage live ICU &amp; trauma bed wards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAmbModal}
            className="btn-primary text-xs flex items-center gap-1.5 font-semibold"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add New Ambulance</span>
          </button>

          <button
            onClick={handleOpenStaffModal}
            className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Doctor / Medical Staff</span>
          </button>

          <button
            onClick={handleOpenWardModal}
            className="btn-outline text-xs flex items-center gap-1.5"
          >
            <Bed className="w-3.5 h-3.5" />
            <span>+ Add / Configure Bed Ward</span>
          </button>

          {user?.role !== 'hospital' && (
            <select
              className="select-field w-auto font-mono text-xs"
              value={selectedFacilityId}
              onChange={(e) => handleFacilityChange(e.target.value)}
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.state_name})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Bed Census Cards */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-bhissm-dark font-mono flex items-center gap-2">
            <Bed className="w-4 h-4 text-bhissm-dark" />
            Live Bed Census &amp; Care Type Availability
          </h2>
          <span className="text-[11px] font-mono text-bhissm-secondary">
            {facilities.find((f) => f.id === selectedFacilityId)?.name || 'Facility'}
          </span>
        </div>

        {capacity.length === 0 ? (
          <div className="text-center py-6 text-xs text-bhissm-secondary font-mono">
            No dedicated capacity census profile configured for this facility level. Click "+ Add / Configure Bed Ward" above to initialize.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {capacity.map((item) => {
              const isEditing = editingCareType === item.careType;
              const occRate = Math.round(
                ((item.occupiedBeds + item.reservedBeds) / (item.totalBeds || 1)) * 100
              );
              return (
                <div
                  key={item.id}
                  className="bg-white border border-bhissm-border rounded p-3 text-xs space-y-2.5 shadow-sm"
                >
                  <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                    <span className="font-bold text-bhissm-dark uppercase font-mono tracking-wide">
                      {item.careType.replace('_', ' ')} Care
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        occRate > 90
                          ? 'bg-red-100 text-red-900'
                          : occRate > 75
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {occRate}% Occupied
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1 font-mono">
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div>
                          <label className="text-[10px] text-emerald-800 font-bold block">Avail</label>
                          <input
                            type="number"
                            className="input-field text-center py-1"
                            value={editBedForm.available_beds}
                            onChange={(e) =>
                              setEditBedForm({ ...editBedForm, available_beds: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-700 font-bold block">Occupied</label>
                          <input
                            type="number"
                            className="input-field text-center py-1"
                            value={editBedForm.occupied_beds}
                            onChange={(e) =>
                              setEditBedForm({ ...editBedForm, occupied_beds: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-800 font-bold block">Reserved</label>
                          <input
                            type="number"
                            className="input-field text-center py-1"
                            value={editBedForm.reserved_beds}
                            onChange={(e) =>
                              setEditBedForm({ ...editBedForm, reserved_beds: Number(e.target.value) })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          onClick={() => setEditingCareType(null)}
                          className="btn-outline text-[10px] py-1 px-2"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveBed(item.careType)}
                          className="btn-primary text-[10px] py-1 px-2.5 flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center pt-1 font-mono">
                      <div>
                        <div className="text-2xl font-bold text-emerald-800">
                          {item.availableBeds}
                        </div>
                        <div className="text-[10px] text-bhissm-secondary">
                          Available of {item.totalBeds} Total
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-bhissm-secondary space-y-0.5">
                        <div>Occupied: <strong>{item.occupiedBeds}</strong></div>
                        <div>Reserved: <strong>{item.reservedBeds}</strong></div>
                        <button
                          onClick={() => startEditBed(item)}
                          className="text-bhissm-dark font-sans hover:underline flex items-center gap-1 justify-end pt-1"
                        >
                          <Edit2 className="w-3 h-3" /> Update Census
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dual Column: Ambulances Fleet & Medical Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ambulance Fleet */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-bhissm-dark font-mono flex items-center gap-2">
              <Truck className="w-4 h-4 text-bhissm-dark" />
              Regional Ambulance Fleet ({ambulances.length})
            </h2>
            <button
              onClick={handleOpenAmbModal}
              className="text-[11px] font-mono font-bold text-blue-800 hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" /> + Add Ambulance
            </button>
          </div>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {ambulances.map((amb) => (
              <div
                key={amb.id}
                className="p-3 rounded border border-bhissm-border bg-white flex justify-between items-center text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-bhissm-dark font-mono text-sm">
                      {amb.registration}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                        amb.ambulanceType === 'ALS'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {amb.ambulanceType}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                        amb.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : amb.status === 'in_use' || amb.status === 'dispatched'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {amb.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-bhissm-secondary mt-1">
                    Base Facility: <strong>{amb.facility_name}</strong> ({amb.state_name}) • Zone: {amb.currentZone || 'Central'}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {amb.status === 'available' ? (
                    <button
                      onClick={() => handleToggleAmbulance(amb, 'in_use')}
                      className="btn-outline text-[10px] py-1 px-2 font-mono"
                    >
                      Deploy
                    </button>
                  ) : amb.status === 'in_use' ? (
                    <button
                      onClick={() => handleToggleAmbulance(amb, 'available')}
                      className="btn-primary text-[10px] py-1 px-2 font-mono"
                    >
                      Return
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medical Personnel Readiness */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-bhissm-dark font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-bhissm-dark" />
              Specialist Doctors &amp; Medical Staff ({staff.length})
            </h2>
            <button
              onClick={handleOpenStaffModal}
              className="text-[11px] font-mono font-bold text-emerald-800 hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> + Add Doctor / Staff
            </button>
          </div>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {staff.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded border border-bhissm-border bg-white flex justify-between items-center text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-bhissm-dark">{s.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 capitalize">
                      {s.staffType} • {s.specialty || 'General'}
                    </span>
                  </div>
                  <div className="text-[11px] text-bhissm-secondary mt-0.5">
                    Attached: <strong>{s.facility_name}</strong> • Rapid Deploy: {s.deploymentTimeMinutes}m
                    {s.contactPhone ? ` • ${s.contactPhone}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                      s.status === 'available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {s.status}
                  </span>
                  <button
                    onClick={() => handleToggleStaff(s)}
                    className="btn-outline text-[10px] py-1 px-2 font-mono"
                  >
                    {s.status === 'available' ? 'Deploy' : 'Standby'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MANUAL ENTRY MODAL: ADD NEW AMBULANCE */}
      {showAmbulanceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-5 shadow-2xl border-2 border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold">
                  MANUAL FLEET REGISTRATION
                </span>
                <h3 className="font-bold text-sm text-bhissm-dark mt-1 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-bhissm-dark" />
                  Register New Ambulance in Hospital Fleet
                </h3>
              </div>
              <button onClick={() => setShowAmbulanceModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            {modalMsg && (
              <div
                className={`p-2.5 rounded text-xs ${
                  modalMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {modalMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateAmbulance} className="space-y-3 text-xs">
              {user?.role !== 'hospital' && (
                <div>
                  <label className="block font-semibold mb-1">Base Hospital / Facility</label>
                  <select
                    className="select-field"
                    value={ambForm.facility_id}
                    onChange={(e) => setAmbForm({ ...ambForm, facility_id: e.target.value })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Vehicle Registration # *</label>
                  <input
                    type="text"
                    className="input-field font-mono font-bold uppercase"
                    placeholder="e.g. PY-01-EM-4092"
                    value={ambForm.registration}
                    onChange={(e) => setAmbForm({ ...ambForm, registration: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Ambulance Class *</label>
                  <select
                    className="select-field font-mono"
                    value={ambForm.ambulance_type}
                    onChange={(e) => setAmbForm({ ...ambForm, ambulance_type: e.target.value })}
                  >
                    <option value="ALS">ALS (Advanced Life Support)</option>
                    <option value="BLS">BLS (Basic Life Support)</option>
                    <option value="Mobile ICU">Mobile Trauma ICU</option>
                    <option value="Neonatal">Neonatal Life Support</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fleet Operator / Provider</label>
                  <input
                    type="text"
                    className="input-field"
                    value={ambForm.provider}
                    onChange={(e) => setAmbForm({ ...ambForm, provider: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Current Deployment Zone</label>
                  <input
                    type="text"
                    className="input-field"
                    value={ambForm.current_zone}
                    onChange={(e) => setAmbForm({ ...ambForm, current_zone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Onboard Life-Support Equipment</label>
                <input
                  type="text"
                  className="input-field"
                  value={ambForm.equipment}
                  onChange={(e) => setAmbForm({ ...ambForm, equipment: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-bhissm-border">
                <button
                  type="button"
                  onClick={() => setShowAmbulanceModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Register Ambulance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL ENTRY MODAL: ADD DOCTOR / MEDICAL STAFF */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-5 shadow-2xl border-2 border-emerald-800 space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                  MANUAL MEDICAL PERSONNEL ONBOARDING
                </span>
                <h3 className="font-bold text-sm text-bhissm-dark mt-1 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-700" />
                  Add Doctor / Specialist / Rapid Response Staff
                </h3>
              </div>
              <button onClick={() => setShowStaffModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            {modalMsg && (
              <div
                className={`p-2.5 rounded text-xs ${
                  modalMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {modalMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              {user?.role !== 'hospital' && (
                <div>
                  <label className="block font-semibold mb-1">Attached Hospital / Facility</label>
                  <select
                    className="select-field"
                    value={staffForm.facility_id}
                    onChange={(e) => setStaffForm({ ...staffForm, facility_id: e.target.value })}
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

              <div>
                <label className="block font-semibold mb-1">Doctor / Specialist Full Name *</label>
                <input
                  type="text"
                  className="input-field font-semibold"
                  placeholder="e.g. Dr. R. Subramanian, MD"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Cadre / Role *</label>
                  <select
                    className="select-field"
                    value={staffForm.staff_type}
                    onChange={(e) => setStaffForm({ ...staffForm, staff_type: e.target.value })}
                  >
                    <option value="doctor">Doctor / Consultant</option>
                    <option value="surgeon">Trauma Surgeon</option>
                    <option value="anesthetist">Anesthetist / Critical Care</option>
                    <option value="nurse">ICU / ER Specialist Nurse</option>
                    <option value="paramedic">ALS Paramedic</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Specialty Department *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Trauma Surgery, Cardiology"
                    value={staffForm.specialty}
                    onChange={(e) => setStaffForm({ ...staffForm, specialty: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Emergency Mobilization (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    className="input-field font-mono"
                    value={staffForm.deployment_time_minutes}
                    onChange={(e) =>
                      setStaffForm({
                        ...staffForm,
                        deployment_time_minutes: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Emergency Hotline / Mobile</label>
                  <input
                    type="text"
                    className="input-field font-mono"
                    value={staffForm.contact_phone}
                    onChange={(e) => setStaffForm({ ...staffForm, contact_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-bhissm-border">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Onboard Medical Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL ENTRY MODAL: ADD / CONFIGURE BED WARD */}
      {showBedWardModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-5 shadow-2xl border-2 border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono">
                Add / Configure Hospital Bed Ward
              </h3>
              <button onClick={() => setShowBedWardModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            {modalMsg && (
              <div
                className={`p-2.5 rounded text-xs ${
                  modalMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {modalMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateWard} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Care Ward Type</label>
                <select
                  className="select-field"
                  value={wardForm.care_type}
                  onChange={(e) => setWardForm({ ...wardForm, care_type: e.target.value })}
                >
                  <option value="icu">Intensive Care Unit (ICU)</option>
                  <option value="trauma">Emergency Trauma &amp; Resuscitation</option>
                  <option value="ventilator">Ventilator-Supported Critical Care</option>
                  <option value="general">General Inpatient Ward</option>
                  <option value="pediatric">Pediatric &amp; NICU Ward</option>
                  <option value="maternity">Maternity &amp; Labor Ward</option>
                  <option value="isolation">Infectious Isolation Ward</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Available Beds</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field font-mono"
                    value={wardForm.available_beds}
                    onChange={(e) =>
                      setWardForm({ ...wardForm, available_beds: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Occupied Beds</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field font-mono"
                    value={wardForm.occupied_beds}
                    onChange={(e) =>
                      setWardForm({ ...wardForm, occupied_beds: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Reserved Beds</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field font-mono"
                    value={wardForm.reserved_beds}
                    onChange={(e) =>
                      setWardForm({ ...wardForm, reserved_beds: Number(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-bhissm-border">
                <button
                  type="button"
                  onClick={() => setShowBedWardModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs font-bold">
                  Save Bed Ward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
