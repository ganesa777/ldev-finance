import React from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { getCategoryIcon } from '../../lib/categories';
import { formatRupiah, formatTanggal } from '../../lib/format';
import type { Transaction } from '../../types';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (trx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const Icon = getCategoryIcon(transaction.category?.icon);
  const color = transaction.category?.color ?? '#0EA5E9';
  const isIncome = transaction.type === 'income';

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x < -85) {
      navigator.vibrate?.(12);
      onDelete(transaction.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, backgroundColor: '#E0F2FE' }}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: 'rgba(255,255,255,0)',
      }}
      exit={{ opacity: 0, scale: 0.92, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-expense/90 rounded-2xl flex items-center justify-end pr-5 text-white md:hidden"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Trash2 className="w-4 h-4" />
          <span>Hapus</span>
        </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0.05 }}
        onDragEnd={handleDragEnd}
        onClick={() => onEdit(transaction)}
        className="group relative z-10 bg-white/80 hover:bg-white backdrop-blur-md border border-white/90 hover:border-sky-200 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${color}24`,
              color,
            }}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-ink truncate">
              {transaction.category?.name ?? 'Lainnya'}
            </p>
            <p className="text-xs text-muted truncate mt-0.5">
              {transaction.note
                ? `${transaction.note} · ${formatTanggal(transaction.trx_date, 'd MMM yyyy')}`
                : formatTanggal(transaction.trx_date, 'd MMM yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className={`text-sm sm:text-base font-extrabold tabular-nums ${
              isIncome ? 'text-income' : 'text-expense'
            }`}
          >
            {isIncome ? '+' : '−'}
            {formatRupiah(transaction.amount)}
          </span>

          <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(transaction);
              }}
              aria-label="Ubah transaksi"
              className="p-2 rounded-xl text-muted hover:text-sky-600 hover:bg-sky-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(transaction.id);
              }}
              aria-label="Hapus transaksi"
              className="p-2 rounded-xl text-muted hover:text-expense hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TransactionItem;