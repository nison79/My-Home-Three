import { calculate, LoanEstimate } from './calculate';
import { SPITI_MOU_3_RULES } from '../rules/spiti-mou-3.rules';

function estimate(propertyValue: number, termYears: number, bankRatePercent: number): LoanEstimate {
  const r = calculate({ propertyValue, termYears, bankRatePercent }, SPITI_MOU_3_RULES);
  if (r.kind !== 'estimate') throw new Error(`expected an estimate, got ${r.kind}`);
  return r;
}

describe('calculate', () => {
  it('finances 90% of the value and splits the loan in two equal halves', () => {
    const e = estimate(200000, 25, 0);
    expect(e.loan).toBe(180000);
    expect(e.ownFunds).toBe(20000);
    expect(e.interestFreePart).toBe(90000);
    expect(e.bankPart).toBe(90000);
    expect(e.cappedByMaxLoan).toBe(false);
  });

  it('caps the loan at the maximum loan and raises own funds accordingly', () => {
    const e = estimate(300000, 25, 0);
    expect(e.loan).toBe(230000);
    expect(e.ownFunds).toBe(70000);
    expect(e.cappedByMaxLoan).toBe(true);
    expect(e.financingShare).toBeCloseTo(230000 / 300000, 6);
  });

  it('does not cap exactly at the value where 90% equals the maximum loan', () => {
    const value = 230000 / 0.9;
    expect(estimate(value, 25, 0).cappedByMaxLoan).toBe(false);
  });

  it('repays both halves in equal instalments when the rate is zero', () => {
    const e = estimate(200000, 25, 0);
    expect(e.months).toBe(300);
    expect(e.monthlyInterestFree).toBeCloseTo(300, 6);
    expect(e.monthlyBank).toBeCloseTo(300, 6);
    expect(e.monthlyTotal).toBeCloseTo(600, 6);
    expect(e.totalInterest).toBeCloseTo(0, 6);
    expect(e.totalRepaid).toBeCloseTo(180000, 6);
  });

  it('applies a standard annuity to the bank half only', () => {
    // 90.000 € over 25 years at 3 %: the textbook payment is about 426,79 €.
    const e = estimate(200000, 25, 3);
    expect(e.monthlyBank).toBeCloseTo(426.79, 1);
    expect(e.monthlyInterestFree).toBeCloseTo(300, 6);
    expect(e.monthlyTotal).toBeCloseTo(e.monthlyBank + e.monthlyInterestFree, 6);
  });

  it('derives total interest from the bank instalments', () => {
    const e = estimate(200000, 25, 3);
    expect(e.totalInterest).toBeCloseTo(e.monthlyBank * e.months - e.bankPart, 6);
    expect(e.totalRepaid).toBeCloseTo(e.loan + e.totalInterest, 6);
  });

  it('counts months from the term in years', () => {
    expect(estimate(150000, 3, 0).months).toBe(36);
    expect(estimate(150000, 30, 0).months).toBe(360);
  });

  it('refuses a value above the programme maximum', () => {
    const r = calculate({ propertyValue: 300001, termYears: 25, bankRatePercent: 3 }, SPITI_MOU_3_RULES);
    expect(r).toEqual({ kind: 'above-max-value', max: 300000 });
  });

  it('flags a loan below the assumed minimum without refusing', () => {
    const e = estimate(20000, 25, 3);
    expect(e.loan).toBe(18000);
    expect(e.belowMinimumLoan).toBe(true);
    expect(estimate(200000, 25, 3).belowMinimumLoan).toBe(false);
  });
});
