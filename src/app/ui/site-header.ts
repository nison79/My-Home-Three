import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink],
  template: `
    <header class="border-b border-border bg-surface-raised">
      <div class="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a
          routerLink="/"
          class="font-display text-2xl font-semibold text-aegean-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aegean"
          >Σπίτι μου 3</a
        >
        <span class="text-sm text-ink-muted">Ανεπίσημος οδηγός</span>
      </div>
    </header>
  `,
})
export class SiteHeader {}
