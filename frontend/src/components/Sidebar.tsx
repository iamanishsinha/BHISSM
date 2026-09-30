import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  Droplet,
  Truck,
  Landmark,
  ShieldCheck,
  Siren,
  MapPin,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();

  const navItems = [
    {
      to: '/',
      label:
        user?.role === 'hospital'
          ? 'Facility Dashboard'
          : user?.role === 'state'
          ? 'State Command Center'
          : 'National Overview',
      icon: LayoutDashboard,
      roles: ['hospital', 'state', 'national'],
      group: 'COMMAND & DISASTER OPS',
    },
    {
      to: '/emergency',
      label: 'Emergency Response Ops',
      icon: Siren,
      roles: ['hospital', 'state', 'national'],
      badge: 'LIVE SOS',
      isEmergency: true,
      group: 'COMMAND & DISASTER OPS',
    },
    {
      to: '/national-reserve',
      label:
        user?.role === 'state'
          ? 'State Reserve & Redistribution'
          : 'National Stockpile Command',
      icon: Landmark,
      roles: ['state', 'national'],
      badge: user?.role === 'national' ? 'Authority' : 'Reserve',
      group: 'COMMAND & DISASTER OPS',
    },
    {
      to: '/inventory',
      label:
        user?.role === 'state'
          ? 'Hospital-Wise Stock Check'
          : 'Inventory & Vendor Entry',
      icon: Boxes,
      roles: ['hospital', 'state', 'national'],
      badge: '33+ Drugs',
      group: 'SUPPLY CHAIN & RESOURCES',
    },
    {
      to: '/forecast',
      label: 'AI Forecast & Safety Stock',
      icon: TrendingUp,
      roles: ['hospital', 'state', 'national'],
      group: 'SUPPLY CHAIN & RESOURCES',
    },
    {
      to: '/blood-bank',
      label: 'Blood Supply Network',
      icon: Droplet,
      roles: ['hospital', 'state', 'national'],
      group: 'SUPPLY CHAIN & RESOURCES',
    },
    {
      to: '/capacity',
      label: 'Beds, Ambulances & Staff',
      icon: Truck,
      roles: ['hospital', 'state', 'national'],
      group: 'SUPPLY CHAIN & RESOURCES',
    },
    {
      to: '/audit-alerts',
      label: 'Alerts & Audit Ledger',
      icon: ShieldCheck,
      roles: ['hospital', 'state', 'national'],
      group: 'GOVERNANCE & AUDIT',
    },
  ];

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  const groups = Array.from(new Set(filteredNav.map((i) => i.group)));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-bhissm-surface border-r-2 border-bhissm-border flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Active Jurisdiction Card */}
        <div className="p-3.5 border-b border-bhissm-border bg-gradient-to-br from-[#FFF9F1] to-[#F4E7D7]/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-widest text-bhissm-secondary font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#B65C62]" />
              Active Jurisdiction
            </span>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-bhissm-secondary hover:text-bhissm-dark"
            >
              ✕
            </button>
          </div>
          <div className="text-sm font-extrabold text-bhissm-dark truncate mt-1">
            {user?.role === 'hospital'
              ? user.facility_name || 'Hospital Node'
              : user?.role === 'state'
              ? `${user.state_name || 'State'} Command`
              : 'National Strategic Reserve'}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2D2926] text-[#FFF9F1] font-bold uppercase">
              {user?.role} TIER
            </span>
            {user?.state_name && user?.role !== 'national' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-bhissm-border text-bhissm-dark font-semibold truncate">
                {user.state_name}
              </span>
            )}
          </div>
        </div>

        {/* Grouped Navigation List */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {groups.map((grp) => (
            <div key={grp} className="space-y-1">
              <div className="px-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-bhissm-secondary/80">
                {grp}
              </div>
              {filteredNav
                .filter((item) => item.group === grp)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onClose}
                      className={({ isActive }) => {
                        if (item.isEmergency) {
                          return `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all border ${
                            isActive
                              ? 'bg-red-700 text-white border-red-800 shadow-sm'
                              : 'bg-red-50/90 text-red-950 border-red-200 hover:bg-red-100'
                          }`;
                        }
                        return `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-colors ${
                          isActive
                            ? 'bg-bhissm-accent/35 text-bhissm-dark font-bold border-l-4 border-bhissm-dark pl-2.5 shadow-2xs'
                            : 'text-bhissm-secondary hover:bg-bhissm-pink/60 hover:text-bhissm-dark'
                        }`;
                      }}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            {item.isEmergency ? (
                              <span className="relative flex items-center justify-center w-5 h-5">
                                <span
                                  className={`absolute inset-0 rounded-full animate-ping opacity-70 ${
                                    isActive ? 'bg-red-300' : 'bg-red-500'
                                  }`}
                                />
                                <Icon
                                  className={`w-4 h-4 relative z-10 ${
                                    isActive ? 'text-white' : 'text-red-700'
                                  }`}
                                />
                              </span>
                            ) : (
                              <Icon className="w-4 h-4 text-bhissm-dark shrink-0" />
                            )}
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                item.isEmergency
                                  ? isActive
                                    ? 'bg-white text-red-800 border-white'
                                    : 'bg-red-600 text-white border-red-700 animate-pulse'
                                  : 'bg-[#F4D5DC] text-[#2D2926] border-[#E8A7B5]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
            </div>
          ))}
        </nav>

        {/* Footer command metadata */}
        <div className="p-3 border-t border-bhissm-border bg-[#F8F1E7]/60 text-[11px] font-mono text-bhissm-secondary space-y-1">
          <div className="flex justify-between items-center">
            <span>BHISSM ENGINE:</span>
            <span className="text-emerald-800 font-bold">FEFO + AI SYNC</span>
          </div>
          <div className="flex justify-between items-center">
            <span>MUTUAL AID:</span>
            <span className="text-blue-900 font-bold">INTER-STATE ACTIVE</span>
          </div>
          <div className="flex justify-between items-center">
            <span>LOCATION:</span>
            <span className="text-bhissm-dark font-bold truncate max-w-[120px]">
              {user?.role === 'national'
                ? 'CENTRAL HQ'
                : user?.state_name?.toUpperCase() || 'STATE COMMAND'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

