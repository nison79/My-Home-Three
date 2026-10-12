import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatDateEl } from '../rules/format';
import { SPITI_MOU_3_RULES } from '../rules/spiti-mou-3.rules';
import { Field } from '../ui/field';
import { Notice } from '../ui/notice';
import { StatusBadge } from '../ui/status-badge';
import { FieldId, FieldErrors, parseAnswers, RawAnswers } from './answers';
import { evaluate } from './evaluate';

const EMPTY: RawAnswers = {
  householdType: '',
  children: '',
  ageA: '',
  ageB: '',
  income: '',
  propertyValue: '',
  area: '',
  buildingYear: '',
  ownsSuitableHome: '',
  residency: '',
};

const FIELD_ORDER: FieldId[] = [
  'householdType',
  'ageA',
  'ageB',
  'children',
  'income',
  'propertyValue',
  'area',
  'buildingYear',
  'ownsSuitableHome',
  'residency',
];

const INPUT_BASE =
  'w-full rounded-md border bg-surface-raised px-3 py-3 text-base text-ink tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aegean';

@Component({
  selector: 'app-checker',
  imports: [RouterLink, Field, Notice, StatusBadge],
  templateUrl: './checker.html',
})
export class Checker {
  protected readonly form = signal<RawAnswers>({ ...EMPTY });
  protected readonly submitted = signal(false);
  protected readonly lastVerified = formatDateEl(SPITI_MOU_3_RULES.lastVerified);

  private readonly parsed = computed(() => parseAnswers(this.form()));

  /** Errors are shown only after the first submit attempt. */
  protected readonly errors = computed<FieldErrors>(() => {
    const p = this.parsed();
    return this.submitted() && !p.ok ? p.errors : {};
  });

  /** Live after the first successful submit, so edits never leave a stale verdict. */
  protected readonly result = computed(() => {
    const p = this.parsed();
    return this.submitted() && p.ok ? evaluate(p.answers, SPITI_MOU_3_RULES) : null;
  });

  protected readonly householdType = computed(() => this.form().householdType);

  protected readonly householdOptions = [
    { value: 'single', label: 'Άγαμος/η ή διαζευγμένος/η, χωρίς παιδιά' },
    { value: 'couple', label: 'Έγγαμοι ή σε σύμφωνο συμβίωσης' },
    { value: 'singleParent', label: 'Μονογονεϊκή οικογένεια' },
  ];

  protected readonly yesNoOptions = [
    { value: 'no', label: 'Όχι, δεν έχω' },
    { value: 'yes', label: 'Ναι, έχω' },
  ];

  protected readonly residencyOptions = [
    { value: 'greek-eu', label: 'Ελληνική ή άλλης χώρας της ΕΕ' },
    { value: 'non-eu-permit', label: 'Χώρας εκτός ΕΕ, με άδεια παραμονής σε ισχύ' },
    { value: 'non-eu-no-permit', label: 'Χώρας εκτός ΕΕ, χωρίς άδεια παραμονής' },
  ];

  protected set(field: FieldId, value: string): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected inputClass(field: FieldId): string {
    const border = this.errors()[field] ? 'border-terracotta' : 'border-border-strong';
    return `${INPUT_BASE} ${border}`;
  }

  protected describedBy(field: FieldId, hasHint: boolean): string | null {
    const ids = [hasHint ? `${field}-hint` : '', this.errors()[field] ? `${field}-error` : ''];
    return ids.filter(Boolean).join(' ') || null;
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    queueMicrotask(() => this.focusFirstError());
  }

  protected reset(): void {
    this.form.set({ ...EMPTY });
    this.submitted.set(false);
  }

  private focusFirstError(): void {
    const p = this.parsed();
    if (p.ok) {
      document.getElementById('result-title')?.focus();
      return;
    }
    const first = FIELD_ORDER.find((f) => p.errors[f]);
    if (first) document.getElementById(first)?.focus();
  }
}
