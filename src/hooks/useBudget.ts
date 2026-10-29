import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import type { Budget } from '../types';

export function useBudget(targetMonth: Date = new Date()) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const monthStr = format(startOfMonth(targetMonth), 'yyyy-MM-01');

  const budgetQuery = useQuery({
    queryKey: ['budget', user?.id, monthStr],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Budget | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('budgets')
        .select('id, user_id, month, amount, created_at')
        .eq('month', monthStr)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;

      return {
        ...data,
        amount: Number(data.amount),
      } as Budget;
    },
  });

  const saveBudget = useMutation({
    mutationFn: async (amount: number) => {
      if (!user?.id) throw new Error('Pengguna belum masuk.');

      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          {
            user_id: user.id,
            month: monthStr,
            amount,
          },
          { onConflict: 'user_id,month' }
        )
        .select('id, user_id, month, amount, created_at')
        .single();

      if (error) throw new Error(error.message);
      return {
        ...data,
        amount: Number(data.amount),
      } as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      showToast('Anggaran bulanan disimpan.', 'success');
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