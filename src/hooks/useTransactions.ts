import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '../lib/supabase';
import {
  getCachedTransactions,
  setCachedTransactions,
  getCachedCategories,
  enqueueOfflineAction,
} from '../lib/offlineStorage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import type { Transaction, TransactionFilter, TransactionInput } from '../types';

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

      // Jika sedang offline, langsung gunakan data dari penyimpanan lokal HP
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
          .limit(500);

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

        // Pertahankan transaksi offline yang belum tersinkronisasi
        const existingCache = getCachedTransactions(user.id);
        const unsyncedOffline = existingCache.filter((t) =>
          t.id.startsWith('offline-')
        );
        const merged = [...unsyncedOffline, ...normalized];
        setCachedTransactions(user.id, merged);

        return applyLocalFilters(merged, filter);
      } catch {
        // Fallback ke cache lokal jika sinyal terputus di tengah jalan
        const cached = getCachedTransactions(user.id);
        return applyLocalFilters(cached, filter);
      }
    },
  });

  const addTransaction = useMutation({
    networkMode: 'always',
    mutationFn: async (input: TransactionInput) => {
      if (!user?.id) throw new Error('Pengguna belum masuk.');

      const saveOfflineFallback = () => {
        const tempId = `offline-${Date.now()}`;
        const nowIso = new Date().toISOString();
        const categories = getCachedCategories(user.id);
        const matchedCat =
          categories.find((c) => c.id === input.category_id) ?? null;

        const newTx: Transaction = {
          id: tempId,
          user_id: user.id,
          category_id: input.category_id,
          type: input.type,
          amount: input.amount,
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
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return saveOfflineFallback();
      }

      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            category_id: input.category_id,
            type: input.type,
            amount: input.amount,
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
        return saveOfflineFallback();
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (result.offline) {
        showToast(
          'Disimpan secara offline! Akan disinkronkan saat online.',
          'info'
        );
      } else {
        showToast('Transaksi disimpan', 'success');
      }
    },
    onError: (err: Error) => {
      showToast(`Gagal menyimpan transaksi: ${err.message}`, 'error');
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
                amount: input.amount,
                note: input.note?.trim() || null,
                trx_date: input.trx_date,
                category: matchedCat,
              }
            : item
        );
        setCachedTransactions(user.id, updatedCache);

        enqueueOfflineAction(user.id, {
          id: `act-${Date.now()}`,
          type: 'UPDATE_TX',
          payload: {
            id,
            ...input,
            note: input.note?.trim() || null,
          },
        });
      };

      if (
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        id.startsWith('offline-')
      ) {
        updateLocalCache();
        return { offline: true };
      }

      try {
        const { error } = await supabase
          .from('transactions')
          .update({
            category_id: input.category_id,
            type: input.type,
            amount: input.amount,
            note: input.note?.trim() || null,
            trx_date: input.trx_date,
          })
          .eq('id', id);

        if (error) throw error;
        return { offline: false };
      } catch {
        updateLocalCache();
        return { offline: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast('Transaksi diperbarui', 'success');
    },
    onError: (err: Error) => {
      showToast(`Gagal memperbarui transaksi: ${err.message}`, 'error');
    },
  });

  const deleteTransaction = useMutation({
    networkMode: 'always',
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Pengguna belum masuk.');

      const removeLocal = () => {
        const currentCache = getCachedTransactions(user.id);
        setCachedTransactions(
          user.id,
          currentCache.filter((t) => t.id !== id)
        );
        enqueueOfflineAction(user.id, {
          id: `act-${Date.now()}`,
          type: 'DELETE_TX',
          payload: { id },
        });
      };

      if (
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        id.startsWith('offline-')
      ) {
        removeLocal();
        return id;
      }

      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);
        if (error) throw error;

        const currentCache = getCachedTransactions(user.id);
        setCachedTransactions(
          user.id,
          currentCache.filter((t) => t.id !== id)
        );
        return id;
      } catch {
        removeLocal();
        return id;
      }
    },
    onMutate: async (deletedId: string) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const previousQueries = queryClient.getQueriesData<Transaction[]>({
        queryKey: ['transactions'],
      });

      queryClient.setQueriesData<Transaction[]>(
        { queryKey: ['transactions'] },
        (old) => (old ? old.filter((item) => item.id !== deletedId) : [])
      );

      return { previousQueries };
    },
    onError: (err: Error, _deletedId, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      showToast(`Gagal menghapus transaksi: ${err.message}`, 'error');
    },
    onSuccess: () => {
      showToast('Transaksi dihapus', 'info');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
  };
}

export default useTransactions;