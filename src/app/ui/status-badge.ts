import { Component, computed, input } from '@angular/core';
import { CriterionStatus } from '../rules/rules.model';

const LABELS: Record<CriterionStatus, string> = {
  reported: 'Αναφερόμενο',
  assumed: 'Παραδοχή',
  unknown: 'Άγνωστο',
};

const TONES: Record<CriterionStatus, string> = {
  reported: 'bg-olive-mist text-olive border-olive',
  assumed: 'bg-gold-mist text-gold-deep border-gold-deep',
  unknown: 'bg-surface-sunken text-ink border-border-strong',
};

/** Κατάσταση κριτηρίου: always a word, never colour alone. */
@Component({
  selector: 'app-status-badge',
  template: `<span
    class="inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold whitespace-nowrap"
    [class]="tone()"
    >{{ label() }}</span
  >`,
})
export class StatusBadge {
  readonly status = input.required<CriterionStatus>();
  protected readonly label = computed(() => LABELS[this.status()]);
  protected readonly tone = computed(() => TONES[this.status()]);
}
