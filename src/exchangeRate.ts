const rateCache: Record<string, number> = {};

export async function getMonthlyAverageRate(year: number, month: number): Promise<number> {
  const key = `${year}-${month}`;
  if (rateCache[key]) return rateCache[key];

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Cap end date to today if in the future
  const today = new Date().toISOString().slice(0, 10);
  const effectiveEnd = endDate > today ? today : endDate;

  const res = await fetch(
    `https://api.frankfurter.app/${startDate}..${effectiveEnd}?from=AUD&to=USD`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch exchange rate for ${year}-${month}`);
  }

  const data = await res.json();
  const rates: number[] = Object.values(data.rates).map(
    (r) => (r as { USD: number }).USD
  );

  if (rates.length === 0) {
    throw new Error(`No rate data for ${year}-${month}`);
  }

  const average = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  const rounded = Math.round(average * 10000) / 10000;
  rateCache[key] = rounded;
  return rounded;
}

export async function convertAudTransactions(
  transactions: { date: string; amount: number }[]
): Promise<Map<string, number>> {
  // Group by year-month to know which rates we need
  const months = new Set<string>();
  for (const t of transactions) {
    const d = new Date(t.date);
    if (!isNaN(d.getTime())) {
      months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
    }
  }

  // Fetch all needed rates in parallel
  const rateMap = new Map<string, number>();
  await Promise.all(
    [...months].map(async (key) => {
      const [year, month] = key.split('-').map(Number);
      const rate = await getMonthlyAverageRate(year, month);
      rateMap.set(key, rate);
    })
  );

  return rateMap;
}
