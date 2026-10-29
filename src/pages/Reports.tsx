import React, { useMemo, useState } from 'react';
import { addMonths, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import {
  calculateSummary,
  groupByCategory,
  compareMonths,
  calculateDailyAverageExpense,
} from '../lib/stats';
import { getCategoryIcon } from '../lib/categories';
import {
  formatBulanTahun,
  formatRupiah,
  formatSingkat,
  formatTanggal,
} from '../lib/format';
import { container, item } from '../lib/motion';
import { CategoryDonut } from '../components/charts/CategoryDonut';

export const Reports: React.FC = () => {
  const [month, setMonth] = useState<Date>(() => new Date());
  const prevMonth = useMemo(() => subMonths(month, 1), [month]);

  const { categories } = useCategories();
  const { transactions: currentTx, isLoading: loadingCurrent } =
    useTransactions({ month });
  const { transactions: prevTx, isLoading: loadingPrev } = useTransactions({
    month: prevMonth,
  });

  const isLoading = loadingCurrent || loadingPrev;

  const summary = useMemo(() => calculateSummary(currentTx), [currentTx]);
  const categoryBreakdown = useMemo(
    () => groupByCategory(currentTx, 'expense', categories),
    [currentTx, categories]
  );
  const comparison = useMemo(
    () => compareMonths(currentTx, prevTx),
    [currentTx, prevTx]
  );
  const dailyAvg = useMemo(
    () => calculateDailyAverageExpense(currentTx, month),
    [currentTx, month]
  );

  // 5 pengeluaran terbesar bulan ini
  const top5Expenses = useMemo(() => {
    return currentTx
      .filter((t) => t.type === 'expense')
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);
  }, [currentTx]);

  // Data Bar Ganda: Bulan Lalu vs Bulan Ini
  const comparisonChartData = useMemo(
    () => [
      {
        name: 'Pemasukan',
        bulanLalu: comparison.prevIncome,
        bulanIni: comparison.currentIncome,
      },
      {
        name: 'Pengeluaran',
        bulanLalu: comparison.prevExpense,
        bulanIni: comparison.currentExpense,
      },
    ],
    [comparison]
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Header + Pemilih Bulan */}
      <motion.div
        variants={item}
        className="glass-card rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-ink">Laporan Keuangan</h1>
          <p className="text-sm text-muted">
            Ringkasan analitik dan perbandingan arus kas bulananmu di LDEV.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 bg-sky-50/90 border border-sky-100 rounded-2xl px-3 py-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMonth((prev) => addMonths(prev, -1))}
            aria-label="Bulan sebelumnya"
            className="w-8 h-8 rounded-xl bg-white hover:bg-sky-100/60 text-ink flex items-center justify-center transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs sm:text-sm font-bold text-ink px-2 capitalize min-w-[130px] text-center">
            {formatBulanTahun(month)}
          </span>

          <button
            type="button"
            onClick={() => setMonth((prev) => addMonths(prev, 1))}
            aria-label="Bulan berikutnya"
            className="w-8 h-8 rounded-xl bg-white hover:bg-sky-100/60 text-ink flex items-center justify-center transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* 3 Kartu Ringkasan Atas (Pemasukan, Pengeluaran, Rata-rata Harian) */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card rounded-3xl p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-income flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Total pemasukan</p>
            <p className="text-xl font-extrabold text-ink tabular-nums mt-0.5">
              {formatRupiah(summary.income)}
            </p>
            <p className="text-[11px] font-semibold text-income mt-0.5">
              {comparison.incomeChangePct >= 0
                ? `+${comparison.incomeChangePct}%`
                : `${comparison.incomeChangePct}%`}{' '}
              vs bulan lalu
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card rounded-3xl p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-expense flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Total pengeluaran</p>
            <p className="text-xl font-extrabold text-ink tabular-nums mt-0.5">
              {formatRupiah(summary.expense)}
            </p>
            <p className="text-[11px] font-semibold text-expense mt-0.5">
              {comparison.expenseChangePct >= 0
                ? `+${comparison.expenseChangePct}%`
                : `${comparison.expenseChangePct}%`}{' '}
              vs bulan lalu
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card rounded-3xl p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">
              Rata-rata pengeluaran harian
            </p>
            <p className="text-xl font-extrabold text-ink tabular-nums mt-0.5">
              {formatRupiah(dailyAvg)}
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              Dari {currentTx.filter((t) => t.type === 'expense').length} transaksi keluar
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Baris Utama: Donut Kategori + Perbandingan Bulan Ini vs Bulan Lalu */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <motion.div variants={item} className="lg:col-span-7">
          <CategoryDonut
            items={categoryBreakdown}
            totalAmount={summary.expense}
            loading={isLoading}
          />
        </motion.div>

        {/* Perbandingan Bulan Ini vs Bulan Lalu dengan Bar Ganda */}
        <motion.div
          variants={item}
          whileHover={{ y: -4 }}
          className="lg:col-span-5 glass-card rounded-3xl p-5 md:p-6 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-500" />
              <h3 className="text-base font-bold text-ink">
                Bulan ini vs bulan lalu
              </h3>
            </div>
            <p className="text-xs text-muted capitalize">
              Perbandingan {formatBulanTahun(prevMonth)} & {formatBulanTahun(month)}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span className="w-3 h-3 rounded-sm bg-sky-200 inline-block" />
              Bulan lalu
            </span>
            <span className="inline-flex items-center gap-1.5 text-ink">
              <span className="w-3 h-3 rounded-sm bg-sky-500 inline-block" />
              Bulan ini
            </span>
          </div>

          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonChartData}
                margin={{ top: 10, right: 10, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#E0F2FE"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#0F2A43', fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatSingkat(Number(v))}
                  tick={{ fill: '#6B84A0', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(224,242,254,0.35)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const prevVal = Number(
                      payload.find((p) => p.dataKey === 'bulanLalu')?.value ?? 0
                    );
                    const currVal = Number(
                      payload.find((p) => p.dataKey === 'bulanIni')?.value ?? 0
                    );
                    return (
                      <div className="glass-strong rounded-2xl p-3 shadow-float border border-white text-xs space-y-1">
                        <p className="font-bold text-ink">{label}</p>
                        <p className="text-muted tabular-nums">
                          Bulan lalu: {formatRupiah(prevVal)}
                        </p>
                        <p className="text-sky-600 font-bold tabular-nums">
                          Bulan ini: {formatRupiah(currVal)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="bulanLalu"
                  fill="#BAE6FD"
                  radius={[8, 8, 8, 8]}
                  barSize={28}
                  animationDuration={900}
                />
                <Bar
                  dataKey="bulanIni"
                  fill="#0EA5E9"
                  radius={[8, 8, 8, 8]}
                  barSize={28}
                  animationDuration={1100}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* 5 Pengeluaran Terbesar Bulan Ini */}
      <motion.div
        variants={item}
        className="glass-card rounded-3xl p-5 md:p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-sky-500" />
          <div>
            <h3 className="text-base font-bold text-ink">
              5 pengeluaran terbesar bulan ini
            </h3>
            <p className="text-xs text-muted">
              Transaksi dengan nilai pengeluaran tertinggi pada {formatBulanTahun(month)}
            </p>
          </div>
        </div>

        {top5Expenses.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">
            Belum ada pengeluaran tercatat pada bulan ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {top5Expenses.map((trx, idx) => {
              const Icon = getCategoryIcon(trx.category?.icon);
              const color = trx.category?.color ?? '#F43F5E';

              return (
                <div
                  key={trx.id}
                  className="p-3.5 rounded-2xl bg-white/75 border border-white/90 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${color}22`,
                        color,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink truncate">
                        {trx.category?.name ?? 'Lainnya'}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {trx.note
                          ? `${trx.note} · ${formatTanggal(trx.trx_date, 'd MMM')}`
                          : formatTanggal(trx.trx_date, 'd MMM yyyy')}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-extrabold text-expense tabular-nums shrink-0">
                    −{formatRupiah(trx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Reports;