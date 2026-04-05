export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  note: string;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface MonthlyIncome {
  month: string; // YYYY-MM
  amount: number;
}

export interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
}

export const INITIAL_CATEGORIES = [
  'Bills & Utilities',
  'Entertainment',
  'Fees & Adjustments',
  'Food & Drink',
  'Car',
  'Groceries',
  'Health & Wellness',
  'Household',
  'Personal',
  'Reimbursed',
  'Shopping',
  'Travel',
];

// These are always present and cannot be removed
export const SYSTEM_CATEGORIES = ['Income', 'Other', 'Ignore'] as const;
