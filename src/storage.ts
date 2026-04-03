import type { Transaction, Budget, MonthlyIncome } from './types';

const TRANSACTIONS_KEY = 'finance-tracker-transactions';
const BUDGETS_KEY = 'finance-tracker-budgets';

export function loadTransactions(): Transaction[] {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTransactions(transactions: Transaction[]) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function loadBudgets(): Budget[] {
  const data = localStorage.getItem(BUDGETS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveBudgets(budgets: Budget[]) {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
}

const INCOME_KEY = 'finance-tracker-income';

export function loadIncome(): MonthlyIncome[] {
  const data = localStorage.getItem(INCOME_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveIncome(income: MonthlyIncome[]) {
  localStorage.setItem(INCOME_KEY, JSON.stringify(income));
}
