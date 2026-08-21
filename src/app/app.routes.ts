import { Routes } from '@angular/router';
import { blogArticles } from './blog/blog-data';

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
    path: 'blog',
    title: 'Blog — Websites & digitale Tipps für Unternehmen | Bünyamin Ilhan',
    loadComponent: () => import('./blog/blog-index').then(m => m.BlogIndex),
  },
  // One static route per article so prerendering picks them up (outputMode: static)
  ...blogArticles.map(article => ({
    path: 'blog/' + article.slug,
    title: article.metaTitle,
    data: { slug: article.slug },
    loadComponent: () => import('./blog/blog-article').then(m => m.BlogArticlePage),
  })),
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
