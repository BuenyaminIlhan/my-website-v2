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
 * baseUrl: the site's one address (softlyx.de since 2026-10-16); canonical, hreflang,
 * structured data, the sitemap and the form endpoint derive from it. The README section
 * "Domain" lists the plain files that repeat it. email deliberately stays on the old
 * domain ilhan-buenyamin.com.
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
  baseUrl: 'https://softlyx.de',
  email: 'mail@ilhan-buenyamin.com',
  whatsappNumber: '4917656987311',
  phoneNumber: '491732856136',
  googleReviewUrl: '',
  turkishSiteUrl: 'https://softlyx.tr/',
} as const;

/** Where both forms post. Absolute on purpose: `ng serve` posts to the deployed script,
 *  which allows localhost via CORS — a relative URL would break local development. */
export const MAIL_ENDPOINT = `${SITE_CONFIG.baseUrl}/send_mail/send_mail.php`;

/** A prefilled mail to the site's address — the way out both forms offer when sending
 *  fails. Subject and body are encoded, so a `&` or `#` in what the visitor typed
 *  cannot cut the body short. */
export function mailtoUrl(subject: string, lines: readonly string[]): string {
  return `mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(subject)}`
    + `&body=${encodeURIComponent(lines.join('\n'))}`;
}
