import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { getCategoryIcon } from '../../lib/categories';
import { formatRupiah } from '../../lib/format';
import type { CategoryBreakdownItem } from '../../lib/stats';

interface CategoryDonutProps {
  items: CategoryBreakdownItem[];
  totalAmount: number;
  loading?: boolean;
}

export const CategoryDonut: React.FC<CategoryDonutProps> = ({
  items,
  totalAmount,
  loading = false,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (loading) {
    return <div className="rounded-3xl h-[340px] shimmer shadow-glass" />;
  }

  const activeItem =
    activeIndex !== null && items[activeIndex] ? items[activeIndex] : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card rounded-3xl p-5 md:p-6 space-y-5"
    >
      <div>
        <h3 className="text-base font-bold text-ink">
          Distribusi pengeluaran per kategori
        </h3>
        <p className="text-xs text-muted">
          Arahkan kursor atau ketuk kategori untuk melihat rincian nominalnya
        </p>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 mx-auto flex items-center justify-center">
            <PieIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-ink">
            Belum ada data pengeluaran
          </p>
          <p className="text-xs text-muted">
            Catat pengeluaran di bulan ini untuk melihat diagram donut.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Grafik Donut dengan Total di Tengah */}
          <div className="md:col-span-6 relative h-[240px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={96}
                  paddingAngle={4}
                  cornerRadius={10}
                  stroke="none"
                  isAnimationActive={true}
                  animationDuration={1000}
                  onMouseEnter={(_, idx) => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {items.map((entry, idx) => (
                    <Cell
                      key={entry.categoryId}
                      fill={entry.color}
                      opacity={
                        activeIndex === null || activeIndex === idx ? 1 : 0.35
                      }
                      style={{
                        cursor: 'pointer',
                        transition: 'opacity 0.2s ease',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0].payload as CategoryBreakdownItem;
                    return (
                      <div className="glass-strong rounded-2xl p-3 shadow-float border border-white text-xs space-y-1">
                        <p className="font-bold text-ink">{data.name}</p>
                        <p className="font-semibold text-sky-600 tabular-nums">
                          {formatRupiah(data.amount)} ({data.percentage}%)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Label Tengah Donut */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <span className="text-[11px] font-medium text-muted truncate max-w-[120px]">
                {activeItem ? activeItem.name : 'Total keluar'}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-ink tabular-nums mt-0.5">
                {formatRupiah(activeItem ? activeItem.amount : totalAmount)}
              </span>
              {activeItem && (
                <span
                  className="text-[11px] font-bold mt-0.5 tabular-nums"
                  style={{ color: activeItem.color }}
                >
                  {activeItem.percentage}%
                </span>
              )}
            </div>
          </div>

          {/* Legenda Interaktif */}
          <div className="md:col-span-6 space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const Icon = getCategoryIcon(item.icon);
              const isSelected = activeIndex === idx;

              return (
                <button
                  key={item.categoryId}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() =>
                    setActiveIndex((prev) => (prev === idx ? null : idx))
                  }
                  className={`w-full p-2.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all ${
                    isSelected
                      ? 'bg-sky-50/90 border-sky-300 shadow-sm'
                      : 'bg-white/60 border-white/80 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${item.color}22`,
                        color: item.color,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-muted">
                        {item.count} transaksi
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-ink tabular-nums">
                      {formatRupiah(item.amount)}
                    </p>
                    <p
                      className="text-[11px] font-bold tabular-nums"
                      style={{ color: item.color }}
                    >
                      {item.percentage}%
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CategoryDonut;