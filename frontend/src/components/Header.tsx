import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, ShieldAlert, Siren } from 'lucide-react';
import API from '../lib/api';
import { getNavItems, getUnitName } from './navConfig';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const ROLE_LABEL: Record<string, string> = {
  national: 'National Command',
  state: 'State Command',
  hospital: 'Hospital Node',
};

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);
  const [activeEmergencies, setActiveEmergencies] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Live date/time ticker (system-wide reference clock)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime
    .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();

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
      // non-blocking
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = getNavItems(user?.role);
  const unitName = getUnitName(user);

  return (
    <header className="sticky top-0 z-30 bg-bhissm-bg/95 backdrop-blur border-b border-bhissm-maroon/25">
      {/* Row 1: identity, live clock, status, account */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-8 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 -ml-2 text-bhissm-maroon hover:bg-bhissm-maroon/10 rounded-lg transition-colors"
            title="Open menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-baseline gap-3 min-w-0">
            <span className="font-display text-3xl text-bhissm-maroon leading-none tracking-tight">BHISSM</span>
            <span className="hidden md:inline text-xs text-bhissm-secondary font-medium truncate">
              Bharat Health Initiative for SupplyChain Sourcing &amp; Management
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Live date & time (small) */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-bhissm-secondary">
            <span className="w-2 h-2 rounded-full bg-bhissm-success animate-pulse" title="Grid online" />
            <span>{formattedDate}</span>
            <span className="font-medium text-bhissm-dark">{formattedTime}</span>
            <span className="text-bhissm-maroon font-semibold">IST</span>
          </div>

          {activeEmergencies > 0 && (
            <Link
              to="/emergency"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold emergency-beacon-core"
              title="Open Emergency Response"
            >
              <Siren className="w-3.5 h-3.5" />
              <span>{activeEmergencies} ACTIVE</span>
            </Link>
          )}

          {unreadAlerts > 0 && (
            <Link
              to="/audit-alerts"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8DFA8] border border-[#EBC675] text-[#7A4A06] text-xs font-bold hover:brightness-95 transition"
              title="Unread alerts"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{unreadAlerts}</span>
            </Link>
          )}

          <div className="hidden md:block text-right border-l border-bhissm-border pl-4 max-w-[240px]">
            <div className="text-sm font-bold text-bhissm-dark leading-tight truncate">{unitName}</div>
            <div className="text-xs text-bhissm-secondary font-mono uppercase truncate">
              {ROLE_LABEL[user?.role || ''] || user?.role}
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-bhissm-secondary hover:text-bhissm-maroon hover:bg-bhissm-maroon/10 rounded-lg transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 2: primary navigation (desktop) */}
      <nav
        className="hidden lg:flex items-center gap-1 px-8 border-t border-bhissm-border/70 overflow-x-auto"
        aria-label="Primary"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? 'text-bhissm-maroon border-bhissm-maroon'
                    : item.isEmergency
                    ? 'text-red-700 border-transparent hover:text-red-800 hover:border-red-300'
                    : 'text-bhissm-secondary border-transparent hover:text-bhissm-maroon hover:border-bhissm-maroon/40'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.short}</span>
              {item.isEmergency && activeEmergencies > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              )}
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}
