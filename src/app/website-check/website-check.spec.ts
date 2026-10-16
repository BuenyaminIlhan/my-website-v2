import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WebsiteCheck } from './website-check';
import { LangService } from '../services/lang.service';
import { stubIntersectionObserver } from '../../testing/browser-stubs';
import { SITE_CONFIG } from '../config/site.config';

// A literal on purpose: built from SITE_CONFIG it would only repeat the production formula.
const MAIL_ENDPOINT = 'https://softlyx.de/send_mail/send_mail.php';

describe('WebsiteCheck', () => {
  let fixture: ComponentFixture<WebsiteCheck>;
  let check: WebsiteCheck;
  let fetchMock: ReturnType<typeof vi.fn>;
  let io: ReturnType<typeof stubIntersectionObserver>;

  const sentBody = () => {
    // The component always posts a urlencoded string body.
    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    return new URLSearchParams(init.body);
  };

  const fill = () => {
    check.url.set('https://example.com');
    check.name.set('Test');
    check.email.set('test@example.com');
  };

  beforeEach(() => {
    io = stubIntersectionObserver();
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(LangService).applyRoute('en', 'home');

    fixture = TestBed.createComponent(WebsiteCheck);
    check = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // Restores console spies even when an assertion failed before the test could.
    vi.restoreAllMocks();
    io.restore();
  });

  it('posts the check request with the active locale and clears the form', async () => {
    fill();

    await check.send();

    expect(fetchMock).toHaveBeenCalledWith(MAIL_ENDPOINT, expect.objectContaining({ method: 'POST' }));
    const body = sentBody();
    expect(body.get('form')).toBe('website-check');
    expect(body.get('url')).toBe('https://example.com');
    expect(body.get('lang')).toBe('en');

    expect(check.sent()).toBe(true);
    expect(check.url()).toBe('');
    expect(check.name()).toBe('');
    expect(check.email()).toBe('');
    expect(check.sending()).toBe(false);
  });

  it('sends the honeypot field along so the backend can drop bots', async () => {
    fill();
    check.honeypot.set('spam');

    await check.send();

    expect(sentBody().get('hp_contact_ref')).toBe('spam');
    expect(sentBody().has('website')).toBe(false);
  });

  /* Browsers autofill a field called "website" with a "Website" label — a real visitor
     then got a thank-you while the backend silently dropped the inquiry as a bot. */
  it('names the honeypot so that no browser autofills it', () => {
    const el: HTMLElement = fixture.nativeElement;
    const trap = el.querySelector<HTMLInputElement>('input[name="hp_contact_ref"]');
    expect(trap).not.toBeNull();
    expect(el.querySelector('input[name="website"]')).toBeNull();
    expect(el.querySelector(`label[for="${trap?.id}"]`)?.textContent).not.toMatch(/website|url/i);
  });

  it('flags an error when the mailer rejects the request', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    fill();

    await check.send();

    expect(check.error()).toBe(true);
    expect(check.sent()).toBe(false);
    expect(check.url()).toBe('https://example.com');
  });

  it('logs a rejected request with the endpoint and status', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    fill();

    await check.send();

    expect(log).toHaveBeenCalledWith(expect.stringContaining('website-check'), MAIL_ENDPOINT, 500);
  });

  it('logs a request that never arrives with the endpoint and the error', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const offline = new Error('offline');
    fetchMock.mockRejectedValue(offline);
    fill();

    await check.send();

    expect(log).toHaveBeenCalledWith(expect.stringContaining('website-check'), MAIL_ENDPOINT, offline);
  });

  it('offers a prefilled mail when sending fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    fill();
    check.url.set('https://example.com/?a=1&b=2#x');

    await check.send();
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.error-msg a[href^="mailto:"]');
    expect(link).not.toBeNull();
    expect(link?.textContent?.trim()).toBe(TestBed.inject(LangService).t().websiteCheck.mailFallback);
    const href = link?.getAttribute('href') ?? '';
    expect(href.startsWith(`mailto:${SITE_CONFIG.email}?subject=`)).toBe(true);
    // Parsed, not decoded wholesale: an unencoded & or # in the URL would cut the body short.
    const body = new URL(href).searchParams.get('body') ?? '';
    expect(body).toContain('https://example.com/?a=1&b=2#x');
    expect(body).toContain('Test');
  });

  it('flags an error when the request never arrives', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    fill();

    await check.send();

    expect(check.error()).toBe(true);
    expect(check.sending()).toBe(false);
  });

  it('ignores a second submit while one is in flight', async () => {
    check.sending.set(true);

    await check.send();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('points at the privacy policy where the data is entered', () => {
    const lang = TestBed.inject(LangService);
    const note = (fixture.nativeElement as HTMLElement).querySelector('.privacy-note');

    expect(note?.textContent).toContain(lang.t().contact.privacyNote.text);
    const link = note?.querySelector('a');
    expect(link?.textContent?.trim()).toBe(lang.t().contact.privacyNote.linkLabel);
    // The localized route, not a hardcoded path.
    expect(link?.getAttribute('href')).toBe(lang.pagePath('privacy'));
  });
});
