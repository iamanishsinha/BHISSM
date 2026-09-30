import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../lib/api';
import {
  ShieldCheck,
  AlertTriangle,
  History,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Check,
  RotateCcw
} from 'lucide-react';

export default function AuditAlertsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'alerts' | 'audit'>('alerts');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [actionFilter, setActionFilter] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/alerts', {
        params: {
          severity: severityFilter || undefined,
          type: typeFilter || undefined,
          unread_only: unreadOnly ? 'true' : undefined,
        },
      });
      setAlerts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await API.get('/alerts/audit', {
        params: {
          limit: 100,
          action: actionFilter || undefined,
        },
      });
      setAuditLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'alerts') fetchAlerts();
    else fetchAuditLogs();
  }, [activeTab, severityFilter, typeFilter, unreadOnly, actionFilter]);

  const markAlertRead = async (id: string) => {
    try {
      await API.put(`/alerts/${id}/read`);
      setAlerts(alerts.map((a) => (a.id === id ? { ...a, is_read: 1 } : a)));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-bhissm-secondary">
              TRANSPARENCY & REGULATORY OVERSIGHT
            </span>
            <span className="text-[10px] bg-gray-100 text-gray-800 border border-gray-300 px-1.5 py-0.2 rounded font-mono font-bold">
              IMMUTABLE AUDIT TRAIL
            </span>
          </div>
          <h1 className="text-xl font-bold text-bhissm-dark mt-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-bhissm-dark" />
            Alerts Dispatch & System Audit Logs
          </h1>
          <p className="text-xs text-bhissm-secondary mt-0.5">
            Immutable tracking for regulatory compliance, stock changes, emergency dispatches, and clinical safety alerts.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#F8F1E7] p-1 rounded border border-bhissm-border text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-bhissm-surface text-bhissm-dark shadow-sm'
                : 'text-bhissm-secondary hover:text-bhissm-dark'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> System Alerts
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-bhissm-surface text-bhissm-dark shadow-sm'
                : 'text-bhissm-secondary hover:text-bhissm-dark'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Immutable Audit Ledger
          </button>
        </div>
      </div>

      {activeTab === 'alerts' ? (
        <div className="space-y-4">
          {/* Alerts Filter Bar */}
          <div className="card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="select-field w-auto"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Informational</option>
              </select>

              <select
                className="select-field w-auto"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Alert Types</option>
                <option value="stockout_risk">Stockout Risk</option>
                <option value="expiry">Batch Expiry</option>
                <option value="emergency">Emergency Operations</option>
                <option value="supply_disruption">Supply Disruption</option>
              </select>

              <button
                onClick={() => setUnreadOnly(!unreadOnly)}
                className={`px-3 py-1.5 rounded border transition-colors ${
                  unreadOnly
                    ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                    : 'border-bhissm-border text-bhissm-secondary hover:bg-bhissm-pink'
                }`}
              >
                Unacknowledged Only
              </button>
            </div>

            <button
              onClick={fetchAlerts}
              className="text-xs font-mono text-bhissm-secondary hover:text-bhissm-dark flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh Alerts
            </button>
          </div>

          {/* Alerts Feed */}
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="card text-center py-10 text-xs text-bhissm-secondary font-mono">
                No alerts matching current filter parameters.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`card p-4 text-xs space-y-2 border transition-colors ${
                    alert.is_read
                      ? 'bg-white/80 opacity-75'
                      : alert.severity === 'critical'
                      ? 'bg-red-50/70 border-red-300'
                      : alert.severity === 'warning'
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-blue-50/70 border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                            alert.severity === 'critical'
                              ? 'bg-red-200 text-red-950'
                              : alert.severity === 'warning'
                              ? 'bg-amber-200 text-amber-950'
                              : 'bg-blue-200 text-blue-950'
                          }`}
                        >
                          {alert.severity} • {alert.alert_type?.replace('_', ' ')}
                        </span>
                        <h3 className="font-bold text-sm text-bhissm-dark">{alert.title}</h3>
                      </div>
                      <p className="text-bhissm-secondary leading-relaxed">{alert.message}</p>
                      <div className="text-[10px] text-bhissm-secondary/80 font-mono">
                        {new Date(alert.created_at).toLocaleString()} • Node: {alert.facility_name || 'System Dispatch'}
                      </div>
                    </div>

                    {!alert.is_read ? (
                      <button
                        onClick={() => markAlertRead(alert.id)}
                        className="btn-outline text-[11px] py-1 px-2.5 shrink-0 flex items-center gap-1 font-mono hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300"
                      >
                        <Check className="w-3.5 h-3.5" /> Acknowledge
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Audit Log Filter Bar */}
          <div className="card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <label className="font-medium">Filter Action:</label>
              <select
                className="select-field w-auto font-mono"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="EMERGENCY_INITIATE">EMERGENCY_INITIATE</option>
                <option value="EMERGENCY_CONFIRM">EMERGENCY_CONFIRM</option>
                <option value="RESOURCE_OFFER">RESOURCE_OFFER</option>
                <option value="RESOURCE_ACCEPT">RESOURCE_ACCEPT</option>
                <option value="RESOURCE_DISPATCH">RESOURCE_DISPATCH</option>
                <option value="NATIONAL_RESERVE_RELEASE">NATIONAL_RESERVE_RELEASE</option>
                <option value="BLOOD_REQUEST">BLOOD_REQUEST</option>
                <option value="BLOOD_OFFER">BLOOD_OFFER</option>
              </select>
            </div>

            <button
              onClick={fetchAuditLogs}
              className="text-xs font-mono text-bhissm-secondary hover:text-bhissm-dark flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh Audit Trail
            </button>
          </div>

          {/* Audit Ledger Table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-bhissm-border bg-bhissm-bg">
                    <th className="table-header">Timestamp</th>
                    <th className="table-header">User & Role</th>
                    <th className="table-header">Action Code</th>
                    <th className="table-header">Resource Type</th>
                    <th className="table-header">Details Payload</th>
                    <th className="table-header text-right">Client IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bhissm-border/40 font-mono text-[11px]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-bhissm-secondary">
                        No audit events recorded under this filter.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FDF9F3]">
                        <td className="table-cell whitespace-nowrap text-bhissm-secondary">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="table-cell">
                          <div className="font-bold text-bhissm-dark font-sans">{log.user_name || 'System'}</div>
                          <div className="text-[10px] text-bhissm-secondary uppercase">
                            {log.role}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-900 border border-gray-300 font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="table-cell uppercase text-bhissm-secondary">
                          {log.resource_type || 'SYSTEM'}
                        </td>
                        <td className="table-cell max-w-xs truncate text-bhissm-secondary" title={log.details}>
                          {log.details || '—'}
                        </td>
                        <td className="table-cell text-right text-bhissm-secondary">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
