import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Receipt, AlertCircle } from 'lucide-react';
import { useTransactionModal } from '../components/layout/AppShell';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { calculateSummary, groupTransactionsByDate } from '../lib/stats';
import { formatHeaderTanggal, formatRupiah } from '../lib/format';
import { container, item } from '../lib/motion';
import { Button } from '../components/ui/Button';
import { FilterBar } from '../components/transactions/FilterBar';
import { TransactionItem } from '../components/transactions/TransactionItem';
import type { TxType } from '../types';

const PAGE_STEP = 25;

export const Transactions: React.FC = () => {
  const { openTransactionModal } = useTransactionModal();
  const { categories } = useCategories();

  const [month, setMonth] = useState<Date>(() => new Date());
  const [type, setType] = useState<'all' | TxType>('all');
  const [categoryId, setCategoryId] = useState<string | 'all'>('all');
  const [search, setSearch] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_STEP);

  const {
    transactions,
    isLoading,
    isError,
    refetch,
    deleteTransaction,
  } = useTransactions({
    month,
    type,
    categoryId,
    search,
  });

  const summary = useMemo(
    () => calculateSummary(transactions),
    [transactions]
  );

  const slicedTransactions = useMemo(
    () => transactions.slice(0, visibleCount),
    [transactions, visibleCount]
  );

  const groupedByDate = useMemo(
    () => groupTransactionsByDate(slicedTransactions),
    [slicedTransactions]
  );

  const hasMore = transactions.length > visibleCount;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Header Halaman + Ringkasan Cepat */}
      <motion.div
        variants={item}
        className="glass-card rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-ink">Transaksi</h1>
          <p className="text-sm text-muted">
            Riwayat pemasukan dan pengeluaranmu yang tercatat di LDEV.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-5 h-5" />}
          onClick={() => openTransactionModal('expense')}
        >
          Tambah transaksi
        </Button>
      </motion.div>

      {/* Bar Filter & Pencarian */}
      <motion.div variants={item}>
        <FilterBar
          month={month}
          onMonthChange={(m) => {
            setMonth(m);
            setVisibleCount(PAGE_STEP);
          }}
          type={type}
          onTypeChange={(t) => {
            setType(t);
            setVisibleCount(PAGE_STEP);
          }}
          categoryId={categoryId}
          onCategoryChange={(c) => {
            setCategoryId(c);
            setVisibleCount(PAGE_STEP);
          }}
          search={search}
          onSearchChange={(q) => {
            setSearch(q);
            setVisibleCount(PAGE_STEP);
          }}
          categories={categories}
        />
      </motion.div>

      {/* Pita Ringkasan Filter Aktif */}
      <motion.div
        variants={item}
        className="grid grid-cols-3 gap-3"
      >
        <div className="glass-card rounded-2xl p-3.5">
          <p className="text-[11px] font-medium text-muted">Pemasukan</p>
          <p className="text-sm sm:text-base font-extrabold text-income tabular-nums mt-0.5">
            +{formatRupiah(summary.income)}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-3.5">
          <p className="text-[11px] font-medium text-muted">Pengeluaran</p>
          <p className="text-sm sm:text-base font-extrabold text-expense tabular-nums mt-0.5">
            −{formatRupiah(summary.expense)}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-3.5">
          <p className="text-[11px] font-medium text-muted">Selisih Bersih</p>
          <p className="text-sm sm:text-base font-extrabold text-ink tabular-nums mt-0.5">
            {formatRupiah(summary.balance)}
          </p>
        </div>
      </motion.div>

      {/* Daftar Transaksi Dikelompokkan per Tanggal */}
      <motion.div variants={item} className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-20 rounded-2xl shimmer shadow-glass" />
            ))}
          </div>
        ) : isError ? (
          <div className="glass-card rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-expense mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-ink">
              Gagal memuat daftar transaksi
            </p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Periksa sambungan internetmu lalu muat ulang daftar transaksi.
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Coba muat ulang
            </Button>
          </div>
        ) : groupedByDate.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-sky-50 text-sky-500 mx-auto flex items-center justify-center">
              <Receipt className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-ink">
                Belum ada transaksi. Catat pengeluaran pertamamu.
              </p>
              <p className="text-xs text-muted">
                Ketuk tombol di bawah atau tombol + di navigasi bawah untuk mulai mencatat.
              </p>
            </div>
            <div className="pt-1">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => openTransactionModal('expense')}
              >
                Tambah transaksi
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedByDate.map((group) => {
              const netDaily = group.subtotalIncome - group.subtotalExpense;
              return (
                <div
                  key={group.date}
                  className="glass-card rounded-3xl p-4 sm:p-5 space-y-3"
                >
                  {/* Header Tanggal + Subtotal Harian */}
                  <div className="flex items-center justify-between border-b border-sky-100/80 pb-2.5">
                    <span className="text-xs sm:text-sm font-bold text-ink capitalize">
                      {formatHeaderTanggal(group.date)}
                    </span>
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        netDaily >= 0 ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {netDaily >= 0 ? '+' : '−'}
                      {formatRupiah(Math.abs(netDaily))}
                    </span>
                  </div>

                  {/* Daftar Item pada Tanggal Tersebut */}
                  <div className="space-y-2.5">
                    <AnimatePresence initial={false} mode="popLayout">
                      {group.items.map((trx) => (
                        <TransactionItem
                          key={trx.id}
                          transaction={trx}
                          onEdit={(itemToEdit) =>
                            openTransactionModal(itemToEdit.type, itemToEdit)
                          }
                          onDelete={(id) => deleteTransaction.mutate(id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <div className="text-center pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_STEP)}
                >
                  Muat lebih banyak ({transactions.length - visibleCount} lagi)
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Transactions;