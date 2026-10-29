import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Wallet, User as UserIcon, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { softSpring } from '../lib/motion';

export const Register: React.FC = () => {
  const { session, signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Nama panggilan wajib diisi.');
      return;
    }
    if (!email.trim()) {
      setFormError('Alamat email wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setFormError('Kata sandi minimal 6 karakter.');
      return;
    }

    setSubmitting(true);
    const { error } = await signUp(email, password, fullName);
    setSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }

    showToast('Akun LDEV berhasil dibuat! Silakan masuk.', 'success');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
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
          <h1 className="text-2xl font-bold text-ink">Buat akun LDEV baru</h1>
          <p className="text-sm text-muted">
            Mulai catat pemasukan dan pengeluaran harianmu.
          </p>
        </div>

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
            label="Nama panggilan (misal: Budi)"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<UserIcon className="w-5 h-5" />}
            required
          />

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
            label="Kata sandi (minimal 6 karakter)"
            type="password"
            autoComplete="new-password"
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
            Daftar
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          Sudah punya akun?{' '}
          <Link
            to="/login"
            className="font-semibold text-sky-600 hover:text-sky-700 underline-offset-4 hover:underline"
          >
            Masuk
          </Link>
        </p>
      </motion.div>
    </div>
  );
};