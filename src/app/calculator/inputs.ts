import { parseNumber } from '../checker/answers';
import { LoanInputs } from './calculate';

export interface RawLoanInputs {
  propertyValue: string;
  termYears: string;
  bankRate: string;
}

export type LoanFieldId = keyof RawLoanInputs;
export type LoanFieldErrors = Partial<Record<LoanFieldId, string>>;

export type ParseLoanResult =
  | { ok: true; inputs: LoanInputs }
  | { ok: false; errors: LoanFieldErrors };

const REQUIRED = 'Συμπληρώστε το πεδίο για να συνεχίσετε.';
const NOT_A_NUMBER = 'Δώστε έναν έγκυρο αριθμό.';

export const TERM_RANGE = { min: 3, max: 30 } as const;
export const RATE_RANGE = { min: 0, max: 15 } as const;

export function parseLoanInputs(raw: RawLoanInputs): ParseLoanResult {
  const errors: LoanFieldErrors = {};

  let propertyValue = 0;
  if (!raw.propertyValue.trim()) errors.propertyValue = REQUIRED;
  else {
    const n = parseNumber(raw.propertyValue);
    if (n === null) errors.propertyValue = NOT_A_NUMBER;
    else if (n <= 0 || n > 100_000_000) errors.propertyValue = 'Δώστε έγκυρη αξία ακινήτου.';
    else propertyValue = n;
  }

  let termYears = 0;
  if (!raw.termYears.trim()) errors.termYears = REQUIRED;
  else {
    const n = parseNumber(raw.termYears);
    if (n === null || !Number.isInteger(n)) errors.termYears = NOT_A_NUMBER;
    else if (n < TERM_RANGE.min || n > TERM_RANGE.max) {
      errors.termYears = `Δώστε διάρκεια από ${TERM_RANGE.min} έως ${TERM_RANGE.max} έτη.`;
    } else termYears = n;
  }

  let bankRatePercent = 0;
  if (!raw.bankRate.trim()) errors.bankRate = REQUIRED;
  else {
    const n = parseNumber(raw.bankRate);
    if (n === null) errors.bankRate = NOT_A_NUMBER;
    else if (n < RATE_RANGE.min || n > RATE_RANGE.max) {
      errors.bankRate = `Δώστε επιτόκιο από ${RATE_RANGE.min} % έως ${RATE_RANGE.max} %.`;
    } else bankRatePercent = n;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, inputs: { propertyValue, termYears, bankRatePercent } };
}
