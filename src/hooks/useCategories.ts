import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import {
  getCachedCategories,
  setCachedCategories,
} from '../lib/offlineStorage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import type { Category, DefaultCategorySeed } from '../types';

function buildLocalFallbackCategories(userId: string): Category[] {
  return DEFAULT_CATEGORIES.map((cat, idx) => ({
    id: `local-cat-${idx}`,
    user_id: userId,
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
    color: cat.color,
  }));
}

export function useCategories() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['categories', user?.id],
    enabled: Boolean(user?.id),
    networkMode: 'always',
    queryFn: async (): Promise<Category[]> => {
      if (!user?.id) return [];

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cached = getCachedCategories(user.id);
        return cached.length > 0
          ? cached
          : buildLocalFallbackCategories(user.id);
      }

      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, user_id, name, type, icon, color, created_at')
          .order('name', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          const seedPayload = DEFAULT_CATEGORIES.map((cat) => ({
            user_id: user.id,
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
          }));

          const { data: inserted, error: seedError } = await supabase
            .from('categories')
            .insert(seedPayload)
            .select('id, user_id, name, type, icon, color, created_at');

          if (!seedError && inserted) {
            setCachedCategories(user.id, inserted as Category[]);
            return inserted as Category[];
          }
        }

        const result = (data ?? []) as Category[];
        setCachedCategories(user.id, result);
        return result;
      } catch {
        const cached = getCachedCategories(user.id);
        return cached.length > 0
          ? cached
          : buildLocalFallbackCategories(user.id);
      }
    },
  });

  const addCategory = useMutation({
    mutationFn: async (input: DefaultCategorySeed) => {
      if (!user?.id) throw new Error('Pengguna belum masuk.');
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          type: input.type,
          icon: input.icon,
          color: input.color,
        })
        .select('id, user_id, name, type, icon, color, created_at')
        .single();

      if (error) throw new Error(error.message);
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast('Kategori baru berhasil ditambahkan.', 'success');
    },
    onError: (err: Error) => {
      showToast(`Gagal menambah kategori: ${err.message}`, 'error');
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<DefaultCategorySeed> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select('id, user_id, name, type, icon, color, created_at')
        .single();

      if (error) throw new Error(error.message);
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast('Kategori diperbarui.', 'success');
    },
    onError: (err: Error) => {
      showToast(`Gagal mengubah kategori: ${err.message}`, 'error');
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast('Kategori dihapus.', 'info');
    },
    onError: (err: Error) => {
      showToast(`Gagal menghapus kategori: ${err.message}`, 'error');
    },
  });

  const restoreDefaultCategories = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Pengguna belum masuk.');
      const existingNames = new Set(
        (categoriesQuery.data ?? []).map((c) => c.name.toLowerCase())
      );
      const missing = DEFAULT_CATEGORIES.filter(
        (c) => !existingNames.has(c.name.toLowerCase())
      );

      if (missing.length === 0) return [];

      const { data, error } = await supabase
        .from('categories')
        .insert(
          missing.map((c) => ({
            user_id: user.id,
            name: c.name,
            type: c.type,
            icon: c.icon,
            color: c.color,
          }))
        )
        .select('id, user_id, name, type, icon, color, created_at');

      if (error) throw new Error(error.message);
      return (data ?? []) as Category[];
    },
    onSuccess: (inserted) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (inserted.length > 0) {
        showToast(`${inserted.length} kategori bawaan dipulihkan.`, 'success');
      } else {
        showToast('Semua kategori bawaan sudah lengkap.', 'info');
      }
    },
    onError: (err: Error) => {
      showToast(`Gagal memulihkan kategori: ${err.message}`, 'error');
    },
  });

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    isError: categoriesQuery.isError,
    error: categoriesQuery.error,
    addCategory,
    updateCategory,
    deleteCategory,
    restoreDefaultCategories,
  };
}

export default useCategories;