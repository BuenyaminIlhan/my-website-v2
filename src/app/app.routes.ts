import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.Home),
  },
  {
    path: 'legal-notice',
    loadComponent: () => import('./legal-notice/legal-notice').then(m => m.LegalNotice),
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./privacy-policy/privacy-policy').then(m => m.PrivacyPolicy),
  },
  { path: '**', redirectTo: '' },
];
