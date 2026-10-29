import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  PieChart,
  User,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { TxType } from '../../types';

interface BottomBarProps {
  hidden?: boolean;
  onQuickAdd: (type: TxType) => void;
}

const LEFT_TABS = [
  { to: '/', label: 'Beranda', icon: LayoutDashboard },
  { to: '/transaksi', label: 'Transaksi', icon: ArrowLeftRight },
];

const RIGHT_TABS = [
  { to: '/laporan', label: 'Laporan', icon: PieChart },
  { to: '/pengaturan', label: 'Profil', icon: User },
];

export const BottomBar: React.FC<BottomBarProps> = ({
  hidden = false,
  onQuickAdd,
}) => {
  const location = useLocation();
  const [fabOpen, setFabOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        setKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setKeyboardOpen(false);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const toggleFab = () => {
    navigator.vibrate?.(8);
    setFabOpen((prev) => !prev);
  };

  const handleSelectType = (type: TxType) => {
    navigator.vibrate?.(8);
    setFabOpen(false);
    onQuickAdd(type);
  };

  const isBarHidden = hidden || keyboardOpen;

  const renderTab = (tab: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const Icon = tab.icon;
    const isActive =
      tab.to === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(tab.to);

    return (
      <NavLink
        key={tab.to}
        to={tab.to}
        onClick={() => setFabOpen(false)}
        aria-label={tab.label}
        className="relative h-full w-full flex items-center justify-center outline-none rounded-2xl select-none"
      >
        <div
          className={`relative w-[62px] h-[52px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-transform active:scale-90 ${
            isActive ? 'bg-sky-100/90' : ''
          }`}
        >
          <Icon
            className={`w-5 h-5 transition-colors ${
              isActive ? 'text-sky-500' : 'text-muted'
            }`}
          />
          <span
            className={`text-[10px] leading-none font-semibold transition-colors ${
              isActive ? 'text-sky-600' : 'text-muted'
            }`}
          >
            {tab.label}
          </span>
        </div>
      </NavLink>
    );
  };

  if (isBarHidden) return null;

  return (
    <>
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setFabOpen(false)}
            className="fixed inset-0 z-30 bg-ink/25 md:hidden"
          />
        )}
      </AnimatePresence>

      <nav
        aria-label="Navigasi Bawah Mobile"
        className="md:hidden fixed bottom-3 left-3 right-3 z-40 pb-safe"
      >
        <AnimatePresence>
          {fabOpen && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto">
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.16 }}
                onClick={() => handleSelectType('income')}
                className="bg-white rounded-2xl px-4 py-2.5 shadow-float flex items-center gap-2 border border-emerald-200 whitespace-nowrap active:scale-95 transition-transform"
              >
                <span className="w-7 h-7 rounded-xl bg-emerald-100 text-income flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-ink">Pemasukan</span>
              </motion.button>

              <motion.button
                type="button"
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.16 }}
                onClick={() => handleSelectType('expense')}
                className="bg-white rounded-2xl px-4 py-2.5 shadow-float flex items-center gap-2 border border-rose-200 whitespace-nowrap active:scale-95 transition-transform"
              >
                <span className="w-7 h-7 rounded-xl bg-rose-100 text-expense flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-ink">Pengeluaran</span>
              </motion.button>
            </div>
          )}
        </AnimatePresence>

        <div className="h-[68px] rounded-[28px] bg-white/95 border border-white shadow-float px-2 grid grid-cols-5 items-center">
          {LEFT_TABS.map(renderTab)}

          <div className="relative h-full w-full flex items-center justify-center">
            <div className="relative -top-5 flex items-center justify-center">
              <button
                type="button"
                onClick={toggleFab}
                aria-label="Tambah transaksi"
                aria-expanded={fabOpen}
                className="relative w-[56px] h-[56px] rounded-full grad-sky text-white shadow-float flex items-center justify-center ring-4 ring-white active:scale-90 transition-transform outline-none"
              >
                <Plus
                  className={`w-6 h-6 stroke-[2.5] transition-transform duration-200 ${
                    fabOpen ? 'rotate-45' : 'rotate-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {RIGHT_TABS.map(renderTab)}
        </div>
      </nav>
    </>
  );
};

export default BottomBar;