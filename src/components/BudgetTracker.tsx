import { useState } from 'react';
import type { Transaction, Budget, MonthlyIncome } from '../types';
import { DEFAULT_CATEGORIES } from '../types';

interface Props {
  transactions: Transaction[];
  budgets: Budget[];
  onBudgetsChange: (budgets: Budget[]) => void;
  income: MonthlyIncome[];
  onIncomeChange: (income: MonthlyIncome[]) => void;
}

export function BudgetTracker({ transactions, budgets, onBudgetsChange, income, onIncomeChange }: Props) {
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [newIncomeMonth, setNewIncomeMonth] = useState('');
  const [newIncomeAmount, setNewIncomeAmount] = useState('');

  const active = transactions.filter(t => t.category !== 'Ignore' && t.category !== 'Reimbursed');

  const expensesByCategory = active
    .reduce<Record<string, number>>((acc, t) => {
      if (t.type === 'expense') {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      } else {
        // Refunds/returns reduce the category total
        acc[t.category] = (acc[t.category] || 0) - t.amount;
      }
      return acc;
    }, {});

  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);

  const totalExpenses = Object.values(expensesByCategory)
    .reduce((sum, v) => sum + Math.max(v, 0), 0);

  function addBudget() {
    if (!newCategory || !newLimit) return;
    const limit = parseFloat(newLimit);
    if (isNaN(limit) || limit <= 0) return;

    const existing = budgets.findIndex(b => b.category === newCategory);
    if (existing >= 0) {
      const updated = [...budgets];
      updated[existing] = { ...updated[existing], limit };
      onBudgetsChange(updated);
    } else {
      onBudgetsChange([...budgets, { category: newCategory, limit }]);
    }
    setNewCategory('');
    setNewLimit('');
  }

  function removeBudget(category: string) {
    onBudgetsChange(budgets.filter(b => b.category !== category));
  }

  function addIncome() {
    if (!newIncomeMonth || !newIncomeAmount) return;
    const amount = parseFloat(newIncomeAmount);
    if (isNaN(amount) || amount <= 0) return;

    const existing = income.findIndex(i => i.month === newIncomeMonth);
    if (existing >= 0) {
      const updated = [...income];
      updated[existing] = { ...updated[existing], amount };
      onIncomeChange(updated);
    } else {
      onIncomeChange([...income, { month: newIncomeMonth, amount }]);
    }
    setNewIncomeMonth('');
    setNewIncomeAmount('');
  }

  function removeIncome(month: string) {
    onIncomeChange(income.filter(i => i.month !== month));
  }

  return (
    <div className="budget-tracker">
      <h2>Budget Tracker</h2>

      <div className="summary-cards">
        <div className="card income-card">
          <h3>Total Income</h3>
          <p className="amount positive">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="card expense-card">
          <h3>Total Expenses</h3>
          <p className="amount negative">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="card balance-card">
          <h3>Balance</h3>
          <p className={`amount ${totalIncome - totalExpenses >= 0 ? 'positive' : 'negative'}`}>
            ${(totalIncome - totalExpenses).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="add-budget">
        <h3>Monthly Income</h3>
        <div className="add-budget-form">
          <input
            type="month"
            value={newIncomeMonth}
            onChange={e => setNewIncomeMonth(e.target.value)}
          />
          <input
            type="number"
            placeholder="Income amount ($)"
            value={newIncomeAmount}
            onChange={e => setNewIncomeAmount(e.target.value)}
            min="0"
            step="100"
          />
          <button onClick={addIncome}>Add</button>
        </div>
        {income.length > 0 && (
          <div className="income-list">
            {[...income].sort((a, b) => a.month.localeCompare(b.month)).map(i => (
              <div key={i.month} className="income-item">
                <span>{i.month}</span>
                <span className="positive">${i.amount.toFixed(2)}</span>
                <button className="remove-btn" onClick={() => removeIncome(i.month)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="add-budget">
        <h3>Set Budget</h3>
        <div className="add-budget-form">
          <select value={newCategory} onChange={e => setNewCategory(e.target.value)}>
            <option value="">Select category...</option>
            {DEFAULT_CATEGORIES.filter(c => c !== 'Income' && c !== 'Ignore' && c !== 'Reimbursed').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Monthly limit ($)"
            value={newLimit}
            onChange={e => setNewLimit(e.target.value)}
            min="0"
            step="50"
          />
          <button onClick={addBudget}>Set</button>
        </div>
      </div>

      {budgets.length > 0 && (
        <div className="budget-list">
          <h3>Budget Progress</h3>
          {budgets.map(budget => {
            const spent = expensesByCategory[budget.category] || 0;
            const percent = Math.min((spent / budget.limit) * 100, 100);
            const overBudget = spent > budget.limit;

            return (
              <div key={budget.category} className="budget-item">
                <div className="budget-header">
                  <span className="budget-category">{budget.category}</span>
                  <span className={`budget-amounts ${overBudget ? 'over' : ''}`}>
                    ${spent.toFixed(2)} / ${budget.limit.toFixed(2)}
                  </span>
                  <button className="remove-btn" onClick={() => removeBudget(budget.category)}>×</button>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${overBudget ? 'over-budget' : percent > 75 ? 'warning' : ''}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
