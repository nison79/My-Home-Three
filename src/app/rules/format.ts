const numberEl = new Intl.NumberFormat('el-GR', { maximumFractionDigits: 0 });
const centsEl = new Intl.NumberFormat('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentEl = new Intl.NumberFormat('el-GR', { maximumFractionDigits: 2 });
const dateEl = new Intl.DateTimeFormat('el-GR', { dateStyle: 'long', timeZone: 'UTC' });

const NBSP = ' ';

/** `€ 120.000`: euro sign first, non-breaking space, el-GR grouping. `€ 612,40` with cents. */
export function formatEuro(amount: number, withCents = false): string {
  return `€${NBSP}${(withCents ? centsEl : numberEl).format(amount)}`;
}

/** `4,33 %` with a non-breaking space. */
export function formatPercent(value: number): string {
  return `${percentEl.format(value)}${NBSP}%`;
}

/** `4,33`: a decimal as a user would type it, for pre-filling an input. */
export function formatDecimalInput(value: number): string {
  return percentEl.format(value);
}

/** `12 Οκτωβρίου 2026` from an ISO date (YYYY-MM-DD). */
export function formatDateEl(isoDate: string): string {
  return dateEl.format(new Date(isoDate));
}
