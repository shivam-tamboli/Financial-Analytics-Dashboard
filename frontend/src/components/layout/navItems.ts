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
  /** Route to navigate to. */
  path: string;
  /** For items that live as a section within the Dashboard page rather than their own route — scrolls to this element id instead of just navigating. */
  targetId?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: FiGrid, path: '/', targetId: 'top' },
  { key: 'transactions', label: 'Transactions', icon: FiFileText, path: '/', targetId: 'transactions-section' },
  { key: 'wallet', label: 'Wallet', icon: FaWallet, path: '/wallet' },
  { key: 'analytics', label: 'Analytics', icon: FiBarChart2, path: '/analytics' },
  { key: 'personal', label: 'Personal', icon: FiUser, path: '/personal' },
  { key: 'message', label: 'Message', icon: FiMail, path: '/message' },
  { key: 'setting', label: 'Setting', icon: FiSettings, path: '/settings' },
];
