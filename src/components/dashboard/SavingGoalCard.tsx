import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { Orb3D } from './Orb3D';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  formatRupiah,
  formatRibuan,
  parseRupiahInput,
} from '../../lib/format';
import type { SavingGoal } from '../../types';

interface SavingGoalCardProps {
  goal: SavingGoal | null;
  loading?: boolean;
  onSaveGoal: (input: {
    id?: string;
    name: string;
    target: number;
    saved: number;
  }) => Promise<unknown>;
}

export const SavingGoalCard: React.FC<SavingGoalCardProps> = ({
  goal,
  loading = false,
  onSaveGoal,
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetRaw, setTargetRaw] = useState('');
  const [savedRaw, setSavedRaw] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <div className="rounded-3xl h-[190px] shimmer shadow-glass" />;
  }

  const pct =
    goal && goal.target > 0
      ? Math.min(100, Math.round((goal.saved / goal.target) * 100))
      : 0;

  const handleOpenModal = () => {
    setName(goal?.name ?? 'Dana Darurat');
    setTargetRaw(goal?.target ? formatRibuan(goal.target) : '10.000.000');
    setSavedRaw(goal?.saved ? formatRibuan(goal.saved) : '0');
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseRupiahInput(targetRaw);
    const savedNum = parseRupiahInput(savedRaw);
    if (!name.trim() || targetNum <= 0) return;

    setSaving(true);
    try {
      await onSaveGoal({
        id: goal?.id,
        name,
        target: targetNum,
        saved: savedNum,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        className="glass-card rounded-3xl p-5 relative overflow-hidden flex items-center justify-between gap-3 min-h-[190px]"
      >
        {/* Objek 3D Spiral Sky di Kiri/Kanan seperti foto referensi */}
        <div className="shrink-0">
          <Orb3D variant="ribbon" size={88} />
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-sky-500 shrink-0" />
            <span className="text-xs font-semibold text-sky-600">
              Capai targetmu
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-ink truncate">
              {goal ? goal.name : 'Target Tabungan'}
            </h3>
            <p className="text-xs text-muted tabular-nums mt-0.5">
              {goal
                ? `${formatRupiah(goal.saved)} / ${formatRupiah(goal.target)}`
                : 'Atur target tabungan impianmu.'}
            </p>
          </div>

          {goal && (
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-sky-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full grad-sky"
                />
              </div>
              <p className="text-[11px] font-bold text-sky-600 text-right tabular-nums">
                {pct}% tercapai
              </p>
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleOpenModal}
          >
            {goal ? 'Perbarui target' : 'Atur target'}
          </Button>
        </div>
      </motion.div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Target Tabungan LDEV"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Target (misal: Dana Darurat / MacBook)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted">
              Target Nominal (Rp)
            </label>
            <div className="flex items-center h-[52px] rounded-2xl bg-white border border-sky-100 px-4 focus-within:border-sky-400 focus-within:shadow-glow">
              <span className="text-sm font-bold text-muted mr-2">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={targetRaw}
                onChange={(e) => {
                  const n = parseRupiahInput(e.target.value);
                  setTargetRaw(n > 0 ? formatRibuan(n) : '');
                }}
                className="w-full bg-transparent text-base font-bold text-ink outline-none tabular-nums"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted">
              Sudah Terkumpul Saat Ini (Rp)
            </label>
            <div className="flex items-center h-[52px] rounded-2xl bg-white border border-sky-100 px-4 focus-within:border-sky-400 focus-within:shadow-glow">
              <span className="text-sm font-bold text-muted mr-2">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={savedRaw}
                onChange={(e) => {
                  const n = parseRupiahInput(e.target.value);
                  setSavedRaw(n >= 0 ? formatRibuan(n) : '0');
                }}
                className="w-full bg-transparent text-base font-bold text-ink outline-none tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Simpan target
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default SavingGoalCard;