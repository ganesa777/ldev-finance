import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { BottomBar } from './BottomBar';
import { BottomSheet } from '../ui/BottomSheet';
import { Modal } from '../ui/Modal';
import { OfflinePwaBar } from '../ui/OfflinePwaBar';
import { TransactionForm } from '../transactions/TransactionForm';
import { pageTransition } from '../../lib/motion';
import type { Transaction, TxType } from '../../types';

interface TransactionModalContextValue {
  isOpen: boolean;
  defaultType: TxType;
  editingTransaction: Transaction | null;
  openTransactionModal: (type?: TxType, trx?: Transaction | null) => void;
  closeTransactionModal: () => void;
}

const TransactionModalContext = createContext<
  TransactionModalContextValue | undefined
>(undefined);

export function useTransactionModal(): TransactionModalContextValue {
  const ctx = useContext(TransactionModalContext);
  if (!ctx) {
    throw new Error('useTransactionModal harus dipakai di dalam AppShell');
  }
  return ctx;
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<TxType>('expense');
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openTransactionModal = (
    type: TxType = 'expense',
    trx: Transaction | null = null
  ) => {
    setDefaultType(trx ? trx.type : type);
    setEditingTransaction(trx);
    setIsOpen(true);
  };

  const closeTransactionModal = () => {
    setIsOpen(false);
    setEditingTransaction(null);
  };

  const modalTitle = editingTransaction
    ? 'Ubah Transaksi'
    : 'Tambah Transaksi';

  return (
    <TransactionModalContext.Provider
      value={{
        isOpen,
        defaultType,
        editingTransaction,
        openTransactionModal,
        closeTransactionModal,
      }}
    >
      <div className="min-h-screen flex flex-col md:pl-[96px]">
        <Sidebar />

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 pt-4 pb-[120px] md:px-6 md:py-6">
          <OfflinePwaBar />

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomBar
          hidden={isOpen}
          onQuickAdd={(type) => openTransactionModal(type, null)}
        />

        {isMobile ? (
          <BottomSheet
            open={isOpen}
            onClose={closeTransactionModal}
            title={modalTitle}
          >
            <TransactionForm
              key={editingTransaction?.id ?? defaultType}
              defaultType={defaultType}
              initialData={editingTransaction}
              onSuccess={closeTransactionModal}
              onCancel={closeTransactionModal}
            />
          </BottomSheet>
        ) : (
          <Modal
            open={isOpen}
            onClose={closeTransactionModal}
            title={modalTitle}
          >
            <TransactionForm
              key={editingTransaction?.id ?? defaultType}
              defaultType={defaultType}
              initialData={editingTransaction}
              onSuccess={closeTransactionModal}
              onCancel={closeTransactionModal}
            />
          </Modal>
        )}
      </div>
    </TransactionModalContext.Provider>
  );
};

export default AppShell;