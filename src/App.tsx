import { useState, useEffect } from 'react';
import type { Transaction, Budget, MonthlyIncome } from './types';
import {
  loadTransactions, saveTransactions,
  loadBudgets, saveBudgets,
  loadIncome, saveIncome,
  loadCategories, saveCategories,
  learnCategories,
} from './storage';
import { CsvUpload } from './components/CsvUpload';
import { BudgetTracker } from './components/BudgetTracker';
import { SpendingInsights } from './components/SpendingInsights';
import { ExcelExport } from './components/ExcelExport';
import { TransactionList } from './components/TransactionList';
import { SuggestedBudget } from './components/SuggestedBudget';
import { ManualEntry } from './components/ManualEntry';
import { CategoryManager } from './components/CategoryManager';

type Tab = 'import' | 'transactions' | 'budget' | 'annual' | 'insights' | 'settings';

export function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [budgets, setBudgets] = useState<Budget[]>(loadBudgets);
  const [income, setIncome] = useState<MonthlyIncome[]>(loadIncome);
  const [categories, setCategories] = useState<string[]>(loadCategories);
  const [activeTab, setActiveTab] = useState<Tab>('import');

  // Learn from existing transactions on first load
  useEffect(() => { learnCategories(transactions); }, []);

  useEffect(() => saveTransactions(transactions), [transactions]);
  useEffect(() => saveBudgets(budgets), [budgets]);
  useEffect(() => saveIncome(income), [income]);
  useEffect(() => saveCategories(categories), [categories]);

  function handleImport(newTransactions: Transaction[]) {
    learnCategories(newTransactions);
    setTransactions(prev => [...prev, ...newTransactions]);
    setActiveTab('insights');
  }

  function handleManualAdd(t: Transaction) {
    learnCategories([t]);
    setTransactions(prev => [...prev, t]);
  }

  function handleTransactionUpdate(updated: Transaction) {
    learnCategories([updated]);
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
  }

  function handleClearData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setTransactions([]);
      setBudgets([]);
      setIncome([]);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Finance Tracker</h1>
        <div className="header-actions">
          <ExcelExport transactions={transactions} budgets={budgets} income={income} />
          <button className="clear-btn" onClick={handleClearData} disabled={transactions.length === 0}>
            Clear Data
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button className={activeTab === 'import' ? 'active' : ''} onClick={() => setActiveTab('import')}>
          Import
        </button>
        <button className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>
          Transactions
        </button>
        <button className={activeTab === 'budget' ? 'active' : ''} onClick={() => setActiveTab('budget')}>
          Budget
        </button>
        <button className={activeTab === 'annual' ? 'active' : ''} onClick={() => setActiveTab('annual')}>
          Annual Plan
        </button>
        <button className={activeTab === 'insights' ? 'active' : ''} onClick={() => setActiveTab('insights')}>
          Insights
        </button>
        <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
          Settings
        </button>
      </nav>

      {transactions.length > 0 && (
        <p className="transaction-count">{transactions.length} transactions loaded</p>
      )}

      <main className="content">
        {activeTab === 'import' && (
          <>
            <ManualEntry onAdd={handleManualAdd} categories={categories} />
            <CsvUpload onImport={handleImport} categories={categories} />
          </>
        )}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            categories={categories}
            onUpdate={handleTransactionUpdate}
            onDelete={(id) => setTransactions(prev => prev.filter(t => t.id !== id))}
          />
        )}
        {activeTab === 'budget' && (
          <BudgetTracker
            transactions={transactions}
            budgets={budgets}
            onBudgetsChange={setBudgets}
            income={income}
            onIncomeChange={setIncome}
            categories={categories}
          />
        )}
        {activeTab === 'annual' && <SuggestedBudget transactions={transactions} annualTarget={50000} />}
        {activeTab === 'insights' && <SpendingInsights transactions={transactions} income={income} />}
        {activeTab === 'settings' && (
          <CategoryManager categories={categories} onCategoriesChange={setCategories} />
        )}
      </main>
    </div>
  );
}
