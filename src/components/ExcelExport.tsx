import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Transaction, Budget, MonthlyIncome } from '../types';

interface Props {
  transactions: Transaction[];
  budgets: Budget[];
  income: MonthlyIncome[];
}

export function ExcelExport({ transactions, budgets, income }: Props) {
  function exportToExcel() {
    const wb = XLSX.utils.book_new();

    // Transactions sheet
    const txData = transactions.map(t => ({
      Date: t.date,
      Description: t.description,
      Type: t.type,
      Category: t.category,
      Amount: t.type === 'expense' ? -t.amount : t.amount,
      Note: t.note,
    }));
    const txSheet = XLSX.utils.json_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

    // Summary by category
    const categoryMap: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach(t => {
      if (!categoryMap[t.category]) categoryMap[t.category] = { income: 0, expenses: 0 };
      if (t.type === 'income') categoryMap[t.category].income += t.amount;
      else categoryMap[t.category].expenses += t.amount;
    });
    const summaryData = Object.entries(categoryMap).map(([category, data]) => ({
      Category: category,
      Income: Math.round(data.income * 100) / 100,
      Expenses: Math.round(data.expenses * 100) / 100,
      Net: Math.round((data.income - data.expenses) * 100) / 100,
    }));
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Category Summary');

    // Budget sheet
    if (budgets.length > 0) {
      const expensesByCategory: Record<string, number> = {};
      transactions.filter(t => t.type === 'expense').forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      });

      const budgetData = budgets.map(b => ({
        Category: b.category,
        'Budget Limit': b.limit,
        Spent: Math.round((expensesByCategory[b.category] || 0) * 100) / 100,
        Remaining: Math.round((b.limit - (expensesByCategory[b.category] || 0)) * 100) / 100,
        '% Used': Math.round(((expensesByCategory[b.category] || 0) / b.limit) * 100),
      }));
      const budgetSheet = XLSX.utils.json_to_sheet(budgetData);
      XLSX.utils.book_append_sheet(wb, budgetSheet, 'Budgets');
    }

    // Monthly summary (using manual income)
    const monthlyMap: Record<string, { income: number; expenses: number }> = {};
    transactions.filter(t => t.type === 'expense' && t.category !== 'Ignore' && t.category !== 'Reimbursed').forEach(t => {
      const date = new Date(t.date);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expenses: 0 };
      monthlyMap[key].expenses += t.amount;
    });
    income.forEach(i => {
      if (!monthlyMap[i.month]) monthlyMap[i.month] = { income: 0, expenses: 0 };
      monthlyMap[i.month].income += i.amount;
    });
    const monthlyData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        Month: month,
        Income: Math.round(data.income * 100) / 100,
        Expenses: Math.round(data.expenses * 100) / 100,
        Net: Math.round((data.income - data.expenses) * 100) / 100,
      }));
    const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly Summary');

    // Income sheet
    if (income.length > 0) {
      const incomeData = [...income]
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(i => ({ Month: i.month, Amount: i.amount }));
      const incomeSheet = XLSX.utils.json_to_sheet(incomeData);
      XLSX.utils.book_append_sheet(wb, incomeSheet, 'Income');
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `finance-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <button className="export-btn" onClick={exportToExcel} disabled={transactions.length === 0}>
      Export to Excel
    </button>
  );
}
