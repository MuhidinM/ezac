export function parseCurrency(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

export function formatCurrency(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const parts = cleaned.split(".");
  const intPart = parts[0] ?? "";
  const decPart = parts[1];
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${formatted}.${decPart.slice(0, 2)}` : formatted;
}

export function sumCurrency(values: Record<string, string>): number {
  return Object.values(values).reduce((sum, v) => sum + parseCurrency(v), 0);
}

export function formatDisplayCurrency(amount: number): string {
  return amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
