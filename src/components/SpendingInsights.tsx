import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine,
  LineChart, Line,
} from 'recharts';
import type { Transaction, MonthlyIncome } from '../types';
import { formatDate } from '../formatDate';

interface Props {
  transactions: Transaction[];
  income: MonthlyIncome[];
}

const COLORS = [
  '#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
  '#84CC16', '#A855F7',
];

export function SpendingInsights({ transactions, income }: Props) {
  const active = transactions.filter(t => t.category !== 'Ignore' && t.category !== 'Reimbursed');

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    active.forEach(t => {
      const sign = t.type === 'expense' ? 1 : -1;
      map[t.category] = (map[t.category] || 0) + t.amount * sign;
    });
    return Object.entries(map)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [active]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expenses: number }> = {};
    active.forEach(t => {
      const date = new Date(t.date);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { income: 0, expenses: 0 };
      if (t.type === 'expense') {
        map[key].expenses += t.amount;
      } else {
        // Refunds reduce expenses for that month
        map[key].expenses -= t.amount;
      }
    });
    income.forEach(i => {
      if (!map[i.month]) map[i.month] = { income: 0, expenses: 0 };
      map[i.month].income += i.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(Math.max(data.expenses, 0) * 100) / 100,
      }));
  }, [active, income]);

  const monthlyCategoryData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    const allCategories = new Set<string>();
    active.forEach(t => {
      const date = new Date(t.date);
      if (isNaN(date.getTime())) return;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!map[month]) map[month] = {};
      const sign = t.type === 'expense' ? 1 : -1;
      map[month][t.category] = (map[month][t.category] || 0) + t.amount * sign;
      allCategories.add(t.category);
    });
    const months = Object.keys(map).sort();
    const categories = [...allCategories].sort();
    const rows = months.map(month => {
      const row: Record<string, string | number> = { month };
      for (const cat of categories) {
        row[cat] = Math.round((map[month][cat] || 0) * 100) / 100;
      }
      return row;
    });
    return { rows, categories };
  }, [active]);

  const savingsData = useMemo(() => {
    return monthlyData
      .filter(m => m.income > 0)
      .map(m => {
        const saved = m.income - m.expenses;
        const rate = Math.round((saved / m.income) * 10000) / 100;
        return {
          month: m.month,
          income: m.income,
          expenses: m.expenses,
          saved: Math.round(saved * 100) / 100,
          rate,
        };
      });
  }, [monthlyData]);

  const topExpensesByMonth = useMemo(() => {
    const byMonth: Record<string, Transaction[]> = {};
    active.filter(t => t.type === 'expense').forEach(t => {
      const date = new Date(t.date);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(t);
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, txns]) => ({
        month,
        top: txns.sort((a, b) => b.amount - a.amount).slice(0, 10),
      }));
  }, [active]);

  if (active.length === 0) {
    return (
      <div className="spending-insights">
        <h2>Spending Insights</h2>
        <p className="empty-state">Import some transactions to see your spending insights.</p>
      </div>
    );
  }

  return (
    <div className="spending-insights">
      <h2>Spending Insights</h2>

      <div className="charts-grid">
        {categoryData.length > 0 && (
          <div className="chart-card">
            <h3>Spending by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {monthlyData.length > 0 && (
          <div className="chart-card">
            <h3>Monthly Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Legend />
                <Bar dataKey="income" fill="#10B981" name="Income" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {monthlyData.length > 1 && (
          <div className="chart-card">
            <h3>Spending Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {savingsData.length > 0 && (
          <div className="chart-card full-width">
            <h3>Monthly Savings Rate</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={savingsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value, name) =>
                  name === 'rate' ? `${Number(value).toFixed(1)}%` : `$${Number(value).toFixed(2)}`
                } />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="rate" name="Savings Rate" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
            <div className="preview-table-wrapper" style={{ marginTop: 16 }}>
              <table className="top-expenses-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Income</th>
                    <th>Expenses</th>
                    <th>Saved</th>
                    <th>Savings Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsData.map(m => (
                    <tr key={m.month}>
                      <td><strong>{m.month}</strong></td>
                      <td className="positive">${m.income.toFixed(2)}</td>
                      <td className="negative">${m.expenses.toFixed(2)}</td>
                      <td className={m.saved >= 0 ? 'positive' : 'negative'}>${m.saved.toFixed(2)}</td>
                      <td className={m.rate >= 0 ? 'positive' : 'negative'}>{m.rate.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {savingsData.length > 1 && (() => {
                    const avgRate = savingsData.reduce((s, m) => s + m.rate, 0) / savingsData.length;
                    const totalSaved = savingsData.reduce((s, m) => s + m.saved, 0);
                    return (
                      <tr>
                        <td><strong>Average</strong></td>
                        <td></td>
                        <td></td>
                        <td className={totalSaved >= 0 ? 'positive' : 'negative'}>
                          <strong>${(totalSaved / savingsData.length).toFixed(2)}</strong>
                        </td>
                        <td className={avgRate >= 0 ? 'positive' : 'negative'}>
                          <strong>{avgRate.toFixed(1)}%</strong>
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {monthlyCategoryData.rows.length > 0 && (
          <div className="chart-card full-width">
            <h3>Monthly Spending by Category</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyCategoryData.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Legend />
                {monthlyCategoryData.categories.map((cat, i) => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {monthlyCategoryData.rows.length > 0 && (
          <div className="chart-card full-width">
            <h3>Monthly Spending by Category (Table)</h3>
            <div className="preview-table-wrapper">
              <table className="top-expenses-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    {monthlyCategoryData.rows.map(row => (
                      <th key={row.month as string}>{row.month as string}</th>
                    ))}
                    <th>Average</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyCategoryData.categories.map(cat => {
                    const total = monthlyCategoryData.rows.reduce(
                      (sum, row) => sum + (Number(row[cat]) || 0), 0
                    );
                    const avg = monthlyCategoryData.rows.length > 0
                      ? total / monthlyCategoryData.rows.length : 0;
                    return (
                      <tr key={cat}>
                        <td><strong>{cat}</strong></td>
                        {monthlyCategoryData.rows.map(row => {
                          const val = Number(row[cat]) || 0;
                          const diff = val - avg;
                          return (
                            <td key={row.month as string}>
                              {val ? (
                                <>
                                  ${val.toFixed(2)}
                                  {avg > 0 && (
                                    <span className={`deviation ${diff > 0 ? 'over' : 'under'}`}>
                                      {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                                    </span>
                                  )}
                                </>
                              ) : '—'}
                            </td>
                          );
                        })}
                        <td><strong>${avg.toFixed(2)}</strong></td>
                        <td><strong>${total.toFixed(2)}</strong></td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td><strong>Total</strong></td>
                    {monthlyCategoryData.rows.map(row => {
                      const monthTotal = monthlyCategoryData.categories.reduce(
                        (sum, cat) => sum + (Number(row[cat]) || 0), 0
                      );
                      return <td key={row.month as string}><strong>${monthTotal.toFixed(2)}</strong></td>;
                    })}
                    <td><strong>${monthlyCategoryData.rows.length > 0 ? (monthlyCategoryData.rows.reduce((sum, row) =>
                      sum + monthlyCategoryData.categories.reduce((s, cat) => s + (Number(row[cat]) || 0), 0)
                    , 0) / monthlyCategoryData.rows.length).toFixed(2) : '0.00'}</strong></td>
                    <td><strong>${monthlyCategoryData.rows.reduce((sum, row) =>
                      sum + monthlyCategoryData.categories.reduce((s, cat) => s + (Number(row[cat]) || 0), 0)
                    , 0).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {topExpensesByMonth.map(({ month, top }) => (
          <div key={month} className="chart-card full-width">
            <h3>Top Expenses — {month}</h3>
            <table className="top-expenses-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {top.map(t => (
                  <tr key={t.id}>
                    <td>{formatDate(t.date)}</td>
                    <td>{t.description}</td>
                    <td>{t.category}</td>
                    <td className="negative">${t.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
