import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Transaction, Budget, MonthlyIncome } from '../types';

interface Props {
  transactions: Transaction[];
  budgets: Budget[];
  income: MonthlyIncome[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ExcelExport({ transactions, budgets, income }: Props) {
  function exportToExcel() {
    const wb = XLSX.utils.book_new();

    // Group transactions by month
    const byMonth: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(t);
    });

    // Create a sheet per month (matching 2025 format)
    const sortedMonths = Object.keys(byMonth).sort();
    for (const monthKey of sortedMonths) {
      const txns = byMonth[monthKey];
      const [year, monthNum] = monthKey.split('-').map(Number);
      const sheetName = `${MONTH_NAMES[monthNum - 1]} ${year}`;

      const rows = txns.map(t => ({
        'Category': t.category,
        'Type': t.type === 'expense' ? 'Sale' : 'Return',
        'Trans Date': t.date,
        'Description': t.description,
        'Amount USD': t.type === 'expense' ? -t.amount : t.amount,
        'note': t.note,
      }));

      const sheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, sheet, sheetName.slice(0, 31));
    }

    // Year summary sheet: categories as rows, months as columns
    const active = transactions.filter(t => t.category !== 'Ignore' && t.category !== 'Reimbursed');
    const catMonthMap: Record<string, Record<string, number>> = {};
    const allCategories = new Set<string>();

    active.forEach(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const sign = t.type === 'expense' ? -1 : 1;
      if (!catMonthMap[t.category]) catMonthMap[t.category] = {};
      catMonthMap[t.category][monthKey] = (catMonthMap[t.category][monthKey] || 0) + t.amount * sign;
      allCategories.add(t.category);
    });

    const categories = [...allCategories].sort();
    const yearRows: Record<string, string | number>[] = [];

    for (const cat of categories) {
      const row: Record<string, string | number> = { 'Category': cat };
      let yearTotal = 0;
      for (const monthKey of sortedMonths) {
        const [, monthNum] = monthKey.split('-').map(Number);
        const colName = MONTH_NAMES[monthNum - 1];
        const val = Math.round((catMonthMap[cat]?.[monthKey] || 0) * 100) / 100;
        row[colName] = val;
        yearTotal += val;
      }
      row['Year Total'] = Math.round(yearTotal * 100) / 100;
      const monthCount = sortedMonths.length || 1;
      row['% Total'] = 0; // placeholder, calculated below
      row['Avg/Mo'] = Math.round((yearTotal / monthCount) * 100) / 100;
      yearRows.push(row);
    }

    // Calculate % totals
    const grandTotal = yearRows.reduce((sum, r) => sum + Math.abs(Number(r['Year Total']) || 0), 0);
    for (const row of yearRows) {
      row['% Total'] = grandTotal > 0
        ? Math.round((Math.abs(Number(row['Year Total'])) / grandTotal) * 10000) / 100
        : 0;
    }

    // Add total row
    const totalRow: Record<string, string | number> = { 'Category': 'Total' };
    for (const monthKey of sortedMonths) {
      const [, monthNum] = monthKey.split('-').map(Number);
      const colName = MONTH_NAMES[monthNum - 1];
      totalRow[colName] = Math.round(yearRows.reduce((sum, r) => sum + (Number(r[colName]) || 0), 0) * 100) / 100;
    }
    totalRow['Year Total'] = Math.round(yearRows.reduce((sum, r) => sum + (Number(r['Year Total']) || 0), 0) * 100) / 100;
    totalRow['% Total'] = 100;
    totalRow['Avg/Mo'] = Math.round((Number(totalRow['Year Total']) / (sortedMonths.length || 1)) * 100) / 100;
    yearRows.push(totalRow);

    const yearSheet = XLSX.utils.json_to_sheet(yearRows);
    XLSX.utils.book_append_sheet(wb, yearSheet, 'Year');

    // Budget sheet
    if (budgets.length > 0) {
      const expensesByCategory: Record<string, number> = {};
      active.forEach(t => {
        const sign = t.type === 'expense' ? 1 : -1;
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount * sign;
      });

      const budgetData = budgets.map(b => ({
        Category: b.category,
        'Budget Limit': b.limit,
        Spent: Math.round((expensesByCategory[b.category] || 0) * 100) / 100,
        Remaining: Math.round((b.limit - (expensesByCategory[b.category] || 0)) * 100) / 100,
        '% Used': Math.round(((expensesByCategory[b.category] || 0) / b.limit) * 100),
      }));
      const budgetSheet = XLSX.utils.json_to_sheet(budgetData);
      XLSX.utils.book_append_sheet(wb, budgetSheet, 'Budget');
    }

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
