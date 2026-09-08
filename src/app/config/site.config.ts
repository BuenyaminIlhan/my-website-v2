/**
 * Central site configuration.
 *
 * whatsappNumber: international format without '+' or spaces (e.g. '491701234567').
 * Leave empty to hide the WhatsApp button until a WhatsApp Business number exists.
 *
 * googleReviewUrl: paste the Google Business profile review link here to make
 * the reviews section appear. While it is empty the section renders nothing.
 *
 * turkishSiteUrl: absolute URL of the Turkish site's home page, exactly as that
 * site canonicalises it (e.g. 'https://softlyx.tr/'). While it is empty, the
 * home page emits no hreflang="tr" and the footer shows no "Türkçe" link —
 * fill it in only once the Turkish site answers. The former /tr/... URLs are
 * redirected there by public/.htaccess, never by a language or IP sniff.
 */
export const SITE_CONFIG = {
  brandName: 'Softlyx',
  baseUrl: 'https://ilhan-buenyamin.com',
  email: 'mail@ilhan-buenyamin.com',
  whatsappNumber: '4917656987311',
  googleReviewUrl: '',
  turkishSiteUrl: '',
} as const;
