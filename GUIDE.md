# Finance Tracker - User Guide

## Getting Started

Visit **https://kelseygilch.github.io/finance-tracker/** in your browser.

To install as an app on your device:
- **Desktop**: Click the install icon in the browser address bar (monitor with a download arrow)
- **Phone**: Tap your browser menu and select "Add to Home Screen"

Your data is stored locally in your browser. Each person has completely separate data, categories, and settings.

---

## Tabs Overview

### Import
**Add transactions** two ways:

- **Manual entry**: Fill in the form at the top — pick expense or refund/return, enter date, description, amount, category, and an optional note. You can enter amounts in USD or AUD (AUD is automatically converted using the monthly average exchange rate).

- **CSV upload**: Upload a CSV export from your bank or credit card. You'll be asked to:
  1. Select the **currency** (USD or AUD — AUD gets converted to USD automatically)
  2. Check **"Shared account (50/50 split)"** if this is from the shared account — all amounts will be halved
  3. Map the **date**, **description**, and **amount** columns
  4. Review transactions, adjust categories, add notes, then click **Import All**

### Transactions
View, search, and edit all your imported transactions:
- **Search** by description
- **Filter** by month or category
- **Change the category** of any transaction using the dropdown
- **Edit notes** inline
- **Delete** transactions with the x button

When you re-categorize a transaction here, the app learns that mapping for future imports.

### Budget
- **Monthly Income**: Enter your income for each month (since income isn't in credit card statements)
- **Summary cards**: See total income, expenses, and balance
- **Set budgets**: Pick a category and set a monthly spending limit — progress bars show how you're tracking

### Annual Plan
A smart budget targeting **$50,000/year** based on 2025 spending patterns:
- **Budget/Mo**: Simple annual budget divided by 12
- **Adj. Target/Mo**: Adjusted target based on what's left divided by remaining months
- **Status**: Shows whether each category is on track or over pace
- The targets automatically adjust as you import more data throughout the year

### Insights
Charts and breakdowns of your spending:
- **Spending by Category** (pie chart)
- **Monthly Income vs Expenses** (bar chart)
- **Spending Trend** (line chart)
- **Monthly Savings Rate** (bar chart + table showing income, expenses, saved, and savings %)
- **Monthly Spending by Category** (stacked bar chart + table with averages and deviation indicators)
- **Top Expenses by Month** (tables showing your biggest expenses each month)

Note: "Ignore" and "Reimbursed" categories are excluded from all insights and budget calculations.

### Settings
- **Categories**: Add or remove spending categories to match your needs. System categories (Income, Other, Ignore) are always present.
- **Auto-Categorization**: The app learns from your categorization choices. When you import or edit transactions, it remembers the description-to-category mapping. You can:
  - **Export Mappings** to a JSON file (backup or share)
  - **Import Mappings** from a JSON file
  - **Load 2025 Baseline** to start with pre-built mappings from 2025 data
  - **Clear Mappings** to start fresh

---

## Handling Shared vs Individual Expenses

- **Shared AUD account**: When importing the shared CSV, select **AUD** as the currency and check **"Shared account (50/50 split)"**. Amounts will be converted to USD and halved.
- **Individual USD expenses**: Import your personal CSV with **USD** selected and the shared checkbox unchecked.

## Handling Returns and Refunds

Returns/refunds reduce the spending total for that category. For example, a $500 Shopping expense and a $131 Shopping return nets to $369 in Shopping.

- **In CSV imports**: Positive amounts are automatically treated as refunds
- **In manual entry**: Select "Refund / Return" from the Type dropdown

## Ignoring Transactions

Set a transaction's category to **"Ignore"** to exclude it from all calculations (useful for credit card payments that would double-count).

Set a transaction's category to **"Reimbursed"** for work expenses or anything you were reimbursed for — these are also excluded from budget and insights.

## Exporting Data

Click **"Export to Excel"** in the header to download a spreadsheet with:
- Monthly sheets (one per month) with Category, Type, Date, Description, Amount, Note
- Year summary sheet with categories as rows and months as columns
- Budget sheet with limits and progress
- Income sheet

## Data & Privacy

- All data is stored **locally in your browser** — nothing is sent to any server
- The only external call is to fetch AUD/USD exchange rates
- If you clear your browser data, your transactions will be lost — use **Export to Excel** regularly as a backup
