import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subDays,
  isSameMonth,
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Category, Transaction, TxType } from '../types';

export interface SummaryStats {
  balance: number;
  income: number;
  expense: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface TrendPoint {
  date: string; // 'YYYY-MM-DD'
  label: string; // 'Sen', '28 Okt', dll
  income: number;
  expense: number;
}

export interface MonthComparison {
  currentIncome: number;
  currentExpense: number;
  prevIncome: number;
  prevExpense: number;
  incomeChangePct: number;
  expenseChangePct: number;
  balanceChangePct: number;
}

/**
 * Menghitung total pemasukan, pengeluaran, dan saldo bersih.
 */
export function calculateSummary(transactions: Transaction[]): SummaryStats {
  let income = 0;
  let expense = 0;

  for (const trx of transactions) {
    const amt = Number(trx.amount) || 0;
    if (trx.type === 'income') {
      income += amt;
    } else {
      expense += amt;
    }
  }

  return {
    income,
    expense,
    balance: income - expense,
  };
}

/**
 * Mengelompokkan transaksi berdasarkan kategori (diurutkan dari nominal terbesar).
 */
export function groupByCategory(
  transactions: Transaction[],
  type: TxType = 'expense',
  categoriesMap?: Category[]
): CategoryBreakdownItem[] {
  const filtered = transactions.filter((t) => t.type === type);
  const totalAmount = filtered.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  if (totalAmount === 0) return [];

  const lookup = new Map<string, Category>();
  categoriesMap?.forEach((c) => lookup.set(c.id, c));

  const map = new Map<
    string,
    {
      name: string;
      icon: string;
      color: string;
      amount: number;
      count: number;
    }
  >();

  for (const trx of filtered) {
    const key = trx.category_id ?? 'uncategorized';
    const catObj = trx.category ?? (trx.category_id ? lookup.get(trx.category_id) : undefined);
    const existing = map.get(key);

    if (existing) {
      existing.amount += Number(trx.amount) || 0;
      existing.count += 1;
    } else {
      map.set(key, {
        name: catObj?.name ?? 'Lainnya',
        icon: catObj?.icon ?? 'MoreHorizontal',
        color: catObj?.color ?? '#64748B',
        amount: Number(trx.amount) || 0,
        count: 1,
      });
    }
  }

  return Array.from(map.entries())
    .map(([categoryId, val]) => ({
      categoryId,
      name: val.name,
      icon: val.icon,
      color: val.color,
      amount: val.amount,
      count: val.count,
      percentage: Math.round((val.amount / totalAmount) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Menghasilkan titik data tren 7 hari terakhir (Mingguan).
 */
export function buildWeeklyTrend(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): TrendPoint[] {
  const start = subDays(referenceDate, 6);
  const days = eachDayOfInterval({ start, end: referenceDate });

  const byDate = new Map<string, { income: number; expense: number }>();
  for (const trx of transactions) {
    const current = byDate.get(trx.trx_date) ?? { income: 0, expense: 0 };
    if (trx.type === 'income') {
      current.income += Number(trx.amount) || 0;
    } else {
      current.expense += Number(trx.amount) || 0;
    }
    byDate.set(trx.trx_date, current);
  }

  return days.map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const totals = byDate.get(key) ?? { income: 0, expense: 0 };
    return {
      date: key,
      label: format(day, 'EEE', { locale: idLocale }),
      income: totals.income,
      expense: totals.expense,
    };
  });
}

/**
 * Menghasilkan titik data tren harian dalam 1 bulan penuh (Bulanan).
 */
export function buildMonthlyTrend(
  transactions: Transaction[],
  monthDate: Date = new Date()
): TrendPoint[] {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start, end });

  const byDate = new Map<string, { income: number; expense: number }>();
  for (const trx of transactions) {
    const current = byDate.get(trx.trx_date) ?? { income: 0, expense: 0 };
    if (trx.type === 'income') {
      current.income += Number(trx.amount) || 0;
    } else {
      current.expense += Number(trx.amount) || 0;
    }
    byDate.set(trx.trx_date, current);
  }

  return days.map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const totals = byDate.get(key) ?? { income: 0, expense: 0 };
    return {
      date: key,
      label: format(day, 'd MMM', { locale: idLocale }),
      income: totals.income,
      expense: totals.expense,
    };
  });
}

/**
 * Membandingkan total bulan ini dengan bulan lalu.
 */
export function compareMonths(
  currentMonthTransactions: Transaction[],
  prevMonthTransactions: Transaction[]
): MonthComparison {
  const curr = calculateSummary(currentMonthTransactions);
  const prev = calculateSummary(prevMonthTransactions);

  const calcPct = (now: number, before: number): number => {
    if (before === 0) return now > 0 ? 100 : 0;
    return Math.round(((now - before) / Math.abs(before)) * 100);
  };

  return {
    currentIncome: curr.income,
    currentExpense: curr.expense,
    prevIncome: prev.income,
    prevExpense: prev.expense,
    incomeChangePct: calcPct(curr.income, prev.income),
    expenseChangePct: calcPct(curr.expense, prev.expense),
    balanceChangePct: calcPct(curr.balance, prev.balance),
  };
}

/**
 * Menghitung rata-rata pengeluaran harian pada bulan berjalan.
 */
export function calculateDailyAverageExpense(
  transactions: Transaction[],
  monthDate: Date = new Date()
): number {
  const { expense } = calculateSummary(transactions);
  if (expense === 0) return 0;

  const today = new Date();
  const daysElapsed = isSameMonth(monthDate, today)
    ? Math.max(1, today.getDate())
    : endOfMonth(monthDate).getDate();

  return Math.round(expense / daysElapsed);
}

/**
 * Mengelompokkan daftar transaksi per tanggal ('YYYY-MM-DD') beserta subtotal hariannya.
 */
export function groupTransactionsByDate(transactions: Transaction[]): Array<{
  date: string;
  subtotalIncome: number;
  subtotalExpense: number;
  items: Transaction[];
}> {
  const groups = new Map<
    string,
    {
      subtotalIncome: number;
      subtotalExpense: number;
      items: Transaction[];
    }
  >();

  for (const trx of transactions) {
    const existing = groups.get(trx.trx_date) ?? {
      subtotalIncome: 0,
      subtotalExpense: 0,
      items: [],
    };

    if (trx.type === 'income') {
      existing.subtotalIncome += Number(trx.amount) || 0;
    } else {
      existing.subtotalExpense += Number(trx.amount) || 0;
    }

    existing.items.push(trx);
    groups.set(trx.trx_date, existing);
  }

  return Array.from(groups.entries())
    .sort(([dateA], [dateB]) =>
      parseISO(dateB).getTime() - parseISO(dateA).getTime()
    )
    .map(([date, val]) => ({
      date,
      subtotalIncome: val.subtotalIncome,
      subtotalExpense: val.subtotalExpense,
      items: val.items,
    }));
}