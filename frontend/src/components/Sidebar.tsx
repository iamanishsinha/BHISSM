import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';
import { getNavItems, getUnitName } from './navConfig';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile / tablet navigation drawer.
 * On large screens navigation lives in the sticky top bar (see Header).
 */
export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();

  const navItems = getNavItems(user?.role);
  const groups = Array.from(new Set(navItems.map((i) => i.group)));

  return (
    <div className="lg:hidden">
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-[#2A0A0D]/50 z-40"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-bhissm-surface border-r border-bhissm-border flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation drawer"
      >
        <div className="flex items-start justify-between p-4 border-b border-bhissm-border bg-bhissm-skin/40">
          <div className="min-w-0">
            <div className="font-display text-2xl text-bhissm-maroon leading-none">BHISSM</div>
            <div className="text-sm font-bold text-bhissm-dark truncate mt-2">{getUnitName(user)}</div>
            <div className="text-xs font-mono uppercase text-bhissm-secondary mt-0.5">
              {user?.role} tier
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-bhissm-secondary hover:text-bhissm-maroon rounded-lg hover:bg-bhissm-maroon/10"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {groups.map((grp) => (
            <div key={grp} className="space-y-1">
              <div className="px-3 text-xs font-mono font-semibold uppercase tracking-wider text-bhissm-secondary/80">
                {grp}
              </div>
              {navItems
                .filter((item) => item.group === grp)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-bhissm-maroon text-[#F8EDE0]'
                            : item.isEmergency
                            ? 'text-red-800 bg-red-50 hover:bg-red-100'
                            : 'text-bhissm-dark hover:bg-bhissm-pink/70'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
