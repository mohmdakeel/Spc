export function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
}
