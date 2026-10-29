import {
  Utensils,
  Bus,
  ShoppingBag,
  Receipt,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Banknote,
  Gift,
  Store,
  TrendingUp,
  Wallet,
  Coffee,
  Home,
  Car,
  Smartphone,
  Plane,
  Briefcase,
  PiggyBank,
  type LucideIcon,
} from 'lucide-react';
import type { DefaultCategorySeed } from '../types/index';

export const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Bus,
  ShoppingBag,
  Receipt,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Banknote,
  Gift,
  Store,
  TrendingUp,
  Wallet,
  Coffee,
  Home,
  Car,
  Smartphone,
  Plane,
  Briefcase,
  PiggyBank,
};

export const AVAILABLE_ICON_NAMES = Object.keys(ICON_MAP);

export const CATEGORY_COLORS = [
  '#F97316',
  '#0EA5E9',
  '#EC4899',
  '#8B5CF6',
  '#F43F5E',
  '#EF4444',
  '#14B8A6',
  '#64748B',
  '#10B981',
  '#22C55E',
  '#06B6D4',
  '#3B82F6',
  '#F59E0B',
];

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { name: 'Makan & Minum', type: 'expense', icon: 'Utensils', color: '#F97316' },
  { name: 'Transportasi', type: 'expense', icon: 'Bus', color: '#0EA5E9' },
  { name: 'Belanja', type: 'expense', icon: 'ShoppingBag', color: '#EC4899' },
  { name: 'Tagihan', type: 'expense', icon: 'Receipt', color: '#8B5CF6' },
  { name: 'Hiburan', type: 'expense', icon: 'Gamepad2', color: '#F43F5E' },
  { name: 'Kesehatan', type: 'expense', icon: 'HeartPulse', color: '#EF4444' },
  { name: 'Pendidikan', type: 'expense', icon: 'GraduationCap', color: '#14B8A6' },
  { name: 'Lainnya', type: 'expense', icon: 'MoreHorizontal', color: '#64748B' },
  { name: 'Gaji', type: 'income', icon: 'Banknote', color: '#10B981' },
  { name: 'Bonus', type: 'income', icon: 'Gift', color: '#22C55E' },
  { name: 'Usaha', type: 'income', icon: 'Store', color: '#06B6D4' },
  { name: 'Investasi', type: 'income', icon: 'TrendingUp', color: '#3B82F6' },
];

export function getCategoryIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return Wallet;
  return ICON_MAP[iconName] ?? Wallet;
}