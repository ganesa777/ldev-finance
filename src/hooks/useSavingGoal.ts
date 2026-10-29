import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  getCachedSavingGoal,
  setCachedSavingGoal,
} from '../lib/offlineStorage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import type { SavingGoal } from '../types';

export interface SavingGoalInput {
  title: string;
  target_amount: number;
  current_amount: number;
}

export function useSavingGoal() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const goalQuery = useQuery({
    queryKey: ['saving_goal', user?.id],
    enabled: Boolean(user?.id),
    networkMode: 'always',
    queryFn: async (): Promise<SavingGoal | null> => {
      if (!user?.id) return null;

      const cached = getCachedSavingGoal(user.id);
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return cached;
      }

      try {
        const { data, error } = await supabase
          .from('saving_goals')
          .select('id, user_id, title, target_amount, current_amount, created_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const normalized: SavingGoal = {
            ...data,
            target_amount: Number(data.target_amount),
            current_amount: Number(data.current_amount),
          };
          setCachedSavingGoal(user.id, normalized);
          return normalized;
        }
        return cached;
      } catch {
        return cached;
      }
    },
  });

  const saveGoal = useMutation({
    networkMode: 'always',
    mutationFn: async (input: SavingGoalInput): Promise<SavingGoal> => {
      if (!user?.id) throw new Error('Pengguna belum masuk.');

      const saveLocal = (): SavingGoal => {
        const localGoal: SavingGoal = {
          id: `local-goal-${user.id}`,
          user_id: user.id,
          title: input.title.trim() || 'Tabungan Impian',
          target_amount: Number(input.target_amount),
          current_amount: Number(input.current_amount),
        };
        setCachedSavingGoal(user.id, localGoal);
        return localGoal;
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return saveLocal();
      }

      try {
        const { data, error } = await supabase
          .from('saving_goals')
          .upsert(
            {
              user_id: user.id,
              title: input.title.trim() || 'Tabungan Impian',
              target_amount: Number(input.target_amount),
              current_amount: Number(input.current_amount),
            },
            { onConflict: 'user_id' }
          )
          .select('id, user_id, title, target_amount, current_amount, created_at')
          .single();

        if (error) throw error;

        const saved: SavingGoal = {
          ...data,
          target_amount: Number(data.target_amount),
          current_amount: Number(data.current_amount),
        };
        setCachedSavingGoal(user.id, saved);
        return saved;
      } catch {
        return saveLocal();
      }
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(['saving_goal', user?.id], saved);
      queryClient.invalidateQueries({ queryKey: ['saving_goal', user?.id] });
      showToast('Target tabungan berhasil diperbarui!', 'success');
    },
    onError: (err: Error) => {
      showToast(`Gagal menyimpan target tabungan: ${err.message}`, 'error');
    },
  });

  return {
    savingGoal: goalQuery.data ?? null,
    isLoading: goalQuery.isLoading,
    saveGoal,
  };
}

export default useSavingGoal;