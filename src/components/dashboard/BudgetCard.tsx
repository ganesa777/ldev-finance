import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { formatRupiah, formatSingkat, parseRupiahInput, formatRibuan } from '../../lib/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface BudgetCardProps {
  budgetAmount: number;
  spentAmount: number;
  loading?: boolean;
  onSaveBudget: (amount: number) => Promise<unknown>;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budgetAmount,
  spentAmount,
  loading = false,
  onSaveBudget,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <div className="rounded-3xl h-[200px] shimmer shadow-glass" />;
  }

  const percentage =
    budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0;
  const clampedPct = Math.min(percentage, 100);

  // Warna otomatis berubah ke amber (>80%) atau rose (>100%) sesuai DESIGN.md 7.2 #12
  const barColorClass =
    percentage >= 100
      ? 'bg-expense'
      : percentage >= 80
      ? 'bg-warning'
      : 'grad-sky';

  const statusTextColor =
    percentage >= 100
      ? 'text-expense'
      : percentage >= 80
      ? 'text-amber-600'
      : 'text-sky-600';

  const handleOpenEdit = () => {
    setRawInput(budgetAmount > 0 ? formatRibuan(budgetAmount) : '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseRupiahInput(rawInput);
    setSaving(true);
    try {
      await onSaveBudget(numeric);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        className="glass-card rounded-3xl p-5 flex flex-col justify-between min-h-[200px]"
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-ink">Anggaran</h3>
            <p className="text-xs text-muted">Batas belanja bulan ini</p>
          </div>
          <button
            type="button"
            onClick={handleOpenEdit}
            aria-label="Atur anggaran bulanan"
            className="w-8 h-8 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 flex items-center justify-center transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Bar Vertikal Pastel ala Kartu Impact V18 */}
        <div className="flex items-end justify-between gap-4 my-3">
          <div className="space-y-1">
            <span className={`text-2xl font-extrabold tabular-nums ${statusTextColor}`}>
              {budgetAmount > 0 ? `${percentage}%` : 'Belum diatur'}
            </span>
            <p className="text-xs text-muted tabular-nums">
              Terpakai {formatRupiah(spentAmount)}
            </p>
            {budgetAmount > 0 && (
              <p className="text-[11px] font-medium text-ink/80 tabular-nums">
                dari {formatSingkat(budgetAmount)}
              </p>
            )}
          </div>

          {/* 4 Pilar Bar Vertikal */}
          <div className="flex items-end gap-2 h-20">
            {[0.4, 0.7, 1, 0.55].map((multiplier, idx) => {
              const barHeight =
                budgetAmount > 0
                  ? Math.max(18, Math.round(clampedPct * multiplier))
                  : 24;
              const isMainBar = idx === 2;
              return (
                <div
                  key={idx}
                  className="w-3.5 h-full rounded-full bg-sky-100/90 flex items-end overflow-hidden p-0.5"
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${barHeight}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.08 }}
                    className={`w-full rounded-full ${
                      isMainBar ? barColorClass : 'bg-sky-300/80'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar Horizontal */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded-full bg-sky-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${clampedPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${barColorClass}`}
            />
          </div>
          {budgetAmount === 0 && (
            <button
              type="button"
              onClick={handleOpenEdit}
              className="text-xs font-semibold text-sky-600 hover:underline"
            >
              + Tetapkan anggaran bulanan
            </button>
          )}
        </div>
      </motion.div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Atur Anggaran Bulanan"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted">
              Nominal Anggaran Bulan Ini (Rp)
            </label>
            <div className="flex items-center h-14 rounded-2xl bg-white border border-sky-200 px-4 focus-within:border-sky-400 focus-within:shadow-glow">
              <span className="text-base font-bold text-muted mr-2">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={rawInput}
                onChange={(e) => {
                  const num = parseRupiahInput(e.target.value);
                  setRawInput(num > 0 ? formatRibuan(num) : '');
                }}
                placeholder="3.500.000"
                className="w-full bg-transparent text-xl font-extrabold text-ink outline-none tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Simpan anggaran
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default BudgetCard;