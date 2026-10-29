import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Settings,
  LogOut,
  Wallet,
} from 'lucide-react';
import { spring } from '../../lib/motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Beranda', icon: LayoutDashboard },
  { to: '/transaksi', label: 'Transaksi', icon: ArrowLeftRight },
  { to: '/laporan', label: 'Laporan', icon: PieChart },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut();
    showToast('Kamu telah keluar dari LDEV.', 'info');
  };

  return (
    <aside
      aria-label="Navigasi Utama Desktop"
      className="hidden md:flex fixed left-4 top-4 bottom-4 w-[72px] rounded-full grad-sky shadow-float z-40 flex-col items-center justify-between py-5 select-none"
    >
      {/* Logo LDEV di atas */}
      <NavLink
        to="/"
        aria-label="Beranda LDEV"
        className="w-11 h-11 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform"
      >
        <Wallet className="w-5 h-5" />
      </NavLink>

      {/* Menu Tengah */}
      <nav className="flex flex-col items-center gap-3">
        {NAV_ITEMS.map((nav) => {
          const Icon = nav.icon;
          const isActive =
            nav.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(nav.to);

          return (
            <div
              key={nav.to}
              className="relative flex items-center"
              onMouseEnter={() => setHoveredItem(nav.to)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <NavLink
                to={nav.to}
                aria-label={nav.label}
                className="relative w-12 h-12 rounded-full flex items-center justify-center outline-none focus-visible:shadow-glow"
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    transition={spring}
                    className="absolute inset-0 rounded-full bg-white shadow-md"
                  />
                )}

                <motion.span
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  className={`relative z-10 transition-colors ${
                    isActive ? 'text-sky-600' : 'text-white/90 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </motion.span>
              </NavLink>

              {/* Tooltip Kanan */}
              <AnimatePresence>
                {hoveredItem === nav.to && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.16 }}
                    className="pointer-events-none absolute left-16 px-3 py-1.5 rounded-xl glass-strong text-xs font-semibold text-ink shadow-glass whitespace-nowrap"
                  >
                    {nav.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Tombol Keluar di paling bawah */}
      <div
        className="relative flex items-center"
        onMouseEnter={() => setHoveredItem('logout')}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleLogout}
          aria-label="Keluar"
          className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors outline-none focus-visible:shadow-glow"
        >
          <LogOut className="w-5 h-5" />
        </motion.button>

        <AnimatePresence>
          {hoveredItem === 'logout' && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.16 }}
              className="pointer-events-none absolute left-16 px-3 py-1.5 rounded-xl glass-strong text-xs font-semibold text-expense shadow-glass whitespace-nowrap"
            >
              Keluar
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};