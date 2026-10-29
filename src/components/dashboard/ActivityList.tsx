import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Plus, Receipt, Trash2 } from 'lucide-react';
import { getCategoryIcon } from '../../lib/categories';
import { formatRupiah, formatTanggal } from '../../lib/format';
import { Button } from '../ui/Button';
import type { Transaction } from '../../types';

interface ActivityListProps {
  transactions: Transaction[];
  loading?: boolean;
  selectedDate?: string | null;
  onAddClick: () => void;
  onEditClick?: (trx: Transaction) => void;
  onDeleteClick?: (id: string) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  transactions,
  loading = false,
  selectedDate,
  onAddClick,
  onEditClick,
  onDeleteClick,
}) => {
  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-5 space-y-3">
        <div className="h-5 w-36 rounded-full shimmer" />
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-14 w-full rounded-2xl shimmer" />
        ))}
      </div>
    );
  }

  const recentItems = transactions.slice(0, 5);

  return (
    <div className="glass-card rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-ink">Aktivitas terbaru</h3>
          <p className="text-xs text-muted">
            {selectedDate
              ? `Filter: ${formatTanggal(selectedDate, 'd MMM yyyy')}`
              : '5 transaksi terakhir'}
          </p>
        </div>

        <Link
          to="/transaksi"
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
        >
          Lihat semua <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {recentItems.length === 0 ? (
        <div className="py-8 px-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 mx-auto flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Belum ada transaksi</p>
            <p className="text-xs text-muted">
              Catat pengeluaran atau pemasukan pertamamu hari ini.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onAddClick}
          >
            Tambah transaksi
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false} mode="popLayout">
            {recentItems.map((trx) => {
              const Icon = getCategoryIcon(trx.category?.icon);
              const color = trx.category?.color ?? '#0EA5E9';
              const isIncome = trx.type === 'income';

              return (
                <motion.div
                  key={trx.id}
                  layout
                  initial={{ opacity: 0, y: -12, backgroundColor: '#E0F2FE' }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    backgroundColor: 'rgba(255,255,255,0.6)',
                  }}
                  exit={{ opacity: 0, scale: 0.92, height: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => onEditClick?.(trx)}
                  className="group p-3 rounded-2xl border border-white/80 hover:border-sky-200 flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${color}24`,
                        color,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {trx.category?.name ?? 'Lainnya'}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {trx.note
                          ? `${trx.note} · ${formatTanggal(trx.trx_date, 'd MMM')}`
                          : formatTanggal(trx.trx_date, 'd MMM yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isIncome ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {formatRupiah(trx.amount)}
                    </span>

                    {onDeleteClick && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(trx.id);
                        }}
                        aria-label="Hapus transaksi"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl text-muted hover:text-expense hover:bg-rose-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ActivityList;