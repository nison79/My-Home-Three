import { formatEuro } from './format';
import { CriterionStatus, RuleSource, Spiti3Rules } from './rules.model';

export interface KeyFigure {
  id: string;
  label: string;
  value: string;
  status: CriterionStatus;
  source: RuleSource;
}

/** Figures shown on the landing page: only criteria reported for Σπίτι μου 3. */
export function keyFigures(rules: Spiti3Rules): KeyFigure[] {
  const { age, incomeCaps, maxPropertyValue, maxLoan, maxFinancingShare } = rules;
  const caps = incomeCaps.value;

  const all: KeyFigure[] = [
    {
      id: 'age',
      label: 'Ηλικία αιτούντος',
      value: `${age.value.min}–${age.value.max} ετών`,
      status: age.status,
      source: age.source,
    },
    {
      id: 'incomeSingle',
      label: 'Εισόδημα: άγαμος ή διαζευγμένος χωρίς παιδιά',
      value: `έως ${formatEuro(caps.single)}`,
      status: incomeCaps.status,
      source: incomeCaps.source,
    },
    {
      id: 'incomeCouple',
      label: 'Εισόδημα: έγγαμοι ή σε σύμφωνο συμβίωσης',
      value: `έως ${formatEuro(caps.couple)}, +${formatEuro(caps.perChildCouple)} ανά παιδί`,
      status: incomeCaps.status,
      source: incomeCaps.source,
    },
    {
      id: 'incomeSingleParent',
      label: 'Εισόδημα: μονογονεϊκή οικογένεια',
      value: `έως ${formatEuro(caps.singleParent)}, +${formatEuro(caps.perChildSingleParent)} ανά παιδί πέραν του πρώτου`,
      status: incomeCaps.status,
      source: incomeCaps.source,
    },
    {
      id: 'maxPropertyValue',
      label: 'Μέγιστη αξία ακινήτου',
      value: formatEuro(maxPropertyValue.value),
      status: maxPropertyValue.status,
      source: maxPropertyValue.source,
    },
    {
      id: 'maxLoan',
      label: 'Μέγιστο ποσό δανείου',
      value: formatEuro(maxLoan.value),
      status: maxLoan.status,
      source: maxLoan.source,
    },
    {
      id: 'maxFinancingShare',
      label: 'Μέγιστη χρηματοδότηση',
      value: `έως ${Math.round(maxFinancingShare.value * 100)} % της αξίας`,
      status: maxFinancingShare.status,
      source: maxFinancingShare.source,
    },
  ];

  return all.filter((f) => f.status === 'reported');
}
