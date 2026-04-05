import type { Transaction, Budget, MonthlyIncome } from './types';
import { INITIAL_CATEGORIES, SYSTEM_CATEGORIES } from './types';

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

const CATEGORIES_KEY = 'finance-tracker-categories';

export function loadCategories(): string[] {
  const data = localStorage.getItem(CATEGORIES_KEY);
  if (data) return [...JSON.parse(data), ...SYSTEM_CATEGORIES];
  return [...INITIAL_CATEGORIES, ...SYSTEM_CATEGORIES];
}

export function saveCategories(categories: string[]) {
  // Only save user categories, not system ones
  const userCats = categories.filter(
    c => !(SYSTEM_CATEGORIES as readonly string[]).includes(c)
  );
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(userCats));
}

const CATEGORY_MAP_KEY = 'finance-tracker-category-map';

export function loadCategoryMap(): Record<string, string> {
  const data = localStorage.getItem(CATEGORY_MAP_KEY);
  return data ? JSON.parse(data) : {};
}

export function saveCategoryMap(map: Record<string, string>) {
  localStorage.setItem(CATEGORY_MAP_KEY, JSON.stringify(map));
}

export function learnCategories(transactions: Transaction[]) {
  const map = loadCategoryMap();
  for (const t of transactions) {
    if (t.category && t.category !== 'Other' && t.description.trim()) {
      const key = t.description.trim().toUpperCase();
      map[key] = t.category;
    }
  }
  saveCategoryMap(map);
}
