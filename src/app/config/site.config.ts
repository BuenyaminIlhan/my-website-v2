/**
 * Central site configuration.
 *
 * whatsappNumber: international format without '+' or spaces (e.g. '491701234567').
 * Leave empty to hide the WhatsApp button until a WhatsApp Business number exists.
 *
 * googleReviewUrl: paste the Google Business profile review link here to make
 * the reviews section appear. While it is empty the section renders nothing.
 */
export const SITE_CONFIG = {
  brandName: 'Softlyx',
  baseUrl: 'https://ilhan-buenyamin.com',
  email: 'mail@ilhan-buenyamin.com',
  whatsappNumber: '4917656987311',
  googleReviewUrl: '',
} as const;
