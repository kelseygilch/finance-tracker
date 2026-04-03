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

export const DEFAULT_CATEGORIES = [
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
  'Income',
  'Other',
  'Ignore',
] as const;
