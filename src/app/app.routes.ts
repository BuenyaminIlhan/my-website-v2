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
  {
    path: 'website-erstellen-lassen',
    title: 'Website erstellen lassen — Bünyamin Ilhan',
    data: { slug: 'website-erstellen-lassen' },
    loadComponent: () => import('./service-page/service-page').then(m => m.ServicePage),
  },
  {
    path: 'web-app-entwicklung',
    title: 'Web-App entwickeln lassen — Bünyamin Ilhan',
    data: { slug: 'web-app-entwicklung' },
    loadComponent: () => import('./service-page/service-page').then(m => m.ServicePage),
  },
  {
    path: 'website-optimierung',
    title: 'Website-Optimierung & Modernisierung — Bünyamin Ilhan',
    data: { slug: 'website-optimierung' },
    loadComponent: () => import('./service-page/service-page').then(m => m.ServicePage),
  },
  {
    path: 'sorglos-paket',
    title: 'All-in-One Sorglos-Paket — Bünyamin Ilhan',
    data: { slug: 'sorglos-paket' },
    loadComponent: () => import('./service-page/service-page').then(m => m.ServicePage),
  },
  {
    path: '404',
    title: 'Seite nicht gefunden — Bünyamin Ilhan',
    loadComponent: () => import('./not-found/not-found').then(m => m.NotFound),
  },
  {
    path: '**',
    title: 'Seite nicht gefunden — Bünyamin Ilhan',
    loadComponent: () => import('./not-found/not-found').then(m => m.NotFound),
  },
];
