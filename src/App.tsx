import { useState, useEffect } from 'react';
import type { Transaction, Budget, MonthlyIncome } from './types';
import { loadTransactions, saveTransactions, loadBudgets, saveBudgets, loadIncome, saveIncome } from './storage';
import { CsvUpload } from './components/CsvUpload';
import { BudgetTracker } from './components/BudgetTracker';
import { SpendingInsights } from './components/SpendingInsights';
import { ExcelExport } from './components/ExcelExport';
import { TransactionList } from './components/TransactionList';
import { SuggestedBudget } from './components/SuggestedBudget';
import { ManualEntry } from './components/ManualEntry';

type Tab = 'import' | 'transactions' | 'budget' | 'annual' | 'insights';

export function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [budgets, setBudgets] = useState<Budget[]>(loadBudgets);
  const [income, setIncome] = useState<MonthlyIncome[]>(loadIncome);
  const [activeTab, setActiveTab] = useState<Tab>('import');

  useEffect(() => saveTransactions(transactions), [transactions]);
  useEffect(() => saveBudgets(budgets), [budgets]);
  useEffect(() => saveIncome(income), [income]);

  function handleImport(newTransactions: Transaction[]) {
    setTransactions(prev => [...prev, ...newTransactions]);
    setActiveTab('insights');
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
      </nav>

      {transactions.length > 0 && (
        <p className="transaction-count">{transactions.length} transactions loaded</p>
      )}

      <main className="content">
        {activeTab === 'import' && (
          <>
            <ManualEntry onAdd={(t) => setTransactions(prev => [...prev, t])} />
            <CsvUpload onImport={handleImport} />
          </>
        )}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            onUpdate={(updated) => setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t))}
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
          />
        )}
        {activeTab === 'annual' && <SuggestedBudget transactions={transactions} annualTarget={50000} />}
        {activeTab === 'insights' && <SpendingInsights transactions={transactions} income={income} />}
      </main>
    </div>
  );
}
