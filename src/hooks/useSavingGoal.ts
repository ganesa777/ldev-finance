import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import type { SavingGoal } from '../types';

export function useSavingGoal() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const goalQuery = useQuery({
    queryKey: ['saving_goal', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<SavingGoal | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('saving_goals')
        .select('id, user_id, name, target, saved, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;

      return {
        ...data,
        target: Number(data.target),
        saved: Number(data.saved),
      } as SavingGoal;
    },
  });

  const saveGoal = useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      target: number;
      saved: number;
    }) => {
      if (!user?.id) throw new Error('Pengguna belum masuk.');

      if (input.id) {
        const { data, error } = await supabase
          .from('saving_goals')
          .update({
            name: input.name.trim(),
            target: input.target,
            saved: input.saved,
          })
          .eq('id', input.id)
          .select('id, user_id, name, target, saved, created_at')
          .single();

        if (error) throw new Error(error.message);
        return data as SavingGoal;
      }

      const { data, error } = await supabase
        .from('saving_goals')
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          target: input.target,
          saved: input.saved,
        })
        .select('id, user_id, name, target, saved, created_at')
        .single();

      if (error) throw new Error(error.message);
      return data as SavingGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saving_goal'] });
      showToast('Target tabungan diperbarui!', 'success');
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