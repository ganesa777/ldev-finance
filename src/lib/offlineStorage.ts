import type {
  Budget,
  Category,
  SavingGoal,
  Transaction,
  TransactionInput,
} from '../types';

const STORAGE_PREFIX = 'ldev_offline_v1';

export type OfflineMutationAction =
  | {
      id: string;
      type: 'ADD_TX';
      payload: TransactionInput & { tempId: string; createdAt: string };
    }
  | {
      id: string;
      type: 'UPDATE_TX';
      payload: TransactionInput & { id: string };
    }
  | {
      id: string;
      type: 'DELETE_TX';
      payload: { id: string };
    };

function getKey(userId: string, entity: string): string {
  return `${STORAGE_PREFIX}_${userId}_${entity}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, data: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Abaikan jika kuota penyimpanan penuh
  }
}

// Cache Transaksi
export function getCachedTransactions(userId: string): Transaction[] {
  return readJson<Transaction[]>(getKey(userId, 'transactions'), []);
}

export function setCachedTransactions(
  userId: string,
  items: Transaction[]
): void {
  writeJson(getKey(userId, 'transactions'), items);
}

// Cache Kategori
export function getCachedCategories(userId: string): Category[] {
  return readJson<Category[]>(getKey(userId, 'categories'), []);
}

export function setCachedCategories(userId: string, items: Category[]): void {
  writeJson(getKey(userId, 'categories'), items);
}

// Cache Anggaran Bulanan
export function getCachedBudget(
  userId: string,
  monthStr: string
): Budget | null {
  return readJson<Budget | null>(getKey(userId, `budget_${monthStr}`), null);
}

export function setCachedBudget(
  userId: string,
  monthStr: string,
  budget: Budget | null
): void {
  writeJson(getKey(userId, `budget_${monthStr}`), budget);
}

// Cache Target Tabungan
export function getCachedSavingGoal(userId: string): SavingGoal | null {
  return readJson<SavingGoal | null>(getKey(userId, 'saving_goal'), null);
}

export function setCachedSavingGoal(
  userId: string,
  goal: SavingGoal | null
): void {
  writeJson(getKey(userId, 'saving_goal'), goal);
}

// Antrean Sinkronisasi Offline (Offline Queue)
export function getOfflineQueue(userId: string): OfflineMutationAction[] {
  return readJson<OfflineMutationAction[]>(getKey(userId, 'queue'), []);
}

export function enqueueOfflineAction(
  userId: string,
  action: OfflineMutationAction
): void {
  const queue = getOfflineQueue(userId);
  queue.push(action);
  writeJson(getKey(userId, 'queue'), queue);
  window.dispatchEvent(new CustomEvent('ldev-offline-queue-changed'));
}

export function setOfflineQueue(
  userId: string,
  queue: OfflineMutationAction[]
): void {
  writeJson(getKey(userId, 'queue'), queue);
  window.dispatchEvent(new CustomEvent('ldev-offline-queue-changed'));
}