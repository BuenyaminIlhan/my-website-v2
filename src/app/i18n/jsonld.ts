import { Lang, LangTranslations, ServicePageContent } from './translations';
import { absoluteUrl, homePathFor, PageKey, urlPathFor } from './route-map';
import { SITE_CONFIG } from '../config/site.config';

const BASE = SITE_CONFIG.baseUrl;

const SERVICE_DESC: Record<Lang, string> = {
  de: 'Entwicklung von Websites, Web-Apps und nativen Apps für iOS und Android — modern, performant und maßgeschneidert.',
  en: 'Development of websites, web apps and native apps for iOS and Android — modern, performant and tailor-made.',
};

const APP_OFFER: Record<Lang, { name: string; description: string }> = {
  de: { name: 'App entwickeln (iOS & Android)', description: 'Native Mobile Apps mit Swift (iOS) und Kotlin (Android) — inklusive Veröffentlichung im App Store und Play Store.' },
  en: { name: 'Mobile app development (iOS & Android)', description: 'Native mobile apps with Swift (iOS) and Kotlin (Android) — including App Store and Play Store publishing.' },
};

const CATALOG_NAME: Record<Lang, string> = { de: 'Leistungen', en: 'Services' };

/** The German home page — the address every own-site reference below points at. */
const HOME_URL = absoluteUrl(homePathFor('de'));

/** The logo wordmark, given to search engines as an alternate spelling of the brand. */
const BRAND_WORDMARK = 'softlyx_';

/**
 * The business address for local search. Address and phone mirror the Google Business
 * Profile and must be kept in sync with it.
 */
const BUSINESS_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: 'Beethovenstr. 13',
  postalCode: '53721',
  addressLocality: 'Siegburg',
  addressRegion: 'Nordrhein-Westfalen',
  addressCountry: 'DE',
};

/**
 * Where the owner visits customers — customers do not come to him. It mirrors the service
 * area of the Google Business Profile (user decision 2026-10-21); the site texts name the
 * same four places. Websites themselves are delivered nationwide, see the Service nodes.
 */
const SERVICE_AREA = [
  { '@type': 'City', name: 'Siegburg' },
  { '@type': 'City', name: 'Köln' },
  { '@type': 'City', name: 'Bonn' },
  { '@type': 'AdministrativeArea', name: 'Rhein-Sieg-Kreis' },
];

const PROJECTS = [
  { pos: 1, type: 'WebApplication', name: 'HausVio', url: 'https://hausvio.de/', category: 'BusinessApplication' },
  { pos: 2, type: 'WebApplication', name: 'Zephir', url: 'https://badeo.net/', category: 'BusinessApplication' },
  { pos: 3, type: 'WebApplication', name: 'Dachplaner', url: undefined, category: 'BusinessApplication' },
];

/**
 * The business as author, publisher or provider on pages outside the home page graph.
 * It carries the name itself: a bare @id points into a graph that page does not have.
 * The name is the bare brand, exactly as on the Google Business Profile, in every
 * language. The owner's personal name stays out of what Google shows (user decision
 * 2026-10-14) — only the legal notice names him, as the law requires.
 */
export function serviceRef(): object {
  return {
    '@type': 'ProfessionalService',
    '@id': `${BASE}/#service`,
    name: SITE_CONFIG.brandName,
    url: HOME_URL,
    logo: `${BASE}/brand/avatar-square-dark.svg`,
  };
}

/**
 * E.164 form of a number stored without '+', or nothing at all: an empty number is a
 * supported config state and must not become "telephone": "+".
 */
export function e164(digits: string): { telephone: string } | Record<string, never> {
  return digits ? { telephone: `+${digits}` } : {};
}

function serviceNode(lang: Lang, t: LangTranslations): object {
  return {
    ...serviceRef(),
    alternateName: BRAND_WORDMARK,
    description: SERVICE_DESC[lang],
    areaServed: SERVICE_AREA,
    knowsLanguage: ['de', 'en', 'tr'],
    address: BUSINESS_ADDRESS,
    // The voice line, not WhatsApp: a different number (user, 2026-10-13).
    ...e164(SITE_CONFIG.phoneNumber),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: CATALOG_NAME[lang],
      itemListElement: [
        ...t.offers.items.map(item => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: item.title, description: item.desc },
        })),
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: APP_OFFER[lang].name, description: APP_OFFER[lang].description },
        },
      ],
    },
  };
}

function faqNode(homeUrl: string, t: LangTranslations): object {
  return {
    '@type': 'FAQPage',
    '@id': `${homeUrl}#faq`,
    mainEntity: t.faq.items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

function websiteNode(lang: Lang): object {
  return {
    '@type': 'WebSite',
    '@id': `${BASE}/#website`,
    url: `${BASE}/`,
    // Google shows WebSite.name as the site name above the result.
    name: SITE_CONFIG.brandName,
    alternateName: BRAND_WORDMARK,
    publisher: { '@id': `${BASE}/#service` },
    inLanguage: lang,
  };
}

function projectsNode(): object {
  return {
    '@type': 'ItemList',
    '@id': `${BASE}/#projects`,
    name: 'Portfolio',
    author: { '@id': `${BASE}/#service` },
    itemListElement: PROJECTS.map(p => ({
      '@type': 'ListItem',
      position: p.pos,
      item: {
        '@type': p.type,
        name: p.name,
        ...(p.url ? { url: p.url } : {}),
        ...(p.category ? { applicationCategory: p.category } : {}),
        author: { '@id': `${BASE}/#service` },
      },
    })),
  };
}

const HOME_CRUMB: Record<Lang, string> = { de: 'Startseite', en: 'Home' };

/**
 * JSON-LD @graph of a service page: the breadcrumb Google can show instead of the
 * bare URL, and the service itself, offered by the business node of the home page.
 */
export function buildServicePageGraph(lang: Lang, key: PageKey, page: ServicePageContent): object {
  // A page without a URL in this locale is a routing bug. Falling back to '' would
  // name the home page as this service and the last crumb — break the prerender instead.
  const path = urlPathFor(key, lang);
  if (path === undefined) throw new Error(`buildServicePageGraph: page "${key}" has no URL in locale "${lang}"`);
  const url = absoluteUrl(path);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: HOME_CRUMB[lang], item: absoluteUrl(homePathFor(lang)) },
          { '@type': 'ListItem', position: 2, name: page.h1, item: url },
        ],
      },
      {
        '@type': 'Service',
        name: page.h1,
        description: page.metaDescription,
        url,
        inLanguage: lang,
        provider: serviceRef(),
        areaServed: ['DE'],
      },
    ],
  };
}

/** Localized site-wide JSON-LD @graph, injected on the home page of each locale. */
export function buildSiteGraph(lang: Lang, t: LangTranslations): object {
  // The FAQ node's @id is derived from this URL, so it has to be the same one
  // SeoService writes as the canonical link on the page — hence the shared helper.
  const homeUrl = absoluteUrl(homePathFor(lang));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      serviceNode(lang, t),
      faqNode(homeUrl, t),
      websiteNode(lang),
      projectsNode(),
    ],
  };
}
