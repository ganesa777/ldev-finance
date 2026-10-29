import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { spring } from '../../lib/motion';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => {
        removeToast(id);
      }, 3000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-[100] flex flex-col gap-2.5 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const Icon =
              toast.type === 'success'
                ? CheckCircle2
                : toast.type === 'error'
                ? AlertCircle
                : Info;

            const iconColor =
              toast.type === 'success'
                ? 'text-income bg-emerald-50'
                : toast.type === 'error'
                ? 'text-expense bg-rose-50'
                : 'text-sky-600 bg-sky-50';

            const barColor =
              toast.type === 'success'
                ? 'bg-income'
                : toast.type === 'error'
                ? 'bg-expense'
                : 'bg-sky-500';

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.94 }}
                transition={spring}
                className="pointer-events-auto relative overflow-hidden glass-strong rounded-2xl p-3.5 shadow-float flex items-center gap-3 border border-white"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-ink flex-1 leading-snug">
                  {toast.message}
                </p>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Tutup notifikasi"
                  className="p-1 rounded-lg text-muted hover:text-ink hover:bg-sky-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Progress bar 3 detik */}
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 3, ease: 'linear' }}
                  style={{ transformOrigin: 'left' }}
                  className={`absolute bottom-0 left-0 right-0 h-1 ${barColor}`}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast harus dipakai di dalam ToastProvider');
  }
  return context;
}