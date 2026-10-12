import { Spiti3Rules } from '../rules/rules.model';

export interface LoanInputs {
  /** Contract value of the property (Συμβατική αξία). */
  propertyValue: number;
  termYears: number;
  /** Annual rate of the bank half, in percent (e.g. 4.25). */
  bankRatePercent: number;
}

export interface LoanEstimate {
  kind: 'estimate';
  propertyValue: number;
  loan: number;
  ownFunds: number;
  /** Loan as a share of the property value (0–1). */
  financingShare: number;
  /** True when the maximum loan, not the 90% share, limits the loan. */
  cappedByMaxLoan: boolean;
  /** True when the loan is below the (assumed) minimum loan. */
  belowMinimumLoan: boolean;
  interestFreePart: number;
  bankPart: number;
  months: number;
  monthlyInterestFree: number;
  monthlyBank: number;
  monthlyTotal: number;
  totalInterest: number;
  totalRepaid: number;
}

export interface AboveMaxValue {
  kind: 'above-max-value';
  max: number;
}

export type LoanResult = LoanEstimate | AboveMaxValue;

/**
 * Estimates the loan. The interest-free half is repaid in equal instalments at
 * 0 %; the bank half is a standard annuity at `bankRatePercent`. Any interest
 * subsidy is deliberately not applied.
 */
export function calculate(inputs: LoanInputs, rules: Spiti3Rules): LoanResult {
  const { propertyValue, termYears, bankRatePercent } = inputs;
  const maxValue = rules.maxPropertyValue.value;
  if (propertyValue > maxValue) return { kind: 'above-max-value', max: maxValue };

  const shareLoan = propertyValue * rules.maxFinancingShare.value;
  const maxLoan = rules.maxLoan.value;
  const loan = Math.min(shareLoan, maxLoan);

  const interestFreePart = loan * rules.interestFreeShare.value;
  const bankPart = loan - interestFreePart;

  const months = termYears * 12;
  const monthlyInterestFree = interestFreePart / months;
  const monthlyBank = annuity(bankPart, bankRatePercent / 100 / 12, months);
  const monthlyTotal = monthlyInterestFree + monthlyBank;

  return {
    kind: 'estimate',
    propertyValue,
    loan,
    ownFunds: propertyValue - loan,
    financingShare: loan / propertyValue,
    cappedByMaxLoan: shareLoan > maxLoan,
    belowMinimumLoan: loan < rules.minimumLoan.value,
    interestFreePart,
    bankPart,
    months,
    monthlyInterestFree,
    monthlyBank,
    monthlyTotal,
    totalInterest: monthlyBank * months - bankPart,
    totalRepaid: monthlyTotal * months,
  };
}

/** Monthly payment of an annuity; `monthlyRate` of 0 means equal principal parts. */
function annuity(principal: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}
