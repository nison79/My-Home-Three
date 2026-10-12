/** How firmly a criterion is known. See CONTEXT.md: Κατάσταση κριτηρίου. */
export type CriterionStatus = 'reported' | 'assumed' | 'unknown';

export interface RuleSource {
  label: string;
  url: string;
}

export interface RuleValue<T> {
  value: T;
  status: CriterionStatus;
  source: RuleSource;
}

/** A criterion Σπίτι μου 3 has not published: listed to the user, never evaluated. */
export interface UnknownCriterion {
  id: string;
  label: string;
  note: string;
}

export interface Spiti3Rules {
  /** ISO date (YYYY-MM-DD) on which the values were last checked against sources. */
  lastVerified: string;
  age: RuleValue<{ min: number; max: number }>;
  /** For couples: is it enough that one applicant is in the age range? */
  coupleAgeOneApplicantEnough: RuleValue<boolean>;
  incomeCaps: RuleValue<{
    single: number;
    couple: number;
    perChildCouple: number;
    singleParent: number;
    perChildSingleParent: number;
  }>;
  minimumIncome: RuleValue<number>;
  maxPropertyValue: RuleValue<number>;
  maxLoan: RuleValue<number>;
  /** Maximum share of the contract value that can be financed (0–1). */
  maxFinancingShare: RuleValue<number>;
  /** Share of the loan that is State-funded and interest-free (0–1); the rest is a bank loan. */
  interestFreeShare: RuleValue<number>;
  minimumLoan: RuleValue<number>;
  loanTermYears: RuleValue<{ min: number; max: number; default: number }>;
  /** Bank-half rate basis: 3M Euribor plus a fixed margin, both in percent. */
  bankRate: RuleValue<{
    euribor3m: number;
    /** ISO date the Euribor value applies to. */
    euribor3mAsOf: string;
    euribor3mSource: RuleSource;
    margin: number;
  }>;
  /** Base maximum area; raised by `extraSqmPerChild` for each child beyond `afterChildren`. */
  maxArea: RuleValue<{ sqm: number; afterChildren: number; extraSqmPerChild: number }>;
  /** Latest building year allowed (the programme says "built by 31/12 of this year"). */
  maxBuildingYear: RuleValue<number>;
  /** Applicant must not own a property suitable as a main residence (self-declared). */
  mustNotOwnSuitableHome: RuleValue<boolean>;
  /** Non-EU applicants need a valid residence permit. */
  nonEuNeedsResidencePermit: RuleValue<boolean>;
  unknownCriteria: UnknownCriterion[];
}
