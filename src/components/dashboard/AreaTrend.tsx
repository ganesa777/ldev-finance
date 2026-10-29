import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { spring } from '../../lib/motion';
import { formatRupiah, formatSingkat } from '../../lib/format';
import type { TrendPoint } from '../../lib/stats';

interface AreaTrendProps {
  weeklyData: TrendPoint[];
  monthlyData: TrendPoint[];
  loading?: boolean;
}

export const AreaTrend: React.FC<AreaTrendProps> = ({
  weeklyData,
  monthlyData,
  loading = false,
}) => {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  if (loading) {
    return <div className="rounded-3xl h-[300px] shimmer shadow-glass" />;
  }

  const activeData = period === 'weekly' ? weeklyData : monthlyData;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card rounded-3xl p-5 md:p-6 space-y-4"
    >
      {/* Header + Segmented Tab Mingguan / Bulanan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">Statistik arus kas</h3>
          <p className="text-xs text-muted">
            Tren pemasukan dan pengeluaran {period === 'weekly' ? '7 hari terakhir' : 'bulan ini'}
          </p>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-sky-50 border border-sky-100 self-start sm:self-auto">
          {(['weekly', 'monthly'] as const).map((tab) => {
            const active = period === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setPeriod(tab)}
                className="relative px-3.5 py-1.5 rounded-xl text-xs font-semibold outline-none transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="trend-tab-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-xl bg-white shadow-sm"
                  />
                )}
                <span
                  className={`relative z-10 ${
                    active ? 'text-sky-600' : 'text-muted hover:text-ink'
                  }`}
                >
                  {tab === 'weekly' ? 'Mingguan' : 'Bulanan'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legenda Ringkas */}
      <div className="flex items-center gap-5 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-income inline-block" />
          <span className="text-muted">Pemasukan</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-expense inline-block" />
          <span className="text-muted">Pengeluaran</span>
        </div>
      </div>

      {/* Grafik Area Recharts */}
      <div className="h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={activeData}
            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#E0F2FE"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              tick={{ fill: '#6B84A0', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tickFormatter={(v) => formatSingkat(Number(v))}
              tick={{ fill: '#6B84A0', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const inc = Number(
                  payload.find((p) => p.dataKey === 'income')?.value ?? 0
                );
                const exp = Number(
                  payload.find((p) => p.dataKey === 'expense')?.value ?? 0
                );
                return (
                  <div className="glass-strong rounded-2xl p-3 shadow-float border border-white text-xs space-y-1.5">
                    <p className="font-bold text-ink">{label}</p>
                    <p className="text-income font-semibold tabular-nums">
                      Masuk: {formatRupiah(inc)}
                    </p>
                    <p className="text-expense font-semibold tabular-nums">
                      Keluar: {formatRupiah(exp)}
                    </p>
                  </div>
                );
              }}
            />

            <Area
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#incomeFill)"
              isAnimationActive={true}
              animationDuration={1200}
            />

            <Area
              type="monotone"
              dataKey="expense"
              stroke="#F43F5E"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#expenseFill)"
              isAnimationActive={true}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default AreaTrend;