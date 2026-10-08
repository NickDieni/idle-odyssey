export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function formatInt(value: number): string {
  return Math.floor(value).toLocaleString();
}
