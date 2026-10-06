import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, LogOut, Radio, Hospital, Globe, Landmark, Activity, Siren, Clock, Database } from 'lucide-react';
import API from '../lib/api';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);
  const [activeEmergencies, setActiveEmergencies] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Real-time live date and time ticker (synced every 1000ms)
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

  const fetchStatus = async () => {
    try {
      const res = await API.get('/alerts/dashboard');
      setUnreadAlerts(res.data?.alerts?.total_unread || 0);
      setActiveEmergencies(res.data?.emergency?.active || 0);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'national':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2D2926] text-[#FFF9F1] rounded-md text-xs font-mono tracking-wider font-bold border border-[#D4C8BC] shadow-xs">
            <Globe className="w-3.5 h-3.5 text-[#E8A7B5]" />
            NATIONAL COMMAND
          </span>
        );
      case 'state':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A5D4E] text-[#FFF9F1] rounded-md text-xs font-mono tracking-wider font-bold border border-[#D4C8BC] shadow-xs">
            <Landmark className="w-3.5 h-3.5 text-[#F4D5DC]" />
            STATE CONTROLLER ({user.state_name?.toUpperCase() || 'STATE'})
          </span>
        );
      case 'hospital':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6C5B52] text-[#FFF9F1] rounded-md text-xs font-mono tracking-wider font-bold border border-[#D4C8BC] shadow-xs">
            <Hospital className="w-3.5 h-3.5 text-[#F4D5DC]" />
            HOSPITAL ({user.facility_name?.slice(0, 22) || 'FACILITY'})
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-gradient-to-r from-[#FFF9F1] via-[#FDF5EA] to-[#FFF9F1] border-b-2 border-bhissm-border px-4 lg:px-6 py-2.5 flex items-center justify-between shrink-0 z-30 shadow-sm">
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-bhissm-dark hover:bg-bhissm-pink rounded-md transition-colors border border-bhissm-border/60"
          title="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Flagship BHISSM Brand Identity */}
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="relative w-12 h-12 rounded-xl bhissm-emblem-box text-[#FFF9F1] flex flex-col items-center justify-center border-2 border-[#E8A7B5]/80 shrink-0 group-hover:scale-105 transition-transform">
            <div className="flex items-center gap-0.5 leading-none">
              <span className="font-black text-base tracking-tighter text-[#FFF9F1]">BH</span>
              <Activity className="w-3.5 h-3.5 text-[#E8A7B5]" />
            </div>
            <span className="text-[8px] font-mono uppercase tracking-widest text-[#F4D5DC] mt-0.5 font-bold">
              GRID
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-black text-2xl sm:text-3xl tracking-tight bhissm-brand-title font-sans leading-none">
                BHISSM
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-gradient-to-r from-[#2D2926] to-[#514944] text-[#FFF9F1] px-2 py-0.5 rounded font-mono font-bold tracking-wider border border-[#D4C8BC]">
                NATIONAL HEALTH GRID
              </span>
              <span className="text-[10px] bg-[#F4D5DC] text-[#2D2926] px-1.5 py-0.5 rounded font-mono font-bold border border-[#E8A7B5]">
                v2.0
              </span>
            </div>
            <div className="text-[11px] text-bhissm-secondary font-semibold tracking-wide mt-0.5 flex items-center gap-2">
              <span className="hidden sm:inline">Bharat Health Initiative for SupplyChain Sourcing &amp; Management</span>
              <span className="inline-flex xl:hidden items-center gap-1 font-mono text-[10px] text-bhissm-dark font-bold bg-[#F4E7D7]/80 px-1.5 py-0.5 rounded border border-bhissm-border/60">
                <Clock className="w-2.5 h-2.5 text-[#B65C62]" />
                {formattedDate} {formattedTime} IST
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Center Telemetry, Live Date/Time & High-Visibility Emergency Siren */}
      <div className="hidden xl:flex items-center gap-3">
        {activeEmergencies > 0 && (
          <Link
            to="/emergency"
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white border-2 border-red-300 shadow-md hover:brightness-110 transition-all emergency-banner-glow"
            title="Click to open Emergency Command Console"
          >
            {/* High-Visibility Siren & Medical Cross Beacon */}
            <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/20 border border-white/50">
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
              <Siren className="w-4 h-4 text-white relative z-10" />
            </div>

            <div className="text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full siren-light-left"></span>
                <span className="w-2 h-2 rounded-full siren-light-right"></span>
                <span className="text-[10px] font-mono uppercase tracking-widest font-black text-red-100">
                  CODE RED • EMERGENCY ACTIVE
                </span>
              </div>
              <div className="text-xs font-extrabold tracking-wide text-white">
                {activeEmergencies} ACTIVE INCIDENT{activeEmergencies > 1 ? 'S' : ''} — RESPOND NOW
              </div>
            </div>
          </Link>
        )}

        {/* Live Date and Time Telemetry (Small Font) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 border border-bhissm-border rounded-md text-[10px] font-mono text-bhissm-dark shadow-2xs">
          <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
          <span className="font-semibold text-bhissm-secondary">{formattedDate}</span>
          <span className="font-black text-bhissm-dark">{formattedTime}</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-900 font-bold">IST</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF9F1] border border-bhissm-border rounded-md text-[11px] font-mono text-bhissm-secondary shadow-2xs">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span className="font-bold text-bhissm-dark">GRID ONLINE</span>
        </div>

        {(user?.role === 'national' || user?.role === 'state') && (
          <Link
            to="/admin/master-data"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-[#FDF6ED] border border-bhissm-border rounded-md text-[11px] font-mono font-bold text-bhissm-dark shadow-2xs transition-colors"
            title="Open Master Data & Infrastructure Governance Console"
          >
            <Database className="w-3.5 h-3.5 text-[#B65C62]" />
            <span>Master Console</span>
          </Link>
        )}

        {unreadAlerts > 0 && (
          <Link
            to="/audit-alerts"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100/90 border border-amber-300 rounded-md text-[11px] font-mono font-bold text-amber-900 hover:bg-amber-200/70 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span>{unreadAlerts} Alerts</span>
          </Link>
        )}
      </div>

      {/* Right User info & actions */}
      <div className="flex items-center gap-3">
        {/* Compact emergency siren button on medium screens */}
        {activeEmergencies > 0 && (
          <Link
            to="/emergency"
            className="xl:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-mono font-bold emergency-beacon-core"
          >
            <Siren className="w-4 h-4" />
            <span>{activeEmergencies} SOS</span>
          </Link>
        )}

        <div className="hidden md:block">{getRoleBadge()}</div>

        <div className="hidden sm:block text-right border-l border-bhissm-border pl-3">
          <div className="text-xs font-bold text-bhissm-dark leading-tight">
            {user?.facility_name || (user?.state_name ? `${user.state_name} State Command` : 'National Command Grid')}
          </div>
          <div className="text-[10px] text-bhissm-secondary font-mono uppercase">
            {user?.role} NODE • {user?.username}
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-bhissm-secondary hover:text-red-700 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

