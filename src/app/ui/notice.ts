import { Component, computed, input } from '@angular/core';

type Tone = 'warning' | 'info';

const TONES: Record<Tone, string> = {
  warning: 'bg-gold-mist text-gold-deep border-gold-deep',
  info: 'bg-surface-tint text-aegean-deep border-aegean',
};

/** Banner with an icon; the message itself carries the meaning. */
@Component({
  selector: 'app-notice',
  template: `
    <div class="flex gap-3 rounded-md border p-4" [class]="tone()" role="note">
      <svg
        class="mt-0.5 h-6 w-6 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        @if (kind() === 'warning') {
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        } @else {
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        }
      </svg>
      <div class="flex flex-col gap-1 text-sm"><ng-content /></div>
    </div>
  `,
})
export class Notice {
  readonly kind = input<Tone>('info');
  protected readonly tone = computed(() => TONES[this.kind()]);
}
