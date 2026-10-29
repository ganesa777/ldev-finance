import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop ringan tanpa blur berlapis yang bikin HP ngelag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40"
          />

          {/* Panel Bottom Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-lg rounded-t-[28px] bg-white border-t border-sky-100 shadow-float flex flex-col max-h-[88dvh]"
          >
            {/* Handle Bar & Header */}
            <div className="px-5 pt-3 pb-2.5 border-b border-sky-100/80 shrink-0">
              <div className="w-10 h-1 rounded-full bg-sky-200 mx-auto mb-2.5" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-ink">
                  {title || 'Tambah Transaksi'}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup"
                  className="w-8 h-8 rounded-full bg-sky-50 text-muted hover:text-ink flex items-center justify-center active:scale-95 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Isi Form */}
            <div className="px-5 pt-3 pb-4 overflow-y-auto overscroll-contain flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;