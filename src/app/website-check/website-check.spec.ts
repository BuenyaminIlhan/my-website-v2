import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { WebsiteCheck } from './website-check';
import { LangService } from '../services/lang.service';
import { stubIntersectionObserver } from '../../testing/browser-stubs';

const MAIL_ENDPOINT = 'https://ilhan-buenyamin.com/send_mail/send_mail.php';

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

    TestBed.configureTestingModule({});
    TestBed.inject(LangService).applyRoute('tr', 'home');

    fixture = TestBed.createComponent(WebsiteCheck);
    check = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    io.restore();
  });

  it('posts the check request with the active locale and clears the form', async () => {
    fill();

    await check.send();

    expect(fetchMock).toHaveBeenCalledWith(MAIL_ENDPOINT, expect.objectContaining({ method: 'POST' }));
    const body = sentBody();
    expect(body.get('form')).toBe('website-check');
    expect(body.get('url')).toBe('https://example.com');
    expect(body.get('lang')).toBe('tr');

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

    expect(sentBody().get('website')).toBe('spam');
  });

  it('flags an error when the mailer rejects the request', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    fill();

    await check.send();

    expect(check.error()).toBe(true);
    expect(check.sent()).toBe(false);
    expect(check.url()).toBe('https://example.com');
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
});
