import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Wallet, Mail, Lock, ArrowUpRight, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { softSpring } from '../lib/motion';

export const Login: React.FC = () => {
  const { session, signIn, isConfigured } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  const card1X = useTransform(smoothX, [-300, 300], [-14, 14]);
  const card1Y = useTransform(smoothY, [-300, 300], [-10, 10]);
  const card2X = useTransform(smoothX, [-300, 300], [16, -16]);
  const card2Y = useTransform(smoothY, [-300, 300], [12, -12]);
  const card3X = useTransform(smoothX, [-300, 300], [-10, 10]);
  const card3Y = useTransform(smoothY, [-300, 300], [12, -12]);

  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError('Email dan kata sandi wajib diisi.');
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }

    showToast('Selamat datang kembali di LDEV!', 'success');
    navigate('/', { replace: true });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen flex items-center justify-center p-4 md:p-8"
    >
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Sisi Kiri Desktop: Area Visual 3D & Teks Terpisah Rapi */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-4 space-y-6">
          {/* Kotak Khusus Visual 3D + Kartu Parallax agar tidak menabrak teks di bawah */}
          <div className="relative h-[340px] w-full flex items-center justify-center">
            {/* Objek 3D Sky Blue Mengambang */}
            <motion.div
              animate={
                shouldReduceMotion
                  ? undefined
                  : { y: [0, -12, 0], rotate: [0, 4, -4, 0] }
              }
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-64 h-64 flex items-center justify-center"
            >
              <div
                className="w-52 h-52 rounded-full shadow-float"
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, #FFFFFF 0%, #BAE6FD 25%, #38BDF8 60%, #0369A1 100%)',
                }}
              />
              <div className="absolute inset-2 rounded-full border-2 border-white/60 -rotate-12 pointer-events-none" />
              <div className="absolute w-16 h-16 top-0 right-4 rounded-full bg-white/40 backdrop-blur-md border border-white/80 shadow-glass" />
            </motion.div>

            {/* Kartu Mini Melayang 1: Saldo */}
            <motion.div
              style={{ x: card1X, y: card1Y }}
              className="glass-card rounded-3xl p-4 w-60 absolute top-4 left-2 flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-2xl grad-sky flex items-center justify-center text-white shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted">Saldo Bulan Ini</p>
                <p className="text-base font-extrabold text-ink tabular-nums">
                  Rp 8.250.000
                </p>
                <span className="inline-flex items-center text-[11px] font-semibold text-income">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +12% hemat
                </span>
              </div>
            </motion.div>

            {/* Kartu Mini Melayang 2: Target Tabungan */}
            <motion.div
              style={{ x: card2X, y: card2Y }}
              className="glass-card rounded-3xl p-4 w-60 absolute bottom-4 right-2 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-500" /> Dana Darurat
                </span>
                <span className="text-xs font-bold text-sky-600 tabular-nums">82%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-sky-100 overflow-hidden">
                <div className="h-full w-[82%] rounded-full grad-sky" />
              </div>
              <p className="text-[11px] text-muted tabular-nums">
                Terkumpul Rp 8.200.000
              </p>
            </motion.div>

            {/* Kartu Mini Melayang 3: Keamanan RLS */}
            <motion.div
              style={{ x: card3X, y: card3Y }}
              className="glass-card rounded-2xl px-4 py-2.5 absolute bottom-6 left-6 flex items-center gap-2.5"
            >
              <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="text-xs font-semibold text-ink">
                Akses Pribadi Terkunci
              </span>
            </motion.div>
          </div>

          {/* Teks Deskripsi di Bawah Area Visual */}
          <div className="max-w-md space-y-2 pl-2">
            <span className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold">
              LDEV Personal Finance
            </span>
            <h2 className="text-3xl font-extrabold text-ink leading-tight">
              Catat keuangan harianmu dengan tenang & jernih.
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Pantau pemasukan, pengeluaran, anggaran bulanan, dan target tabungan dalam satu dashboard bergaya kaca yang ringan.
            </p>
          </div>
        </div>

        {/* Sisi Kanan / Tengah: Kartu Kaca Login Khusus Pemilik */}
        <div className="lg:col-span-5 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={
              formError
                ? { opacity: 1, y: 0, scale: 1, x: [0, -10, 10, -8, 8, -4, 4, 0] }
                : { opacity: 1, y: 0, scale: 1, x: 0 }
            }
            transition={softSpring}
            className="glass-card rounded-3xl p-6 sm:p-8 w-full max-w-[420px] space-y-6"
          >
            <div className="text-center space-y-2">
              <motion.div
                animate={shouldReduceMotion ? undefined : { scale: [1, 1.06, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 rounded-full grad-sky mx-auto flex items-center justify-center text-white shadow-float"
              >
                <Wallet className="w-7 h-7" />
              </motion.div>
              <span className="inline-block text-xs font-bold tracking-wider text-sky-600">
                LDEV FINANCE
              </span>
              <h1 className="text-2xl font-bold text-ink">
                Selamat datang kembali
              </h1>
              <p className="text-sm text-muted">
                Masuk untuk melihat ringkasan keuanganmu hari ini.
              </p>
            </div>

            {!isConfigured && (
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold">Info Konfigurasi (.env)</p>
                <p>
                  Isi <code className="font-mono">VITE_SUPABASE_URL</code> dan{' '}
                  <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> di file{' '}
                  <code className="font-mono">.env</code> agar fitur login aktif.
                </p>
              </div>
            )}

            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-medium text-expense text-center"
              >
                {formError}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />

              <Input
                label="Kata sandi"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
              >
                Masuk
              </Button>
            </form>

            <div className="pt-1 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                <ShieldCheck className="w-4 h-4 text-sky-500" />
                Khusus akses pribadi LDEV
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};