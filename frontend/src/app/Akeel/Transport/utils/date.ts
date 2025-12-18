export const LICENSE_EXPIRY_WARNING_DAYS = 30;

export function fmtDate(s?: string | null): string {
  if (!s) return "-";
  try { return new Date(s).toLocaleDateString(); } catch { return String(s); }
}

export function toDateInput(s?: string | null): string {
  return s ? s.slice(0, 10) : "";
}

export function toDateInputValue(d?: string | Date | null): string {
  if (!d) return "";
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return d.length >= 10 ? d.slice(0, 10) : "";
}

export function isExpiringSoon(dateStr?: string, windowDays = LICENSE_EXPIRY_WARNING_DAYS): boolean {
  if (!dateStr) return false;
  const exp = new Date(dateStr).getTime();
  if (Number.isNaN(exp)) return false;
  const days = Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24));
  return days > 0 && days <= windowDays;
}
