import type { IconType } from 'react-icons';
import {
  FiBarChart2,
  FiCreditCard,
  FiGrid,
  FiMail,
  FiSettings,
  FiUser,
} from 'react-icons/fi';

export interface NavItem {
  key: string;
  label: string;
  icon: IconType;
  targetId?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: FiGrid, targetId: 'top' },
  { key: 'transactions', label: 'Transactions', icon: FiCreditCard, targetId: 'transactions-section' },
  { key: 'wallet', label: 'Wallet', icon: FiCreditCard },
  { key: 'analytics', label: 'Analytics', icon: FiBarChart2, targetId: 'overview-section' },
  { key: 'personal', label: 'Personal', icon: FiUser },
  { key: 'message', label: 'Message', icon: FiMail },
  { key: 'setting', label: 'Setting', icon: FiSettings },
];
