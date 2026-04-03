import { useState, useRef } from 'react';
import Papa from 'papaparse';
import type { Transaction, ColumnMapping } from '../types';
import { DEFAULT_CATEGORIES } from '../types';
import { convertAudTransactions } from '../exchangeRate';
import { guessCategory } from '../categorizer';
import { formatDate } from '../formatDate';

interface Props {
  onImport: (transactions: Transaction[]) => void;
}

export function CsvUpload({ onImport }: Props) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: '', description: '', amount: '' });
  const [currency, setCurrency] = useState<'USD' | 'AUD'>('USD');
  const [shared, setShared] = useState(false);
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [previewTransactions, setPreviewTransactions] = useState<Transaction[]>([]);
  const [converting, setConverting] = useState(false);
  const [conversionRates, setConversionRates] = useState<Map<string, number> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length < 2) return;
        setHeaders(data[0]);
        setRows(data.slice(1).filter(row => row.some(cell => cell.trim())));
        setStep('map');
      },
    });
  }

  async function handleMapping() {
    if (!mapping.date || !mapping.description || !mapping.amount) return;

    const dateIdx = headers.indexOf(mapping.date);
    const descIdx = headers.indexOf(mapping.description);
    const amountIdx = headers.indexOf(mapping.amount);

    let transactions: Transaction[] = rows
      .map((row) => {
        const rawAmount = parseFloat(row[amountIdx]?.replace(/[^-\d.]/g, ''));
        if (isNaN(rawAmount) || !row[dateIdx]) return null;

        const description = row[descIdx] || '';
        return {
          id: crypto.randomUUID(),
          date: row[dateIdx],
          description,
          amount: Math.abs(rawAmount),
          category: guessCategory(description) || 'Other',
          type: rawAmount < 0 ? 'expense' : 'income',
          note: '',
        } as Transaction;
      })
      .filter((t): t is Transaction => t !== null);

    if (currency === 'AUD') {
      setConverting(true);
      try {
        const rateMap = await convertAudTransactions(transactions);
        setConversionRates(rateMap);

        transactions = transactions.map(t => {
          const d = new Date(t.date);
          if (isNaN(d.getTime())) return t;
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
          const rate = rateMap.get(key);
          if (!rate) return t;
          return {
            ...t,
            amount: Math.round(t.amount * rate * 100) / 100,
          };
        });
      } catch (err) {
        alert(`Failed to fetch exchange rates: ${err instanceof Error ? err.message : err}`);
        setConverting(false);
        return;
      }
      setConverting(false);
    } else {
      setConversionRates(null);
    }

    if (shared) {
      transactions = transactions.map(t => ({
        ...t,
        amount: Math.round(t.amount * 50) / 100,
      }));
    }

    setPreviewTransactions(transactions);
    setStep('preview');
  }

  function handleCategoryChange(id: string, category: string) {
    setPreviewTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, category } : t)
    );
  }

  function handleNoteChange(id: string, note: string) {
    setPreviewTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, note } : t)
    );
  }

  function handleImport() {
    onImport(previewTransactions);
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setPreviewTransactions([]);
    setConversionRates(null);
    setCurrency('USD');
    setShared(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="csv-upload">
      <h2>Import Transactions</h2>

      {step === 'upload' && (
        <div className="upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
          />
          <p>Upload a CSV file from your bank or credit card provider</p>
        </div>
      )}

      {step === 'map' && (
        <div className="mapping-step">
          <h3>Map your columns</h3>
          <p>Tell us which columns contain the date, description, and amount.</p>
          <div className="mapping-fields">
            <label>
              Currency:
              <select value={currency} onChange={e => setCurrency(e.target.value as 'USD' | 'AUD')}>
                <option value="USD">USD (US Dollar)</option>
                <option value="AUD">AUD (Australian Dollar) — will convert to USD</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={shared} onChange={e => setShared(e.target.checked)} />
              Shared account (50/50 split) — amounts will be halved
            </label>
            <label>
              Date column:
              <select value={mapping.date} onChange={e => setMapping(m => ({ ...m, date: e.target.value }))}>
                <option value="">Select...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
            <label>
              Description column:
              <select value={mapping.description} onChange={e => setMapping(m => ({ ...m, description: e.target.value }))}>
                <option value="">Select...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
            <label>
              Amount column:
              <select value={mapping.amount} onChange={e => setMapping(m => ({ ...m, amount: e.target.value }))}>
                <option value="">Select...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
          </div>
          <div className="mapping-actions">
            <button onClick={() => setStep('upload')}>Back</button>
            <button
              onClick={handleMapping}
              disabled={!mapping.date || !mapping.description || !mapping.amount || converting}
            >
              {converting ? 'Fetching exchange rates...' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="preview-step">
          <h3>Review & categorize ({previewTransactions.length} transactions)</h3>
          {conversionRates && (
            <div className="conversion-info">
              <p>Converted from AUD to USD using monthly average rates:</p>
              <ul>
                {[...conversionRates.entries()]
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([key, rate]) => {
                    const [year, month] = key.split('-');
                    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                    return <li key={key}>{monthName}: 1 AUD = {rate.toFixed(4)} USD</li>;
                  })}
              </ul>
            </div>
          )}
          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount (USD)</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {previewTransactions.map(t => (
                  <tr key={t.id}>
                    <td>{formatDate(t.date)}</td>
                    <td>{t.description}</td>
                    <td className={t.type === 'income' ? 'positive' : 'negative'}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                    </td>
                    <td>{t.type}</td>
                    <td>
                      <select
                        value={t.category}
                        onChange={e => handleCategoryChange(t.id, e.target.value)}
                      >
                        {DEFAULT_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Add note..."
                        value={t.note}
                        onChange={e => handleNoteChange(t.id, e.target.value)}
                        className="note-input"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mapping-actions">
            <button onClick={() => setStep('map')}>Back</button>
            <button className="primary" onClick={handleImport}>Import All</button>
          </div>
        </div>
      )}
    </div>
  );
}
