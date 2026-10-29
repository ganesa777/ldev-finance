import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { getCategoryIcon } from '../../lib/categories';
import { formatSingkat, formatRupiah } from '../../lib/format';
import type { CategoryBreakdownItem } from '../../lib/stats';

interface TopCategoriesProps {
  items: CategoryBreakdownItem[];
  loading?: boolean;
  onSelectCategory?: (categoryId: string) => void;
}

export const TopCategories: React.FC<TopCategoriesProps> = ({
  items,
  loading = false,
  onSelectCategory,
}) => {
  if (loading) {
    return <div className="rounded-3xl h-[200px] shimmer shadow-glass" />;
  }

  const topItems = items.slice(0, 5);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card rounded-3xl p-5 flex flex-col justify-between min-h-[200px]"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-base font-semibold text-ink">Kategori teratas</h3>
          <p className="text-xs text-muted">Pengeluaran terbesar bulan ini</p>
        </div>
        <span className="w-7 h-7 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center">
          {items.length}
        </span>
      </div>

      {topItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mb-2">
            <Plus className="w-5 h-5" />
          </div>
          <p className="text-xs text-muted">
            Belum ada pengeluaran tercatat bulan ini.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {topItems.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            return (
              <motion.button
                key={cat.categoryId}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectCategory?.(cat.categoryId)}
                title={`${cat.name}: ${formatRupiah(cat.amount)}`}
                className="flex flex-col items-center min-w-[68px] p-2 rounded-2xl hover:bg-sky-50/80 transition-colors group"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-sm transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${cat.color}22`,
                    color: cat.color,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-ink truncate max-w-[68px]">
                  {cat.name.split(' ')[0]}
                </span>
                <span className="text-[11px] font-medium text-muted tabular-nums">
                  Rp {formatSingkat(cat.amount)}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default TopCategories;