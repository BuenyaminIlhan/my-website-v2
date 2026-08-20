import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Bünyamin Ilhan — Websites, Web-Apps & Apps entwickeln lassen',
    loadComponent: () => import('./home/home').then(m => m.Home),
  },
  {
    path: 'legal-notice',
    title: 'Impressum — Bünyamin Ilhan',
    loadComponent: () => import('./legal-notice/legal-notice').then(m => m.LegalNotice),
  },
  {
    path: 'privacy-policy',
    title: 'Datenschutz — Bünyamin Ilhan',
    loadComponent: () => import('./privacy-policy/privacy-policy').then(m => m.PrivacyPolicy),
  },
  { path: '**', redirectTo: '' },
];
