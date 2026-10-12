import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatDateEl, formatDecimalInput, formatEuro, formatPercent } from '../rules/format';
import { SPITI_MOU_3_RULES } from '../rules/spiti-mou-3.rules';
import { Field } from '../ui/field';
import { Notice } from '../ui/notice';
import { SiteHeader } from '../ui/site-header';
import { StatusBadge } from '../ui/status-badge';
import { calculate } from './calculate';
import { LoanFieldErrors, LoanFieldId, parseLoanInputs, RawLoanInputs } from './inputs';

const rules = SPITI_MOU_3_RULES;
const { euribor3m, margin } = rules.bankRate.value;
const DEFAULT_RATE = euribor3m + margin;

const defaults = (): RawLoanInputs => ({
  propertyValue: '',
  termYears: String(rules.loanTermYears.value.default),
  bankRate: formatDecimalInput(DEFAULT_RATE),
});

const FIELD_ORDER: LoanFieldId[] = ['propertyValue', 'termYears', 'bankRate'];

const INPUT_BASE =
  'w-full rounded-md border bg-surface-raised px-3 py-3 text-base text-ink tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aegean';

@Component({
  selector: 'app-calculator',
  imports: [RouterLink, Field, Notice, SiteHeader, StatusBadge],
  templateUrl: './calculator.html',
})
export class Calculator {
  protected readonly form = signal<RawLoanInputs>(defaults());
  /** Fields the user has left; their errors are shown, untouched ones stay quiet. */
  private readonly touched = signal<ReadonlySet<LoanFieldId>>(new Set());

  protected readonly lastVerified = formatDateEl(rules.lastVerified);
  protected readonly termRange = rules.loanTermYears.value;
  protected readonly euribor = formatPercent(euribor3m);
  protected readonly euriborDate = formatDateEl(rules.bankRate.value.euribor3mAsOf);
  protected readonly euriborSource = rules.bankRate.value.euribor3mSource;
  protected readonly margin = formatPercent(margin);
  protected readonly defaultRate = formatPercent(DEFAULT_RATE);
  protected readonly maxValue = formatEuro(rules.maxPropertyValue.value);
  protected readonly maxLoan = formatEuro(rules.maxLoan.value);
  protected readonly minLoan = formatEuro(rules.minimumLoan.value);
  protected readonly financingPct = Math.round(rules.maxFinancingShare.value * 100);

  private readonly parsed = computed(() => parseLoanInputs(this.form()));

  protected readonly errors = computed<LoanFieldErrors>(() => {
    const p = this.parsed();
    if (p.ok) return {};
    const touched = this.touched();
    const errors: LoanFieldErrors = {};
    for (const f of FIELD_ORDER) if (touched.has(f) && p.errors[f]) errors[f] = p.errors[f];
    return errors;
  });

  /** Live: figures follow the inputs, so there is no stale result to manage. */
  protected readonly result = computed(() => {
    const p = this.parsed();
    return p.ok ? calculate(p.inputs, rules) : null;
  });

  protected set(field: LoanFieldId, value: string): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected inputClass(field: LoanFieldId): string {
    const border = this.errors()[field] ? 'border-terracotta' : 'border-border-strong';
    return `${INPUT_BASE} ${border}`;
  }

  protected describedBy(field: LoanFieldId): string | null {
    const ids = [`${field}-hint`, this.errors()[field] ? `${field}-error` : ''];
    return ids.filter(Boolean).join(' ');
  }

  protected termLabel(): string {
    const t = Number(this.form().termYears);
    return Number.isInteger(t) ? `${t} έτη` : '';
  }

  protected euro(amount: number, withCents = false): string {
    return formatEuro(amount, withCents);
  }

  protected percent(value: number): string {
    return formatPercent(value);
  }

  protected years(months: number): string {
    return `${months / 12} έτη`;
  }

  protected touch(field: LoanFieldId): void {
    this.touched.update((t) => new Set(t).add(field));
  }

  /** Enter in a field must not reload the page; the figures are already live. */
  protected submit(event: Event): void {
    event.preventDefault();
  }

  protected reset(): void {
    this.form.set(defaults());
    this.touched.set(new Set());
  }
}
