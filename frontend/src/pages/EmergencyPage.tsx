import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../lib/api';
import {
  AlertTriangle,
  ShieldAlert,
  PlusCircle,
  CheckCircle,
  Truck,
  Users,
  Pill,
  Droplet,
  Send,
  X,
  ShieldCheck,
  Building,
  RotateCcw,
  Lock,
  Check,
  Settings,
  Siren,
  Globe,
  MapPin,
  Activity,
  Radio,
} from 'lucide-react';


export default function EmergencyPage() {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [selectedEmergency, setSelectedEmergency] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter state for National users
  const [nationalFilter, setNationalFilter] = useState<'disasters_only' | 'all'>('disasters_only');
  // Scope filter for State & Hospital users: default includes adjacent districts from neighbouring states!
  const [regionalScope, setRegionalScope] = useState<'adjacent_corridor' | 'local_state' | 'all_india'>(
    'adjacent_corridor'
  );

  // Two-step activation modal state
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [initiatedEmergency, setInitiatedEmergency] = useState<any>(null);

  // All facilities for Primary / Secondary / Supporting hospital selectors
  const [facilities, setFacilities] = useState<any[]>([]);

  // Form states for Step 1 Initiate
  const [initForm, setInitForm] = useState({
    title: '',
    emergency_type: 'mass_casualty',
    location: 'ECR Highway Near Kalapet, Puducherry',
    severity: 'critical',
    estimated_casualties: 25,
    expected_duration_hours: 12,
    description:
      'Multi-vehicle collision on ECR Highway involving interstate passenger buses. Urgent trauma triage underway.',
    primary_facility_id: '',
    secondary_facility_id: '',
    supporting_facility_ids: [] as string[],
  });

  // Modal to edit Primary, Secondary, and Supporting hospitals on an existing emergency
  const [showHospitalsModal, setShowHospitalsModal] = useState(false);
  const [hospitalsForm, setHospitalsForm] = useState({
    primary_facility_id: '',
    secondary_facility_id: '',
    supporting_facility_ids: [] as string[],
  });

  // Resource Requirement Form
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqForm, setReqForm] = useState({
    resource_type: 'medicine',
    medicine_id: '',
    ambulance_sub_type: 'ALS Ambulance (Advanced Life Support with Ventilator)',
    staff_specialty: 'Trauma Surgeon Team',
    blood_group: 'O-',
    blood_component: 'packed_rbc',
    quantity_required: 500,
    priority: 'critical',
    description: '',
  });

  // Offer Form
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [offerQty, setOfferQty] = useState<number>(100);

  // Casualty load state
  const [casualtyForm, setCasualtyForm] = useState({
    load_critical: 0,
    load_serious: 0,
    load_minor: 0,
    load_deceased: 0,
    load_unassessed: 0,
  });
  const [showLoadModal, setShowLoadModal] = useState(false);

  // Medicine list for dropdown (25-33+ medicines)
  const [medicines, setMedicines] = useState<any[]>([]);

  const fetchEmergencies = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (user?.role === 'national') {
        if (nationalFilter === 'disasters_only') {
          params.min_casualties = 500;
        } else {
          params.include_all_india = 'true';
        }
      } else {
        if (regionalScope === 'local_state') {
          params.strict_state_only = 'true';
        } else if (regionalScope === 'all_india') {
          params.include_all_india = 'true';
        }
      }
      const res = await API.get('/emergencies', { params });
      setEmergencies(res.data);
      if (res.data.length > 0) {
        if (!selectedEmergency || !res.data.find((e: any) => e.id === selectedEmergency.id)) {
          fetchEmergencyDetail(res.data[0].id);
        } else {
          fetchEmergencyDetail(selectedEmergency.id);
        }
      } else {
        setSelectedEmergency(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmergencyDetail = async (id: string) => {
    try {
      const res = await API.get(`/emergencies/${id}`);
      setSelectedEmergency(res.data);
      setCasualtyForm({
        load_critical: res.data.loadCritical || 0,
        load_serious: res.data.loadSerious || 0,
        load_minor: res.data.loadMinor || 0,
        load_deceased: res.data.loadDeceased || 0,
        load_unassessed: res.data.loadUnassessed || 0,
      });
      setHospitalsForm({
        primary_facility_id: res.data.primary_facility_id || res.data.facilityId || '',
        secondary_facility_id: res.data.secondary_facility_id || '',
        supporting_facility_ids: Array.isArray(res.data.supporting_facility_ids)
          ? res.data.supporting_facility_ids
          : [],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await API.get('/medicines');
      setMedicines(res.data);
      if (res.data.length > 0) {
        setReqForm((prev) => ({ ...prev, medicine_id: res.data[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFacilities = async () => {
    try {
      const res = await API.get('/facilities', { params: { all_states: 'true' } });
      const hospitalList = res.data.filter((f: any) => f.type === 'hospital' || f.level !== 'warehouse');
      setFacilities(hospitalList);

      // Initialize default primary, secondary, and supporting hospitals in initiate form
      const stateHospitals = user?.state_id
        ? hospitalList.filter((f: any) => f.stateId === user.state_id)
        : hospitalList;
      const pool = stateHospitals.length >= 2 ? stateHospitals : hospitalList;
      const defaultPrimary = user?.facility_id || pool[0]?.id || '';
      const defaultSecondary = pool.find((f: any) => f.id !== defaultPrimary)?.id || '';
      const defaultSupporting = pool
        .filter((f: any) => f.id !== defaultPrimary && f.id !== defaultSecondary)
        .slice(0, 2)
        .map((f: any) => f.id);

      setInitForm((prev) => ({
        ...prev,
        primary_facility_id: prev.primary_facility_id || defaultPrimary,
        secondary_facility_id: prev.secondary_facility_id || defaultSecondary,
        supporting_facility_ids:
          prev.supporting_facility_ids.length > 0 ? prev.supporting_facility_ids : defaultSupporting,
      }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    fetchMedicines();
    fetchFacilities();
  }, [user, nationalFilter, regionalScope]);

  // Helper to toggle a supporting hospital checkbox
  const toggleSupportingHospital = (
    facilityId: string,
    isInitModal: boolean
  ) => {
    if (isInitModal) {
      setInitForm((prev) => {
        const exists = prev.supporting_facility_ids.includes(facilityId);
        return {
          ...prev,
          supporting_facility_ids: exists
            ? prev.supporting_facility_ids.filter((id) => id !== facilityId)
            : [...prev.supporting_facility_ids, facilityId],
        };
      });
    } else {
      setHospitalsForm((prev) => {
        const exists = prev.supporting_facility_ids.includes(facilityId);
        return {
          ...prev,
          supporting_facility_ids: exists
            ? prev.supporting_facility_ids.filter((id) => id !== facilityId)
            : [...prev.supporting_facility_ids, facilityId],
        };
      });
    }
  };

  // Step 1: Initiate
  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initForm.primary_facility_id) {
      alert('Please select a Primary Hospital to lead this emergency.');
      return;
    }
    if (!initForm.secondary_facility_id) {
      alert('Please select a Secondary Hospital for backup and triage overflow.');
      return;
    }
    try {
      const res = await API.post('/emergencies/initiate', {
        ...initForm,
        state_id: user?.state_id,
        facility_id: initForm.primary_facility_id,
      });
      setInitiatedEmergency(res.data);
      setShowInitiateModal(false);
      setShowConfirmModal(true); // Open Step 2 verification modal immediately
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to initiate emergency');
    }
  };

  // Step 2: Confirm
  const handleConfirmActivation = async () => {
    if (!initiatedEmergency) return;
    try {
      await API.post(`/emergencies/${initiatedEmergency.id}/confirm`);
      setShowConfirmModal(false);
      setInitiatedEmergency(null);
      fetchEmergencies();
      fetchEmergencyDetail(initiatedEmergency.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to confirm emergency activation');
    }
  };

  // Save updated Primary, Secondary, and Supporting hospitals
  const handleUpdateHospitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmergency) return;
    try {
      await API.put(`/emergencies/${selectedEmergency.id}/hospitals`, hospitalsForm);
      setShowHospitalsModal(false);
      fetchEmergencyDetail(selectedEmergency.id);
      fetchEmergencies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update designated hospitals');
    }
  };

  // Update casualty load
  const handleUpdateLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmergency) return;
    try {
      await API.put(`/emergencies/${selectedEmergency.id}/load`, casualtyForm);
      setShowLoadModal(false);
      fetchEmergencyDetail(selectedEmergency.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update load');
    }
  };

  // Post Requirement with clean isolation of resource types!
  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmergency) return;
    try {
      const payload: any = {
        resource_type: reqForm.resource_type,
        quantity_required: Number(reqForm.quantity_required),
        priority: reqForm.priority,
      };

      if (reqForm.resource_type === 'medicine') {
        payload.medicine_id = reqForm.medicine_id || medicines[0]?.id;
        const med = medicines.find((m) => m.id === payload.medicine_id);
        payload.description = reqForm.description || med?.name || 'Emergency Medicine';
      } else if (reqForm.resource_type === 'ambulance') {
        payload.medicine_id = null; // STRICTLY NULL
        payload.description = reqForm.ambulance_sub_type || reqForm.description || 'ALS Ambulance';
      } else if (reqForm.resource_type === 'staff') {
        payload.medicine_id = null; // STRICTLY NULL
        payload.description = reqForm.staff_specialty || reqForm.description || 'Trauma Surgeon Team';
      } else if (reqForm.resource_type === 'blood') {
        payload.medicine_id = null; // STRICTLY NULL
        payload.blood_group = reqForm.blood_group;
        payload.blood_component = reqForm.blood_component;
        payload.description = `${reqForm.blood_group} ${reqForm.blood_component
          ?.replace('_', ' ')
          .toUpperCase()} Blood Units`;
      }

      await API.post(`/emergencies/${selectedEmergency.id}/requirements`, payload);
      setShowReqModal(false);
      fetchEmergencyDetail(selectedEmergency.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add requirement');
    }
  };

  // Submit Resource Offer (from External Donor Hospital)
  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      await API.post(`/emergencies/requirements/${selectedReq.id}/offer`, {
        quantity_offered: Number(offerQty),
        deployment_time_minutes: 20,
      });
      setShowOfferModal(false);
      fetchEmergencyDetail(selectedEmergency.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Offer rejected. Check safe transferable quota.');
    }
  };

  // Accept & Reserve Offer (ONLY Authorized Designated Hospitals)
  const handleAcceptOffer = async (offerId: string) => {
    try {
      await API.post(`/emergencies/offers/${offerId}/accept`, {});
      fetchEmergencyDetail(selectedEmergency.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to accept offer');
    }
  };

  // Dispatch Movement (Donor Hospital or Coordinator)
  const handleDispatchOffer = async (offerId: string) => {
    try {
      await API.post(`/emergencies/offers/${offerId}/dispatch`, {});
      fetchEmergencyDetail(selectedEmergency.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to dispatch resources');
    }
  };

  // Confirm & Receive Requested Supplies (STRICTLY ONLY Primary, Secondary, and Supporting Hospitals)
  const handleConfirmAndReceive = async (offerId: string) => {
    try {
      await API.post(`/emergencies/offers/${offerId}/receive`, {});
      fetchEmergencyDetail(selectedEmergency.id);
      fetchEmergencies();
    } catch (err: any) {
      alert(
        err.response?.data?.error ||
          'Unauthorized: Only designated Primary, Secondary, or Supporting hospitals can Confirm & Receive.'
      );
    }
  };

  // Close Emergency
  const handleCloseEmergency = async (id: string) => {
    if (
      !confirm(
        'Are you certain you wish to close this emergency incident? All reserved ambulances and personnel will be returned to pool.'
      )
    ) {
      return;
    }
    try {
      await API.post(`/emergencies/${id}/close`);
      fetchEmergencies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to close emergency');
    }
  };

  // Helper to format requirement headings cleanly
  const getRequirementDisplay = (req: any) => {
    if (req.resourceType === 'ambulance') {
      return {
        icon: '🚑',
        title: req.description || 'Ambulance Units',
        badge: 'Fleet Transport',
        unitLabel: 'Vehicles',
      };
    }
    if (req.resourceType === 'staff') {
      return {
        icon: '👨‍⚕️',
        title: req.description || 'Medical Specialist Personnel',
        badge: 'Medical Specialists',
        unitLabel: 'Personnel',
      };
    }
    if (req.resourceType === 'blood') {
      return {
        icon: '🩸',
        title: `${req.bloodGroup || 'O-'} ${
          req.bloodComponent?.replace('_', ' ').toUpperCase() || 'Blood Units'
        }`,
        badge: 'Blood Grid',
        unitLabel: 'Units',
      };
    }
    return {
      icon: '💊',
      title: req.medicine?.name || req.description || 'Emergency Medicine',
      badge: 'Pharmaceutical',
      unitLabel: req.medicine?.unitType || 'Units',
    };
  };

  // Compute Designated Hospital Hierarchy & Current User's Authorization Status
  const designatedFacilityIds: string[] =
    selectedEmergency?.designated_facility_ids ||
    [
      selectedEmergency?.primary_facility_id || selectedEmergency?.facilityId,
      selectedEmergency?.secondary_facility_id,
      ...(selectedEmergency?.supporting_facility_ids || []),
    ].filter(Boolean);

  // STRICT CHECK: Only Primary, Secondary, and Supporting hospitals are authorized to Confirm & Receive!
  const isAuthorizedReceiver = Boolean(
    user?.facility_id && designatedFacilityIds.includes(user.facility_id)
  );

  const userDesignationBadge = !user?.facility_id
    ? null
    : (selectedEmergency?.primary_facility_id || selectedEmergency?.facilityId) === user.facility_id
    ? 'PRIMARY RESPONSE HOSPITAL'
    : selectedEmergency?.secondary_facility_id === user.facility_id
    ? 'SECONDARY RESPONSE HOSPITAL'
    : (selectedEmergency?.supporting_facility_ids || []).includes(user.facility_id)
    ? 'SUPPORTING RESPONSE HOSPITAL'
    : null;

  const totalCasualtiesAcrossIncidents = emergencies.reduce(
    (sum, e) => sum + (Number(e.estimated_casualties ?? e.estimatedCasualties) || 0),
    0
  );
  const crossBorderCount = emergencies.filter((e) => e.is_cross_border_aid).length;

  return (
    <div className="space-y-5">
      {/* ──────────────────────────────────────────────────────────────────────
          TOP COMMAND HERO: BHISSM IDENTITY + HIGH-VISIBILITY EMERGENCY SIREN
          ────────────────────────────────────────────────────────────────────── */}
      <div className="card p-5 bg-gradient-to-r from-[#FFF5F5] via-[#FFF9F1] to-[#FDF3E7] border-2 border-red-400 shadow-md emergency-banner-glow space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            {/* Large High-Visibility Emergency Siren & Radar Beacon */}
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-900 text-white shadow-lg border-2 border-red-200 shrink-0 emergency-beacon-core">
              <span className="absolute -inset-1 rounded-2xl bg-red-500 animate-ping opacity-40"></span>
              <div className="relative z-10 flex flex-col items-center justify-center leading-none">
                <Siren className="w-7 h-7 text-white drop-shadow" />
                <span className="text-[8px] font-mono font-black tracking-widest text-red-100 mt-0.5">
                  SOS
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {/* Dual Alternating Emergency Strobe Pill */}
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-700 text-white text-[11px] font-mono font-black uppercase tracking-wider shadow-xs border border-red-400">
                  <span className="w-2.5 h-2.5 rounded-full siren-light-left"></span>
                  <span className="w-2.5 h-2.5 rounded-full siren-light-right"></span>
                  <span>CODE RED • EMERGENCY COMMAND ACTIVE</span>
                </span>

                <span className="text-[11px] bg-[#2D2926] text-[#FFF9F1] px-2.5 py-0.5 rounded font-mono font-bold tracking-wider border border-[#D4C8BC]">
                  BHISSM DISASTER GRID
                </span>

                <span className="text-[11px] bg-red-100 text-red-900 border border-red-300 px-2.5 py-0.5 rounded font-mono font-bold">
                  1° PRIMARY • 2° SECONDARY • 3° SUPPORTING
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-bhissm-dark tracking-tight">
                Emergency Operations &amp; Cross-State Mutual Aid Command
              </h1>
              <p className="text-xs text-bhissm-secondary">
                Two-step disaster mobilization, adjacent border-district mutual aid corridors, and strict Confirm &amp; Receive hospital authorization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={fetchEmergencies}
              className="btn-outline flex items-center gap-1.5 text-xs font-mono font-bold py-2.5 px-3 bg-white"
              title="Refresh Live Telemetry"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>
            <button
              onClick={() => setShowInitiateModal(true)}
              className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-800 hover:to-red-700 text-white px-4 py-2.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 shadow-md border border-red-300 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Step 1: Declare Emergency</span>
            </button>
          </div>
        </div>

        {/* Fast Situational Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-red-200/80">
          <div className="bg-white/90 border border-red-200 rounded-lg px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-red-800 font-bold">
                Active Incidents
              </div>
              <div className="text-lg font-black text-red-950 font-mono leading-tight">
                {emergencies.length}
              </div>
            </div>
            <Siren className="w-5 h-5 text-red-600 animate-bounce" />
          </div>

          <div className="bg-white/90 border border-amber-200 rounded-lg px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-amber-900 font-bold">
                Total Casualties
              </div>
              <div className="text-lg font-black text-amber-950 font-mono leading-tight">
                {totalCasualtiesAcrossIncidents.toLocaleString()}
              </div>
            </div>
            <Activity className="w-5 h-5 text-amber-700" />
          </div>

          <div className="bg-white/90 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-blue-900 font-bold">
                Adjacent State Corridors
              </div>
              <div className="text-lg font-black text-blue-950 font-mono leading-tight">
                {crossBorderCount > 0 ? `${crossBorderCount} Linked` : 'PY ↔ TN Ready'}
              </div>
            </div>
            <Globe className="w-5 h-5 text-blue-700" />
          </div>

          <div className="bg-white/90 border border-emerald-200 rounded-lg px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-emerald-900 font-bold">
                Receipt Authority
              </div>
              <div className="text-xs font-black text-emerald-950 font-mono leading-tight mt-0.5 truncate max-w-[145px]">
                {isAuthorizedReceiver ? userDesignationBadge?.replace(' RESPONSE HOSPITAL', '') : 'DONOR / MONITOR'}
              </div>
            </div>
            {isAuthorizedReceiver ? (
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          MAIN 12-COLUMN COMMAND WORKSPACE:
          Left (4 cols): Incident Queue & Scope Filter
          Right (8 cols): Active Incident Console
          ────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Incident Selector Queue (4 cols) */}
        <div className="lg:col-span-4 card p-4 space-y-3.5 border-2 border-bhissm-border">
          <div className="space-y-2.5 border-b border-bhissm-border pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
                <h2 className="text-xs font-black uppercase tracking-wider text-bhissm-dark font-mono">
                  Live Incident Queue ({emergencies.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-red-100 text-red-900 px-2 py-0.5 rounded font-bold border border-red-200">
                REAL-TIME
              </span>
            </div>

            {/* Scope Filter Controls */}
            {user?.role === 'national' ? (
              <div className="grid grid-cols-2 bg-[#F8F1E7] p-1 rounded-lg border border-bhissm-border text-[11px] font-mono font-bold gap-1">
                <button
                  onClick={() => setNationalFilter('disasters_only')}
                  className={`py-1.5 px-2 rounded-md transition-all text-center cursor-pointer ${
                    nationalFilter === 'disasters_only'
                      ? 'bg-red-700 text-white shadow-xs'
                      : 'text-bhissm-secondary hover:text-bhissm-dark'
                  }`}
                >
                  Natl Disasters (&gt;500)
                </button>
                <button
                  onClick={() => setNationalFilter('all')}
                  className={`py-1.5 px-2 rounded-md transition-all text-center cursor-pointer ${
                    nationalFilter === 'all'
                      ? 'bg-[#2D2926] text-white shadow-xs'
                      : 'text-bhissm-secondary hover:text-bhissm-dark'
                  }`}
                >
                  All Regional Incidents
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-bhissm-secondary font-bold uppercase tracking-wide flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-800" />
                  <span>Jurisdiction &amp; Adjacent District Scope:</span>
                </div>
                <div className="grid grid-cols-3 bg-[#F8F1E7] p-1 rounded-lg border border-bhissm-border text-[10px] font-mono font-bold gap-1">
                  <button
                    onClick={() => setRegionalScope('adjacent_corridor')}
                    className={`py-1.5 px-1.5 rounded-md transition-all text-center cursor-pointer leading-tight ${
                      regionalScope === 'adjacent_corridor'
                        ? 'bg-red-700 text-white shadow-xs'
                        : 'text-bhissm-secondary hover:text-bhissm-dark'
                    }`}
                  >
                    State + Adjacent
                  </button>
                  <button
                    onClick={() => setRegionalScope('local_state')}
                    className={`py-1.5 px-1.5 rounded-md transition-all text-center cursor-pointer leading-tight ${
                      regionalScope === 'local_state'
                        ? 'bg-[#2D2926] text-white shadow-xs'
                        : 'text-bhissm-secondary hover:text-bhissm-dark'
                    }`}
                  >
                    My State Only
                  </button>
                  <button
                    onClick={() => setRegionalScope('all_india')}
                    className={`py-1.5 px-1.5 rounded-md transition-all text-center cursor-pointer leading-tight ${
                      regionalScope === 'all_india'
                        ? 'bg-[#2D2926] text-white shadow-xs'
                        : 'text-bhissm-secondary hover:text-bhissm-dark'
                    }`}
                  >
                    All India
                  </button>
                </div>
              </div>
            )}
          </div>

          {emergencies.length === 0 ? (
            <div className="text-center py-10 px-3 text-xs text-bhissm-secondary font-mono bg-[#F8F1E7]/50 rounded-lg border border-bhissm-border">
              {user?.role === 'national' && nationalFilter === 'disasters_only'
                ? 'No active national-scale disasters (>500 casualties). Switch to All Regional Incidents to inspect state-level events.'
                : 'No active emergency operations in this filter. Click "Step 1: Declare Emergency" above to initiate.'}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[760px] overflow-y-auto pr-1">
              {emergencies.map((e) => {
                const casualties = e.estimated_casualties ?? e.estimatedCasualties ?? 0;
                const isNatDisaster = casualties >= 500;
                const isCrossBorder = Boolean(e.is_cross_border_aid);
                const isSelected = selectedEmergency?.id === e.id;

                return (
                  <div
                    key={e.id}
                    onClick={() => fetchEmergencyDetail(e.id)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-red-50 via-[#FFF9F1] to-red-50/40 border-red-600 shadow-md'
                        : isNatDisaster
                        ? 'bg-red-50/40 border-red-300 hover:border-red-500'
                        : 'bg-white border-bhissm-border hover:border-red-300 hover:bg-[#FDF9F3]'
                    }`}
                  >
                    {/* Card Top Status Row */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold ${
                          isNatDisaster
                            ? 'bg-red-700 text-white'
                            : isCrossBorder
                            ? 'bg-blue-700 text-white'
                            : e.status === 'active'
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        <Siren className="w-3 h-3 shrink-0" />
                        <span>
                          {isNatDisaster
                            ? 'NATL DISASTER'
                            : isCrossBorder
                            ? 'ADJACENT STATE AID'
                            : e.status === 'active'
                            ? 'CODE RED ACTIVE'
                            : 'INITIATED (STEP 1)'}
                        </span>
                      </span>

                      <span className="text-[11px] font-mono font-black text-red-800 bg-red-100 border border-red-200 px-2 py-0.5 rounded">
                        {casualties} Casualties
                      </span>
                    </div>

                    {/* Incident Title & Location */}
                    <div className="font-extrabold text-sm text-bhissm-dark leading-snug">
                      {e.title}
                    </div>
                    <div className="text-[11px] text-bhissm-secondary mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-700 shrink-0" />
                      <span className="truncate">{e.location}</span>
                    </div>

                    {/* Designated 1° and 2° Hospitals */}
                    <div className="mt-2.5 text-[10px] font-mono text-bhissm-dark space-y-1 bg-[#F8F1E7]/80 p-2 rounded-lg border border-bhissm-border/70">
                      <div className="truncate flex items-center gap-1">
                        <span className="font-bold text-red-800 shrink-0">1° Primary:</span>
                        <span className="truncate font-semibold">
                          {e.primary_facility_name || e.facility_name || 'Assigned'}
                        </span>
                      </div>
                      {e.secondary_facility_name && (
                        <div className="truncate flex items-center gap-1">
                          <span className="font-bold text-amber-900 shrink-0">2° Backup:</span>
                          <span className="truncate">{e.secondary_facility_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-bhissm-secondary mt-2 pt-1.5 border-t border-bhissm-border/40">
                      <span className="font-bold text-bhissm-dark">
                        {e.state_name || 'Active Zone'}
                      </span>
                      {isCrossBorder ? (
                        <span className="text-blue-800 font-bold">↔ Cross-Border Aid</span>
                      ) : (
                        <span className="uppercase">{e.severity} severity</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Active Incident Command Console (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedEmergency ? (
            <div className="card p-5 space-y-5 border-2 border-bhissm-border shadow-sm">
              {/* 1. INCIDENT HEADER & COMMAND CONTROLS */}
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 border-b-2 border-bhissm-border pb-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-0.5 rounded-md font-mono font-bold text-[11px] uppercase shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                      <Siren className="w-3.5 h-3.5" />
                      <span>{selectedEmergency.severity} EMERGENCY</span>
                    </span>

                    {(selectedEmergency.estimated_casualties ??
                      selectedEmergency.estimatedCasualties) >= 500 && (
                      <span className="bg-red-900 text-white px-2.5 py-0.5 rounded-md font-mono font-bold text-[10px] tracking-wide">
                        NATIONAL DISASTER (&gt;500 CASUALTIES)
                      </span>
                    )}

                    {selectedEmergency.is_cross_border_aid && (
                      <span className="bg-blue-700 text-white px-2.5 py-0.5 rounded-md font-mono font-bold text-[10px] tracking-wide">
                        🤝 ADJACENT STATE MUTUAL AID
                      </span>
                    )}

                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F8F1E7] border border-bhissm-border text-bhissm-dark uppercase">
                      STATUS: {selectedEmergency.status}
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-bhissm-dark leading-snug">
                    {selectedEmergency.title}
                  </h2>

                  <div className="text-xs text-bhissm-secondary flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1 font-semibold text-bhissm-dark">
                      <MapPin className="w-3.5 h-3.5 text-red-700" />
                      {selectedEmergency.location} ({selectedEmergency.state_name})
                    </span>
                    <span>•</span>
                    <span>
                      Activated by{' '}
                      <strong className="text-bhissm-dark">
                        {selectedEmergency.activated_by_name || 'Medical Director'}
                      </strong>
                    </span>
                  </div>

                  {selectedEmergency.description && (
                    <p className="text-xs text-bhissm-dark mt-1.5 bg-[#F8F1E7]/70 p-2.5 rounded-lg border border-bhissm-border/70 leading-relaxed">
                      {selectedEmergency.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowHospitalsModal(true)}
                    className="btn-outline text-xs flex items-center gap-1.5 font-mono font-bold bg-white"
                  >
                    <Settings className="w-3.5 h-3.5" /> Assign Hospitals
                  </button>
                  <button
                    onClick={() => setShowLoadModal(true)}
                    className="btn-outline text-xs flex items-center gap-1.5 font-mono font-bold bg-white"
                  >
                    <Activity className="w-3.5 h-3.5" /> Update Triage
                  </button>
                  {selectedEmergency.status === 'active' && (
                    <button
                      onClick={() => handleCloseEmergency(selectedEmergency.id)}
                      className="btn-danger text-xs font-mono font-bold"
                    >
                      Close Incident
                    </button>
                  )}
                </div>
              </div>

              {/* 2. CASUALTY TRIAGE LIVE DISTRIBUTION MATRIX (Top Situational Bar) */}
              <div className="p-3.5 bg-[#F8F1E7]/80 rounded-xl border border-bhissm-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-bhissm-dark uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-red-700" />
                    Casualty Triage Distribution Matrix
                  </span>
                  <span className="text-xs font-mono font-bold bg-white px-2.5 py-0.5 rounded border border-bhissm-border text-red-900">
                    Estimated Total Casualties:{' '}
                    {selectedEmergency.estimated_casualties ?? selectedEmergency.estimatedCasualties}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs font-mono">
                  <div className="bg-red-100/90 border-2 border-red-300 p-2.5 rounded-lg">
                    <div className="text-[10px] uppercase font-bold text-red-900">Critical (Red)</div>
                    <div className="text-lg font-black text-red-950 mt-0.5">
                      {selectedEmergency.loadCritical || 0}
                    </div>
                  </div>
                  <div className="bg-amber-100/90 border-2 border-amber-300 p-2.5 rounded-lg">
                    <div className="text-[10px] uppercase font-bold text-amber-900">
                      Serious (Yellow)
                    </div>
                    <div className="text-lg font-black text-amber-950 mt-0.5">
                      {selectedEmergency.loadSerious || 0}
                    </div>
                  </div>
                  <div className="bg-emerald-100/90 border-2 border-emerald-300 p-2.5 rounded-lg">
                    <div className="text-[10px] uppercase font-bold text-emerald-900">
                      Minor (Green)
                    </div>
                    <div className="text-lg font-black text-emerald-950 mt-0.5">
                      {selectedEmergency.loadMinor || 0}
                    </div>
                  </div>
                  <div className="bg-gray-100 border-2 border-gray-300 p-2.5 rounded-lg">
                    <div className="text-[10px] uppercase font-bold text-gray-800">
                      Deceased (Black)
                    </div>
                    <div className="text-lg font-black text-gray-950 mt-0.5">
                      {selectedEmergency.loadDeceased || 0}
                    </div>
                  </div>
                  <div className="bg-blue-50 border-2 border-blue-300 p-2.5 rounded-lg col-span-2 sm:col-span-1">
                    <div className="text-[10px] uppercase font-bold text-blue-900">Unassessed</div>
                    <div className="text-lg font-black text-blue-950 mt-0.5">
                      {selectedEmergency.loadUnassessed || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. REFINED & PROPERLY ALIGNED INTER-STATE & ADJACENT DISTRICT MUTUAL AID CORRIDOR */}
              <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-50/90 via-[#F5F9FF] to-indigo-50/80 p-4 shadow-2xs space-y-3">
                {/* Top Header Row: Left Icon + Title, Right Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/90 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-mono font-black text-xs sm:text-sm uppercase tracking-wide text-blue-950 leading-tight">
                        Inter-State &amp; Adjacent District Mutual Aid Corridor Active
                      </h3>
                      <p className="text-[11px] text-blue-900/80 font-medium">
                        Cross-border emergency visibility &amp; rapid resource sharing across neighbouring state districts
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-blue-700 text-white shrink-0 w-fit">
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>CORRIDOR LINKED</span>
                  </span>
                </div>

                {/* Middle Row: Full-Width Clean Description */}
                <div className="text-xs text-blue-950 leading-relaxed bg-white/80 px-3 py-2 rounded-lg border border-blue-200/80">
                  {selectedEmergency.adjacent_corridor_note ||
                    'Adjacent border districts across neighbouring states are automatically linked to assist with ambulances, medicines, blood units, and trauma specialists.'}
                </div>

                {/* Bottom Row: Uniformly Aligned Helper District Chips */}
                {Array.isArray(selectedEmergency.adjacent_districts_notified) &&
                  selectedEmergency.adjacent_districts_notified.length > 0 && (
                    <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-900 shrink-0">
                        Notified Adjacent Districts:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                        {selectedEmergency.adjacent_districts_notified.map((dist: string) => (
                          <div
                            key={dist}
                            className="flex items-center gap-1.5 text-[11px] font-mono bg-white text-blue-950 border border-blue-300 px-2.5 py-1.5 rounded-lg font-semibold shadow-2xs"
                          >
                            <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span className="truncate" title={dist}>
                              {dist}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* 4. DESIGNATED DISASTER RESPONSE HOSPITALS (Primary, Secondary, Supporting) */}
              <div className="p-4 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50/60 via-[#FDF9F3] to-amber-50/40 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-red-800" />
                    <span className="text-xs font-mono font-black uppercase tracking-wider text-bhissm-dark">
                      Designated Disaster Response Hospital Hierarchy
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    ONLY DESIGNATED HOSPITALS AUTHORIZED TO CONFIRM &amp; RECEIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* 1. Primary Hospital */}
                  <div className="p-3 rounded-lg bg-white border-l-4 border-l-red-600 border border-bhissm-border shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold uppercase text-red-800">
                          1. Primary Hospital (Command)
                        </span>
                        {user?.facility_id &&
                          (selectedEmergency.primary_facility_id || selectedEmergency.facilityId) ===
                            user.facility_id && (
                            <span className="text-[9px] font-mono bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">
                              YOUR HOSPITAL
                            </span>
                          )}
                      </div>
                      <div className="font-bold text-bhissm-dark mt-1.5 leading-snug">
                        {selectedEmergency.primary_facility_name ||
                          selectedEmergency.facility_name ||
                          'Primary Command Hospital'}
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-800 font-mono font-semibold mt-2 pt-1.5 border-t border-gray-100">
                      ✓ Authorized to Confirm &amp; Receive
                    </div>
                  </div>

                  {/* 2. Secondary Hospital */}
                  <div className="p-3 rounded-lg bg-white border-l-4 border-l-amber-600 border border-bhissm-border shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-900">
                          2. Secondary Hospital (Backup)
                        </span>
                        {user?.facility_id &&
                          selectedEmergency.secondary_facility_id === user.facility_id && (
                            <span className="text-[9px] font-mono bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold">
                              YOUR HOSPITAL
                            </span>
                          )}
                      </div>
                      <div className="font-bold text-bhissm-dark mt-1.5 leading-snug">
                        {selectedEmergency.secondary_facility_name || (
                          <span className="text-bhissm-secondary italic font-normal">
                            Not assigned — click Assign Hospitals
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-800 font-mono font-semibold mt-2 pt-1.5 border-t border-gray-100">
                      {selectedEmergency.secondary_facility_name
                        ? '✓ Authorized to Confirm & Receive'
                        : 'Assign backup hospital'}
                    </div>
                  </div>

                  {/* 3. Supporting Hospitals */}
                  <div className="p-3 rounded-lg bg-white border-l-4 border-l-blue-700 border border-bhissm-border shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold uppercase text-blue-900">
                          3. Supporting Hospitals (
                          {selectedEmergency.supporting_facilities?.length || 0})
                        </span>
                        {user?.facility_id &&
                          (selectedEmergency.supporting_facility_ids || []).includes(
                            user.facility_id
                          ) && (
                            <span className="text-[9px] font-mono bg-blue-700 text-white px-1.5 py-0.5 rounded font-bold">
                              YOUR HOSPITAL
                            </span>
                          )}
                      </div>
                      {selectedEmergency.supporting_facilities &&
                      selectedEmergency.supporting_facilities.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {selectedEmergency.supporting_facilities.map((sf: any) => (
                            <span
                              key={sf.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                                sf.id === user?.facility_id
                                  ? 'bg-blue-100 text-blue-950 border-blue-400 font-bold'
                                  : 'bg-gray-50 text-bhissm-dark border-gray-200'
                              }`}
                            >
                              {sf.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-bhissm-secondary italic text-[11px] mt-1.5">
                          No supporting hospitals assigned yet
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-emerald-800 font-mono font-semibold mt-2 pt-1.5 border-t border-gray-100">
                      ✓ Authorized to Confirm &amp; Receive
                    </div>
                  </div>
                </div>

                {/* Current Logged-in User Authorization Status Bar */}
                <div
                  className={`px-3.5 py-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                    isAuthorizedReceiver
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50/90 border-amber-300 text-amber-950'
                  }`}
                >
                  {isAuthorizedReceiver ? (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        <strong>RECEIVING AUTHORIZATION ACTIVE ({userDesignationBadge}):</strong>{' '}
                        Your hospital is designated for this emergency and is authorized to{' '}
                        <strong>Confirm &amp; Receive</strong> incoming medicines, ambulances, blood, and staff.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-800 shrink-0" />
                      <span>
                        <strong>RESTRICTED RECEIPT:</strong> Your account (
                        {user?.facility_name || user?.role?.toUpperCase()}) is not one of the
                        designated Primary, Secondary, or Supporting hospitals for this incident.
                        You may <strong>Offer Mutual Aid</strong>, but only designated hospitals can{' '}
                        <strong>Confirm &amp; Receive</strong>.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. RESOURCE REQUISITIONS & MUTUAL AID FULFILLMENT */}
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bhissm-border pb-2.5">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-bhissm-dark font-mono">
                      Resource Requisitions &amp; Mutual Aid Fulfillment
                    </h3>
                    <p className="text-[11px] text-bhissm-secondary">
                      {isAuthorizedReceiver
                        ? `Your hospital (${userDesignationBadge}) can requisition supplies and Confirm & Receive deliveries below.`
                        : 'Neighbouring and cross-border hospitals can offer surplus stock, ambulances, or specialist teams.'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setReqForm({
                        resource_type: 'medicine',
                        medicine_id: medicines[0]?.id || '',
                        ambulance_sub_type:
                          'ALS Ambulance (Advanced Life Support with Ventilator)',
                        staff_specialty: 'Trauma Surgeon Team',
                        blood_group: 'O-',
                        blood_component: 'packed_rbc',
                        quantity_required: 500,
                        priority: 'critical',
                        description: '',
                      });
                      setShowReqModal(true);
                    }}
                    className="btn-primary text-xs flex items-center gap-1.5 font-mono font-bold shrink-0 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> Requisition Resource
                  </button>
                </div>

                {selectedEmergency.requirements?.length === 0 ? (
                  <div className="text-center py-8 text-xs text-bhissm-secondary font-mono bg-[#F8F1E7]/40 rounded-lg border border-bhissm-border">
                    No resource requisition items filed yet. Click "Requisition Resource" to request medicines, ambulances, blood, or specialists.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEmergency.requirements?.map((req: any) => {
                      const display = getRequirementDisplay(req);
                      const qtyReq = req.quantity_required ?? req.quantityRequired ?? 0;
                      const qtyConf = req.quantity_confirmed ?? req.quantityConfirmed ?? 0;
                      const pct = qtyReq > 0 ? Math.min(100, Math.round((qtyConf / qtyReq) * 100)) : 0;

                      return (
                        <div
                          key={req.id}
                          className="p-3.5 border border-bhissm-border rounded-xl bg-white space-y-3 text-xs shadow-2xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-lg">{display.icon}</span>
                                <span className="font-extrabold text-bhissm-dark text-sm">
                                  {display.title}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8F1E7] border border-bhissm-border text-bhissm-dark font-semibold">
                                  {display.badge}
                                </span>
                              </div>
                              {req.description && req.description !== display.title && (
                                <div className="text-[11px] text-bhissm-secondary mt-0.5">
                                  {req.description}
                                </div>
                              )}
                            </div>

                            <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                              <span
                                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                                  req.status === 'fulfilled'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}
                              >
                                {req.status}
                              </span>
                              <div className="text-xs font-mono font-bold text-bhissm-dark">
                                Confirmed: {qtyConf} / {qtyReq} {display.unitLabel} ({pct}%)
                              </div>
                            </div>
                          </div>

                          {/* Fulfillment Progress Bar */}
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                            <div
                              className={`h-full transition-all duration-300 ${
                                pct >= 100 ? 'bg-emerald-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {/* Incoming Offers submitted for this requirement */}
                          {req.offers && req.offers.length > 0 && (
                            <div className="pt-2 border-t border-gray-100 space-y-2">
                              <div className="text-[10px] font-mono font-bold text-bhissm-secondary uppercase">
                                External Facility Mutual Aid Offers ({req.offers.length}):
                              </div>
                              {req.offers.map((offer: any) => {
                                const offeredQty =
                                  offer.quantity_offered ?? offer.quantityOffered ?? 0;
                                const isDonorOfThisOffer =
                                  user?.facility_id &&
                                  (offer.offering_facility_id || offer.offeringFacilityId) ===
                                    user.facility_id;

                                return (
                                  <div
                                    key={offer.id}
                                    className="p-2.5 bg-[#F8F1E7]/60 rounded-lg border border-bhissm-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
                                  >
                                    <div>
                                      <span className="font-bold text-bhissm-dark">
                                        Donor: {offer.facility?.name || offer.facility_name}
                                      </span>
                                      <span className="text-bhissm-secondary font-mono ml-2">
                                        • Qty: <strong>{offeredQty}</strong> {display.unitLabel} •
                                        Status:{' '}
                                        <span className="uppercase font-bold text-bhissm-dark">
                                          {offer.status}
                                        </span>
                                      </span>
                                    </div>

                                    {/* STRICT AUTHORIZATION CONTROLS */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {offer.status === 'received' ? (
                                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded font-mono font-bold text-[10px] flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3 text-emerald-700" />
                                          CONFIRMED &amp; RECEIVED
                                        </span>
                                      ) : isAuthorizedReceiver ? (
                                        <>
                                          {offer.status === 'offered' && (
                                            <button
                                              onClick={() => handleAcceptOffer(offer.id)}
                                              className="btn-outline text-[10px] py-1 px-2.5 font-mono font-bold bg-white"
                                            >
                                              Reserve Offer
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleConfirmAndReceive(offer.id)}
                                            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] py-1 px-2.5 font-mono font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                          >
                                            <Check className="w-3 h-3" />
                                            Confirm &amp; Receive
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          {isDonorOfThisOffer && offer.status === 'reserved' && (
                                            <button
                                              onClick={() => handleDispatchOffer(offer.id)}
                                              className="btn-danger text-[10px] py-0.5 px-2 font-mono"
                                            >
                                              Dispatch Transit
                                            </button>
                                          )}
                                          <span className="text-[10px] font-mono text-amber-900 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            Only Designated Hospitals Can Confirm &amp; Receive
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Action Footer */}
                          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                            {isAuthorizedReceiver ? (
                              <div className="text-[11px] font-mono text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span>
                                  Your hospital is a designated{' '}
                                  <strong>{userDesignationBadge}</strong> • Authorized to Confirm
                                  &amp; Receive offers above
                                </span>
                              </div>
                            ) : (
                              user?.role === 'hospital' &&
                              req.status !== 'fulfilled' && (
                                <button
                                  onClick={() => {
                                    setSelectedReq(req);
                                    setOfferQty(Math.max(1, Math.min(100, qtyReq - qtyConf)));
                                    setShowOfferModal(true);
                                  }}
                                  className="btn-outline text-[11px] py-1 px-3 flex items-center gap-1.5 font-mono font-bold bg-white hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 cursor-pointer"
                                >
                                  <Send className="w-3 h-3" /> Offer Mutual Aid from Local Stock
                                </button>
                              )
                            )}

                            {qtyConf < qtyReq && (
                              <span className="text-[11px] font-mono text-red-700 font-bold ml-auto">
                                Deficit: {qtyReq - qtyConf} {display.unitLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center py-14 text-bhissm-secondary text-xs font-mono border-2 border-bhissm-border">
              Select an emergency incident from the left queue to view designated response hospitals, triage matrix, and mutual aid corridors.
            </div>
          )}
        </div>
      </div>


      {/* STEP 1: Initiate Modal with Primary, Secondary, and Supporting Hospital Declaration */}
      {showInitiateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card bg-white max-w-2xl w-full p-5 shadow-xl border border-red-400 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-red-100 text-red-900 px-2 py-0.5 rounded font-mono font-bold">
                  STEP 1 OF 2
                </span>
                <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono">
                  Initiate Emergency &amp; Declare Response Hospitals
                </h3>
              </div>
              <button onClick={() => setShowInitiateModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            <form onSubmit={handleInitiate} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Incident Title</label>
                <input
                  type="text"
                  className="input-field"
                  value={initForm.title}
                  placeholder="e.g. Cyclone Fengal Coastal Surge Mass Casualty"
                  onChange={(e) => setInitForm({ ...initForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Disaster Type</label>
                  <select
                    className="select-field"
                    value={initForm.emergency_type}
                    onChange={(e) => setInitForm({ ...initForm, emergency_type: e.target.value })}
                  >
                    <option value="mass_casualty">Mass Casualty (Road/Rail)</option>
                    <option value="natural_disaster">Natural Disaster (Cyclone/Flood)</option>
                    <option value="industrial">Industrial Chemical / Fire</option>
                    <option value="epidemic">Epidemic Outbreak</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Severity Level</label>
                  <select
                    className="select-field"
                    value={initForm.severity}
                    onChange={(e) => setInitForm({ ...initForm, severity: e.target.value })}
                  >
                    <option value="critical">Critical (Tier 1 Code Red)</option>
                    <option value="high">High (Tier 2)</option>
                    <option value="medium">Medium (Tier 3)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Precise Geographic Location</label>
                <input
                  type="text"
                  className="input-field"
                  value={initForm.location}
                  onChange={(e) => setInitForm({ ...initForm, location: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Estimated Casualties</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={initForm.estimated_casualties}
                    onChange={(e) =>
                      setInitForm({ ...initForm, estimated_casualties: Number(e.target.value) })
                    }
                    required
                  />
                  <span className="text-[10px] text-bhissm-secondary">
                    Note: Emergencies with &gt;500 casualties escalate to National Command.
                  </span>
                </div>
                <div>
                  <label className="block font-medium mb-1">Expected Duration (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={initForm.expected_duration_hours}
                    onChange={(e) =>
                      setInitForm({ ...initForm, expected_duration_hours: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              {/* HOSPITAL HIERARCHY DESIGNATION SECTION */}
              <div className="p-3 bg-red-50/50 border border-red-200 rounded space-y-3">
                <div className="text-[11px] font-mono font-bold uppercase text-red-900 flex items-center justify-between">
                  <span>Declare Designated Response Hospitals</span>
                  <span className="text-[10px] text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                    Authorized to Confirm &amp; Receive
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-red-900 mb-1">
                      1. Primary Hospital (Lead Command) *
                    </label>
                    <select
                      className="select-field"
                      value={initForm.primary_facility_id}
                      onChange={(e) =>
                        setInitForm({
                          ...initForm,
                          primary_facility_id: e.target.value,
                          supporting_facility_ids: initForm.supporting_facility_ids.filter(
                            (id) => id !== e.target.value
                          ),
                        })
                      }
                      required
                    >
                      <option value="">-- Select Primary Hospital --</option>
                      {facilities.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.state_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">
                      2. Secondary Hospital (Overflow &amp; Backup) *
                    </label>
                    <select
                      className="select-field"
                      value={initForm.secondary_facility_id}
                      onChange={(e) =>
                        setInitForm({
                          ...initForm,
                          secondary_facility_id: e.target.value,
                          supporting_facility_ids: initForm.supporting_facility_ids.filter(
                            (id) => id !== e.target.value
                          ),
                        })
                      }
                      required
                    >
                      <option value="">-- Select Secondary Hospital --</option>
                      {facilities
                        .filter((f) => f.id !== initForm.primary_facility_id)
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.state_code})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-blue-900 mb-1">
                    3. Supporting Hospitals (Select Auxiliary Receiving Hospitals)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-white border border-bhissm-border rounded">
                    {facilities
                      .filter(
                        (f) =>
                          f.id !== initForm.primary_facility_id &&
                          f.id !== initForm.secondary_facility_id
                      )
                      .map((f) => {
                        const checked = initForm.supporting_facility_ids.includes(f.id);
                        return (
                          <label
                            key={f.id}
                            className={`flex items-center gap-2 p-1.5 rounded cursor-pointer border text-[11px] ${
                              checked
                                ? 'bg-blue-50 border-blue-400 font-bold text-blue-950'
                                : 'border-transparent hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSupportingHospital(f.id, true)}
                            />
                            <span className="truncate">
                              {f.name} ({f.state_code})
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Operational Description</label>
                <textarea
                  className="input-field h-16"
                  value={initForm.description}
                  onChange={(e) => setInitForm({ ...initForm, description: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-bhissm-border">
                <button
                  type="button"
                  onClick={() => setShowInitiateModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-danger text-xs font-bold">
                  Proceed to Step 2 Verification →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: Secondary Confirmation Modal */}
      {showConfirmModal && initiatedEmergency && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-5 shadow-2xl border-2 border-red-600 space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="w-7 h-7 shrink-0 animate-bounce" />
              <div>
                <h3 className="font-bold text-base text-red-950 font-mono">
                  FINAL VERIFICATION REQUIRED (STEP 2)
                </h3>
                <div className="text-[11px] text-red-800 font-mono">PROTOCOL SAFETY CHECK</div>
              </div>
            </div>

            <p className="text-xs text-bhissm-secondary leading-relaxed">
              Confirming this activation will alert all regional hospitals across the jurisdiction,
              lock mutual aid priority channels, and authorize only the designated Primary,
              Secondary, and Supporting hospitals to Confirm &amp; Receive supplies.
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs space-y-1 font-mono">
              <div>
                <strong>Incident:</strong> {initiatedEmergency.title}
              </div>
              <div>
                <strong>Location:</strong> {initiatedEmergency.location}
              </div>
              <div>
                <strong>Casualties:</strong>{' '}
                {initiatedEmergency.estimated_casualties ?? initiatedEmergency.estimatedCasualties}
              </div>
              <div>
                <strong>1° Primary Hospital:</strong>{' '}
                {initiatedEmergency.primary_facility_name || 'Assigned'}
              </div>
              <div>
                <strong>2° Secondary Hospital:</strong>{' '}
                {initiatedEmergency.secondary_facility_name || 'Assigned'}
              </div>
              <div>
                <strong>3° Supporting Hospitals:</strong>{' '}
                {initiatedEmergency.supporting_facilities
                  ?.map((s: any) => s.name)
                  .join(', ') || 'None'}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setInitiatedEmergency(null);
                }}
                className="btn-outline text-xs"
              >
                Cancel Activation
              </button>
              <button
                onClick={handleConfirmActivation}
                className="btn-danger text-xs font-bold px-4 py-2"
              >
                CONFIRM &amp; BROADCAST EMERGENCY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Designated Response Hospitals Modal (Primary, Secondary, Supporting) */}
      {showHospitalsModal && selectedEmergency && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card bg-white max-w-lg w-full p-4 shadow-xl border border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono">
                Assign Primary, Secondary &amp; Supporting Hospitals
              </h3>
              <button onClick={() => setShowHospitalsModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            <p className="text-xs text-bhissm-secondary">
              Only the hospitals designated below (Primary, Secondary, and Supporting) will be
              authorized to <strong>Confirm &amp; Receive</strong> requested medicines, blood,
              ambulances, and specialist teams for this emergency.
            </p>

            <form onSubmit={handleUpdateHospitals} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-red-900 mb-1">
                  1. Primary Hospital (Lead Command Receiver) *
                </label>
                <select
                  className="select-field"
                  value={hospitalsForm.primary_facility_id}
                  onChange={(e) =>
                    setHospitalsForm({
                      ...hospitalsForm,
                      primary_facility_id: e.target.value,
                      supporting_facility_ids: hospitalsForm.supporting_facility_ids.filter(
                        (id) => id !== e.target.value
                      ),
                    })
                  }
                  required
                >
                  <option value="">-- Select Primary Hospital --</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.state_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">
                  2. Secondary Hospital (Backup &amp; Overflow Receiver) *
                </label>
                <select
                  className="select-field"
                  value={hospitalsForm.secondary_facility_id}
                  onChange={(e) =>
                    setHospitalsForm({
                      ...hospitalsForm,
                      secondary_facility_id: e.target.value,
                      supporting_facility_ids: hospitalsForm.supporting_facility_ids.filter(
                        (id) => id !== e.target.value
                      ),
                    })
                  }
                  required
                >
                  <option value="">-- Select Secondary Hospital --</option>
                  {facilities
                    .filter((f) => f.id !== hospitalsForm.primary_facility_id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.state_code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-blue-900 mb-1">
                  3. Supporting Hospitals (Auxiliary Triage &amp; Receiving Hospitals)
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto p-2 bg-[#FDF9F3] border border-bhissm-border rounded">
                  {facilities
                    .filter(
                      (f) =>
                        f.id !== hospitalsForm.primary_facility_id &&
                        f.id !== hospitalsForm.secondary_facility_id
                    )
                    .map((f) => {
                      const checked = hospitalsForm.supporting_facility_ids.includes(f.id);
                      return (
                        <label
                          key={f.id}
                          className={`flex items-center gap-2 p-1.5 rounded cursor-pointer border text-[11px] ${
                            checked
                              ? 'bg-blue-50 border-blue-400 font-bold text-blue-950'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSupportingHospital(f.id, false)}
                          />
                          <span>
                            {f.name} ({f.state_name})
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-bhissm-border">
                <button
                  type="button"
                  onClick={() => setShowHospitalsModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs font-bold">
                  Save Designated Hospitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requisition Modal with Clean Multi-Resource Type Selectors */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-4 shadow-xl border border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono">
                Requisition Resource Item
              </h3>
              <button onClick={() => setShowReqModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            <form onSubmit={handleCreateRequirement} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Resource Category</label>
                <select
                  className="select-field"
                  value={reqForm.resource_type}
                  onChange={(e) => setReqForm({ ...reqForm, resource_type: e.target.value })}
                >
                  <option value="medicine">💊 Medicine / IV Infusions ({medicines.length} Available)</option>
                  <option value="ambulance">🚑 Ambulance Fleet</option>
                  <option value="staff">👨‍⚕️ Medical Specialist Personnel</option>
                  <option value="blood">🩸 Blood Components</option>
                </select>
              </div>

              {/* Specific selector based on resource type */}
              {reqForm.resource_type === 'medicine' && (
                <div>
                  <label className="block font-medium mb-1">
                    Formulation ({medicines.length} Essential Medicines)
                  </label>
                  <select
                    className="select-field"
                    value={reqForm.medicine_id}
                    onChange={(e) => setReqForm({ ...reqForm, medicine_id: e.target.value })}
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.category} ({m.criticality.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {reqForm.resource_type === 'ambulance' && (
                <div>
                  <label className="block font-medium mb-1">Ambulance Category</label>
                  <select
                    className="select-field"
                    value={reqForm.ambulance_sub_type}
                    onChange={(e) => setReqForm({ ...reqForm, ambulance_sub_type: e.target.value })}
                  >
                    <option value="ALS Ambulance (Advanced Life Support with Ventilator)">
                      ALS Ambulance (Advanced Life Support with Ventilator)
                    </option>
                    <option value="BLS Ambulance (Basic Life Support with Oxygen)">
                      BLS Ambulance (Basic Life Support with Oxygen)
                    </option>
                    <option value="Neonatal & Pediatric Critical Care Ambulance">
                      Neonatal &amp; Pediatric Critical Care Ambulance
                    </option>
                    <option value="Multiple Casualty Transport Van">
                      Multiple Casualty Transport Van
                    </option>
                  </select>
                </div>
              )}

              {reqForm.resource_type === 'staff' && (
                <div>
                  <label className="block font-medium mb-1">Medical Specialist Discipline</label>
                  <select
                    className="select-field"
                    value={reqForm.staff_specialty}
                    onChange={(e) => setReqForm({ ...reqForm, staff_specialty: e.target.value })}
                  >
                    <option value="Trauma Surgeon Team">Trauma Surgeon Team</option>
                    <option value="Emergency Medicine Physicians">
                      Emergency Medicine Physicians
                    </option>
                    <option value="Critical Care / ICU Nursing Team">
                      Critical Care / ICU Nursing Team
                    </option>
                    <option value="Anesthesiologist & Intensivists">
                      Anesthesiologist &amp; Intensivists
                    </option>
                    <option value="Disaster Triage Medical Officers">
                      Disaster Triage Medical Officers
                    </option>
                  </select>
                </div>
              )}

              {reqForm.resource_type === 'blood' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium mb-1">Blood Group</label>
                    <select
                      className="select-field"
                      value={reqForm.blood_group}
                      onChange={(e) => setReqForm({ ...reqForm, blood_group: e.target.value })}
                    >
                      {['O-', 'O+', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Component</label>
                    <select
                      className="select-field"
                      value={reqForm.blood_component}
                      onChange={(e) => setReqForm({ ...reqForm, blood_component: e.target.value })}
                    >
                      <option value="packed_rbc">Packed RBC</option>
                      <option value="whole_blood">Whole Blood</option>
                      <option value="platelets">Platelets</option>
                      <option value="plasma">Plasma (FFP)</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium mb-1">
                  Quantity Required (
                  {reqForm.resource_type === 'ambulance'
                    ? 'Vehicles'
                    : reqForm.resource_type === 'staff'
                    ? 'Personnel'
                    : reqForm.resource_type === 'blood'
                    ? 'Units'
                    : 'Units/Bottles'}
                  )
                </label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={reqForm.quantity_required}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, quantity_required: Number(e.target.value) })
                  }
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Clinical Context / Urgency Justification
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Massive burn resuscitation / ICU trauma overflow"
                  value={reqForm.description}
                  onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })}
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
                <button type="submit" className="btn-primary text-xs font-bold">
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-4 shadow-xl border border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono">
                Offer Mutual Aid Stock
              </h3>
              <button onClick={() => setShowOfferModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            <p className="text-xs text-bhissm-secondary">
              Offering resource for: <strong>{getRequirementDisplay(selectedReq).title}</strong>.
              Automated safety stock check will verify that your facility does not breach clinical
              thresholds. Once submitted, only the designated Primary, Secondary, or Supporting
              hospitals can Confirm &amp; Receive.
            </p>

            <form onSubmit={handleSubmitOffer} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Quantity to Offer</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={offerQty}
                  onChange={(e) => setOfferQty(Number(e.target.value))}
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
                  Submit Mutual Aid Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Casualty Load Update Modal */}
      {showLoadModal && selectedEmergency && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-4 shadow-xl border border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono">
                Update Live Casualty Triage Load
              </h3>
              <button onClick={() => setShowLoadModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            <form onSubmit={handleUpdateLoad} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-red-700">Critical (Red)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={casualtyForm.load_critical}
                    onChange={(e) =>
                      setCasualtyForm({ ...casualtyForm, load_critical: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-amber-700">Serious (Yellow)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={casualtyForm.load_serious}
                    onChange={(e) =>
                      setCasualtyForm({ ...casualtyForm, load_serious: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-emerald-700">Minor (Green)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={casualtyForm.load_minor}
                    onChange={(e) =>
                      setCasualtyForm({ ...casualtyForm, load_minor: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Deceased (Black)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={casualtyForm.load_deceased}
                    onChange={(e) =>
                      setCasualtyForm({ ...casualtyForm, load_deceased: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-blue-700">
                  Unassessed / In Triage
                </label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={casualtyForm.load_unassessed}
                  onChange={(e) =>
                    setCasualtyForm({ ...casualtyForm, load_unassessed: Number(e.target.value) })
                  }
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-bhissm-border">
                <button
                  type="button"
                  onClick={() => setShowLoadModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs font-bold">
                  Update Triage Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
