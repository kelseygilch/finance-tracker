import { useState } from 'react';
import type { Transaction } from '../types';
import { formatDate } from '../formatDate';

interface Props {
  transactions: Transaction[];
  categories: string[];
  onUpdate: (updated: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, categories, onUpdate, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const filtered = transactions.filter(t => {
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterMonth) {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return false;
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (month !== filterMonth) return false;
    }
    return true;
  });

  return (
    <div className="transaction-list">
      <h2>Transactions</h2>

      <div className="transaction-filters">
        <input
          type="text"
          placeholder="Search descriptions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
        />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <p className="transaction-count">{filtered.length} of {transactions.length} transactions</p>

      <div className="preview-table-wrapper">
        <table className="preview-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td>{formatDate(t.date)}</td>
                <td>{t.description}</td>
                <td className={t.type === 'income' ? 'positive' : 'negative'}>
                  {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                </td>
                <td>
                  <select
                    value={t.category}
                    onChange={e => onUpdate({ ...t, category: e.target.value })}
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="Add note..."
                    value={t.note}
                    onChange={e => onUpdate({ ...t, note: e.target.value })}
                    className="note-input"
                  />
                </td>
                <td>
                  <button className="remove-btn" onClick={() => onDelete(t.id)}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
