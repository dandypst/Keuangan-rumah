// Siklus gaji: tanggal 25 (00.00 WIB) sampai 24 (23.59 WIB) bulan berikutnya.
const WIB = 7 * 3600e3;

export function cycle(now = new Date()) {
  const w = new Date(now.getTime() + WIB);
  const m = w.getUTCMonth() - (w.getUTCDate() < 25 ? 1 : 0);
  const y = w.getUTCFullYear();
  const start = new Date(Date.UTC(y, m, 25) - WIB);
  const end = new Date(Date.UTC(y, m + 1, 25) - WIB); // eksklusif
  const total = Math.round((end.getTime() - start.getTime()) / 864e5);
  const daysLeft = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 864e5));
  return { start, end, total, daysLeft };
}
