// Completion instants are independent from scheduled/start times.
export function completionTimestamp(value: unknown): string | undefined {
  const text = value instanceof Date ? value.toISOString() : typeof value === 'string' ? value : '';
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(text) && Number.isFinite(Date.parse(text)) ? text : undefined;
}
export function completionClock(value: unknown): {date: string; time: string} | null {
  const stamp = completionTimestamp(value); if (!stamp) return null;
  const d = new Date(stamp), pad = (n: number) => String(n).padStart(2, '0');
  return {date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}`};
}
