import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const numberOnlyFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

export function formatRupiah(amount: number): string {
  if (Number.isNaN(amount)) return 'Rp 0';
  return rupiahFormatter.format(Math.round(amount));
}

export function formatRibuan(amount: number): string {
  if (!amount || Number.isNaN(amount)) return '';
  return numberOnlyFormatter.format(Math.round(amount));
}

export function parseRupiahInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export function formatSingkat(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}${ (abs / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) } M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${ (abs / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) } jt`;
  }
  if (abs >= 1_000) {
    return `${sign}${ (abs / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 }) } rb`;
  }
  return `${sign}${abs}`;
}

export function formatTanggal(dateStr: string | Date, pattern = 'EEEE, d MMM yyyy'): string {
  const dateObj = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(dateObj, pattern, { locale: idLocale });
}

export function formatHeaderTanggal(dateStr: string): string {
  const dateObj = parseISO(dateStr);
  if (isToday(dateObj)) return 'Hari ini';
  if (isYesterday(dateObj)) return 'Kemarin';
  return format(dateObj, 'EEEE, d MMM yyyy', { locale: idLocale });
}

export function formatBulanTahun(dateStr: string | Date): string {
  const dateObj = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(dateObj, 'MMMM yyyy', { locale: idLocale });
}