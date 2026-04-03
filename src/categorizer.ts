import categoryMap from './categoryMap.json';

const entries = Object.entries(categoryMap as Record<string, string>);

export function guessCategory(description: string): string | null {
  const upper = description.trim().toUpperCase();
  if (!upper) return null;

  // 1. Exact match
  const exact = (categoryMap as Record<string, string>)[upper];
  if (exact) return exact;

  // 2. Check if the description starts with or contains a known key
  //    (handles cases like "UBER *TRIP HELP.UBER.COM" matching "UBER* TRIP")
  for (const [key, cat] of entries) {
    // Normalize both for comparison: strip spaces and special chars
    const normKey = key.replace(/[^A-Z0-9]/g, '');
    const normDesc = upper.replace(/[^A-Z0-9]/g, '');

    if (normDesc === normKey) return cat;
    if (normDesc.startsWith(normKey) || normKey.startsWith(normDesc)) return cat;
  }

  // 3. Check if any known key is a substring (for partial matches)
  //    Only match if the key is long enough to be meaningful (>= 8 chars)
  for (const [key, cat] of entries) {
    if (key.length >= 8 && upper.includes(key)) return cat;
    if (key.length >= 8 && key.includes(upper) && upper.length >= 8) return cat;
  }

  return null;
}
