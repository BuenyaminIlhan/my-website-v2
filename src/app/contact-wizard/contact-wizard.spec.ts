import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ContactWizard } from './contact-wizard';
import { LangService } from '../services/lang.service';
import { InquiryService } from '../services/inquiry.service';
import { SITE_CONFIG } from '../config/site.config';

const MAIL_ENDPOINT = 'https://ilhan-buenyamin.com/send_mail/send_mail.php';

describe('ContactWizard', () => {
  let fixture: ComponentFixture<ContactWizard>;
  let wizard: ContactWizard;
  let lang: LangService;
  let inquiry: InquiryService;
  let fetchMock: ReturnType<typeof vi.fn>;

  const create = () => {
    fixture = TestBed.createComponent(ContactWizard);
    wizard = fixture.componentInstance;
    fixture.detectChanges();
  };

  const sentBody = () => {
    // The component always posts a urlencoded string body.
    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    return new URLSearchParams(init.body);
  };

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    TestBed.configureTestingModule({});
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');
    inquiry = TestBed.inject(InquiryService);
    inquiry.projectType.set('');
  });

  afterEach(() => vi.unstubAllGlobals());

  it('starts on step 1 with nothing selected', () => {
    create();
    expect(wizard.step()).toBe(1);
    expect(wizard.projectType()).toBe('');
  });

  it('picking a project type advances to step 2', () => {
    create();
    wizard.selectType('webApp');

    expect(wizard.projectType()).toBe('webApp');
    expect(wizard.step()).toBe(2);
  });

  it('steps forward and back within bounds', () => {
    create();

    wizard.back();
    expect(wizard.step()).toBe(1);

    wizard.next();
    wizard.next();
    expect(wizard.step()).toBe(3);

    wizard.next();
    expect(wizard.step()).toBe(3);

    wizard.back();
    expect(wizard.step()).toBe(2);
  });

  it('takes over a project type preselected on an offer card', () => {
    inquiry.projectType.set('optimization');
    create();

    expect(wizard.projectType()).toBe('optimization');
  });

  it('posts the wizard content and clears the form on success', async () => {
    create();
    wizard.selectType('website');
    wizard.budget.set('5-10k');
    wizard.timeline.set('Q4');
    wizard.details.set('Shop mit 200 Artikeln');
    wizard.name.set('Test');
    wizard.email.set('test@example.com');
    wizard.message.set('Bitte melden');

    await wizard.send();

    expect(fetchMock).toHaveBeenCalledWith(MAIL_ENDPOINT, expect.objectContaining({ method: 'POST' }));
    const body = sentBody();
    expect(body.get('form')).toBe('wizard');
    expect(body.get('email')).toBe('test@example.com');
    expect(body.get('budget')).toBe('5-10k');
    expect(body.get('lang')).toBe('de');

    expect(wizard.sent()).toBe(true);
    expect(wizard.error()).toBe(false);
    expect(wizard.sending()).toBe(false);
    expect(wizard.name()).toBe('');
    expect(inquiry.projectType()).toBe('');
  });

  it('sends the localized label of the chosen type as the topic', async () => {
    create();
    const type = lang.t().wizard.types[0];
    wizard.selectType(type.key);

    await wizard.send();

    expect(sentBody().get('topic')).toBe(type.label);
  });

  it('falls back to the general topic when no type was picked', async () => {
    create();

    await wizard.send();

    expect(sentBody().get('topic')).toBe(lang.t().contact.topicGeneral);
  });

  it('flags an error when the mailer rejects the request', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    create();

    await wizard.send();

    expect(wizard.error()).toBe(true);
    expect(wizard.sent()).toBe(false);
    expect(wizard.sending()).toBe(false);
  });

  it('flags an error when the request never arrives', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    create();

    await wizard.send();

    expect(wizard.error()).toBe(true);
    expect(wizard.sending()).toBe(false);
  });

  it('ignores a second submit while one is in flight', async () => {
    create();
    wizard.sending.set(true);

    await wizard.send();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('offers a mailto fallback with the collected content', () => {
    create();
    wizard.budget.set('5-10k');
    wizard.timeline.set('Q4');
    wizard.details.set('Shop');

    const href = wizard.mailtoHref();

    expect(href.startsWith(`mailto:${SITE_CONFIG.email}?subject=`)).toBe(true);
    expect(decodeURIComponent(href)).toContain('5-10k');
    expect(decodeURIComponent(href)).toContain('Shop');
  });

  it('reset takes the wizard back to an empty step 1', () => {
    create();
    wizard.selectType('website');
    wizard.budget.set('5-10k');
    wizard.timeline.set('Q4');
    wizard.sent.set(true);

    wizard.reset();

    expect(wizard.step()).toBe(1);
    expect(wizard.sent()).toBe(false);
    expect(wizard.projectType()).toBe('');
    expect(wizard.budget()).toBe('');
    expect(wizard.timeline()).toBe('');
  });
});
