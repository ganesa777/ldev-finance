import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  User,
  Wallet,
  Tags,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  LogOut,
  Sparkles,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTransactionModal } from '../components/layout/AppShell';
import { useBudget } from '../hooks/useBudget';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import { useToast } from '../components/ui/Toast';
import {
  AVAILABLE_ICON_NAMES,
  CATEGORY_COLORS,
  getCategoryIcon,
} from '../lib/categories';
import { calculateSummary } from '../lib/stats';
import {
  formatRibuan,
  formatRupiah,
  formatTanggal,
  parseRupiahInput,
} from '../lib/format';
import { container, item } from '../lib/motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import type { Category, TxType } from '../types';

export const Settings: React.FC = () => {
  const { user, displayName, updateDisplayName, signOut } = useAuth();
  const { openTransactionModal } = useTransactionModal();
  const { showToast } = useToast();
  const { budgetAmount, saveBudget } = useBudget(new Date());
  const {
    categories,
    isLoading: catLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    restoreDefaultCategories,
  } = useCategories();

  const {
    transactions,
    addTransaction,
    deleteTransaction,
    clearAllTransactions,
  } = useTransactions();

  const summary = useMemo(
    () => calculateSummary(transactions),
    [transactions]
  );

  // State Profil
  const [nameInput, setNameInput] = useState(displayName);
  const [savingProfile, setSavingProfile] = useState(false);

  // State Anggaran
  const [budgetRaw, setBudgetRaw] = useState('1.000.000');
  const [savingBudgetState, setSavingBudgetState] = useState(false);

  // State Koreksi Saldo Manual
  const [targetBalanceRaw, setTargetBalanceRaw] = useState('');
  const [adjustingBalance, setAdjustingBalance] = useState(false);

  // State Konfirmasi Reset Saldo
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // State Kelola Kategori
  const [catTab, setCatTab] = useState<TxType>('expense');
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<TxType>('expense');
  const [catIcon, setCatIcon] = useState('Wallet');
  const [catColor, setCatColor] = useState('#38BDF8');

  // State Konfirmasi Keluar
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  useEffect(() => {
    setNameInput(displayName);
  }, [displayName]);

  useEffect(() => {
    setBudgetRaw(
      budgetAmount > 0 ? formatRibuan(budgetAmount) : formatRibuan(1000000)
    );
  }, [budgetAmount]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setSavingProfile(true);
    const { error } = await updateDisplayName(nameInput);
    setSavingProfile(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Nama profil berhasil diperbarui.', 'success');
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseRupiahInput(budgetRaw);
    setSavingBudgetState(true);
    try {
      await saveBudget.mutateAsync(numeric > 0 ? numeric : 1000000);
    } finally {
      setSavingBudgetState(false);
    }
  };

  // Fitur 1-Klik: Klaim Jatah Uang Bulanan Rp 1.000.000
  const handleAddMonthlyAllowance = async () => {
    const incomeCategory =
      categories.find((c) => c.type === 'income') ?? null;

    await addTransaction.mutateAsync({
      type: 'income',
      amount: 1000000,
      category_id: incomeCategory?.id ?? null,
      trx_date: format(new Date(), 'yyyy-MM-dd'),
      note: 'Jatah Uang Bulanan (Rp 1.000.000)',
    });

    await saveBudget.mutateAsync(1000000);
    showToast('Jatah bulanan Rp 1.000.000 berhasil ditambahkan ke saldo!', 'success');
  };

  // Fitur Koreksi Saldo Langsung jika Ada Salah Hitung
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const desiredBalance = parseRupiahInput(targetBalanceRaw);
    const diff = desiredBalance - summary.balance;

    if (diff === 0) {
      showToast('Saldo saat ini sudah sama dengan nominal tersebut.', 'info');
      return;
    }

    setAdjustingBalance(true);
    try {
      const isIncome = diff > 0;
      const matchedCat =
        categories.find((c) => c.type === (isIncome ? 'income' : 'expense')) ??
        null;

      await addTransaction.mutateAsync({
        type: isIncome ? 'income' : 'expense',
        amount: Math.abs(diff),
        category_id: matchedCat?.id ?? null,
        trx_date: format(new Date(), 'yyyy-MM-dd'),
        note: 'Koreksi / Penyesuaian Saldo Manual',
      });

      setTargetBalanceRaw('');
      showToast(
        `Saldo berhasil disesuaikan menjadi ${formatRupiah(desiredBalance)}!`,
        'success'
      );
    } finally {
      setAdjustingBalance(false);
    }
  };

  const openAddCategory = () => {
    setEditingCat(null);
    setCatName('');
    setCatType(catTab);
    setCatIcon('Wallet');
    setCatColor('#0EA5E9');
    setCatModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatIcon(cat.icon);
    setCatColor(cat.color);
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCat) {
      await updateCategory.mutateAsync({
        id: editingCat.id,
        name: catName.trim(),
        type: catType,
        icon: catIcon,
        color: catColor,
      });
    } else {
      await addCategory.mutateAsync({
        name: catName.trim(),
        type: catType,
        icon: catIcon,
        color: catColor,
      });
    }
    setCatModalOpen(false);
  };

  const handleConfirmLogout = async () => {
    await signOut();
    setLogoutModalOpen(false);
    showToast('Kamu telah keluar dari LDEV.', 'info');
  };

  const filteredCategories = categories.filter((c) => c.type === catTab);
  const recentTransactions = transactions.slice(0, 8);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5 max-w-4xl"
    >
      {/* Header Halaman */}
      <motion.div
        variants={item}
        className="glass-card rounded-3xl p-5 md:p-6 flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-ink">Pengaturan</h1>
          <p className="text-sm text-muted">
            Atur jatah bulanan Rp 1 juta, koreksi data/saldo, dan kelola kategori.
          </p>
        </div>

        <Button
          variant="danger"
          leftIcon={<LogOut className="w-4 h-4" />}
          onClick={() => setLogoutModalOpen(true)}
        >
          Keluar
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Kartu Profil Pengguna */}
        <motion.div
          variants={item}
          className="glass-card rounded-3xl p-5 md:p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl grad-sky text-white flex items-center justify-center shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Profil saya</h2>
              <p className="text-xs text-muted">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <Input
              label="Nama panggilan"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingProfile}
            >
              Simpan nama
            </Button>
          </form>
        </motion.div>

        {/* 2. Kartu Jatah & Anggaran Bulanan (Otomatis Rp 1.000.000) */}
        <motion.div
          variants={item}
          className="glass-card rounded-3xl p-5 md:p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">
                  Jatah & Anggaran Bulanan
                </h2>
                <p className="text-xs text-muted">
                  Saat ini: {formatRupiah(budgetAmount)} / bulan
                </p>
              </div>
            </div>
          </div>

          {/* Tombol 1-Klik Masuk Uang Bulanan Rp 1.000.000 */}
          <div className="p-3 rounded-2xl bg-sky-50/90 border border-sky-200 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-ink">
                Jatah Bulanan Rp 1.000.000
              </p>
              <p className="text-[11px] text-muted">
                Klik untuk langsung menambah Rp 1 juta ke saldo bulan ini
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              loading={addTransaction.isPending}
              onClick={handleAddMonthlyAllowance}
            >
              + Rp 1 Juta
            </Button>
          </div>

          <form onSubmit={handleSaveBudget} className="space-y-3">
            <div className="flex items-center h-[48px] rounded-2xl bg-white border border-sky-100 px-4 focus-within:border-sky-400">
              <span className="text-sm font-bold text-muted mr-2">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={budgetRaw}
                onChange={(e) => {
                  const n = parseRupiahInput(e.target.value);
                  setBudgetRaw(n > 0 ? formatRibuan(n) : '');
                }}
                placeholder="1.000.000"
                className="w-full bg-transparent text-base font-extrabold text-ink outline-none tabular-nums"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingBudgetState}
            >
              Simpan anggaran
            </Button>
          </form>
        </motion.div>
      </div>

      {/* 3. BARU: Kartu Koreksi Saldo, Edit Data Salah & Hapus/Reset Saldo */}
      <motion.div
        variants={item}
        className="glass-card rounded-3xl p-5 md:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">
                Kelola Data & Koreksi Saldo
              </h2>
              <p className="text-xs text-muted">
                Saldo saat ini:{' '}
                <strong className="text-ink">{formatRupiah(summary.balance)}</strong>{' '}
                · Ubah atau hapus jika ada data yang salah
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={() => setResetModalOpen(true)}
          >
            Hapus / Reset Semua Saldo
          </Button>
        </div>

        {/* Form Ubah / Sesuaikan Saldo Langsung */}
        <form
          onSubmit={handleAdjustBalance}
          className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-3"
        >
          <label className="block text-xs font-bold text-ink">
            Ubah / Sesuaikan Total Saldo Sekarang
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 flex items-center h-11 rounded-xl bg-white border border-sky-200 px-3.5 focus-within:border-sky-400">
              <span className="text-sm font-bold text-muted mr-2">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={targetBalanceRaw}
                onChange={(e) => {
                  const n = parseRupiahInput(e.target.value);
                  setTargetBalanceRaw(
                    e.target.value === '0'
                      ? '0'
                      : n > 0
                      ? formatRibuan(n)
                      : ''
                  );
                }}
                placeholder="Ketik saldo yang benar (mis. 850.000)"
                className="w-full bg-transparent text-sm font-extrabold text-ink outline-none tabular-nums"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={adjustingBalance}
            >
              Terapkan Saldo
            </Button>
          </div>
        </form>

        {/* Daftar Transaksi Terakhir untuk Diedit / Dihapus Langsung */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-ink">
              Transaksi Terakhir (Ketuk Pensil untuk Edit atau Tong Sampah untuk Hapus)
            </p>
            <span className="text-[11px] text-muted">
              Total {transactions.length} data
            </span>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center bg-white/60 rounded-2xl border border-sky-100">
              Belum ada data transaksi tercatat.
            </p>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {recentTransactions.map((trx) => {
                const isInc = trx.type === 'income';
                return (
                  <div
                    key={trx.id}
                    className="p-3 rounded-2xl bg-white border border-sky-100 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">
                        {trx.note || trx.category?.name || 'Transaksi'}
                      </p>
                      <p className="text-[11px] text-muted">
                        {formatTanggal(trx.trx_date, 'd MMM yyyy')} ·{' '}
                        <span
                          className={`font-bold ${
                            isInc ? 'text-income' : 'text-expense'
                          }`}
                        >
                          {isInc ? '+' : '−'}
                          {formatRupiah(trx.amount)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openTransactionModal(trx.type, trx)}
                        className="px-2.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTransaction.mutate(trx.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-expense text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* 4. Kelola Kategori */}
      <motion.div
        variants={item}
        className="glass-card rounded-3xl p-5 md:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Kelola kategori</h2>
              <p className="text-xs text-muted">
                Tambah, ubah ikon & warna, atau hapus kategori transaksi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              loading={restoreDefaultCategories.isPending}
              onClick={() => restoreDefaultCategories.mutate()}
            >
              Pulihkan bawaan
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={openAddCategory}
            >
              Tambah kategori
            </Button>
          </div>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-sky-50 border border-sky-100">
          {(['expense', 'income'] as const).map((t) => {
            const active = catTab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setCatTab(t)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  active
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
              </button>
            );
          })}
        </div>

        {catLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-2xl bg-white border border-sky-100 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.color}22`,
                        color: cat.color,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-ink truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditCategory(cat)}
                      aria-label={`Ubah kategori ${cat.name}`}
                      className="p-2 rounded-xl text-muted hover:text-sky-600 hover:bg-sky-50"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory.mutate(cat.id)}
                      aria-label={`Hapus kategori ${cat.name}`}
                      className="p-2 rounded-xl text-muted hover:text-expense hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Modal Konfirmasi Hapus / Reset Semua Saldo & Transaksi */}
      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Hapus & Reset Semua Saldo?"
        maxWidthClass="max-w-sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50 text-expense text-xs font-semibold">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              Semua riwayat transaksi akan dihapus dan total saldo akan kembali menjadi Rp 0.
            </span>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setResetModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={clearAllTransactions.isPending}
              onClick={async () => {
                await clearAllTransactions.mutateAsync();
                setResetModalOpen(false);
              }}
            >
              Ya, Reset ke Rp 0
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Tambah / Ubah Kategori */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Nama kategori"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted">
              Tipe kategori
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCatType(t)}
                  className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                    catType === t
                      ? 'bg-sky-50 border-sky-400 text-sky-700'
                      : 'bg-white border-sky-100 text-muted'
                  }`}
                >
                  {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted">
              Pilih warna
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setCatColor(hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    catColor === hex ? 'scale-110 ring-4 ring-sky-200' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted">
              Pilih ikon
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1">
              {AVAILABLE_ICON_NAMES.map((iconName) => {
                const IconComp = getCategoryIcon(iconName);
                const selected = catIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setCatIcon(iconName)}
                    className={`h-11 rounded-2xl border flex items-center justify-center ${
                      selected
                        ? 'bg-sky-50 border-sky-400'
                        : 'bg-white border-sky-100'
                    }`}
                  >
                    <IconComp
                      className="w-5 h-5"
                      style={{ color: selected ? catColor : '#0F2A43' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCatModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={addCategory.isPending || updateCategory.isPending}
            >
              Simpan kategori
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Keluar */}
      <Modal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Keluar dari LDEV?"
        maxWidthClass="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Kamu harus masuk kembali dengan email dan kata sandi untuk mengakses data keuanganmu.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLogoutModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={handleConfirmLogout}
            >
              Ya, keluar
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default Settings;