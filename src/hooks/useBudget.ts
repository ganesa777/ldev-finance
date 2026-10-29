import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { getCachedBudget, setCachedBudget } from '../lib/offlineStorage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import type { Budget } from '../types';

export function useBudget(monthDate: Date = new Date()) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const monthStr = format(monthDate, 'yyyy-MM');

  const budgetQuery = useQuery({
    queryKey: ['budget', user?.id, monthStr],
    enabled: Boolean(user?.id),
    networkMode: 'always',
    queryFn: async (): Promise<Budget | null> => {
      if (!user?.id) return null;

      const cached = getCachedBudget(user.id, monthStr);
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return cached;
      }

      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('id, user_id, month, amount, created_at')
          .eq('user_id', user.id)
          .eq('month', monthStr)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const normalized: Budget = {
            ...data,
            amount: Number(data.amount),
          };
          setCachedBudget(user.id, monthStr, normalized);
          return normalized;
        }

        return cached;
      } catch {
        return cached;
      }
    },
  });

  const saveBudget = useMutation({
    networkMode: 'always',
    mutationFn: async (amount: number): Promise<{ budget: Budget; localOnly: boolean }> => {
      if (!user?.id) throw new Error('Pengguna belum masuk.');

      const fallbackLocal = (): { budget: Budget; localOnly: boolean } => {
        const localBudget: Budget = {
          id: `local-budget-${monthStr}`,
          user_id: user.id,
          month: monthStr,
          amount: Number(amount),
        };
        setCachedBudget(user.id, monthStr, localBudget);
        return { budget: localBudget, localOnly: true };
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return fallbackLocal();
      }

      try {
        const { data, error } = await supabase
          .from('budgets')
          .upsert(
            {
              user_id: user.id,
              month: monthStr,
              amount: Number(amount),
            },
            { onConflict: 'user_id,month' }
          )
          .select('id, user_id, month, amount, created_at')
          .single();

        if (error) throw error;

        const saved: Budget = {
          ...data,
          amount: Number(data.amount),
        };
        setCachedBudget(user.id, monthStr, saved);
        return { budget: saved, localOnly: false };
      } catch {
        // Jika tabel Supabase belum disinkronkan atau sinyal terputus, simpan di perangkat
        return fallbackLocal();
      }
    },
    onSuccess: (res) => {
      queryClient.setQueryData(['budget', user?.id, monthStr], res.budget);
      queryClient.invalidateQueries({ queryKey: ['budget', user?.id, monthStr] });
      showToast('Anggaran bulanan berhasil disimpan!', 'success');
    },
    onError: (err: Error) => {
      showToast(`Gagal menyimpan anggaran: ${err.message}`, 'error');
    },
  });

  return {
    budget: budgetQuery.data ?? null,
    budgetAmount: budgetQuery.data?.amount ?? 0,
    isLoading: budgetQuery.isLoading,
    saveBudget,
  };
}

export default useBudget;