import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';
import { formatRupiah } from '../../lib/format';
import { Orb3D } from './Orb3D';

interface BalanceHeroProps {
  balance: number;
  changePct: number;
  loading?: boolean;
}

export const BalanceHero: React.FC<BalanceHeroProps> = ({
  balance,
  changePct,
  loading = false,
}) => {
  const [hidden, setHidden] = useState(false);
  const animatedBalance = useCountUp(balance, 1200);

  if (loading) {
    return (
      <div className="rounded-4xl p-6 md:p-7 h-[200px] shimmer shadow-glass" />
    );
  }

  const isPositive = changePct >= 0;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative overflow-hidden rounded-4xl grad-sky p-6 md:p-7 text-white shadow-float flex flex-col justify-between min-h-[200px]"
    >
      {/* Dekorasi 2 lingkaran transparan putih sesuai DESIGN.md 5.1 */}
      <div className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute -bottom-14 right-16 w-32 h-32 rounded-full bg-white/15" />

      {/* Objek 3D di sudut kanan */}
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-95 hidden sm:block">
        <Orb3D variant="orb" size={88} />
      </div>

      {/* Baris Atas: Label + Tombol Mata */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </span>
          <span className="text-xs font-semibold text-white/90">
            Saldo total LDEV
          </span>
        </div>

        <button
          type="button"
          onClick={() => setHidden((prev) => !prev)}
          aria-label={hidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
          className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-colors outline-none focus-visible:shadow-glow"
        >
          {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Angka Saldo Besar (Hero) */}
      <div className="relative z-10 my-3">
        <motion.p
          key={hidden ? 'masked' : 'visible'}
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.25 }}
          className="text-[36px] sm:text-[40px] xl:text-[44px] font-extrabold leading-none tracking-[-0.03em] tabular-nums drop-shadow-sm"
        >
          {hidden ? 'Rp ••••••••' : formatRupiah(animatedBalance)}
        </motion.p>
      </div>

      {/* Chip Persentase & Sparkline Mini */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
          {isPositive ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" />
          )}
          {isPositive ? `+${changePct}%` : `${changePct}%`} dari bulan lalu
        </span>

        {/* Mini Sparkline SVG */}
        <svg
          viewBox="0 0 80 24"
          className="w-20 h-6 stroke-white/85 fill-none"
          aria-hidden="true"
        >
          <path
            d="M2 18 C 18 16, 24 8, 38 12 C 52 16, 62 4, 78 6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </motion.div>
  );
};

export default BalanceHero;