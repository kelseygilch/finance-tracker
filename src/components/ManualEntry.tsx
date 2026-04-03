import { useState } from 'react';
import type { Transaction } from '../types';
import { DEFAULT_CATEGORIES } from '../types';
import { getMonthlyAverageRate } from '../exchangeRate';

interface Props {
  onAdd: (transaction: Transaction) => void;
}

export function ManualEntry({ onAdd }: Props) {
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [currency, setCurrency] = useState<'USD' | 'AUD'>('USD');
  const [category, setCategory] = useState('Other');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!date || !description || isNaN(parsed) || parsed <= 0) return;

    setSubmitting(true);
    let finalAmount = parsed;

    if (currency === 'AUD') {
      try {
        const d = new Date(date);
        const rate = await getMonthlyAverageRate(d.getFullYear(), d.getMonth() + 1);
        finalAmount = Math.round(parsed * rate * 100) / 100;
      } catch {
        alert('Failed to fetch exchange rate. Please try again.');
        setSubmitting(false);
        return;
      }
    }

    onAdd({
      id: crypto.randomUUID(),
      date,
      description,
      amount: finalAmount,
      category,
      type,
      note: currency === 'AUD' ? `${note ? note + ' | ' : ''}Original: A$${parsed.toFixed(2)}` : note,
    });

    setDate('');
    setDescription('');
    setAmount('');
    setType('expense');
    setCurrency('USD');
    setCategory('Other');
    setNote('');
    setSubmitting(false);
  }

  return (
    <div className="manual-entry">
      <h2>Add Transaction</h2>
      <form onSubmit={handleSubmit} className="manual-entry-form">
        <label>
          Type
          <select value={type} onChange={e => setType(e.target.value as 'expense' | 'income')}>
            <option value="expense">Expense</option>
            <option value="income">Refund / Return</option>
          </select>
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </label>
        <label>
          Description
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Coffee shop" required />
        </label>
        <label>
          Currency
          <select value={currency} onChange={e => setCurrency(e.target.value as 'USD' | 'AUD')}>
            <option value="USD">USD</option>
            <option value="AUD">AUD (converts to USD)</option>
          </select>
        </label>
        <label>
          Amount ({currency})
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0.01" step="0.01" required />
        </label>
        <label>
          Category
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {DEFAULT_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Note (optional)
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Add note..." />
        </label>
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Converting...' : type === 'expense' ? 'Add Expense' : 'Add Refund'}
        </button>
      </form>
    </div>
  );
}
