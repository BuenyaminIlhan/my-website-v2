import { Routes } from '@angular/router';
import { Lang } from './i18n/translations';
import { langGuard } from './i18n/lang.guard';
import { slugFor } from './i18n/route-map';
import { articlesFor } from './blog/blog-data';

const SERVICE_KEYS = [
  'website-erstellen-lassen',
  'web-app-entwicklung',
  'website-optimierung',
  'sorglos-paket',
] as const;

/**
 * One route tree per locale. Page titles/meta are set per page via SeoService
 * (they render into the prerendered HTML); slugs come from the route map so
 * each locale gets localized URLs. With outputMode: static every route here
 * is prerendered to its own index.html.
 */
function localeRoutes(lang: Lang): Routes {
  const routes: Routes = [
    {
      path: slugFor('home', lang)!,
      data: { lang, pageKey: 'home' },
      canActivate: [langGuard],
      loadComponent: () => import('./home/home').then(m => m.Home),
    },
    {
      path: slugFor('legal', lang)!,
      data: { lang, pageKey: 'legal' },
      canActivate: [langGuard],
      loadComponent: () => import('./legal-notice/legal-notice').then(m => m.LegalNotice),
    },
    {
      path: slugFor('privacy', lang)!,
      data: { lang, pageKey: 'privacy' },
      canActivate: [langGuard],
      loadComponent: () => import('./privacy-policy/privacy-policy').then(m => m.PrivacyPolicy),
    },
    ...SERVICE_KEYS.map(key => ({
      path: slugFor(key, lang)!,
      data: { lang, pageKey: key, slug: key },
      canActivate: [langGuard],
      loadComponent: () => import('./service-page/service-page').then(m => m.ServicePage),
    })),
  ];

  const blogSlug = slugFor('blog', lang);
  if (blogSlug !== undefined) {
    routes.push({
      path: blogSlug,
      data: { lang, pageKey: 'blog' },
      canActivate: [langGuard],
      loadComponent: () => import('./blog/blog-index').then(m => m.BlogIndex),
    });
    // One static route per article so prerendering picks them up (outputMode: static).
    for (const article of articlesFor(lang)) {
      routes.push({
        path: blogSlug + '/' + article.slugs[lang],
        data: { lang, pageKey: 'blog', articleId: article.id },
        canActivate: [langGuard],
        loadComponent: () => import('./blog/blog-article').then(m => m.BlogArticlePage),
      });
    }
  }

  routes.push(
    {
      path: slugFor('notFound', lang)!,
      data: { lang, pageKey: 'notFound' },
      canActivate: [langGuard],
      loadComponent: () => import('./not-found/not-found').then(m => m.NotFound),
    },
    {
      path: '**',
      data: { lang, pageKey: 'notFound' },
      canActivate: [langGuard],
      loadComponent: () => import('./not-found/not-found').then(m => m.NotFound),
    },
  );

  return routes;
}

export const routes: Routes = [
  { path: 'en', children: localeRoutes('en') },
  { path: 'tr', children: localeRoutes('tr') },
  // German is the unprefixed default tree; its '**' catch-all must come last.
  ...localeRoutes('de'),
];
