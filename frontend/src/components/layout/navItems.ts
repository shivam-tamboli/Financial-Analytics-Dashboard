import type { IconType } from 'react-icons';
import {
  FiBarChart2,
  FiFileText,
  FiGrid,
  FiMail,
  FiSettings,
  FiUser,
} from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';

export interface NavItem {
  key: string;
  label: string;
  icon: IconType;
  targetId?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: FiGrid, targetId: 'top' },
  { key: 'transactions', label: 'Transactions', icon: FiFileText, targetId: 'transactions-section' },
  { key: 'wallet', label: 'Wallet', icon: FaWallet },
  { key: 'analytics', label: 'Analytics', icon: FiBarChart2, targetId: 'overview-section' },
  { key: 'personal', label: 'Personal', icon: FiUser },
  { key: 'message', label: 'Message', icon: FiMail },
  { key: 'setting', label: 'Setting', icon: FiSettings },
];
