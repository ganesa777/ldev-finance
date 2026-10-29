import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBudget } from '../hooks/useBudget';
import { useCategories } from '../hooks/useCategories';
import { useToast } from '../components/ui/Toast';
import {
  AVAILABLE_ICON_NAMES,
  CATEGORY_COLORS,
  getCategoryIcon,
} from '../lib/categories';
import {
  formatRibuan,
  formatRupiah,
  parseRupiahInput,
} from '../lib/format';
import { container, item, spring } from '../lib/motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import type { Category, TxType } from '../types';

export const Settings: React.FC = () => {
  const { user, displayName, updateDisplayName, signOut } = useAuth();
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

  // State Profil
  const [nameInput, setNameInput] = useState(displayName);
  const [savingProfile, setSavingProfile] = useState(false);

  // State Anggaran
  const [budgetRaw, setBudgetRaw] = useState('');
  const [savingBudgetState, setSavingBudgetState] = useState(false);

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
    setBudgetRaw(budgetAmount > 0 ? formatRibuan(budgetAmount) : '');
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
      await saveBudget.mutateAsync(numeric);
    } finally {
      setSavingBudgetState(false);
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
            Sesuaikan profil, anggaran bulanan, dan daftar kategori LDEV.
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

        {/* 2. Kartu Anggaran Bulanan */}
        <motion.div
          variants={item}
          className="glass-card rounded-3xl p-5 md:p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Anggaran bulanan</h2>
              <p className="text-xs text-muted">
                Saat ini:{' '}
                {budgetAmount > 0 ? formatRupiah(budgetAmount) : 'Belum diatur'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveBudget} className="space-y-3">
            <div className="flex items-center h-[52px] rounded-2xl bg-white/80 border border-sky-100 px-4 focus-within:border-sky-400 focus-within:shadow-glow">
              <span className="text-sm font-bold text-muted mr-2">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={budgetRaw}
                onChange={(e) => {
                  const n = parseRupiahInput(e.target.value);
                  setBudgetRaw(n > 0 ? formatRibuan(n) : '');
                }}
                placeholder="3.500.000"
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

      {/* 3. Kelola Kategori */}
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

        {/* Tab Tipe Kategori */}
        <div className="inline-flex p-1 rounded-2xl bg-sky-50 border border-sky-100">
          {(['expense', 'income'] as const).map((t) => {
            const active = catTab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setCatTab(t)}
                className="relative px-4 py-1.5 rounded-xl text-xs font-semibold outline-none"
              >
                {active && (
                  <motion.span
                    layoutId="settings-cat-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-xl bg-white shadow-sm"
                  />
                )}
                <span
                  className={`relative z-10 ${
                    active ? 'text-sky-600' : 'text-muted hover:text-ink'
                  }`}
                >
                  {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid Daftar Kategori */}
        {catLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-16 rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-2xl bg-white/75 border border-white/90 hover:border-sky-200 flex items-center justify-between gap-2 transition-all"
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
                      className="p-2 rounded-xl text-muted hover:text-sky-600 hover:bg-sky-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory.mutate(cat.id)}
                      aria-label={`Hapus kategori ${cat.name}`}
                      className="p-2 rounded-xl text-muted hover:text-expense hover:bg-rose-50 transition-colors"
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
                      ? 'bg-sky-50 border-sky-400 text-sky-700 shadow-glow'
                      : 'bg-white border-sky-100 text-muted'
                  }`}
                >
                  {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                </button>
              ))}
            </div>
          </div>

          {/* Pemilih Warna */}
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
                  aria-label={`Warna ${hex}`}
                  style={{ backgroundColor: hex }}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    catColor === hex
                      ? 'scale-110 ring-4 ring-sky-200'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Pemilih Ikon */}
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
                    className={`h-11 rounded-2xl border flex items-center justify-center transition-all ${
                      selected
                        ? 'bg-sky-50 border-sky-400 shadow-glow'
                        : 'bg-white border-sky-100 hover:bg-sky-50/50'
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