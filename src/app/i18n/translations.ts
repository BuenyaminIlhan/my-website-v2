export type Lang = 'de' | 'en' | 'tr';

/** Locales that get their own routed URL tree. '/' = de, '/en/...', '/tr/...'. */
export const SUPPORTED_LOCALES: Lang[] = ['de', 'en', 'tr'];

export interface OfferItem {
  title: string;
  desc: string;
  points: string[];
  /** Content key — identical across locales; the localized URL comes from the route map. */
  slug: string;
}

export interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  rating: number;
}

export interface ServicePageContent {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  lead: string;
  intro: string[];
  includedTitle: string;
  included: string[];
  forWhoTitle: string;
  forWho: string;
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  overviewLink: string;
}

export type ProjectTypeKey = 'website' | 'webApp' | 'mobileApp' | 'optimization' | 'maintenance' | 'other';

export interface LangTranslations {
  nav:       { offers: string; about: string; skills: string; portfolio: string; contact: string; legal: string; privacy: string; cta: string; skip: string };
  hero:      { label: string; title1: string; title2: string; sub: string; cta1: string; cta2: string; scroll: string; badges: string[]; marquee: string[]; terminal: { title: string; cmd: string; steps: { label: string; note: string }[]; deploy: string; live: string; visitorCmd: string; visitorDevice: string; visitorTime: string; visitorRegion: string; visitorNet: string; loadTime: string; loadTimeNote: string;
    requests: string; requestsForeign: string; themeDetected: string; themeDark: string; themeLight: string; themeApplied: string;
    langDetected: string; langSwitch: string; langAria: string;
    ipCmd: string; ipShow: string; ipHide: string; ipNote: string; ipFailed: string;
    ipAria: string; ipAriaHide: string } };
  offers:    { label: string; title: string; sub: string; items: OfferItem[]; why: string; priceNote: string; cta: string; mailHint: string; cardCta: string; moreInfo: string; core: string };
  testimonials: { label: string; title: string; sub: string; items: TestimonialItem[] };
  reviews:   { label: string; title: string; sub: string; empty: string; cta: string };
  servicePages: Record<string, ServicePageContent>;
  process:   { label: string; title: string; sub: string; steps: { title: string; desc: string }[] };
  faq:       { label: string; title: string; sub: string; items: { q: string; a: string }[] };
  about:     { label: string; title1: string; title2: string; p1: string; p2: string; p3: string; p4: string; cta: string };
  skills:    { label: string; title: string };
  stats:     { labels: string[] };
  portfolio: { label: string; title: string; sub: string; demo: string; pitch: string; github: string; liveProduct: string; responsive: string };
  contact:   { label: string; title: string; titleAccent: string; intro: string; name: string; email: string; topic: string; topicGeneral: string; message: string; namePh: string; emailPh: string; messagePh: string; send: string; sending: string; successTitle: string; successSub: string; sendAnother: string; error: string; waTitle: string; waNote: string; mailNote: string; formNote: string };
  notFound:  { title: string; sub: string; home: string; contact: string };
  footer:    { legal: string; privacy: string; back: string; sayHi: string; servicesTitle: string; contactTitle: string; location: string; noTracking: string };
  meta: {
    homeTitle: string; homeDesc: string;
    blogTitle: string; blogDesc: string;
    legalTitle: string; legalDesc: string;
    privacyTitle: string; privacyDesc: string;
    notFoundTitle: string; notFoundDesc: string;
  };
  blogUi: { eyebrow: string; h1: string; sub: string; minRead: string; readMore: string; backToAll: string; cta: string };
  a11y: { menu: string; backToTop: string; langSwitch: string };
  whatsapp: { aria: string; prefill: string; cta: string; short: string };
  websiteCheck: {
    label: string; title: string; titleAccent: string; sub: string;
    urlLabel: string; urlPh: string; nameLabel: string; emailLabel: string;
    submit: string; sending: string; successTitle: string; successSub: string; error: string; note: string;
  };
  wizard: {
    steps: string[];
    typeTitle: string;
    types: { key: ProjectTypeKey; label: string; desc: string }[];
    frameTitle: string;
    budgetLabel: string; budgets: string[];
    timelineLabel: string; timelines: string[];
    detailsLabel: string; detailsPh: string;
    contactTitle: string;
    next: string; back: string; optional: string; mailFallback: string;
  };
}
