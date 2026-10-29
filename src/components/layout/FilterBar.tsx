import React from 'react';
import { addMonths } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
} from 'lucide-react';
import { formatBulanTahun } from '../../lib/format';
import { spring } from '../../lib/motion';
import type { Category, TxType } from '../../types';

interface FilterBarProps {
  month: Date;
  onMonthChange: (newMonth: Date) => void;
  type: 'all' | TxType;
  onTypeChange: (newType: 'all' | TxType) => void;
  categoryId: string | 'all';
  onCategoryChange: (newCatId: string | 'all') => void;
  search: string;
  onSearchChange: (q: string) => void;
  categories: Category[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  month,
  onMonthChange,
  type,
  onTypeChange,
  categoryId,
  onCategoryChange,
  search,
  onSearchChange,
  categories,
}) => {
  const visibleCategories =
    type === 'all'
      ? categories
      : categories.filter((c) => c.type === type);

  return (
    <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-4">
      {/* Baris Atas: Pencarian Catatan + Pemilih Bulan */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Input Cari */}
        <div className="relative flex-1 flex items-center h-11 rounded-2xl bg-white/85 border border-sky-100 px-3.5 focus-within:border-sky-400 focus-within:shadow-glow">
          <Search className="w-4 h-4 text-muted mr-2.5 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari catatan transaksi..."
            className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted/70"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Hapus pencarian"
              className="p-1 rounded-lg text-muted hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pemilih Bulan */}
        <div className="flex items-center justify-between md:justify-end gap-2 bg-sky-50/90 border border-sky-100 rounded-2xl px-2.5 py-1.5">
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, -1))}
            aria-label="Bulan sebelumnya"
            className="w-8 h-8 rounded-xl bg-white hover:bg-sky-100/60 text-ink flex items-center justify-center transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs sm:text-sm font-bold text-ink px-2 capitalize min-w-[125px] text-center">
            {formatBulanTahun(month)}
          </span>

          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            aria-label="Bulan berikutnya"
            className="w-8 h-8 rounded-xl bg-white hover:bg-sky-100/60 text-ink flex items-center justify-center transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Baris Bawah: Chip Tipe & Dropdown Kategori */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Chip Tipe Transaksi */}
        <div className="inline-flex p-1 rounded-2xl bg-sky-50 border border-sky-100 self-start">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'expense', label: 'Pengeluaran' },
              { id: 'income', label: 'Pemasukan' },
            ] as const
          ).map((tab) => {
            const active = type === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onTypeChange(tab.id);
                  onCategoryChange('all');
                }}
                className="relative px-3.5 py-1.5 rounded-xl text-xs font-semibold outline-none transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="filter-type-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-xl bg-white shadow-sm"
                  />
                )}
                <span
                  className={`relative z-10 ${
                    active ? 'text-sky-600' : 'text-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pilih Kategori */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-sky-500 shrink-0" />
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter kategori"
            className="h-10 rounded-2xl bg-white/85 border border-sky-100 px-3.5 text-xs font-semibold text-ink outline-none focus:border-sky-400 focus:shadow-glow"
          >
            <option value="all">Semua kategori</option>
            {visibleCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;