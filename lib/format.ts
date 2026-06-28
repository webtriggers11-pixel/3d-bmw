/** Format paise as a rupee string, e.g. 5000 → "₹50". */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/** Quick-pick contribution amounts (in rupees). */
export const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2500];
