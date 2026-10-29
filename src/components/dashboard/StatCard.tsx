import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';
import { formatRupiah } from '../../lib/format';
import type { TxType } from '../../types';

interface StatCardProps {
  title: string;
  amount: number;
  changePct: number;
  type: TxType;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  changePct,
  type,
  loading = false,
}) => {
  const animatedAmount = useCountUp(amount, 1200);

  if (loading) {
    return <div className="rounded-3xl h-[136px] shimmer shadow-glass" />;
  }

  const isIncome = type === 'income';
  const Icon = isIncome ? TrendingUp : TrendingDown;
  const isUp = changePct >= 0;

  // Untuk pemasukan, naik = bagus (hijau). Untuk pengeluaran, naik = rose.
  const badgePositive = isIncome ? isUp : !isUp;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card rounded-3xl p-5 flex flex-col justify-between gap-3 transition-shadow hover:shadow-float"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{title}</span>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isIncome
              ? 'bg-emerald-50 text-income'
              : 'bg-rose-50 text-expense'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div>
        <p className="text-[24px] sm:text-[26px] font-bold text-ink tabular-nums tracking-tight leading-tight">
          {formatRupiah(animatedAmount)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
            badgePositive
              ? 'bg-emerald-50 text-income'
              : 'bg-rose-50 text-expense'
          }`}
        >
          {isUp ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" />
          )}
          {isUp ? `+${changePct}%` : `${changePct}%`}
        </span>
        <span className="text-[11px] text-muted">bulan ini</span>
      </div>
    </motion.div>
  );
};

export default StatCard;