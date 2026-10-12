export type HouseholdType = 'single' | 'couple' | 'singleParent';
export type Residency = 'greek-eu' | 'non-eu-permit' | 'non-eu-no-permit';

/** Validated answers, ready for `evaluate`. */
export interface HouseholdAnswers {
  householdType: HouseholdType;
  /** One age for a single applicant or single parent, two for a couple. */
  applicantAges: number[];
  children: number;
  annualIncome: number;
  propertyValue: number;
  propertyAreaSqm: number;
  buildingYear: number;
  ownsSuitableHome: boolean;
  residency: Residency;
}

/** Raw form values: everything is text until validated. */
export interface RawAnswers {
  householdType: string;
  children: string;
  ageA: string;
  ageB: string;
  income: string;
  propertyValue: string;
  area: string;
  buildingYear: string;
  ownsSuitableHome: string;
  residency: string;
}

export type FieldId = keyof RawAnswers;
export type FieldErrors = Partial<Record<FieldId, string>>;

export type ParseResult =
  | { ok: true; answers: HouseholdAnswers }
  | { ok: false; errors: FieldErrors };

/**
 * Reads a number typed the Greek way: `25000`, `25.000`, `25.000,50`, `12,5`.
 * Returns null for anything that is not a non-negative number.
 */
export function parseNumber(text: string): number | null {
  let t = text.replace(/[\s €]/g, '');
  if (!t) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) {
    t = t.replace(/\./g, '').replace(',', '.');
  } else {
    t = t.replace(',', '.');
  }
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : null;
}

const REQUIRED = 'Συμπληρώστε το πεδίο για να συνεχίσετε.';
const CHOOSE = 'Επιλέξτε μία απάντηση.';
const NOT_A_NUMBER = 'Δώστε έναν έγκυρο αριθμό.';

const HOUSEHOLD_TYPES: readonly string[] = ['single', 'couple', 'singleParent'];
const RESIDENCIES: readonly string[] = ['greek-eu', 'non-eu-permit', 'non-eu-no-permit'];

function readInteger(
  raw: string,
  min: number,
  max: number,
  rangeMessage: string,
): { value: number } | { error: string } {
  if (!raw.trim()) return { error: REQUIRED };
  const n = parseNumber(raw);
  if (n === null || !Number.isInteger(n)) return { error: NOT_A_NUMBER };
  if (n < min || n > max) return { error: rangeMessage };
  return { value: n };
}

function readAmount(raw: string, rangeMessage: string, min = 0): { value: number } | { error: string } {
  if (!raw.trim()) return { error: REQUIRED };
  const n = parseNumber(raw);
  if (n === null) return { error: NOT_A_NUMBER };
  if (n < min || n > 100_000_000) return { error: rangeMessage };
  return { value: n };
}

export function parseAnswers(raw: RawAnswers): ParseResult {
  const errors: FieldErrors = {};

  const householdType = HOUSEHOLD_TYPES.includes(raw.householdType)
    ? (raw.householdType as HouseholdType)
    : null;
  if (!householdType) errors.householdType = CHOOSE;

  const ages: number[] = [];
  const ageA = readInteger(raw.ageA, 18, 100, 'Δώστε ηλικία από 18 έως 100 ετών.');
  if ('error' in ageA) errors.ageA = ageA.error;
  else ages.push(ageA.value);

  if (householdType === 'couple') {
    const ageB = readInteger(raw.ageB, 18, 100, 'Δώστε ηλικία από 18 έως 100 ετών.');
    if ('error' in ageB) errors.ageB = ageB.error;
    else ages.push(ageB.value);
  }

  let children = 0;
  if (householdType === 'couple' || householdType === 'singleParent') {
    const c = readInteger(raw.children, 0, 15, 'Δώστε αριθμό παιδιών από 0 έως 15.');
    if ('error' in c) errors.children = c.error;
    else if (householdType === 'singleParent' && c.value < 1) {
      errors.children = 'Μια μονογονεϊκή οικογένεια έχει τουλάχιστον ένα παιδί.';
    } else children = c.value;
  }

  const income = readAmount(raw.income, 'Δώστε έγκυρο ετήσιο εισόδημα.');
  if ('error' in income) errors.income = income.error;

  const value = readAmount(raw.propertyValue, 'Δώστε έγκυρη αξία ακινήτου.', 1);
  if ('error' in value) errors.propertyValue = value.error;

  const area = readAmount(raw.area, 'Δώστε εμβαδόν από 1 έως 1.000 τ.μ.', 1);
  if ('error' in area) errors.area = area.error;
  else if (area.value > 1000) errors.area = 'Δώστε εμβαδόν από 1 έως 1.000 τ.μ.';

  const year = readInteger(raw.buildingYear, 1800, 2100, 'Δώστε έτος κατασκευής από 1800 έως 2100.');
  if ('error' in year) errors.buildingYear = year.error;

  if (raw.ownsSuitableHome !== 'yes' && raw.ownsSuitableHome !== 'no') {
    errors.ownsSuitableHome = CHOOSE;
  }

  const residency = RESIDENCIES.includes(raw.residency) ? (raw.residency as Residency) : null;
  if (!residency) errors.residency = CHOOSE;

  if (Object.keys(errors).length > 0 || !householdType || !residency) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    answers: {
      householdType,
      applicantAges: ages,
      children,
      annualIncome: (income as { value: number }).value,
      propertyValue: (value as { value: number }).value,
      propertyAreaSqm: (area as { value: number }).value,
      buildingYear: (year as { value: number }).value,
      ownsSuitableHome: raw.ownsSuitableHome === 'yes',
      residency,
    },
  };
}
