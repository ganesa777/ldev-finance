import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import { Plus, Sparkles, Bell, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTransactionModal } from '../components/layout/AppShell';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useBudget } from '../hooks/useBudget';
import { useSavingGoal } from '../hooks/useSavingGoal';
import {
  calculateSummary,
  groupByCategory,
  buildWeeklyTrend,
  buildMonthlyTrend,
  compareMonths,
  calculateDailyAverageExpense,
} from '../lib/stats';
import { formatRupiah, formatTanggal } from '../lib/format';
import { container, item } from '../lib/motion';
import { Button } from '../components/ui/Button';
import { BalanceHero } from '../components/dashboard/BalanceHero';
import { StatCard } from '../components/dashboard/StatCard';
import { TopCategories } from '../components/dashboard/TopCategories';
import { BudgetCard } from '../components/dashboard/BudgetCard';
import { WeekStrip } from '../components/dashboard/WeekStrip';
import { SavingGoalCard } from '../components/dashboard/SavingGoalCard';
import { ActivityList } from '../components/dashboard/ActivityList';
import { AreaTrend } from '../components/charts/AreaTrend';
import { Orb3D } from '../components/dashboard/Orb3D';

export const Dashboard: React.FC = () => {
  const { displayName } = useAuth();
  const { openTransactionModal } = useTransactionModal();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const currentMonth = useMemo(() => new Date(), []);
  const prevMonth = useMemo(() => subMonths(currentMonth, 1), [currentMonth]);

  const { categories } = useCategories();
  const {
    transactions: monthTransactions,
    isLoading: txLoading,
    deleteTransaction,
  } = useTransactions({ month: currentMonth });
  const { transactions: prevMonthTransactions } = useTransactions({
    month: prevMonth,
  });
  const { budgetAmount, isLoading: budgetLoading, saveBudget } =
    useBudget(currentMonth);
  const { savingGoal, isLoading: goalLoading, saveGoal } = useSavingGoal();

  const summary = useMemo(
    () => calculateSummary(monthTransactions),
    [monthTransactions]
  );
  const comparison = useMemo(
    () => compareMonths(monthTransactions, prevMonthTransactions),
    [monthTransactions, prevMonthTransactions]
  );
  const topExpenseCategories = useMemo(
    () => groupByCategory(monthTransactions, 'expense', categories),
    [monthTransactions, categories]
  );
  const weeklyTrend = useMemo(
    () => buildWeeklyTrend(monthTransactions, currentMonth),
    [monthTransactions, currentMonth]
  );
  const monthlyTrend = useMemo(
    () => buildMonthlyTrend(monthTransactions, currentMonth),
    [monthTransactions, currentMonth]
  );
  const dailyAvgExpense = useMemo(
    () => calculateDailyAverageExpense(monthTransactions, currentMonth),
    [monthTransactions, currentMonth]
  );

  const activeDatesSet = useMemo(
    () => new Set(monthTransactions.map((t) => t.trx_date)),
    [monthTransactions]
  );

  const filteredActivity = useMemo(() => {
    if (!selectedDate) return monthTransactions;
    return monthTransactions.filter((t) => t.trx_date === selectedDate);
  }, [monthTransactions, selectedDate]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start"
    >
      {/* KOLOM KIRI & TENGAH UTAMA (8 Kolom di Desktop XL) */}
      <div className="xl:col-span-8 space-y-5">
        {/* 1. Banner Sapaan */}
        <motion.div
          variants={item}
          className="glass-card rounded-3xl p-5 md:p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="pointer-events-none absolute -right-6 -bottom-10 opacity-25 sm:opacity-80">
            <Orb3D variant="orb" size={110} />
          </div>

          <div className="relative z-10 flex items-center justify-between sm:block">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600">
                <Sparkles className="w-3.5 h-3.5" /> {formatTanggal(currentMonth)}
              </span>
              <h1 className="text-2xl md:text-[26px] font-extrabold text-ink">
                Halo, {displayName}
              </h1>
              <p className="text-sm text-muted">
                Ini ringkasan keuanganmu hari ini.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/laporan')}
              aria-label="Ringkasan laporan"
              className="sm:hidden w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10 flex items-center gap-2.5">
            <Button
              variant="primary"
              leftIcon={<Plus className="w-5 h-5" />}
              onClick={() => openTransactionModal('expense')}
            >
              Tambah transaksi
            </Button>
          </div>
        </motion.div>

        {/* 2. Baris 3 Kartu (Kategori Teratas | Saldo Hero | Anggaran) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          <motion.div
            variants={item}
            className="order-1 md:order-2 md:col-span-5"
          >
            <BalanceHero
              balance={summary.balance}
              changePct={comparison.balanceChangePct}
              loading={txLoading}
            />
          </motion.div>

          <motion.div
            variants={item}
            className="order-3 md:order-1 md:col-span-4"
          >
            <TopCategories
              items={topExpenseCategories}
              loading={txLoading}
              onSelectCategory={() => navigate('/transaksi')}
            />
          </motion.div>

          <motion.div
            variants={item}
            className="order-4 md:order-3 md:col-span-3"
          >
            <BudgetCard
              budgetAmount={budgetAmount}
              spentAmount={summary.expense}
              loading={budgetLoading || txLoading}
              onSaveBudget={(amt) => saveBudget.mutateAsync(amt)}
            />
          </motion.div>

          <motion.div
            variants={item}
            className="order-2 md:order-4 md:col-span-12 grid grid-cols-2 gap-4"
          >
            <StatCard
              title="Pemasukan"
              amount={summary.income}
              changePct={comparison.incomeChangePct}
              type="income"
              loading={txLoading}
            />
            <StatCard
              title="Pengeluaran"
              amount={summary.expense}
              changePct={comparison.expenseChangePct}
              type="expense"
              loading={txLoading}
            />
          </motion.div>
        </div>

        {/* 3. Grafik Statistik Area */}
        <motion.div variants={item}>
          <AreaTrend
            weeklyData={weeklyTrend}
            monthlyData={monthlyTrend}
            loading={txLoading}
          />
        </motion.div>

        {/* 4. Baris Bawah Kiri: Kartu Rata-rata Harian (Seragam Glass Card) + Target Tabungan 3D */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          <motion.div
            variants={item}
            whileHover={{ y: -5 }}
            className="md:col-span-5 glass-card rounded-3xl p-5 flex flex-col justify-between gap-4 min-h-[190px] transition-shadow hover:shadow-float"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-sky-500" /> Rata-rata harian
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted">
                Laju pengeluaran harianmu bulan ini
              </p>
              <p className="text-2xl font-extrabold tabular-nums text-ink">
                {formatRupiah(dailyAvgExpense)}
                <span className="text-xs font-medium text-muted"> / hari</span>
              </p>
            </div>

            <div className="pt-2 border-t border-sky-100 flex items-center justify-between text-xs text-muted">
              <span>Total transaksi bulan ini</span>
              <span className="font-bold text-ink tabular-nums">
                {monthTransactions.length} transaksi
              </span>
            </div>
          </motion.div>

          {/* Kartu Target Tabungan + Objek 3D */}
          <motion.div variants={item} className="md:col-span-7">
            <SavingGoalCard
              goal={savingGoal}
              loading={goalLoading}
              onSaveGoal={(input) => saveGoal.mutateAsync(input)}
            />
          </motion.div>
        </div>
      </div>

      {/* PANEL KANAN (4 Kolom di Desktop XL) */}
      <div className="xl:col-span-4 space-y-5">
        <motion.div variants={item}>
          <WeekStrip
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            activeDates={activeDatesSet}
          />
        </motion.div>

        <motion.div variants={item}>
          <ActivityList
            transactions={filteredActivity}
            loading={txLoading}
            selectedDate={selectedDate}
            onAddClick={() => openTransactionModal('expense')}
            onEditClick={(trx) => openTransactionModal(trx.type, trx)}
            onDeleteClick={(id) => deleteTransaction.mutate(id)}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;