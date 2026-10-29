export type TxType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TxType;
  icon: string;
  color: string;
  created_at?: string;
}

export interface DefaultCategorySeed {
  name: string;
  type: TxType;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TxType;
  amount: number;
  note: string | null;
  trx_date: string; // 'YYYY-MM-DD'
  created_at: string;
  category?: Category | null;
}

export interface TransactionInput {
  category_id: string | null;
  type: TxType;
  amount: number;
  note: string | null;
  trx_date: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month: string; // 'YYYY-MM-01'
  amount: number;
  created_at?: string;
}

export interface SavingGoal {
  id: string;
  user_id: string;
  name: string;
  target: number;
  saved: number;
  created_at?: string;
}

export interface TransactionFilter {
  month?: Date;
  type?: 'all' | TxType;
  categoryId?: string | 'all';
  search?: string;
  selectedDate?: string | null; // 'YYYY-MM-DD'
}