import type { ComponentType } from 'react';
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
  Database,
} from 'lucide-react';

export type NavRole = 'hospital' | 'state' | 'national';

export interface NavItem {
  to: string;
  /** Full label (mobile drawer) */
  label: string;
  /** Compact label (top navigation bar) */
  short: string;
  icon: ComponentType<{ className?: string }>;
  roles: NavRole[];
  badge?: string;
  isEmergency?: boolean;
  group: string;
}

/**
 * Single source of truth for application navigation.
 * Used by the top navigation bar (Header) and the mobile drawer (Sidebar).
 */
export function getNavItems(role?: string): NavItem[] {
  const items: NavItem[] = [
    {
      to: '/',
      label:
        role === 'hospital'
          ? 'Facility Dashboard'
          : role === 'state'
          ? 'State Command Center'
          : 'National Overview',
      short: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['hospital', 'state', 'national'],
      group: 'COMMAND & DISASTER OPS',
    },
    {
      to: '/emergency',
      label: 'Emergency Response Ops',
      short: 'Emergency',
      icon: Siren,
      roles: ['hospital', 'state', 'national'],
      isEmergency: true,
      group: 'COMMAND & DISASTER OPS',
    },
    {
      to: '/national-reserve',
      label: role === 'state' ? 'State Reserve & Redistribution' : 'National Stockpile Command',
      short: role === 'state' ? 'State Reserve' : 'Stockpile',
      icon: Landmark,
      roles: ['state', 'national'],
      group: 'COMMAND & DISASTER OPS',
    },
    {
      to: '/corridor',
      label: 'Regional Corridor Grid',
      short: 'Corridor',
      icon: MapPin,
      roles: ['hospital', 'state', 'national'],
      group: 'COMMAND & DISASTER OPS',
    },
    {
      to: '/inventory',
      label: role === 'state' ? 'Hospital-Wise Stock Check' : 'Inventory & Vendor Entry',
      short: role === 'state' ? 'Hospital Stock' : 'Inventory',
      icon: Boxes,
      roles: ['hospital', 'state', 'national'],
      group: 'SUPPLY CHAIN & RESOURCES',
    },
    {
      to: '/forecast',
      label: 'AI Forecast & Safety Stock',
      short: 'Forecast',
      icon: TrendingUp,
      roles: ['hospital', 'state', 'national'],
      group: 'SUPPLY CHAIN & RESOURCES',
    },
    {
      to: '/blood-bank',
      label: 'Blood Supply Network',
      short: 'Blood',
      icon: Droplet,
      roles: ['hospital', 'state', 'national'],
      group: 'SUPPLY CHAIN & RESOURCES',
    },
    {
      to: '/capacity',
      label: 'Beds, Ambulances & Staff',
      short: 'Capacity',
      icon: Truck,
      roles: ['hospital', 'state', 'national'],
      group: 'SUPPLY CHAIN & RESOURCES',
    },
    {
      to: '/audit-alerts',
      label: 'Alerts & Audit Ledger',
      short: 'Alerts & Audit',
      icon: ShieldCheck,
      roles: ['hospital', 'state', 'national'],
      group: 'GOVERNANCE & AUDIT',
    },
    {
      to: '/admin/master-data',
      label: 'Master Data & Governance',
      short: 'Master Data',
      icon: Database,
      roles: ['state', 'national'],
      group: 'GOVERNANCE & AUDIT',
    },
  ];

  return items.filter((item) => item.roles.includes((role || '') as NavRole));
}

export function getUnitName(user?: {
  role?: string;
  facility_name?: string;
  state_name?: string;
} | null): string {
  if (!user) return 'BHISSM Health Grid';
  if (user.role === 'hospital') return user.facility_name || 'Hospital Node';
  if (user.role === 'state') {
    if (!user.state_name) return 'State Health Command';
    return user.state_name.toLowerCase().includes('command')
      ? user.state_name
      : `${user.state_name} State Command`;
  }
  return 'National Strategic Command';
}
