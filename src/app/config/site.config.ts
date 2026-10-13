/**
 * Central site configuration.
 *
 * whatsappNumber: international format without '+' or spaces (e.g. '491701234567').
 * Leave empty to hide the WhatsApp button until a WhatsApp Business number exists.
 *
 * phoneNumber: the number for voice calls, same format. It is a different line from
 * WhatsApp. It is published as the business telephone in the structured data and
 * must match the Google Business Profile and the legal notice; empty = no telephone.
 *
 * googleReviewUrl: paste the Google Business profile review link here to make
 * the reviews section appear. While it is empty the section renders nothing.
 *
 * turkishSiteUrl: absolute URL of the Turkish site's home page, exactly as that
 * site canonicalises it — set since the site answers. Emptying it again withdraws
 * the hreflang="tr" on the home page and the "Türkçe" link in the footer with the
 * next deploy; the /tr/... -> softlyx.tr 301 in public/.htaccess does NOT come back
 * with it, because browsers cache a permanent redirect. The redirect is a URL move
 * only, never a language or IP sniff.
 */
export const SITE_CONFIG = {
  brandName: 'Softlyx',
  baseUrl: 'https://ilhan-buenyamin.com',
  email: 'mail@ilhan-buenyamin.com',
  whatsappNumber: '4917656987311',
  phoneNumber: '491732856136',
  googleReviewUrl: '',
  turkishSiteUrl: 'https://softlyx.tr/',
} as const;
