import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../lib/api';
import {
  Boxes,
  Search,
  AlertTriangle,
  PlusCircle,
  X,
  Syringe,
  Pill,
  ArrowUpDown,
  Building2,
  PackagePlus,
  Send,
  ShieldCheck,
  CheckCircle2,
  Layers
} from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [catalogMedicines, setCatalogMedicines] = useState<any[]>([]);
  const [hospitalSummaries, setHospitalSummaries] = useState<any[]>([]);
  const [stateReserveStock, setStateReserveStock] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCriticality, setSelectedCriticality] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [vaccinesOnly, setVaccinesOnly] = useState(false);

  // Modals & Drawers
  const [selectedMedForBatches, setSelectedMedForBatches] = useState<any>(null);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showRedistributeModal, setShowRedistributeModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Form states
  const [consumeForm, setConsumeForm] = useState({
    medicine_id: '',
    quantity: 1,
    batch_id: '',
    notes: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    medicine_id: '',
    quantity: 0,
    reason: '',
    type: 'adjustment',
  });

  // Direct Vendor Purchase (Medicine / Vaccine) Form
  const [vendorEntryType, setVendorEntryType] = useState<'medicine' | 'vaccine'>('medicine');
  const [isCustomMedicine, setIsCustomMedicine] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    facility_id: '',
    medicine_id: '',
    custom_medicine_name: '',
    generic_name: '',
    category: 'Antibiotic',
    dosage_form: 'Tablet',
    unit_type: 'tablet',
    criticality: 'high',
    cold_chain: false,
    quantity: 500,
    batch_number: '',
    expiry_date: '2027-06-30',
    vendor_name: '',
    invoice_number: '',
    unit_cost: 12.5,
    storage_location: 'Main Pharmacy Store - Rack A',
    safety_threshold: 150,
  });

  // State Reserve -> Hospital Redistribution Form
  const [redistForm, setRedistForm] = useState({
    target_facility_id: '',
    target_facility_name: '',
    medicine_id: '',
    medicine_name: '',
    quantity: 200,
    priority: 'high',
    remarks: 'State Reserve replenishment to hospital pharmacy',
  });

  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await API.get('/inventory', {
        params: {
          facility_id: selectedFacilityId || undefined,
          category: selectedCategory || undefined,
          criticality: selectedCriticality || undefined,
          low_stock: lowStockOnly ? 'true' : undefined,
          vaccine: vaccinesOnly ? 'true' : undefined,
        },
      });
      setInventory(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogAndStateData = async () => {
    try {
      const medRes = await API.get('/medicines');
      setCatalogMedicines(medRes.data || []);

      if (user?.role === 'state' || user?.role === 'national') {
        const [sumRes, reserveRes] = await Promise.all([
          API.get('/inventory/state-hospital-summary'),
          API.get('/national-reserve/state-stock'),
        ]);
        setHospitalSummaries(sumRes.data?.hospitals || []);
        setStateReserveStock(reserveRes.data || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBatches = async (medicineId?: string, facilityId?: string) => {
    try {
      const res = await API.get('/inventory/batches', {
        params: {
          medicine_id: medicineId,
          facility_id: facilityId || undefined,
        },
      });
      setBatches(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async (medicineId?: string) => {
    try {
      const res = await API.get('/inventory/transactions', {
        params: { medicine_id: medicineId, limit: 30 },
      });
      setTransactions(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCatalogAndStateData();
  }, [user]);

  useEffect(() => {
    fetchInventory();
  }, [selectedFacilityId, selectedCategory, selectedCriticality, lowStockOnly, vaccinesOnly]);

  const handleOpenBatches = (med: any) => {
    setSelectedMedForBatches(med);
    fetchBatches(med.medicine_id, med.facility_id);
  };

  const handleOpenTransactions = (med: any) => {
    setSelectedMedForBatches(med);
    fetchTransactions(med.medicine_id);
    setShowTxModal(true);
  };

  const handleOpenVendorModal = (mode: 'medicine' | 'vaccine') => {
    setFormMsg(null);
    setVendorEntryType(mode);
    setIsCustomMedicine(false);
    const filteredCatalog = catalogMedicines.filter((m) =>
      mode === 'vaccine' ? m.isVaccine === 1 || m.category === 'Vaccine' : m.isVaccine !== 1 && m.category !== 'Vaccine'
    );
    const defaultMed = filteredCatalog[0] || catalogMedicines[0];
    const randLot = `VND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const randPo = `PO/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;

    setVendorForm({
      facility_id: user?.facility_id || selectedFacilityId || hospitalSummaries[0]?.facility_id || '',
      medicine_id: defaultMed?.id || '',
      custom_medicine_name: '',
      generic_name: '',
      category: mode === 'vaccine' ? 'Vaccine' : 'Antibiotic',
      dosage_form: mode === 'vaccine' ? 'Vial' : 'Tablet',
      unit_type: mode === 'vaccine' ? 'vial' : 'tablet',
      criticality: 'high',
      cold_chain: mode === 'vaccine',
      quantity: mode === 'vaccine' ? 200 : 500,
      batch_number: randLot,
      expiry_date: '2027-08-31',
      vendor_name: mode === 'vaccine' ? 'Serum Institute / Bharat Biotech Direct' : 'Cipla / Sun Pharma Authorized Distributor',
      invoice_number: randPo,
      unit_cost: mode === 'vaccine' ? 180 : 14.5,
      storage_location: mode === 'vaccine' ? 'Cold Chain ILR-1 (2°C to 8°C)' : 'Hospital Pharmacy Main Store',
      safety_threshold: mode === 'vaccine' ? 100 : 200,
    });
    setShowVendorModal(true);
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    try {
      const res = await API.post('/inventory/vendor-purchase', {
        facility_id: vendorForm.facility_id || undefined,
        medicine_id: isCustomMedicine ? undefined : vendorForm.medicine_id,
        custom_medicine_name: isCustomMedicine ? vendorForm.custom_medicine_name : undefined,
        generic_name: isCustomMedicine ? vendorForm.generic_name : undefined,
        category: vendorEntryType === 'vaccine' ? 'Vaccine' : vendorForm.category,
        dosage_form: vendorForm.dosage_form,
        unit_type: vendorForm.unit_type,
        criticality: vendorForm.criticality,
        is_vaccine: vendorEntryType === 'vaccine',
        cold_chain: vendorForm.cold_chain || vendorEntryType === 'vaccine',
        quantity: Number(vendorForm.quantity),
        batch_number: vendorForm.batch_number,
        expiry_date: vendorForm.expiry_date,
        vendor_name: vendorForm.vendor_name,
        invoice_number: vendorForm.invoice_number,
        unit_cost: Number(vendorForm.unit_cost),
        storage_location: vendorForm.storage_location,
        safety_threshold: Number(vendorForm.safety_threshold),
      });
      setFormMsg({
        type: 'success',
        text: res.data?.message || 'Direct vendor purchase stock & FEFO batch recorded!',
      });
      setTimeout(() => {
        setShowVendorModal(false);
        setFormMsg(null);
        fetchInventory();
        fetchCatalogAndStateData();
      }, 1100);
    } catch (err: any) {
      setFormMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to record vendor stock entry',
      });
    }
  };

  const handleOpenRedistributeModal = (item?: any) => {
    setFormMsg(null);
    const defaultHospId = item?.facility_id || selectedFacilityId || hospitalSummaries[0]?.facility_id || '';
    const defaultHosp = hospitalSummaries.find((h) => h.facility_id === defaultHospId);
    const defaultMedId = item?.medicine_id || stateReserveStock?.stock?.[0]?.medicine_id || '';
    const defaultMed = stateReserveStock?.stock?.find((s: any) => s.medicine_id === defaultMedId);

    setRedistForm({
      target_facility_id: defaultHospId,
      target_facility_name: item?.facility_name || defaultHosp?.facility_name || '',
      medicine_id: defaultMedId,
      medicine_name: item?.medicine_name || defaultMed?.medicine_name || '',
      quantity: item ? Math.max(100, item.safety_threshold - item.current_stock + 100) : 200,
      priority: item?.current_stock === 0 ? 'Emergency Replenishment' : 'Routine State Allocation',
      remarks: `Allocated from State Reserve Depot to ${item?.facility_name || defaultHosp?.facility_name || 'Hospital'}`,
    });
    setShowRedistributeModal(true);
  };

  const handleRedistributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    try {
      const res = await API.post('/national-reserve/state-redistribute', {
        destination_facility_id: redistForm.target_facility_id,
        target_facility_id: redistForm.target_facility_id,
        medicine_id: redistForm.medicine_id,
        quantity: Number(redistForm.quantity),
        priority: redistForm.priority,
        notes: redistForm.remarks,
        remarks: redistForm.remarks,
      });
      setFormMsg({
        type: 'success',
        text: res.data?.message || 'Medicine allocated from State Reserve to hospital successfully!',
      });
      setTimeout(() => {
        setShowRedistributeModal(false);
        setFormMsg(null);
        fetchInventory();
        fetchCatalogAndStateData();
      }, 1100);
    } catch (err: any) {
      console.error('State redistribute error:', err);
      setFormMsg({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.message || 'Failed to allocate medicine from State Reserve',
      });
    }
  };

  const handleRecordConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    try {
      await API.post('/inventory/consumption', {
        medicine_id: consumeForm.medicine_id,
        quantity: Number(consumeForm.quantity),
        batch_id: consumeForm.batch_id || undefined,
        notes: consumeForm.notes,
      });
      setFormMsg({ type: 'success', text: 'Consumption logged successfully. FEFO batch deducted.' });
      setTimeout(() => {
        setShowConsumptionModal(false);
        setFormMsg(null);
        fetchInventory();
      }, 1000);
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.response?.data?.error || 'Failed to record consumption' });
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    try {
      const facId = user?.facility_id || selectedFacilityId || inventory[0]?.facility_id;
      await API.post('/inventory/adjust', {
        facility_id: facId,
        medicine_id: adjustForm.medicine_id,
        quantity: Number(adjustForm.quantity),
        reason: adjustForm.reason,
        type: adjustForm.type,
      });
      setFormMsg({ type: 'success', text: 'Stock level updated in compliance record.' });
      setTimeout(() => {
        setShowAdjustModal(false);
        setFormMsg(null);
        fetchInventory();
      }, 1000);
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.response?.data?.error || 'Failed to adjust stock' });
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.medicine_name?.toLowerCase().includes(q) ||
      item.generic_name?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.facility_name?.toLowerCase().includes(q)
    );
  });

  const filteredCatalogForVendor = catalogMedicines.filter((m) =>
    vendorEntryType === 'vaccine'
      ? m.isVaccine === 1 || m.category === 'Vaccine'
      : m.isVaccine !== 1 && m.category !== 'Vaccine'
  );

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-bhissm-dark text-white">
              {user?.role === 'state'
                ? 'STATE JURISDICTION HOSPITAL STOCK & VENDOR AUDIT'
                : 'FACILITY PHARMACY, VACCINE COLD-CHAIN & VENDOR ENTRY'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-bhissm-dark flex items-center gap-2 mt-1">
            <Boxes className="w-5 h-5 text-bhissm-dark" />
            {user?.role === 'state'
              ? 'Hospital-Wise Medicine & Vaccine Stock Checking Dashboard'
              : 'Inventory, Direct Vendor Purchase & FEFO Batch Rotation'}
          </h1>
          <p className="text-xs text-bhissm-secondary mt-0.5">
            {user?.role === 'state'
              ? 'Inspect real-time medicine & vaccine stock across every hospital in your state jurisdiction and allocate from State Reserve.'
              : 'Real-time facility stock monitoring with direct vendor purchase entry (Medicines & Vaccines) and FEFO enforcement.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Vendor Stock Entry Buttons for Hospitals & State */}
          {(user?.role === 'hospital' || user?.role === 'state') && (
            <>
              <button
                onClick={() => handleOpenVendorModal('medicine')}
                className="btn-primary text-xs flex items-center gap-1.5 bg-bhissm-dark hover:bg-black text-white font-semibold"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>+ Direct Vendor Purchase (Medicine)</span>
              </button>
              <button
                onClick={() => handleOpenVendorModal('vaccine')}
                className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-sm"
              >
                <Syringe className="w-3.5 h-3.5" />
                <span>+ Manual Vaccine Entry</span>
              </button>
            </>
          )}

          {user?.role === 'state' && (
            <button
              onClick={() => handleOpenRedistributeModal()}
              className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Allocate from State Reserve</span>
            </button>
          )}

          {user?.role === 'hospital' && (
            <>
              <button
                onClick={() => {
                  setConsumeForm({
                    medicine_id: inventory[0]?.medicine_id || '',
                    quantity: 1,
                    batch_id: '',
                    notes: 'Routine OPD dispensation',
                  });
                  setShowConsumptionModal(true);
                }}
                className="btn-outline text-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record Consumption</span>
              </button>
              <button
                onClick={() => {
                  setAdjustForm({
                    medicine_id: inventory[0]?.medicine_id || '',
                    quantity: 100,
                    reason: 'Physical stock verification',
                    type: 'adjustment',
                  });
                  setShowAdjustModal(true);
                }}
                className="btn-outline text-xs flex items-center gap-1.5"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Stock Adjustment</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* STATE LOGIN: HOSPITAL-WISE MEDICINE STOCK CHECKING DASHBOARD */}
      {(user?.role === 'state' || user?.role === 'national') && hospitalSummaries.length > 0 && (
        <div className="card space-y-3 border-2 border-bhissm-dark/20 bg-gradient-to-br from-white to-[#FBF7F0]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-bhissm-border pb-2.5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-bhissm-dark font-mono flex items-center gap-2">
                <Building2 className="w-4 h-4 text-bhissm-dark" />
                Hospital-Wise Medicine & Vaccine Stock Checking Matrix ({hospitalSummaries.length} Hospitals)
              </h2>
              <p className="text-[11px] text-bhissm-secondary">
                Click any hospital card below to inspect its complete medicine & vaccine inventory or dispatch stock from State Reserve.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {stateReserveStock?.depot && (
                <div className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono">
                  <strong>{stateReserveStock.depot.name}:</strong>{' '}
                  {(
                    stateReserveStock.summary?.total_units ??
                    (stateReserveStock.stock || []).reduce(
                      (sum: number, s: any) => sum + (s.current_stock || s.available_to_distribute || 0),
                      0
                    )
                  ).toLocaleString()}{' '}
                  Reserve Units Ready
                </div>
              )}
              {selectedFacilityId && (
                <button
                  onClick={() => setSelectedFacilityId('')}
                  className="btn-outline text-xs py-1 px-2.5 font-mono"
                >
                  Show All Hospitals
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {hospitalSummaries.map((hosp) => {
              const isSelected = selectedFacilityId === hosp.facility_id;
              return (
                <div
                  key={hosp.facility_id}
                  onClick={() =>
                    setSelectedFacilityId(isSelected ? '' : hosp.facility_id)
                  }
                  className={`cursor-pointer rounded-lg p-3 border transition-all ${
                    isSelected
                      ? 'bg-[#FDF6EC] border-2 border-bhissm-dark shadow-md'
                      : 'bg-white border-bhissm-border hover:border-bhissm-dark/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-bhissm-dark leading-snug">
                        {hosp.facility_name}
                      </div>
                      <div className="text-[10px] font-mono text-bhissm-secondary uppercase mt-0.5">
                        {hosp.facility_type} • {hosp.ownership || 'Public'}
                      </div>
                    </div>
                    {hosp.stockout_count > 0 ? (
                      <span className="badge-critical text-[9px] font-mono shrink-0">
                        {hosp.stockout_count} STOCKOUT
                      </span>
                    ) : hosp.low_stock_count > 0 ? (
                      <span className="badge-warning text-[9px] font-mono shrink-0">
                        {hosp.low_stock_count} LOW
                      </span>
                    ) : (
                      <span className="badge-success text-[9px] font-mono shrink-0">
                        ADEQUATE
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-gray-100 text-center font-mono">
                    <div className="bg-[#F8F1E7]/60 rounded p-1">
                      <div className="text-xs font-bold text-bhissm-dark">
                        {hosp.total_medicines}
                      </div>
                      <div className="text-[9px] text-bhissm-secondary">Medicines</div>
                    </div>
                    <div className="bg-emerald-50/70 rounded p-1">
                      <div className="text-xs font-bold text-emerald-800">
                        {hosp.total_vaccines}
                      </div>
                      <div className="text-[9px] text-emerald-700">Vaccines</div>
                    </div>
                    <div className="bg-blue-50/70 rounded p-1">
                      <div className="text-xs font-bold text-blue-900">
                        {hosp.total_stock_units.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-blue-700">Total Units</div>
                    </div>
                  </div>

                  {hosp.critical_deficit_items && hosp.critical_deficit_items.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-red-100">
                      <div className="text-[9px] font-mono uppercase text-red-700 font-bold mb-1">
                        Deficit Formulations:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {hosp.critical_deficit_items.slice(0, 3).map((d: any) => (
                          <span
                            key={d.medicine_id}
                            className="text-[9px] bg-red-50 text-red-800 border border-red-200 px-1.5 py-0.5 rounded font-mono"
                          >
                            {d.medicine_name.split(' ')[0]} ({d.current_stock}/{d.safety_threshold})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-bhissm-secondary absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search medicine by brand, generic name, category, or hospital..."
              className="input-field pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hospital selector for State / National */}
          {user?.role !== 'hospital' && hospitalSummaries.length > 0 && (
            <select
              className="select-field w-auto font-semibold"
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
            >
              <option value="">All Jurisdiction Hospitals ({hospitalSummaries.length})</option>
              {hospitalSummaries.map((h) => (
                <option key={h.facility_id} value={h.facility_id}>
                  {h.facility_name} ({h.low_stock_count} Low)
                </option>
              ))}
            </select>
          )}

          {/* Category filter */}
          <select
            className="select-field w-auto"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories ({inventory.length})</option>
            <option value="Antibiotic">Antibiotic (Azithromycin, Amoxiclav, Meropenem...)</option>
            <option value="Emergency">Emergency / Critical Care</option>
            <option value="IV Fluid">IV Fluids &amp; Plasma Expanders</option>
            <option value="Analgesic">Analgesic &amp; Antipyretic</option>
            <option value="Gastrointestinal">Gastrointestinal</option>
            <option value="Respiratory">Respiratory &amp; Bronchodilators</option>
            <option value="Cardiovascular">Cardiovascular</option>
            <option value="Endocrine">Endocrine / Diabetes</option>
            <option value="Antiviral">Antiviral</option>
            <option value="Antidote">Antidote / Anti-Venom</option>
            <option value="Vaccine">Vaccines</option>
          </select>

          {/* Criticality filter */}
          <select
            className="select-field w-auto"
            value={selectedCriticality}
            onChange={(e) => setSelectedCriticality(e.target.value)}
          >
            <option value="">All Criticalities</option>
            <option value="critical">Critical Tier</option>
            <option value="high">High Tier</option>
            <option value="standard">Standard Tier</option>
          </select>

          {/* Quick Toggles */}
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
              lowStockOnly
                ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                : 'border-bhissm-border text-bhissm-secondary hover:bg-bhissm-pink'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock Only
          </button>

          <button
            onClick={() => setVaccinesOnly(!vaccinesOnly)}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
              vaccinesOnly
                ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                : 'border-bhissm-border text-bhissm-secondary hover:bg-bhissm-pink'
            }`}
          >
            <Syringe className="w-3.5 h-3.5" />
            Vaccines
          </button>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-bhissm-border">
                {user?.role !== 'hospital' && (
                  <th className="table-header">Hospital / Facility</th>
                )}
                <th className="table-header">Medicine &amp; Generic Details</th>
                <th className="table-header">Category &amp; Tier</th>
                <th className="table-header text-right">Current Stock</th>
                <th className="table-header text-right">Safety Threshold</th>
                <th className="table-header text-right">Coverage (Days)</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bhissm-border/40">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td
                    colSpan={user?.role !== 'hospital' ? 8 : 7}
                    className="text-center py-8 text-bhissm-secondary text-xs"
                  >
                    No medicines match the selected filter query.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FDF9F3] transition-colors">
                    {user?.role !== 'hospital' && (
                      <td className="table-cell">
                        <div className="font-semibold text-xs text-bhissm-dark">
                          {item.facility_name}
                        </div>
                        <div className="text-[10px] font-mono text-bhissm-secondary uppercase">
                          {item.facility_type}
                        </div>
                      </td>
                    )}

                    <td className="table-cell">
                      <div className="font-semibold text-bhissm-dark flex items-center gap-1.5">
                        {item.is_vaccine ? (
                          <Syringe className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Pill className="w-3.5 h-3.5 text-bhissm-secondary" />
                        )}
                        <span>{item.medicine_name}</span>
                      </div>
                      <div className="text-[11px] text-bhissm-secondary font-mono">
                        {item.generic_name} • {item.dosage_form} ({item.unit_type})
                      </div>
                    </td>

                    <td className="table-cell">
                      <div className="capitalize text-xs text-bhissm-dark font-medium">
                        {item.category}
                      </div>
                      <span
                        className={`inline-block text-[10px] font-mono uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                          item.criticality === 'critical'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : item.criticality === 'high'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {item.criticality}
                      </span>
                    </td>

                    <td className="table-cell text-right">
                      <div className="font-bold font-mono text-sm text-bhissm-dark">
                        {item.current_stock.toLocaleString()}
                      </div>
                      {item.reserved_stock > 0 && (
                        <div className="text-[10px] text-amber-700 font-mono">
                          {item.reserved_stock} reserved
                        </div>
                      )}
                    </td>

                    <td className="table-cell text-right font-mono text-xs text-bhissm-secondary">
                      {item.safety_threshold.toLocaleString()}
                    </td>

                    <td className="table-cell text-right font-mono text-xs">
                      <span
                        className={`font-semibold ${
                          item.days_of_stock < item.lead_time_days
                            ? 'text-red-700 font-bold'
                            : item.days_of_stock < item.lead_time_days * 1.5
                            ? 'text-amber-700'
                            : 'text-emerald-800'
                        }`}
                      >
                        {item.days_of_stock > 365 ? '365+' : item.days_of_stock}d
                      </span>
                    </td>

                    <td className="table-cell text-center">
                      {item.current_stock <= 0 ? (
                        <span className="badge-critical">STOCKOUT</span>
                      ) : item.is_low_stock ? (
                        <span className="badge-warning">DEFICIT RISK</span>
                      ) : (
                        <span className="badge-success">ADEQUATE</span>
                      )}
                    </td>

                    <td className="table-cell text-right space-x-1 whitespace-nowrap">
                      {user?.role === 'state' && (
                        <button
                          onClick={() => handleOpenRedistributeModal(item)}
                          className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-mono font-semibold"
                          title="Redistribute this medicine from State Reserve to this Hospital"
                        >
                          + Allocate
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenBatches(item)}
                        className="btn-outline text-[11px] py-1 px-2 font-mono"
                        title="View FEFO Batches"
                      >
                        Batches
                      </button>
                      <button
                        onClick={() => handleOpenTransactions(item)}
                        className="btn-outline text-[11px] py-1 px-2 font-mono"
                        title="View Audit Transactions"
                      >
                        Logs
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIRECT VENDOR PURCHASE MODAL (MEDICINE & VACCINE MANUAL ENTRY) */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl border-2 border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2.5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                  DIRECT VENDOR PROCUREMENT &amp; FEFO BATCH INWARD ENTRY
                </span>
                <h3 className="font-bold text-base text-bhissm-dark mt-1 flex items-center gap-2">
                  {vendorEntryType === 'vaccine' ? (
                    <Syringe className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <PackagePlus className="w-4 h-4 text-bhissm-dark" />
                  )}
                  {vendorEntryType === 'vaccine'
                    ? 'Manual Vaccine Stock Entry (Direct Vendor / Cold-Chain)'
                    : 'Manual Medicine Stock Entry (Direct Vendor Purchase)'}
                </h3>
              </div>
              <button onClick={() => setShowVendorModal(false)}>
                <X className="w-5 h-5 text-bhissm-secondary hover:text-bhissm-dark" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F8F1E7] rounded border border-bhissm-border text-xs">
              <button
                type="button"
                onClick={() => handleOpenVendorModal('medicine')}
                className={`py-1.5 rounded font-semibold flex items-center justify-center gap-1.5 ${
                  vendorEntryType === 'medicine'
                    ? 'bg-bhissm-dark text-white shadow-sm'
                    : 'text-bhissm-secondary hover:text-bhissm-dark'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                Direct Medicine Purchase
              </button>
              <button
                type="button"
                onClick={() => handleOpenVendorModal('vaccine')}
                className={`py-1.5 rounded font-semibold flex items-center justify-center gap-1.5 ${
                  vendorEntryType === 'vaccine'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-bhissm-secondary hover:text-bhissm-dark'
                }`}
              >
                <Syringe className="w-3.5 h-3.5" />
                Direct Vaccine Cold-Chain Entry
              </button>
            </div>

            {formMsg && (
              <div
                className={`p-3 rounded text-xs font-medium ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleVendorSubmit} className="space-y-3 text-xs">
              {user?.role !== 'hospital' && hospitalSummaries.length > 0 && (
                <div>
                  <label className="block font-semibold mb-1">Target Hospital / Facility</label>
                  <select
                    className="select-field"
                    value={vendorForm.facility_id}
                    onChange={(e) => setVendorForm({ ...vendorForm, facility_id: e.target.value })}
                    required
                  >
                    {hospitalSummaries.map((h) => (
                      <option key={h.facility_id} value={h.facility_id}>
                        {h.facility_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="font-semibold">
                  {vendorEntryType === 'vaccine' ? 'Vaccine Formulation' : 'Medicine Formulation'}
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomMedicine(!isCustomMedicine)}
                  className="text-[11px] font-mono text-blue-700 hover:underline"
                >
                  {isCustomMedicine
                    ? '← Select from Existing Master Catalog'
                    : '+ Enter New Custom Formulation Not in List'}
                </button>
              </div>

              {!isCustomMedicine ? (
                <div>
                  <select
                    className="select-field"
                    value={vendorForm.medicine_id}
                    onChange={(e) => setVendorForm({ ...vendorForm, medicine_id: e.target.value })}
                    required
                  >
                    {filteredCatalogForVendor.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.genericName} ({m.dosageForm})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded bg-[#F8F1E7]/70 border border-bhissm-border">
                  <div>
                    <label className="block font-medium mb-1">Brand / Formulation Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={
                        vendorEntryType === 'vaccine'
                          ? 'e.g. Pneumococcal Conjugate Vaccine 13v'
                          : 'e.g. Piperacillin + Tazobactam 4.5g'
                      }
                      value={vendorForm.custom_medicine_name}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, custom_medicine_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Generic Composition</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Generic salt name"
                      value={vendorForm.generic_name}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, generic_name: e.target.value })
                      }
                    />
                  </div>
                  {vendorEntryType === 'medicine' && (
                    <div>
                      <label className="block font-medium mb-1">Therapeutic Category</label>
                      <select
                        className="select-field"
                        value={vendorForm.category}
                        onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                      >
                        <option value="Antibiotic">Antibiotic</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Analgesic">Analgesic</option>
                        <option value="IV Fluid">IV Fluid</option>
                        <option value="Cardiovascular">Cardiovascular</option>
                        <option value="Respiratory">Respiratory</option>
                        <option value="Gastrointestinal">Gastrointestinal</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block font-medium mb-1">Dosage Form</label>
                    <select
                      className="select-field"
                      value={vendorForm.dosage_form}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, dosage_form: e.target.value })
                      }
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Vial">Vial / Injection</option>
                      <option value="Ampoule">Ampoule</option>
                      <option value="Bottle">Infusion Bottle</option>
                      <option value="Capsule">Capsule</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Vendor / Manufacturer Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Cipla Direct / Serum Institute"
                    value={vendorForm.vendor_name}
                    onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Invoice / Purchase Order (PO) #
                  </label>
                  <input
                    type="text"
                    className="input-field font-mono"
                    placeholder="e.g. INV-2026-849"
                    value={vendorForm.invoice_number}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, invoice_number: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Quantity Purchased *</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field font-mono font-bold"
                    value={vendorForm.quantity}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, quantity: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Batch / Lot Number *</label>
                  <input
                    type="text"
                    className="input-field font-mono"
                    value={vendorForm.batch_number}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, batch_number: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Expiry Date (FEFO) *</label>
                  <input
                    type="date"
                    className="input-field font-mono"
                    value={vendorForm.expiry_date}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, expiry_date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field font-mono"
                    value={vendorForm.unit_cost}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, unit_cost: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Safety Threshold</label>
                  <input
                    type="number"
                    min="10"
                    className="input-field font-mono"
                    value={vendorForm.safety_threshold}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        safety_threshold: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Storage Location / Cold Chain</label>
                  <input
                    type="text"
                    className="input-field"
                    value={vendorForm.storage_location}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, storage_location: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-bhissm-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Record Direct Vendor Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATE RESERVE -> HOSPITAL REDISTRIBUTION MODAL */}
      {showRedistributeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card bg-white max-w-lg w-full p-5 shadow-2xl border-2 border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2.5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                  TIER-2 STATE RESERVE TO HOSPITAL REDISTRIBUTION
                </span>
                <h3 className="font-bold text-base text-bhissm-dark mt-1 flex items-center gap-2">
                  <Send className="w-4 h-4 text-amber-700" />
                  Allocate Medicine from State Reserve Stock
                </h3>
              </div>
              <button onClick={() => setShowRedistributeModal(false)}>
                <X className="w-5 h-5 text-bhissm-secondary hover:text-bhissm-dark" />
              </button>
            </div>

            {formMsg && (
              <div
                className={`p-3 rounded text-xs font-medium ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleRedistributeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Recipient Hospital (Under State Jurisdiction)
                </label>
                <select
                  className="select-field"
                  value={redistForm.target_facility_id}
                  onChange={(e) =>
                    setRedistForm({ ...redistForm, target_facility_id: e.target.value })
                  }
                  required
                >
                  {hospitalSummaries.map((h) => (
                    <option key={h.facility_id} value={h.facility_id}>
                      {h.facility_name} ({h.facility_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Select Medicine / Vaccine from State Reserve Stockpile
                </label>
                <select
                  className="select-field"
                  value={redistForm.medicine_id}
                  onChange={(e) => {
                    const sel = (stateReserveStock?.stock || []).find((s: any) => s.medicine_id === e.target.value);
                    setRedistForm({
                      ...redistForm,
                      medicine_id: e.target.value,
                      medicine_name: sel?.medicine_name || '',
                    });
                  }}
                  required
                >
                  {redistForm.medicine_id && !(stateReserveStock?.stock || []).some((s: any) => s.medicine_id === redistForm.medicine_id) && (
                    <option value={redistForm.medicine_id}>
                      {redistForm.medicine_name || 'Selected Formulation'} (Checking Reserve Stock...)
                    </option>
                  )}
                  {(stateReserveStock?.stock || []).map((s: any) => {
                    const avail = s.available_to_distribute ?? s.state_reserve_stock ?? s.current_stock ?? 0;
                    return (
                      <option key={s.medicine_id} value={s.medicine_id}>
                        {s.medicine_name} — State Reserve Available: {avail.toLocaleString()} {s.unit_type || 'unit'}s
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Quantity to Dispatch</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field font-mono font-bold"
                    value={redistForm.quantity}
                    onChange={(e) =>
                      setRedistForm({ ...redistForm, quantity: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Dispatch Priority</label>
                  <select
                    className="select-field"
                    value={redistForm.priority}
                    onChange={(e) => setRedistForm({ ...redistForm, priority: e.target.value })}
                  >
                    <option value="Routine State Allocation">Routine State Allocation</option>
                    <option value="Emergency Replenishment">Emergency Replenishment</option>
                    <option value="Cold Chain Priority">Cold Chain Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Dispatch Challan / Remarks</label>
                <input
                  type="text"
                  className="input-field"
                  value={redistForm.remarks}
                  onChange={(e) => setRedistForm({ ...redistForm, remarks: e.target.value })}
                />
              </div>

              <div className="pt-3 border-t border-bhissm-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRedistributeModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs font-bold flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Confirm State-to-Hospital Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEFO Batches Modal Drawer */}
      {selectedMedForBatches && !showTxModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card bg-white max-w-2xl w-full max-h-[85vh] flex flex-col p-4 shadow-xl border border-bhissm-dark">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2.5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-bhissm-secondary font-bold">
                  FEFO Batch Expiry Schedule • {selectedMedForBatches.facility_name}
                </span>
                <h3 className="font-bold text-base text-bhissm-dark">
                  {selectedMedForBatches.medicine_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMedForBatches(null)}
                className="p-1 text-bhissm-secondary hover:text-bhissm-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-3 space-y-2">
              <div className="text-xs text-bhissm-secondary">
                Batches automatically ordered by expiration date (Earliest first). Dispensing must strictly follow this sequence:
              </div>

              {batches.length === 0 ? (
                <div className="text-center py-6 text-xs text-bhissm-secondary font-mono">
                  Loading or no active lot numbers found for this facility.
                </div>
              ) : (
                <table className="w-full text-left text-xs border border-bhissm-border">
                  <thead className="bg-[#F8F1E7]">
                    <tr>
                      <th className="p-2 border-b">Batch / Lot #</th>
                      <th className="p-2 border-b">Vendor / Source</th>
                      <th className="p-2 border-b">Expiry Date</th>
                      <th className="p-2 border-b text-right">Units</th>
                      <th className="p-2 border-b text-center">FEFO Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bhissm-border">
                    {batches.map((b, idx) => (
                      <tr
                        key={b.id}
                        className={idx === 0 ? 'bg-amber-50/60 font-semibold' : ''}
                      >
                        <td className="p-2 font-mono">{b.batch_number}</td>
                        <td className="p-2 text-bhissm-secondary">{b.manufacturer || 'TNMSC'}</td>
                        <td className="p-2 font-mono">
                          {new Date(b.expiry_date).toISOString().split('T')[0]}
                          <span className="text-[10px] block text-bhissm-secondary">
                            ({b.days_to_expiry} days remaining)
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono font-bold">
                          {b.quantity.toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          {idx === 0 ? (
                            <span className="badge-critical font-mono">1ST DISPENSE</span>
                          ) : b.expiry_risk === 'expiring_soon' ? (
                            <span className="badge-warning font-mono">EXPIRING</span>
                          ) : (
                            <span className="badge-neutral font-mono">VALID</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t border-bhissm-border pt-2.5 flex justify-end">
              <button
                onClick={() => setSelectedMedForBatches(null)}
                className="btn-primary text-xs"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Logs Modal */}
      {showTxModal && selectedMedForBatches && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card bg-white max-w-2xl w-full max-h-[85vh] flex flex-col p-4 shadow-xl border border-bhissm-dark">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2.5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-bhissm-secondary font-bold">
                  Immutable Transaction Audit Ledger
                </span>
                <h3 className="font-bold text-base text-bhissm-dark">
                  {selectedMedForBatches.medicine_name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowTxModal(false);
                  setSelectedMedForBatches(null);
                }}
                className="p-1 text-bhissm-secondary hover:text-bhissm-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-3">
              {transactions.length === 0 ? (
                <div className="text-center py-6 text-xs text-bhissm-secondary font-mono">
                  No transaction events recorded yet for this facility.
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 border border-bhissm-border rounded text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-bhissm-dark capitalize">
                          {tx.transaction_type.replace('_', ' ')}
                        </div>
                        <div className="text-[11px] text-bhissm-secondary">
                          {tx.notes || 'Routine dispensary record'}
                        </div>
                        <div className="text-[10px] font-mono text-bhissm-secondary/80">
                          {new Date(tx.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-mono font-bold ${
                          tx.quantity < 0 ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-bhissm-border pt-2.5 flex justify-end">
              <button
                onClick={() => {
                  setShowTxModal(false);
                  setSelectedMedForBatches(null);
                }}
                className="btn-primary text-xs"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Consumption Modal */}
      {showConsumptionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-4 shadow-xl border border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono">
                Log Dispensation / Daily Consumption
              </h3>
              <button onClick={() => setShowConsumptionModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            {formMsg && (
              <div
                className={`p-2.5 rounded text-xs ${
                  formMsg.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleRecordConsumption} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Select Formulation</label>
                <select
                  className="select-field"
                  value={consumeForm.medicine_id}
                  onChange={(e) => setConsumeForm({ ...consumeForm, medicine_id: e.target.value })}
                  required
                >
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.medicine_id}>
                      {inv.medicine_name} (Usable: {inv.usable_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Quantity Consumed (Units)</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={consumeForm.quantity}
                  onChange={(e) => setConsumeForm({ ...consumeForm, quantity: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Ward / Dispensing Notes</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., OPD Emergency ward daily run"
                  value={consumeForm.notes}
                  onChange={(e) => setConsumeForm({ ...consumeForm, notes: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConsumptionModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Confirm Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card bg-white max-w-md w-full p-4 shadow-xl border border-bhissm-dark space-y-4">
            <div className="flex items-center justify-between border-b border-bhissm-border pb-2">
              <h3 className="font-bold text-sm text-bhissm-dark uppercase font-mono">
                Log Stock Adjustment / Receipt
              </h3>
              <button onClick={() => setShowAdjustModal(false)}>
                <X className="w-4 h-4 text-bhissm-secondary" />
              </button>
            </div>

            {formMsg && (
              <div
                className={`p-2.5 rounded text-xs ${
                  formMsg.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Select Formulation</label>
                <select
                  className="select-field"
                  value={adjustForm.medicine_id}
                  onChange={(e) => setAdjustForm({ ...adjustForm, medicine_id: e.target.value })}
                  required
                >
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.medicine_id}>
                      {inv.medicine_name} (Current: {inv.current_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Adjustment Type</label>
                <select
                  className="select-field"
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                >
                  <option value="receipt">Stock Receipt (Incoming delivery)</option>
                  <option value="adjustment">Count Correction (Audit variance)</option>
                  <option value="discard">Damage / Expired Discard</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Quantity Delta (Positive to add, Negative to deduct)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Regulatory Reason &amp; Voucher #</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. TNMSC delivery challan #88412"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="btn-outline text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
