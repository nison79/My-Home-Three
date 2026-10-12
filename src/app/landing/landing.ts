import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatDateEl } from '../rules/format';
import { keyFigures } from '../rules/key-figures';
import { SPITI_MOU_3_RULES } from '../rules/spiti-mou-3.rules';
import { Notice } from '../ui/notice';
import { StatusBadge } from '../ui/status-badge';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Notice, StatusBadge],
  templateUrl: './landing.html',
})
export class Landing {
  protected readonly figures = keyFigures(SPITI_MOU_3_RULES);
  protected readonly lastVerified = formatDateEl(SPITI_MOU_3_RULES.lastVerified);
  protected readonly steps = [
    {
      title: 'Απαντήστε σε λίγες ερωτήσεις',
      text: 'Ηλικία, οικογενειακή κατάσταση, εισόδημα και στοιχεία του ακινήτου.',
    },
    {
      title: 'Δείτε το αποτέλεσμα',
      text: 'Για κάθε κριτήριο φαίνεται αν πληρούται και αν η προϋπόθεση έχει ανακοινωθεί ή είναι παραδοχή.',
    },
    {
      title: 'Εκτιμήστε το δάνειο',
      text: 'Ενδεικτικό ποσό δανείου, ίδια συμμετοχή και μηνιαία δόση.',
    },
  ];
}
