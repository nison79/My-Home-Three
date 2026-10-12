import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Logo mark plus live wordmark, so Greek text always uses the page fonts. */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink],
  template: `
    <header class="border-b border-border bg-surface-raised">
      <div class="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a
          routerLink="/"
          class="flex items-center gap-3 font-display text-2xl font-semibold text-aegean-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aegean"
        >
          <svg class="h-9 w-9 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
            <path
              d="M24 5 6 19.5V41a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2V19.5z"
              fill="#0a3d73"
              stroke="#0a3d73"
              stroke-width="3"
              stroke-linejoin="round"
            />
            <path
              d="M15.5 26.5 22 33l11-13"
              fill="none"
              stroke="#ffffff"
              stroke-width="4.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle cx="38" cy="9" r="3.5" fill="#c8962e" />
          </svg>
          <span>Σπίτι μου 3</span>
        </a>
        <span class="text-sm text-ink-muted">Ανεπίσημος οδηγός</span>
      </div>
    </header>
  `,
})
export class SiteHeader {}
