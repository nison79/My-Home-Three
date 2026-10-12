import { formatEuro } from '../rules/format';
import { CriterionStatus, Spiti3Rules, UnknownCriterion } from '../rules/rules.model';
import { HouseholdAnswers } from './answers';

export interface CriterionResult {
  id: string;
  label: string;
  status: CriterionStatus;
  outcome: 'met' | 'not-met';
  /** One sentence comparing the answer with the limit. */
  detail: string;
  /** Extra caveat shown under the detail. */
  note?: string;
}

export interface Verdict {
  /** `not-eligible` only when a *reported* criterion fails. */
  kind: 'appears-eligible' | 'not-eligible';
  /** Assumed criteria that failed: shown as warnings, never as a rejection. */
  assumedFailures: CriterionResult[];
  /** True when at least one evaluated criterion is an assumption. */
  reliesOnAssumptions: boolean;
}

export interface CheckResult {
  verdict: Verdict;
  criteria: CriterionResult[];
  unknown: UnknownCriterion[];
}

export function evaluate(a: HouseholdAnswers, rules: Spiti3Rules): CheckResult {
  const criteria: CriterionResult[] = [
    ageCriterion(a, rules),
    incomeCriterion(a, rules),
    minimumIncomeCriterion(a, rules),
    propertyValueCriterion(a, rules),
    areaCriterion(a, rules),
    buildingYearCriterion(a, rules),
    suitableHomeCriterion(a, rules),
    residencyCriterion(a, rules),
  ];

  const assumedFailures = criteria.filter((c) => c.status === 'assumed' && c.outcome === 'not-met');
  const reportedFailure = criteria.some((c) => c.status === 'reported' && c.outcome === 'not-met');

  return {
    verdict: {
      kind: reportedFailure ? 'not-eligible' : 'appears-eligible',
      assumedFailures,
      reliesOnAssumptions: criteria.some((c) => c.status === 'assumed'),
    },
    criteria,
    unknown: rules.unknownCriteria,
  };
}

function ageCriterion(a: HouseholdAnswers, rules: Spiti3Rules): CriterionResult {
  const { min, max } = rules.age.value;
  const inRange = a.applicantAges.map((age) => age >= min && age <= max);
  const ages = a.applicantAges.join(' και ');
  const base = { id: 'age', label: 'Ηλικία' };
  const range = `${min}–${max} ετών`;

  if (a.applicantAges.length === 1) {
    return {
      ...base,
      status: rules.age.status,
      outcome: inRange[0] ? 'met' : 'not-met',
      detail: `Ηλικία ${ages} ετών, όριο ${range}.`,
    };
  }

  if (inRange.every(Boolean) || !inRange.some(Boolean)) {
    return {
      ...base,
      status: rules.age.status,
      outcome: inRange[0] ? 'met' : 'not-met',
      detail: `Ηλικίες ${ages} ετών, όριο ${range}.`,
    };
  }

  // Only one partner is in range: the outcome depends on the assumed couple rule.
  const oneEnough = rules.coupleAgeOneApplicantEnough.value;
  return {
    ...base,
    status: rules.coupleAgeOneApplicantEnough.status,
    outcome: oneEnough ? 'met' : 'not-met',
    detail: `Ηλικίες ${ages} ετών, όριο ${range}.`,
    note: 'Στο Σπίτι μου 2 αρκούσε να πληροί το ηλικιακό όριο ο ένας από τους δύο.',
  };
}

function incomeCap(a: HouseholdAnswers, rules: Spiti3Rules): number {
  const caps = rules.incomeCaps.value;
  switch (a.householdType) {
    case 'single':
      return caps.single;
    case 'couple':
      return caps.couple + caps.perChildCouple * a.children;
    case 'singleParent':
      return caps.singleParent + caps.perChildSingleParent * Math.max(0, a.children - 1);
  }
}

function incomeCriterion(a: HouseholdAnswers, rules: Spiti3Rules): CriterionResult {
  const cap = incomeCap(a, rules);
  const met = a.annualIncome <= cap;
  return {
    id: 'income',
    label: 'Ανώτατο οικογενειακό εισόδημα',
    status: rules.incomeCaps.status,
    outcome: met ? 'met' : 'not-met',
    detail: `Εισόδημα ${formatEuro(a.annualIncome)}, όριο ${formatEuro(cap)}.`,
    note: met
      ? undefined
      : 'Στο Σπίτι μου 2, αν το εισόδημα υπερέβαινε το όριο, λαμβανόταν υπόψη ο μέσος όρος των τριών τελευταίων φορολογικών ετών.',
  };
}

function minimumIncomeCriterion(a: HouseholdAnswers, rules: Spiti3Rules): CriterionResult {
  const min = rules.minimumIncome.value;
  return {
    id: 'minimumIncome',
    label: 'Κατώτατο εισόδημα',
    status: rules.minimumIncome.status,
    outcome: a.annualIncome >= min ? 'met' : 'not-met',
    detail: `Εισόδημα ${formatEuro(a.annualIncome)}, κατώτατο όριο ${formatEuro(min)}.`,
  };
}

function propertyValueCriterion(a: HouseholdAnswers, rules: Spiti3Rules): CriterionResult {
  const max = rules.maxPropertyValue.value;
  return {
    id: 'propertyValue',
    label: 'Αξία ακινήτου',
    status: rules.maxPropertyValue.status,
    outcome: a.propertyValue <= max ? 'met' : 'not-met',
    detail: `Αξία ${formatEuro(a.propertyValue)}, ανώτατο όριο ${formatEuro(max)}.`,
  };
}

function areaCriterion(a: HouseholdAnswers, rules: Spiti3Rules): CriterionResult {
  const { sqm, afterChildren, extraSqmPerChild } = rules.maxArea.value;
  const limit = sqm + extraSqmPerChild * Math.max(0, a.children - afterChildren);
  return {
    id: 'area',
    label: 'Εμβαδόν ακινήτου',
    status: rules.maxArea.status,
    outcome: a.propertyAreaSqm <= limit ? 'met' : 'not-met',
    detail: `Εμβαδόν ${a.propertyAreaSqm} τ.μ., όριο ${limit} τ.μ.`,
  };
}

function buildingYearCriterion(a: HouseholdAnswers, rules: Spiti3Rules): CriterionResult {
  const max = rules.maxBuildingYear.value;
  return {
    id: 'buildingYear',
    label: 'Έτος κατασκευής',
    status: rules.maxBuildingYear.status,
    outcome: a.buildingYear <= max ? 'met' : 'not-met',
    detail: `Έτος κατασκευής ${a.buildingYear}, όριο έως ${max}.`,
    note: 'Το όριο ίσχυε στο Σπίτι μου 2 και μπορεί να έχει αλλάξει στο Σπίτι μου 3.',
  };
}

function suitableHomeCriterion(a: HouseholdAnswers, rules: Spiti3Rules): CriterionResult {
  const mustNotOwn = rules.mustNotOwnSuitableHome.value;
  return {
    id: 'suitableHome',
    label: 'Κύρια κατοικία',
    status: rules.mustNotOwnSuitableHome.status,
    outcome: mustNotOwn && a.ownsSuitableHome ? 'not-met' : 'met',
    detail: a.ownsSuitableHome
      ? 'Δηλώσατε ότι έχετε ακίνητο κατάλληλο για κύρια κατοικία.'
      : 'Δηλώσατε ότι δεν έχετε ακίνητο κατάλληλο για κύρια κατοικία.',
  };
}

function residencyCriterion(a: HouseholdAnswers, rules: Spiti3Rules): CriterionResult {
  const needsPermit = rules.nonEuNeedsResidencePermit.value;
  const failing = needsPermit && a.residency === 'non-eu-no-permit';
  return {
    id: 'residency',
    label: 'Ιθαγένεια και άδεια παραμονής',
    status: rules.nonEuNeedsResidencePermit.status,
    outcome: failing ? 'not-met' : 'met',
    detail: failing
      ? 'Πολίτες εκτός ΕΕ χρειάζονται άδεια παραμονής σε ισχύ.'
      : a.residency === 'non-eu-permit'
        ? 'Έχετε άδεια παραμονής σε ισχύ.'
        : 'Ελληνική ή ευρωπαϊκή ιθαγένεια.',
  };
}
