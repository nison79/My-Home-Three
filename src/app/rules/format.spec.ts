import { formatEuro, formatDateEl } from './format';

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
