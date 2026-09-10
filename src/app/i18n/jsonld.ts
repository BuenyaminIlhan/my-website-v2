import { Lang, LangTranslations } from './translations';
import { absoluteUrl, homePathFor } from './route-map';
import { SITE_CONFIG } from '../config/site.config';

const BASE = SITE_CONFIG.baseUrl;

const PERSON_DESC: Record<Lang, string> = {
  de: 'Web- und App-Entwickler aus Siegburg. Entwickelt moderne Websites, Web-Apps und native iOS- & Android-Apps mit Angular, Swift und Kotlin.',
  en: 'Web and app developer based in Siegburg, Germany. Builds modern websites, web apps and native iOS & Android apps with Angular, Swift and Kotlin.',
};

const SERVICE_DESC: Record<Lang, string> = {
  de: 'Entwicklung von Websites, Web-Apps und nativen Apps für iOS und Android — modern, performant und maßgeschneidert.',
  en: 'Development of websites, web apps and native apps for iOS and Android — modern, performant and tailor-made.',
};

const APP_OFFER: Record<Lang, { name: string; description: string }> = {
  de: { name: 'App entwickeln (iOS & Android)', description: 'Native Mobile Apps mit Swift (iOS) und Kotlin (Android) — inklusive Veröffentlichung im App Store und Play Store.' },
  en: { name: 'Mobile app development (iOS & Android)', description: 'Native mobile apps with Swift (iOS) and Kotlin (Android) — including App Store and Play Store publishing.' },
};

const CATALOG_NAME: Record<Lang, string> = { de: 'Leistungen', en: 'Services' };

const SERVICE_NAME_SUFFIX: Record<Lang, string> = {
  de: 'Web- & App-Entwicklung',
  en: 'Web & App Development',
};

const ADDRESS = {
  '@type': 'PostalAddress',
  addressLocality: 'Siegburg',
  addressRegion: 'Nordrhein-Westfalen',
  addressCountry: 'DE',
};

const PROJECTS = [
  { pos: 1, type: 'WebApplication', name: 'HausVio', url: 'https://hausvio.de/', category: 'BusinessApplication' },
  { pos: 2, type: 'WebApplication', name: 'Zephir', url: 'https://badeo.net/', category: 'BusinessApplication' },
  { pos: 3, type: 'WebApplication', name: 'Dachplaner', url: undefined, category: 'BusinessApplication' },
];

function personNode(lang: Lang): object {
  return {
    '@type': 'Person',
    '@id': `${BASE}/#person`,
    name: 'Bünyamin Ilhan',
    url: `${BASE}/`,
    email: SITE_CONFIG.email,
    jobTitle: 'Web- & App-Entwickler',
    description: PERSON_DESC[lang],
    image: `${BASE}/assets/img/Profile_2.jpg`,
    knowsAbout: ['Webentwicklung', 'App-Entwicklung', 'Web-App-Entwicklung', 'Angular', 'TypeScript', 'Swift', 'Kotlin', 'iOS', 'Android', 'Frontend-Entwicklung'],
    // A fact about the person, not site content: Turkish-speaking clients in Germany are served too.
    knowsLanguage: ['de', 'en', 'tr'],
    address: ADDRESS,
    sameAs: [
      'https://github.com/BuenyaminIlhan',
      'https://www.linkedin.com/in/b%C3%BCnyamin-ilhan/',
    ],
  };
}

function serviceNode(lang: Lang, t: LangTranslations): object {
  return {
    '@type': 'ProfessionalService',
    '@id': `${BASE}/#service`,
    name: `${SITE_CONFIG.brandName} — ${SERVICE_NAME_SUFFIX[lang]}`,
    alternateName: 'softlyx_',
    logo: `${BASE}/brand/avatar-square-dark.svg`,
    url: `${BASE}/`,
    founder: { '@id': `${BASE}/#person` },
    description: SERVICE_DESC[lang],
    // The Turkish market is served by the Turkish site (SITE_CONFIG.turkishSiteUrl).
    areaServed: ['DE'],
    knowsLanguage: ['de', 'en', 'tr'],
    address: ADDRESS,
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
    name: `${SITE_CONFIG.brandName} — Portfolio`,
    author: { '@id': `${BASE}/#person` },
    inLanguage: lang,
  };
}

function profilePageNode(homeUrl: string, lang: Lang): object {
  return {
    '@type': 'ProfilePage',
    '@id': `${homeUrl}#profilepage`,
    url: homeUrl,
    name: 'Bünyamin Ilhan — Web- & App-Entwickler',
    isPartOf: { '@id': `${BASE}/#website` },
    mainEntity: { '@id': `${BASE}/#person` },
    inLanguage: lang,
  };
}

function projectsNode(): object {
  return {
    '@type': 'ItemList',
    '@id': `${BASE}/#projects`,
    name: 'Portfolio',
    author: { '@id': `${BASE}/#person` },
    itemListElement: PROJECTS.map(p => ({
      '@type': 'ListItem',
      position: p.pos,
      item: {
        '@type': p.type,
        name: p.name,
        ...(p.url ? { url: p.url } : {}),
        ...(p.category ? { applicationCategory: p.category } : {}),
        author: { '@id': `${BASE}/#person` },
      },
    })),
  };
}

/** Localized site-wide JSON-LD @graph, injected on the home page of each locale. */
export function buildSiteGraph(lang: Lang, t: LangTranslations): object {
  // The @id values below are derived from this URL, so it has to be the same one
  // SeoService writes as the canonical link on the page — hence the shared helper.
  const homeUrl = absoluteUrl(homePathFor(lang));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      personNode(lang),
      serviceNode(lang, t),
      faqNode(homeUrl, t),
      websiteNode(lang),
      profilePageNode(homeUrl, lang),
      projectsNode(),
    ],
  };
}
