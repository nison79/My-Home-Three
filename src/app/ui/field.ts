import { Component, input } from '@angular/core';

/**
 * Label, then the control, then its hint and error. The hint sits below the control so
 * that controls in a row line up no matter how long or wrapped the hint is. The control must have the
 * same id as `controlId` and point `aria-describedby` at `{id}-hint` / `{id}-error`.
 */
@Component({
  selector: 'app-field',
  template: `
    <div class="flex flex-col gap-2">
      <label [attr.for]="controlId()" class="text-sm font-semibold text-ink">{{ label() }}</label>
      <ng-content />
      @if (hint()) {
        <p [id]="controlId() + '-hint'" class="text-sm text-ink-muted">{{ hint() }}</p>
      }
      @if (error()) {
        <p
          [id]="controlId() + '-error'"
          data-testid="field-error"
          class="flex items-center gap-2 text-sm text-terracotta"
        >
          <svg
            class="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
          <span>{{ error() }}</span>
        </p>
      }
    </div>
  `,
})
export class Field {
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input<string>('');
  readonly error = input<string | undefined>(undefined);
}
