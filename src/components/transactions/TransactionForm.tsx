import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, FileText, Loader2, Check, Sparkles } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useTransactions } from '../../hooks/useTransactions';
import { getCategoryIcon } from '../../lib/categories';
import { formatRibuan, parseRupiahInput } from '../../lib/format';
import type { Transaction, TxType } from '../../types';

interface TransactionFormProps {
  defaultType?: TxType;
  initialData?: Transaction | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 1000000];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  defaultType = 'expense',
  initialData = null,
  onSuccess,
  onCancel,
}) => {
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
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle');

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saveState !== 'idle') return;

    const numericAmount = parseRupiahInput(rawAmount);
    if (numericAmount <= 0) {
      setErrorMsg('Masukkan nominal lebih dari Rp 0.');
      navigator.vibrate?.(15);
      return;
    }

    if (!trxDate) {
      setErrorMsg('Tanggal transaksi wajib diisi.');
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

      window.setTimeout(() => {
        onSuccess();
      }, 280);
    } catch {
      setSaveState('idle');
      setErrorMsg('Gagal menyimpan transaksi.');
    }
  };

  const isExpense = type === 'expense';

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      {/* 1. Toggle Pengeluaran | Pemasukan (Ringan & Responsif Instan) */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-sky-50 border border-sky-100">
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
              className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                active
                  ? itemType === 'expense'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-emerald-500 text-white shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 2. Input Nominal + Tombol Nominal Cepat (Termasuk 1 Juta) */}
      <div
        className={`p-3.5 rounded-2xl border transition-colors ${
          errorMsg
            ? 'bg-rose-50/60 border-expense'
            : isExpense
            ? 'bg-rose-50/35 border-rose-200 focus-within:bg-white'
            : 'bg-emerald-50/35 border-emerald-200 focus-within:bg-white'
        }`}
      >
        <label className="block text-[11px] font-semibold text-muted mb-0.5">
          Nominal {isExpense ? 'pengeluaran' : 'pemasukan'}
        </label>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-lg font-extrabold ${
              isExpense ? 'text-expense' : 'text-income'
            }`}
          >
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={rawAmount}
            onChange={(e) => {
              const num = parseRupiahInput(e.target.value);
              setRawAmount(num > 0 ? formatRibuan(num) : '');
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="0"
            className={`w-full bg-transparent text-2xl sm:text-3xl font-extrabold outline-none tabular-nums ${
              isExpense
                ? 'text-expense placeholder-rose-300'
                : 'text-income placeholder-emerald-300'
            }`}
          />
        </div>

        {/* Pil Nominal Cepat */}
        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-sky-100/80">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => {
                setRawAmount(formatRibuan(amt));
                if (amt === 1000000 && !note) {
                  setNote(
                    type === 'income' ? 'Uang bulanan' : 'Pengeluaran bulanan'
                  );
                }
                setErrorMsg(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-white border border-sky-100 text-[11px] font-bold text-sky-700 hover:bg-sky-50 active:scale-95 transition-transform flex items-center gap-1"
            >
              {amt === 1000000 && <Sparkles className="w-3 h-3 text-sky-500" />}
              {amt >= 1000000 ? '1 Jt' : `${amt / 1000}rb`}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Pilihan Kategori (Ringkas 4 Kolom) */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold text-muted">
          Pilih kategori
        </label>

        {catLoading ? (
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-14 rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 max-h-[132px] overflow-y-auto pr-1">
            {filteredCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              const selected = categoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 outline-none ${
                    selected
                      ? 'bg-sky-50 border-sky-400 shadow-glow'
                      : 'bg-white border-sky-100'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${cat.color}22`,
                      color: cat.color,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[10px] leading-tight truncate max-w-full ${
                      selected ? 'font-bold text-ink' : 'font-medium text-muted'
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Tanggal & Catatan Sebaris di HP agar Hemat Ruang */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted">Tanggal</label>
          <div className="flex items-center h-10 rounded-xl bg-white border border-sky-100 px-2.5 focus-within:border-sky-400">
            <Calendar className="w-3.5 h-3.5 text-sky-500 mr-1.5 shrink-0" />
            <input
              type="date"
              value={trxDate}
              onChange={(e) => setTrxDate(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-ink outline-none"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted">
            Catatan
          </label>
          <div className="flex items-center h-10 rounded-xl bg-white border border-sky-100 px-2.5 focus-within:border-sky-400">
            <FileText className="w-3.5 h-3.5 text-muted mr-1.5 shrink-0" />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Makan, bensin..."
              className="w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-muted/60"
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs font-semibold text-expense text-center">
          {errorMsg}
        </p>
      )}

      {/* 5. STICKY FOOTER TOMBOL SIMPAN — Selalu Muncul & Mudah Ditekan di HP */}
      <div className="sticky bottom-0 -mx-5 px-5 pt-2.5 pb-1 bg-white/95 border-t border-sky-100 flex items-center gap-2.5 z-20">
        <button
          type="button"
          onClick={onCancel}
          disabled={saveState !== 'idle'}
          className="h-11 px-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700 active:scale-95 transition-transform disabled:opacity-50"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={saveState !== 'idle'}
          className={`flex-1 h-11 rounded-2xl text-white font-bold text-sm shadow-glass flex items-center justify-center gap-2 active:scale-95 transition-all outline-none ${
            saveState === 'success' ? 'bg-income' : 'grad-sky'
          }`}
        >
          {saveState === 'saving' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          )}

          {saveState === 'success' && (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Tersimpan!</span>
            </>
          )}

          {saveState === 'idle' && (
            <span>
              {initialData ? 'Simpan perubahan' : 'Simpan transaksi'}
            </span>
          )}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;