import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Calendar, FileText, Loader2 } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useTransactions } from '../../hooks/useTransactions';
import { getCategoryIcon } from '../../lib/categories';
import { formatRibuan, parseRupiahInput } from '../../lib/format';
import { spring } from '../../lib/motion';
import type { Transaction, TxType } from '../../types';

interface TransactionFormProps {
  defaultType?: TxType;
  initialData?: Transaction | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CONFETTI_COLORS = ['#10B981', '#38BDF8', '#F59E0B', '#0EA5E9', '#34D399', '#7DD3FC'];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  defaultType = 'expense',
  initialData = null,
  onSuccess,
  onCancel,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { categories, isLoading: catLoading } = useCategories();
  const { addTransaction, updateTransaction } = useTransactions();

  const [type, setType] = useState<TxType>(
    initialData ? initialData.type : defaultType
  );
  const [rawAmount, setRawAmount] = useState<string>(
    initialData ? formatRibuan(initialData.amount) : ''
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    initialData?.category_id ?? null
  );
  const [trxDate, setTrxDate] = useState<string>(
    initialData?.trx_date ?? format(new Date(), 'yyyy-MM-dd')
  );
  const [note, setNote] = useState<string>(initialData?.note ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState<number>(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle');
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  // Pilih kategori pertama secara otomatis bila belum ada yang dipilih atau tipe berganti
  useEffect(() => {
    if (filteredCategories.length === 0) {
      setCategoryId(null);
      return;
    }
    const exists = filteredCategories.some((c) => c.id === categoryId);
    if (!exists) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, categoryId]);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShakeKey((prev) => prev + 1);
    navigator.vibrate?.(15);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saveState !== 'idle') return;

    const numericAmount = parseRupiahInput(rawAmount);
    if (numericAmount <= 0) {
      triggerError('Masukkan nominal transaksi lebih dari Rp 0.');
      return;
    }

    if (!categoryId && filteredCategories.length > 0) {
      triggerError('Pilih salah satu kategori terlebih dahulu.');
      return;
    }

    if (!trxDate) {
      triggerError('Tanggal transaksi wajib diisi.');
      return;
    }

    setErrorMsg(null);
    setSaveState('saving');

    try {
      if (initialData) {
        await updateTransaction.mutateAsync({
          id: initialData.id,
          type,
          amount: numericAmount,
          category_id: categoryId,
          trx_date: trxDate,
          note: note.trim() || null,
        });
      } else {
        await addTransaction.mutateAsync({
          type,
          amount: numericAmount,
          category_id: categoryId,
          trx_date: trxDate,
          note: note.trim() || null,
        });
      }

      setSaveState('success');
      navigator.vibrate?.(10);

      if (type === 'income' && !shouldReduceMotion) {
        setShowConfetti(true);
      }

      window.setTimeout(() => {
        onSuccess();
      }, 650);
    } catch {
      setSaveState('idle');
      triggerError('Gagal menyimpan transaksi. Periksa koneksi internetmu.');
    }
  };

  const isExpense = type === 'expense';

  return (
    <form onSubmit={handleSubmit} className="relative space-y-5" noValidate>
      {/* Konfeti kecil saat menyimpan pemasukan (DESIGN.md 7.2 #14) */}
      <AnimatePresence>
        {showConfetti && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden z-30 flex items-center justify-center"
          >
            {Array.from({ length: 18 }).map((_, i) => {
              const angle = (i / 18) * Math.PI * 2;
              const distance = 70 + (i % 3) * 35;
              const tx = Math.cos(angle) * distance;
              const ty = Math.sin(angle) * distance - 30;
              const bg = CONFETTI_COLORS[i % CONFETTI_COLORS.length];

              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 1, x: 0, y: 20, scale: 0.4, rotate: 0 }}
                  animate={{
                    opacity: 0,
                    x: tx,
                    y: ty,
                    scale: 1.1,
                    rotate: i * 45,
                  }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                  style={{ backgroundColor: bg }}
                  className="absolute w-2.5 h-2.5 rounded-full"
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* 1. Segmented Toggle Pengeluaran | Pemasukan (pil bergeser dengan layoutId) */}
      <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-sky-50/90 border border-sky-100">
        {(['expense', 'income'] as const).map((itemType) => {
          const active = type === itemType;
          const label = itemType === 'expense' ? 'Pengeluaran' : 'Pemasukan';
          return (
            <button
              key={itemType}
              type="button"
              onClick={() => {
                setType(itemType);
                setErrorMsg(null);
              }}
              className="relative py-2.5 rounded-xl text-xs font-bold outline-none transition-colors"
            >
              {active && (
                <motion.span
                  layoutId="tx-form-type-pill"
                  transition={spring}
                  className={`absolute inset-0 rounded-xl shadow-sm ${
                    itemType === 'expense'
                      ? 'bg-rose-500 text-white'
                      : 'bg-emerald-500 text-white'
                  }`}
                />
              )}
              <span
                className={`relative z-10 ${
                  active ? 'text-white' : 'text-muted hover:text-ink'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Input Nominal Besar Berformat Rupiah Otomatis */}
      <motion.div
        key={shakeKey}
        animate={
          errorMsg ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }
        }
        transition={{ duration: 0.4 }}
        className={`p-4 rounded-3xl border transition-all ${
          errorMsg
            ? 'bg-rose-50/60 border-expense'
            : isExpense
            ? 'bg-rose-50/35 border-rose-200/80 focus-within:border-expense focus-within:bg-white'
            : 'bg-emerald-50/35 border-emerald-200/80 focus-within:border-income focus-within:bg-white'
        }`}
      >
        <label className="block text-xs font-semibold text-muted mb-1">
          Nominal {isExpense ? 'pengeluaran' : 'pemasukan'}
        </label>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-xl font-extrabold ${
              isExpense ? 'text-expense' : 'text-income'
            }`}
          >
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={rawAmount}
            onChange={(e) => {
              const num = parseRupiahInput(e.target.value);
              setRawAmount(num > 0 ? formatRibuan(num) : '');
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="0"
            className={`w-full bg-transparent text-3xl sm:text-4xl font-extrabold outline-none tabular-nums tracking-tight ${
              isExpense ? 'text-expense placeholder-rose-300' : 'text-income placeholder-emerald-300'
            }`}
          />
        </div>
      </motion.div>

      {/* 3. Pilihan Kategori Grid Ikon */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-muted">
          Pilih kategori
        </label>

        {catLoading ? (
          <div className="grid grid-cols-4 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-16 rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 max-h-[196px] overflow-y-auto pr-1">
            {filteredCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              const selected = categoryId === cat.id;

              return (
                <motion.button
                  key={cat.id}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setCategoryId(cat.id)}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all outline-none ${
                    selected
                      ? 'bg-sky-50 border-sky-400 shadow-glow'
                      : 'bg-white/70 border-sky-100 hover:bg-white'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${cat.color}22`,
                      color: cat.color,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[11px] leading-tight truncate max-w-full ${
                      selected ? 'font-bold text-ink' : 'font-medium text-muted'
                    }`}
                  >
                    {cat.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Tanggal & Catatan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted">Tanggal</label>
          <div className="flex items-center h-12 rounded-2xl bg-white/80 border border-sky-100 px-3.5 focus-within:border-sky-400 focus-within:shadow-glow">
            <Calendar className="w-4 h-4 text-sky-500 mr-2.5 shrink-0" />
            <input
              type="date"
              value={trxDate}
              onChange={(e) => setTrxDate(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-ink outline-none"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted">
            Catatan (opsional)
          </label>
          <div className="flex items-center h-12 rounded-2xl bg-white/80 border border-sky-100 px-3.5 focus-within:border-sky-400 focus-within:shadow-glow">
            <FileText className="w-4 h-4 text-muted mr-2.5 shrink-0" />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Makan siang, bensin, dll."
              className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted/60"
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold text-expense text-center"
        >
          {errorMsg}
        </motion.p>
      )}

      {/* 5. Tombol Aksi (Spinner -> Centang Animasi SVG -> Tutup) */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saveState !== 'idle'}
          className="h-12 px-5 rounded-2xl bg-white/80 border border-sky-200 text-sm font-semibold text-sky-600 hover:bg-sky-50 transition-colors disabled:opacity-50"
        >
          Batal
        </button>

        <motion.button
          type="submit"
          whileHover={saveState === 'idle' ? { scale: 1.02 } : undefined}
          whileTap={saveState === 'idle' ? { scale: 0.96 } : undefined}
          disabled={saveState !== 'idle'}
          className={`flex-1 h-12 rounded-2xl text-white font-bold text-sm shadow-glass flex items-center justify-center gap-2 transition-all outline-none focus-visible:shadow-glow ${
            saveState === 'success' ? 'bg-income' : 'grad-sky'
          }`}
        >
          {saveState === 'saving' && (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Menyimpan...</span>
            </>
          )}

          {saveState === 'success' && (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5 stroke-white stroke-[3]"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </svg>
              <span>Tersimpan!</span>
            </>
          )}

          {saveState === 'idle' && (
            <span>
              {initialData ? 'Simpan perubahan' : 'Simpan transaksi'}
            </span>
          )}
        </motion.button>
      </div>
    </form>
  );
};

export default TransactionForm;