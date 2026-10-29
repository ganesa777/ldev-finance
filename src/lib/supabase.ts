import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('proyek-anda')
);

// Gunakan fallback URL aman agar aplikasi tidak crash sebelum .env diisi oleh pengguna
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey! : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function translateAuthError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('invalid login credentials')) {
    return 'Email atau kata sandi salah. Coba lagi.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'Email ini sudah terdaftar. Silakan langsung masuk.';
  }
  if (msg.includes('password should be at least')) {
    return 'Kata sandi minimal harus 6 karakter.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Periksa kotak masuk emailmu atau nonaktifkan Confirm Email di Supabase.';
  }
  if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
    return 'Format alamat email tidak valid.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.';
  }
  if (msg.includes('signups not allowed')) {
    return 'Pendaftaran akun baru sedang dikunci oleh pemilik aplikasi.';
  }
  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return 'Gagal terhubung ke server Supabase. Pastikan URL & Anon Key di file .env sudah benar.';
  }
  return message || 'Terjadi kesalahan saat memproses autentikasi.';
}