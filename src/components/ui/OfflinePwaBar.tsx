import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, RefreshCw, Smartphone, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  getOfflineQueue,
  setOfflineQueue,
} from '../../lib/offlineStorage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const OfflinePwaBar: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queueCount, setQueueCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissInstall, setDismissInstall] = useState<boolean>(false);

  const refreshQueueCount = useCallback(() => {
    if (!user?.id) {
      setQueueCount(0);
      return;
    }
    setQueueCount(getOfflineQueue(user.id).length);
  }, [user?.id]);

  const syncOfflineTransactions = useCallback(async () => {
    if (!user?.id || !navigator.onLine || syncing) return;
    const queue = getOfflineQueue(user.id);
    if (queue.length === 0) return;

    setSyncing(true);
    const remaining = [...queue];

    for (const action of queue) {
      try {
        if (action.type === 'ADD_TX') {
          const { error } = await supabase.from('transactions').insert({
            user_id: user.id,
            category_id: action.payload.category_id,
            type: action.payload.type,
            amount: action.payload.amount,
            note: action.payload.note,
            trx_date: action.payload.trx_date,
          });
          if (error) throw error;
        } else if (action.type === 'UPDATE_TX') {
          if (!action.payload.id.startsWith('offline-')) {
            const { error } = await supabase
              .from('transactions')
              .update({
                category_id: action.payload.category_id,
                type: action.payload.type,
                amount: action.payload.amount,
                note: action.payload.note,
                trx_date: action.payload.trx_date,
              })
              .eq('id', action.payload.id);
            if (error) throw error;
          }
        } else if (action.type === 'DELETE_TX') {
          if (!action.payload.id.startsWith('offline-')) {
            const { error } = await supabase
              .from('transactions')
              .delete()
              .eq('id', action.payload.id);
            if (error) throw error;
          }
        }

        remaining.shift();
        setOfflineQueue(user.id, remaining);
      } catch {
        break;
      }
    }

    setSyncing(false);
    refreshQueueCount();

    if (remaining.length === 0) {
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast('Semua data offline berhasil disinkronkan ke server!', 'success');
    }
  }, [user?.id, syncing, queryClient, showToast, refreshQueueCount]);

  useEffect(() => {
    refreshQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      showToast('Kembali online! Menyinkronkan data...', 'info');
      syncOfflineTransactions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast(
        'Mode Offline aktif. Kamu tetap bisa mencatat transaksi.',
        'info'
      );
    };

    const handleQueueChange = () => refreshQueueCount();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('ldev-offline-queue-changed', handleQueueChange);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(
        'ldev-offline-queue-changed',
        handleQueueChange
      );
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, [refreshQueueCount, showToast, syncOfflineTransactions]);

  useEffect(() => {
    if (isOnline && queueCount > 0) {
      syncOfflineTransactions();
    }
  }, [isOnline, queueCount, syncOfflineTransactions]);

  const handleInstallAndroid = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null);
      showToast('Aplikasi LDEV sedang dipasang di perangkatmu!', 'success');
    }
  };

  return (
    <div className="space-y-2.5 mb-4">
      <AnimatePresence>
        {/* Banner Status Offline / Sinkronisasi */}
        {(!isOnline || queueCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`glass-card rounded-2xl px-4 py-3 flex items-center justify-between gap-3 border ${
              isOnline
                ? 'border-sky-200 bg-sky-50/90'
                : 'border-amber-200 bg-amber-50/90'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isOnline
                    ? 'bg-sky-100 text-sky-600'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {isOnline ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-ink">
                  {isOnline
                    ? `Menyinkronkan ${queueCount} transaksi offline...`
                    : 'Mode Offline Aktif'}
                </p>
                <p className="text-[11px] text-muted">
                  {isOnline
                    ? 'Menyimpan perubahan lokal ke cloud Supabase.'
                    : queueCount > 0
                    ? `${queueCount} transaksi tersimpan di HP & akan disinkronkan saat online.`
                    : 'Kamu tetap bisa menambah, mengubah, dan melihat transaksi.'}
                </p>
              </div>
            </div>

            {isOnline && queueCount > 0 && !syncing && (
              <button
                type="button"
                onClick={syncOfflineTransactions}
                className="px-3 py-1.5 rounded-xl grad-sky text-white text-xs font-bold shadow-sm"
              >
                Sinkronkan
              </button>
            )}
          </motion.div>
        )}

        {/* Banner Install Aplikasi Android (PWA) */}
        {installPrompt && !dismissInstall && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass-card rounded-2xl px-4 py-3 flex items-center justify-between gap-3 border border-sky-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl grad-sky text-white flex items-center justify-center shrink-0 shadow-sm">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink truncate">
                  Pasang aplikasi LDEV di Android
                </p>
                <p className="text-[11px] text-muted truncate">
                  Buka layar penuh dari menu utama HP & berjalan lancar saat offline.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallAndroid}
                className="px-3.5 py-1.5 rounded-xl grad-sky text-white text-xs font-bold shadow-sm"
              >
                Instal
              </button>
              <button
                type="button"
                onClick={() => setDismissInstall(true)}
                aria-label="Tutup banner instalasi"
                className="p-1.5 rounded-xl text-muted hover:text-ink hover:bg-sky-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflinePwaBar;