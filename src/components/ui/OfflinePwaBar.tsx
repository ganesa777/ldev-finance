import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, RefreshCw, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  getOfflineQueue,
  setOfflineQueue,
  getCachedTransactions,
  setCachedTransactions,
} from '../../lib/offlineStorage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Validasi apakah string adalah format UUID Supabase yang sah
function isValidUuid(val: string | null | undefined): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    val
  );
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

  const isSyncingRef = useRef(false);

  const refreshQueueCount = useCallback(() => {
    if (!user?.id) {
      setQueueCount(0);
      return;
    }
    setQueueCount(getOfflineQueue(user.id).length);
  }, [user?.id]);

  // Fungsi untuk langsung menyelesaikan & membersihkan antrean yang macet
  const clearStuckQueue = useCallback(() => {
    if (!user?.id) return;
    setOfflineQueue(user.id, []);

    // Ubah prefix 'offline-' menjadi 'local-' agar data tetap aman di layar tanpa memicu antrean lagi
    const cached = getCachedTransactions(user.id);
    const cleaned = cached.map((t) =>
      t.id.startsWith('offline-')
        ? { ...t, id: t.id.replace('offline-', 'local-') }
        : t
    );
    setCachedTransactions(user.id, cleaned);

    setQueueCount(0);
    setSyncing(false);
    isSyncingRef.current = false;
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  }, [user?.id, queryClient]);

  const syncOfflineTransactions = useCallback(async () => {
    if (!user?.id || !navigator.onLine || isSyncingRef.current) return;
    const queue = getOfflineQueue(user.id);
    if (queue.length === 0) {
      setQueueCount(0);
      return;
    }

    isSyncingRef.current = true;
    setSyncing(true);

    const remaining = [...queue];
    let anyFailedPermission = false;

    for (const action of queue) {
      try {
        if (action.type === 'ADD_TX') {
          const safeCategoryId = isValidUuid(action.payload.category_id)
            ? action.payload.category_id
            : null;

          const { data, error } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              category_id: safeCategoryId,
              type: action.payload.type,
              amount: Number(action.payload.amount),
              note: action.payload.note,
              trx_date: action.payload.trx_date,
            })
            .select('id')
            .single();

          if (error) throw error;

          // Ganti ID sementara 'offline-...' di cache dengan ID asli dari Supabase
          if (data?.id) {
            const currentCache = getCachedTransactions(user.id);
            setCachedTransactions(
              user.id,
              currentCache.map((item) =>
                item.id === action.payload.tempId
                  ? { ...item, id: data.id }
                  : item
              )
            );
          }
        } else if (action.type === 'UPDATE_TX') {
          if (isValidUuid(action.payload.id)) {
            const safeCategoryId = isValidUuid(action.payload.category_id)
              ? action.payload.category_id
              : null;

            const { error } = await supabase
              .from('transactions')
              .update({
                category_id: safeCategoryId,
                type: action.payload.type,
                amount: Number(action.payload.amount),
                note: action.payload.note,
                trx_date: action.payload.trx_date,
              })
              .eq('id', action.payload.id);
            if (error) throw error;
          }
        } else if (action.type === 'DELETE_TX') {
          if (isValidUuid(action.payload.id)) {
            const { error } = await supabase
              .from('transactions')
              .delete()
              .eq('id', action.payload.id);
            if (error) throw error;
          }
        }

        // Hapus item yang sudah diproses dari antrean
        remaining.shift();
        setOfflineQueue(user.id, remaining);
      } catch {
        // Jika ditolak oleh Supabase (misal tabel/permission belum siap),
        // simpan permanen di perangkat lokal dan keluarkan dari antrean agar tidak macet selamanya
        anyFailedPermission = true;
        remaining.shift();
        setOfflineQueue(user.id, remaining);

        const currentCache = getCachedTransactions(user.id);
        setCachedTransactions(
          user.id,
          currentCache.map((t) =>
            t.id.startsWith('offline-')
              ? { ...t, id: t.id.replace('offline-', 'local-') }
              : t
          )
        );
      }
    }

    isSyncingRef.current = false;
    setSyncing(false);
    refreshQueueCount();
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });

    if (!anyFailedPermission) {
      showToast('Data berhasil disinkronkan!', 'success');
    }
  }, [user?.id, queryClient, showToast, refreshQueueCount]);

  useEffect(() => {
    refreshQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineTransactions();
    };

    const handleOffline = () => {
      setIsOnline(false);
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
  }, [refreshQueueCount, syncOfflineTransactions]);

  // Jalankan sinkronisasi otomatis saat online dan ada antrean
  useEffect(() => {
    if (isOnline && queueCount > 0 && !isSyncingRef.current) {
      const timer = window.setTimeout(() => {
        syncOfflineTransactions();
      }, 300);
      return () => window.clearTimeout(timer);
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

  if (isOnline && queueCount === 0 && (!installPrompt || dismissInstall)) {
    return null;
  }

  return (
    <div className="space-y-2.5 mb-4">
      <AnimatePresence>
        {/* Banner Status Offline / Sinkronisasi */}
        {(!isOnline || queueCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`glass-card rounded-2xl px-4 py-3 flex items-center justify-between gap-3 border ${
              isOnline
                ? 'border-sky-200 bg-sky-50/90'
                : 'border-amber-200 bg-amber-50/90'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isOnline
                    ? 'bg-sky-100 text-sky-600'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {isOnline ? (
                  <RefreshCw
                    className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
                  />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink truncate">
                  {isOnline
                    ? `Menyinkronkan ${queueCount} transaksi offline...`
                    : 'Mode Offline Aktif'}
                </p>
                <p className="text-[11px] text-muted truncate">
                  {isOnline
                    ? 'Menyimpan perubahan lokal ke cloud Supabase.'
                    : 'Kamu tetap bisa menambah dan melihat transaksi.'}
                </p>
              </div>
            </div>

            {isOnline && queueCount > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={clearStuckQueue}
                  title="Selesaikan & simpan di perangkat"
                  className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-sky-700 text-xs font-bold flex items-center gap-1 hover:bg-sky-50 active:scale-95 transition-transform"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selesai</span>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Banner Install Aplikasi Android (PWA) */}
        {installPrompt && !dismissInstall && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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