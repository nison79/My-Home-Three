import { formatEuro, formatDateEl, formatPercent, formatDecimalInput } from './format';

describe('formatEuro', () => {
  it('puts the euro sign first, followed by a non-breaking space', () => {
    expect(formatEuro(120000)).toBe('€ 120.000');
  });

  it('groups four-digit amounts with a dot', () => {
    expect(formatEuro(7000)).toBe('€ 7.000');
  });
});

describe('formatDateEl', () => {
  it('formats an ISO date in Greek long form', () => {
    expect(formatDateEl('2026-10-12')).toBe('12 Οκτωβρίου 2026');
  });
});

describe('formatEuro with cents', () => {
  it('shows two decimals with a comma', () => {
    expect(formatEuro(612.4, true)).toBe('€\u00A0612,40');
    expect(formatEuro(1234567.891, true)).toBe('€\u00A01.234.567,89');
  });
});

describe('formatPercent', () => {
  it('uses a comma and a non-breaking space', () => {
    expect(formatPercent(3.5)).toBe('3,5\u00A0%');
    expect(formatPercent(4.332)).toBe('4,33\u00A0%');
  });
});

describe('formatDecimalInput', () => {
  it('rounds to two decimals with a comma', () => {
    expect(formatDecimalInput(4.332)).toBe('4,33');
    expect(formatDecimalInput(4)).toBe('4');
  });
});
