import { parseLoanInputs, RawLoanInputs } from './inputs';

const base: RawLoanInputs = { propertyValue: '180.000', termYears: '25', bankRate: '4,25' };

describe('parseLoanInputs', () => {
  it('reads Greek-formatted numbers', () => {
    const r = parseLoanInputs(base);
    expect(r).toEqual({
      ok: true,
      inputs: { propertyValue: 180000, termYears: 25, bankRatePercent: 4.25 },
    });
  });

  it('accepts a rate of zero', () => {
    const r = parseLoanInputs({ ...base, bankRate: '0' });
    expect(r.ok && r.inputs.bankRatePercent).toBe(0);
  });

  it('requires every field', () => {
    const r = parseLoanInputs({ propertyValue: '', termYears: '', bankRate: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['bankRate', 'propertyValue', 'termYears']);
  });

  it.each(['2', '31', '12,5'])('rejects a term of %s years', (term) => {
    const r = parseLoanInputs({ ...base, termYears: term });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.termYears).toBeDefined();
  });

  it.each(['-1', '15,1', 'abc'])('rejects a bank rate of %s', (rate) => {
    const r = parseLoanInputs({ ...base, bankRate: rate });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.bankRate).toBeDefined();
  });

  it('rejects a non-positive property value', () => {
    const r = parseLoanInputs({ ...base, propertyValue: '0' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.propertyValue).toBeDefined();
  });
});
