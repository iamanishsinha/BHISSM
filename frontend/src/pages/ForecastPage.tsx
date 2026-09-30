import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../lib/api';
import {
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Calculator,
  Layers,
  Calendar,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

export default function ForecastPage() {
  const { user } = useAuth();
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Safe transferable calculator state
  const [calcMedId, setCalcMedId] = useState('');
  const [calcQty, setCalcQty] = useState<number>(500);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Multi-source simulation state
  const [multiMedId, setMultiMedId] = useState('');
  const [multiQty, setMultiQty] = useState<number>(10000);
  const [multiResult, setMultiResult] = useState<any>(null);
  const [multiLoading, setMultiLoading] = useState(false);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/forecast');
      setForecasts(res.data);
      if (res.data.length > 0) {
        setCalcMedId(res.data[0].medicine_id);
        setMultiMedId(res.data[0].medicine_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, [user]);

  const handleRunCalculator = async () => {
    if (!calcMedId) return;
    setCalcLoading(true);
    try {
      const res = await API.get('/forecast/safe-transferable', {
        params: {
          facility_id: user?.facility_id || forecasts[0]?.facility_id,
          medicine_id: calcMedId,
          quantity_requested: calcQty,
        },
      });
      setCalcResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleRunMultiSource = async () => {
    if (!multiMedId) return;
    setMultiLoading(true);
    try {
      const res = await API.post('/forecast/multi-source', {
        medicine_id: multiMedId,
        quantity_required: multiQty,
        requesting_facility_id: user?.facility_id,
      });
      setMultiResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setMultiLoading(false);
    }
  };

  useEffect(() => {
    if (forecasts.length > 0 && calcMedId) {
      handleRunCalculator();
    }
  }, [calcMedId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-bhissm-secondary">
              PREDICTIVE INTELLIGENCE & SAFETY DYNAMICS
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
              WEIGHTED MOVING AVG + SEASONAL FACTOR
            </span>
          </div>
          <h1 className="text-xl font-bold text-bhissm-dark mt-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-bhissm-dark" />
            AI Demand Forecast & Dynamic Safety Stock Engine
          </h1>
          <p className="text-xs text-bhissm-secondary mt-0.5">
            Transparent statistical modeling: predicts stockouts, adjusts for seasonal surges (monsoon/summer), and computes safe transferable quotas.
          </p>
        </div>
      </div>

      {/* Model Transparency Formula Banner */}
      <div className="card bg-[#F4D5DC]/30 border-bhissm-border p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 text-bhissm-dark font-bold font-mono">
          <Sparkles className="w-4 h-4 text-bhissm-accent" />
          MATHEMATICAL AUDIT LOG: DYNAMIC SAFETY STOCK FORMULA
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-white p-2.5 rounded border border-bhissm-border/60">
            <div className="font-bold text-bhissm-dark">1. Protected Stock Formula</div>
            <code className="text-[11px] text-bhissm-secondary block mt-1">
              Protected = (DailyForecast × LeadTime) + (SafetyBuffer 50%) + ActiveReservations
            </code>
          </div>
          <div className="bg-white p-2.5 rounded border border-bhissm-border/60">
            <div className="font-bold text-bhissm-dark">2. Safe Transferable Quota</div>
            <code className="text-[11px] text-bhissm-secondary block mt-1">
              SafeTransferable = Max(0, CurrentStock - ProtectedStock)
            </code>
          </div>
          <div className="bg-white p-2.5 rounded border border-bhissm-border/60">
            <div className="font-bold text-bhissm-dark">3. Donor Protection Invariant</div>
            <code className="text-[11px] text-bhissm-secondary block mt-1">
              No hospital is ever permitted to offer stock exceeding SafeTransferable.
            </code>
          </div>
        </div>
      </div>

      {/* Forecast & Stockout Prediction Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-3 border-b border-bhissm-border bg-[#F8F1E7]/50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-bhissm-dark font-mono">
            Facility Predictive Stockout Horizon (90-Day History Analysis)
          </h2>
          <span className="text-[11px] text-bhissm-secondary font-mono">
            Showing {forecasts.length} Formulations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-bhissm-border bg-bhissm-bg">
                <th className="table-header">Medicine & Tier</th>
                <th className="table-header text-right">Current Stock</th>
                <th className="table-header text-right">Forecast (Daily / Mo)</th>
                <th className="table-header text-right">Lead Time</th>
                <th className="table-header text-right">Days of Stock</th>
                <th className="table-header text-center">Predicted Depletion</th>
                <th className="table-header text-right">Protected Stock</th>
                <th className="table-header text-right">Safe to Transfer</th>
                <th className="table-header text-center">Risk Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bhissm-border/40">
              {forecasts.map((item) => (
                <tr key={item.medicine_id} className="hover:bg-[#FDF9F3]">
                  <td className="table-cell">
                    <div className="font-semibold text-bhissm-dark">{item.medicine_name}</div>
                    <div className="text-[10px] text-bhissm-secondary font-mono capitalize">
                      {item.category} • {item.criticality}
                    </div>
                  </td>

                  <td className="table-cell text-right font-mono font-bold">
                    {item.current_stock.toLocaleString()}
                  </td>

                  <td className="table-cell text-right font-mono">
                    <div>{item.forecast?.daily} /day</div>
                    <div className="text-[10px] text-bhissm-secondary">
                      {item.forecast?.monthly.toLocaleString()} /mo (×{item.forecast?.seasonal_factor} season)
                    </div>
                  </td>

                  <td className="table-cell text-right font-mono">
                    {item.lead_time_days} days
                  </td>

                  <td className="table-cell text-right font-mono font-bold">
                    <span
                      className={`${
                        item.days_of_stock <= item.lead_time_days
                          ? 'text-red-700'
                          : item.days_of_stock <= item.lead_time_days * 1.5
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {item.days_of_stock}d
                    </span>
                  </td>

                  <td className="table-cell text-center font-mono text-[11px]">
                    {item.predicted_stockout_date ? (
                      <span
                        className={`px-1.5 py-0.5 rounded border ${
                          item.days_of_stock <= item.lead_time_days
                            ? 'bg-red-50 text-red-900 border-red-300 font-bold'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {item.predicted_stockout_date}
                      </span>
                    ) : (
                      'Stable'
                    )}
                  </td>

                  <td className="table-cell text-right font-mono text-bhissm-secondary">
                    {item.safety_stock_calculation?.protected_stock?.toLocaleString()}
                  </td>

                  <td className="table-cell text-right font-mono font-bold">
                    {item.safety_stock_calculation?.safe_transferable > 0 ? (
                      <span className="text-emerald-800">
                        +{item.safety_stock_calculation?.safe_transferable?.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-red-700">0 (Locked)</span>
                    )}
                  </td>

                  <td className="table-cell text-center">
                    {item.demand_risk === 'critical' ? (
                      <span className="badge-critical font-mono">CRITICAL LEAD-TIME</span>
                    ) : item.demand_risk === 'high' ? (
                      <span className="badge-warning font-mono">REORDER SURGE</span>
                    ) : (
                      <span className="badge-success font-mono">BUFFER SOUND</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Interactive Modules: Safe Transfer Calculator & Multi-Source Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Safe Transferable Stock Calculator */}
        <div className="card space-y-4">
          <div className="border-b border-bhissm-border pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-bhissm-dark uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-bhissm-dark" />
              Donor Safe Transfer Calculator
            </h2>
            <span className="text-[10px] font-mono text-bhissm-secondary">REAL-TIME CHECK</span>
          </div>

          <p className="text-xs text-bhissm-secondary">
            Simulate whether this hospital facility can approve a transfer request without violating its own clinical safety buffer.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium mb-1">Select Formulation</label>
              <select
                className="select-field"
                value={calcMedId}
                onChange={(e) => setCalcMedId(e.target.value)}
              >
                {forecasts.map((f) => (
                  <option key={f.medicine_id} value={f.medicine_id}>
                    {f.medicine_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Requested Transfer Units</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={calcQty}
                  onChange={(e) => setCalcQty(Number(e.target.value))}
                />
                <button
                  onClick={handleRunCalculator}
                  className="btn-primary text-xs shrink-0"
                  disabled={calcLoading}
                >
                  Verify
                </button>
              </div>
            </div>
          </div>

          {/* Calculator Output Display */}
          {calcResult && (
            <div className="p-3 bg-[#FFF9F1] border border-bhissm-border rounded text-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-bhissm-border/60">
                <span className="font-bold text-bhissm-dark">Verification Outcome:</span>
                {calcResult.can_offer ? (
                  <span className="badge-success flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    TRANSFER SAFE & PERMITTED
                  </span>
                ) : (
                  <span className="badge-critical flex items-center gap-1 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    REJECTED: INSUFFICIENT SAFE QUOTA
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-bhissm-secondary">Current Stock:</span>
                  <div className="font-bold text-bhissm-dark">{calcResult.current_stock?.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-bhissm-secondary">Protected Threshold:</span>
                  <div className="font-bold text-red-800">
                    {calcResult.calculation?.protected_stock?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-bhissm-secondary">Max Transferable:</span>
                  <div className="font-bold text-emerald-800">
                    {calcResult.calculation?.safe_transferable?.toLocaleString()} units
                  </div>
                </div>
                <div>
                  <span className="text-bhissm-secondary">Requested:</span>
                  <div className="font-bold text-bhissm-dark">{calcQty.toLocaleString()} units</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Module 2: Multi-Source Emergency Fulfillment Planner */}
        <div className="card space-y-4">
          <div className="border-b border-bhissm-border pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-bhissm-dark uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-bhissm-dark" />
              Multi-Source Network Fulfillment Planner
            </h2>
            <span className="text-[10px] font-mono text-bhissm-secondary">AGGREGATION</span>
          </div>

          <p className="text-xs text-bhissm-secondary">
            Never assume a single facility can fulfill large emergency requirements. The system automatically aggregates safe surplus quotas from neighboring hospitals (Puducherry, Villupuram, Cuddalore, Chennai).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium mb-1">Deficit Formulation</label>
              <select
                className="select-field"
                value={multiMedId}
                onChange={(e) => setMultiMedId(e.target.value)}
              >
                {forecasts.map((f) => (
                  <option key={f.medicine_id} value={f.medicine_id}>
                    {f.medicine_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Required Bulk Quantity</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="100"
                  step="500"
                  className="input-field"
                  value={multiQty}
                  onChange={(e) => setMultiQty(Number(e.target.value))}
                />
                <button
                  onClick={handleRunMultiSource}
                  className="btn-primary text-xs shrink-0"
                  disabled={multiLoading}
                >
                  Plan Network
                </button>
              </div>
            </div>
          </div>

          {/* Multi-Source Output */}
          {multiResult && (
            <div className="p-3 bg-[#FFF9F1] border border-bhissm-border rounded text-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-bhissm-border/60 font-mono">
                <span className="font-bold text-bhissm-dark">
                  Fulfilled: {multiResult.fulfillment_percentage}% ({multiResult.quantity_planned?.toLocaleString()} / {multiResult.quantity_required?.toLocaleString()})
                </span>
                {multiResult.is_fully_fulfilled ? (
                  <span className="badge-success">FULLY NETWORK COVERED</span>
                ) : (
                  <span className="badge-warning">
                    DEFICIT: {multiResult.shortfall?.toLocaleString()} → REQ NATIONAL RESERVE
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-bhissm-secondary uppercase">
                  Donor Facilities Allocation Matrix:
                </div>
                {multiResult.fulfillment_plan?.map((donor: any) => (
                  <div
                    key={donor.facility_id}
                    className="p-2 border border-bhissm-border/80 rounded bg-white flex justify-between items-center text-[11px]"
                  >
                    <div>
                      <div className="font-bold text-bhissm-dark">{donor.facility_name}</div>
                      <div className="text-[10px] text-bhissm-secondary font-mono">
                        Safe Quota: {donor.safe_transferable?.toLocaleString()} • {donor.state_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-emerald-800">
                        +{donor.quantity_can_offer?.toLocaleString()} units
                      </span>
                      {donor.needs_donor_replenishment && (
                        <span className="block text-[9px] text-amber-700 font-mono">
                          Requires Backfill Replenishment
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
