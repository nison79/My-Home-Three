import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Σπίτι μου 3: έλεγχος κριτηρίων και υπολογισμός δανείου',
    loadComponent: () => import('./landing/landing').then((m) => m.Landing),
  },
  {
    path: 'elegxos',
    title: 'Έλεγχος επιλεξιμότητας | Σπίτι μου 3',
    loadComponent: () => import('./checker/checker').then((m) => m.Checker),
  },
  { path: '**', redirectTo: '' },
];
