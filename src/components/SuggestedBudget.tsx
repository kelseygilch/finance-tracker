import { useMemo } from 'react';
import type { Transaction } from '../types';
import baseline from '../spendingBaseline.json';

interface Props {
  transactions: Transaction[];
  annualTarget: number;
}

export function SuggestedBudget({ transactions, annualTarget }: Props) {
  const active = transactions.filter(
    t => t.category !== 'Ignore' && t.category !== 'Reimbursed'
  );

  const data = useMemo(() => {
    // Figure out how many months have passed and how many remain
    const monthsWithData = new Set<string>();
    active.forEach(t => {
      const d = new Date(t.date);
      if (!isNaN(d.getTime())) {
        monthsWithData.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    const monthCount = monthsWithData.size || 1;
    const remainingMonths = Math.max(12 - monthCount, 0);

    // Actual spending by category (net of refunds)
    const spentByCategory: Record<string, number> = {};
    active.forEach(t => {
      const sign = t.type === 'expense' ? 1 : -1;
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount * sign;
    });

    const categories = Object.keys(baseline as Record<string, number>);
    const totalSpent = categories.reduce(
      (sum, cat) => sum + Math.max(spentByCategory[cat] || 0, 0), 0
    );
    const remaining = annualTarget - totalSpent;

    // For each category, calculate suggested budget
    const rows = categories.map(cat => {
      const pct = (baseline as Record<string, number>)[cat] / 100;
      const yearBudget = annualTarget * pct;
      const spent = Math.max(spentByCategory[cat] || 0, 0);
      const categoryRemaining = yearBudget - spent;
      const monthlyTarget = remainingMonths > 0
        ? Math.max(categoryRemaining / remainingMonths, 0)
        : 0;
      const avgMonthly = monthCount > 0 ? spent / monthCount : 0;
      const onTrack = spent <= (yearBudget / 12) * monthCount;

      const baseMontly = yearBudget / 12;

      return {
        category: cat,
        yearBudget: Math.round(yearBudget * 100) / 100,
        spent: Math.round(spent * 100) / 100,
        categoryRemaining: Math.round(categoryRemaining * 100) / 100,
        baseMonthly: Math.round(baseMontly * 100) / 100,
        monthlyTarget: Math.round(monthlyTarget * 100) / 100,
        avgMonthly: Math.round(avgMonthly * 100) / 100,
        pctUsed: yearBudget > 0 ? Math.round((spent / yearBudget) * 100) : 0,
        onTrack,
      };
    });

    return {
      rows,
      totalSpent: Math.round(totalSpent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      monthCount,
      remainingMonths,
      pctYear: Math.round((monthCount / 12) * 100),
      pctBudget: Math.round((totalSpent / annualTarget) * 100),
    };
  }, [active, annualTarget]);

  return (
    <div className="suggested-budget">
      <h2>Annual Budget Plan — ${annualTarget.toLocaleString()}</h2>

      <div className="summary-cards">
        <div className="card">
          <h3>Spent So Far</h3>
          <p className="amount negative">${data.totalSpent.toLocaleString()}</p>
          <p className="card-detail">{data.pctBudget}% of annual budget</p>
        </div>
        <div className="card">
          <h3>Remaining</h3>
          <p className={`amount ${data.remaining >= 0 ? 'positive' : 'negative'}`}>
            ${data.remaining.toLocaleString()}
          </p>
          <p className="card-detail">{data.remainingMonths} months left</p>
        </div>
        <div className="card">
          <h3>Year Progress</h3>
          <p className="amount">{data.pctYear}%</p>
          <p className="card-detail">{data.monthCount} of 12 months</p>
        </div>
        <div className="card">
          <h3>Monthly Pace</h3>
          <p className={`amount ${data.pctBudget <= data.pctYear ? 'positive' : 'negative'}`}>
            {data.pctBudget <= data.pctYear ? 'On Track' : 'Over Pace'}
          </p>
          <p className="card-detail">
            ${Math.round(data.totalSpent / data.monthCount).toLocaleString()}/mo avg
          </p>
        </div>
      </div>

      <div className="overall-progress">
        <div className="progress-bar" style={{ height: 12 }}>
          <div
            className={`progress-fill ${data.pctBudget > data.pctYear ? 'over-budget' : data.pctBudget > data.pctYear * 0.9 ? 'warning' : ''}`}
            style={{ width: `${Math.min(data.pctBudget, 100)}%` }}
          />
          <div className="pace-marker" style={{ left: `${data.pctYear}%` }} />
        </div>
        <div className="progress-labels">
          <span>0%</span>
          <span>{data.pctYear}% of year</span>
          <span>100%</span>
        </div>
      </div>

      <div className="preview-table-wrapper">
        <table className="top-expenses-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Year Budget</th>
              <th>Spent</th>
              <th>Remaining</th>
              <th>Avg/Mo</th>
              <th>Budget/Mo</th>
              <th>Adj. Target/Mo</th>
              <th>% Used</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map(r => (
              <tr key={r.category}>
                <td><strong>{r.category}</strong></td>
                <td>${r.yearBudget.toLocaleString()}</td>
                <td>${r.spent.toLocaleString()}</td>
                <td className={r.categoryRemaining >= 0 ? 'positive' : 'negative'}>
                  ${r.categoryRemaining.toLocaleString()}
                </td>
                <td>${r.avgMonthly.toLocaleString()}</td>
                <td>${r.baseMonthly.toLocaleString()}</td>
                <td><strong>${r.monthlyTarget.toLocaleString()}</strong></td>
                <td>
                  <div className="progress-bar" style={{ width: 80, display: 'inline-block' }}>
                    <div
                      className={`progress-fill ${r.pctUsed > (data.pctYear + 10) ? 'over-budget' : r.pctUsed > data.pctYear ? 'warning' : ''}`}
                      style={{ width: `${Math.min(r.pctUsed, 100)}%` }}
                    />
                  </div>
                  <span style={{ marginLeft: 6, fontSize: 12 }}>{r.pctUsed}%</span>
                </td>
                <td>
                  <span className={`status-badge ${r.onTrack ? 'on-track' : 'over-pace'}`}>
                    {r.onTrack ? 'On Track' : 'Over'}
                  </span>
                </td>
              </tr>
            ))}
            <tr>
              <td><strong>Total</strong></td>
              <td><strong>${annualTarget.toLocaleString()}</strong></td>
              <td><strong>${data.totalSpent.toLocaleString()}</strong></td>
              <td className={data.remaining >= 0 ? 'positive' : 'negative'}>
                <strong>${data.remaining.toLocaleString()}</strong>
              </td>
              <td><strong>${Math.round(data.totalSpent / data.monthCount).toLocaleString()}</strong></td>
              <td><strong>${Math.round(annualTarget / 12).toLocaleString()}</strong></td>
              <td><strong>${data.remainingMonths > 0 ? Math.round(data.remaining / data.remainingMonths).toLocaleString() : '—'}</strong></td>
              <td><strong>{data.pctBudget}%</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
