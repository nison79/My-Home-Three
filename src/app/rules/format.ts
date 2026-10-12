const numberEl = new Intl.NumberFormat('el-GR', { maximumFractionDigits: 0 });
const dateEl = new Intl.DateTimeFormat('el-GR', { dateStyle: 'long', timeZone: 'UTC' });

/** `€ 120.000`: euro sign first, non-breaking space, el-GR grouping. */
export function formatEuro(amount: number): string {
  return `€ ${numberEl.format(amount)}`;
}

/** `12 Οκτωβρίου 2026` from an ISO date (YYYY-MM-DD). */
export function formatDateEl(isoDate: string): string {
  return dateEl.format(new Date(isoDate));
}
