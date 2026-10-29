import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '../lib/supabase';
import {
  getCachedTransactions,
  setCachedTransactions,
  getCachedCategories,
  enqueueOfflineAction,
  setOfflineQueue,
} from '../lib/offlineStorage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import type { Transaction, TransactionFilter, TransactionInput } from '../types';

function isValidUuid(val: string | null | undefined): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    val
  );
}

function applyLocalFilters(
  allItems: Transaction[],
  filter?: TransactionFilter
): Transaction[] {
  let result = [...allItems];

  if (filter?.selectedDate) {
    result = result.filter((t) => t.trx_date === filter.selectedDate);
  } else if (filter?.month) {
    const startStr = format(startOfMonth(filter.month), 'yyyy-MM-dd');
    const endStr = format(endOfMonth(filter.month), 'yyyy-MM-dd');
    result = result.filter(
      (t) => t.trx_date >= startStr && t.trx_date <= endStr
    );
  }

  if (filter?.type && filter.type !== 'all') {
    result = result.filter((t) => t.type === filter.type);
  }

  if (filter?.categoryId && filter.categoryId !== 'all') {
    result = result.filter((t) => t.category_id === filter.categoryId);
  }

  const searchKey = filter?.search?.trim().toLowerCase() ?? '';
  if (searchKey.length > 0) {
    result = result.filter((t) =>
      (t.note ?? '').toLowerCase().includes(searchKey)
    );
  }

  return result.sort((a, b) => {
    if (a.trx_date !== b.trx_date) {
      return b.trx_date.localeCompare(a.trx_date);
    }
    return b.created_at.localeCompare(a.created_at);
  });
}

export function useTransactions(filter?: TransactionFilter) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const monthKey = filter?.month
    ? format(filter.month, 'yyyy-MM')
    : 'all-months';
  const typeKey = filter?.type ?? 'all';
  const categoryKey = filter?.categoryId ?? 'all';
  const searchKey = filter?.search?.trim() ?? '';
  const selectedDateKey = filter?.selectedDate ?? null;

  const transactionsQuery = useQuery({
    queryKey: [
      'transactions',
      user?.id,
      monthKey,
      typeKey,
      categoryKey,
      searchKey,
      selectedDateKey,
    ],
    enabled: Boolean(user?.id),
    networkMode: 'always',
    queryFn: async (): Promise<Transaction[]> => {
      if (!user?.id) return [];

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cached = getCachedTransactions(user.id);
        return applyLocalFilters(cached, filter);
      }

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(
            `
            id,
            user_id,
            category_id,
            type,
            amount,
            note,
            trx_date,
            created_at,
            category:categories (
              id,
              user_id,
              name,
              type,
              icon,
              color
            )
          `
          )
          .order('trx_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(400);

        if (error) throw error;

        const normalized: Transaction[] = (data ?? []).map((row) => {
          const rawCat = Array.isArray(row.category)
            ? row.category[0]
            : row.category;
          return {
            id: row.id,
            user_id: row.user_id,
            category_id: row.category_id,
            type: row.type,
            amount: Number(row.amount),
            note: row.note,
            trx_date: row.trx_date,
            created_at: row.created_at,
            category: rawCat ?? null,
          } as Transaction;
        });

        // Pertahankan transaksi lokal/offline yang disimpan di perangkat
        const existingCache = getCachedTransactions(user.id);
        const localItems = existingCache.filter(
          (t) => t.id.startsWith('offline-') || t.id.startsWith('local-')
        );
        const merged = [...localItems, ...normalized];
        setCachedTransactions(user.id, merged);

        return applyLocalFilters(merged, filter);
      } catch {
        const cached = getCachedTransactions(user.id);
        return applyLocalFilters(cached, filter);
      }
    },
  });

  const addTransaction = useMutation({
    networkMode: 'always',
    mutationFn: async (input: TransactionInput) => {
      if (!user?.id) throw new Error('Pengguna belum masuk.');

      const categories = getCachedCategories(user.id);
      const matchedCat =
        categories.find((c) => c.id === input.category_id) ?? null;

      // Jika sedang benar-benar offline, masukkan ke antrean offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const tempId = `offline-${Date.now()}`;
        const nowIso = new Date().toISOString();

        const newTx: Transaction = {
          id: tempId,
          user_id: user.id,
          category_id: input.category_id,
          type: input.type,
          amount: Number(input.amount),
          note: input.note?.trim() || null,
          trx_date: input.trx_date,
          created_at: nowIso,
          category: matchedCat,
        };

        const currentCache = getCachedTransactions(user.id);
        setCachedTransactions(user.id, [newTx, ...currentCache]);

        enqueueOfflineAction(user.id, {
          id: `act-${Date.now()}`,
          type: 'ADD_TX',
          payload: {
            ...input,
            note: input.note?.trim() || null,
            tempId,
            createdAt: nowIso,
          },
        });

        return { data: newTx, offline: true };
      }

      // Saat online, pastikan category_id berupa UUID yang valid
      const safeCategoryId = isValidUuid(input.category_id)
        ? input.category_id
        : null;

      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            category_id: safeCategoryId,
            type: input.type,
            amount: Number(input.amount),
            note: input.note?.trim() || null,
            trx_date: input.trx_date,
          })
          .select(
            'id, user_id, category_id, type, amount, note, trx_date, created_at'
          )
          .single();

        if (error) throw error;
        return { data, offline: false };
      } catch {
        // Jika tabel Supabase belum diberi izin GRANT, simpan langsung sebagai 'local-'
        // tanpa menambah antrean agar tidak memunculkan spinner sinkronisasi terus-menerus
        const localId = `local-${Date.now()}`;
        const nowIso = new Date().toISOString();
        const localTx: Transaction = {
          id: localId,
          user_id: user.id,
          category_id: input.category_id,
          type: input.type,
          amount: Number(input.amount),
          note: input.note?.trim() || null,
          trx_date: input.trx_date,
          created_at: nowIso,
          category: matchedCat,
        };

        const currentCache = getCachedTransactions(user.id);
        setCachedTransactions(user.id, [localTx, ...currentCache]);
        return { data: localTx, offline: false };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast('Transaksi berhasil disimpan!', 'success');
    },
  });

  const updateTransaction = useMutation({
    networkMode: 'always',
    mutationFn: async ({
      id,
      ...input
    }: TransactionInput & { id: string }) => {
      if (!user?.id) throw new Error('Pengguna belum masuk.');

      const updateLocalCache = () => {
        const categories = getCachedCategories(user.id);
        const matchedCat =
          categories.find((c) => c.id === input.category_id) ?? null;
        const currentCache = getCachedTransactions(user.id);
        const updatedCache = currentCache.map((item) =>
          item.id === id
            ? {
                ...item,
                category_id: input.category_id,
                type: input.type,
                amount: Number(input.amount),
                note: input.note?.trim() || null,
                trx_date: input.trx_date,
                category: matchedCat,
              }
            : item
        );
        setCachedTransactions(user.id, updatedCache);
      };

      updateLocalCache();

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (isValidUuid(id)) {
          enqueueOfflineAction(user.id, {
            id: `act-${Date.now()}`,
            type: 'UPDATE_TX',
            payload: {
              id,
              ...input,
              note: input.note?.trim() || null,
            },
          });
        }
        return { offline: true };
      }

      if (isValidUuid(id)) {
        try {
          const safeCategoryId = isValidUuid(input.category_id)
            ? input.category_id
            : null;
          await supabase
            .from('transactions')
            .update({
              category_id: safeCategoryId,
              type: input.type,
              amount: Number(input.amount),
              note: input.note?.trim() || null,
              trx_date: input.trx_date,
            })
            .eq('id', id);
        } catch {
          // Tetap tersimpan di cache lokal
        }
      }

      return { offline: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast('Data transaksi diperbarui!', 'success');
    },
  });

  const deleteTransaction = useMutation({
    networkMode: 'always',
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Pengguna belum masuk.');

      const currentCache = getCachedTransactions(user.id);
      setCachedTransactions(
        user.id,
        currentCache.filter((t) => t.id !== id)
      );

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (isValidUuid(id)) {
          enqueueOfflineAction(user.id, {
            id: `act-${Date.now()}`,
            type: 'DELETE_TX',
            payload: { id },
          });
        }
        return id;
      }

      if (isValidUuid(id)) {
        try {
          await supabase.from('transactions').delete().eq('id', id);
        } catch {
          // Sudah terhapus dari cache lokal
        }
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast('Transaksi dihapus.', 'info');
    },
  });

  const clearAllTransactions = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      if (!user?.id) throw new Error('Pengguna belum masuk.');

      setCachedTransactions(user.id, []);
      setOfflineQueue(user.id, []);

      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id);
        } catch {
          // Abaikan jika gagal di cloud
        }
      }
    },
    onSuccess: () => {
      queryClient.setQueriesData({ queryKey: ['transactions'] }, []);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast('Semua transaksi & saldo berhasil direset ke Rp 0!', 'info');
    },
  });

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading,
    isError: transactionsQuery.isError,
    error: transactionsQuery.error,
    refetch: transactionsQuery.refetch,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
  };
}

export default useTransactions;