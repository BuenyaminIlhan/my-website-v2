import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

    TestBed.configureTestingModule({ providers: [provideRouter([])] });
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

  const cardEls = () => Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.type-card'),
  );
  const press = (index: number, key: string) => {
    cardEls()[index].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  };

  it('offers the project types as one radio group', () => {
    create();
    const group = (fixture.nativeElement as HTMLElement).querySelector('.type-grid');

    expect(group?.getAttribute('role')).toBe('radiogroup');
    const labelId = group?.getAttribute('aria-labelledby');
    expect((fixture.nativeElement as HTMLElement).querySelector('#' + labelId)?.textContent)
      .toBe(lang.t().wizard.typeTitle);
    expect(cardEls().every(c => c.getAttribute('role') === 'radio')).toBe(true);
    // One tab stop for the group, not one per card.
    expect(cardEls().map(c => c.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1', '-1', '-1']);
  });

  it('marks the chosen project type as checked, and only that one', () => {
    create();
    const checked = () => cardEls().map(c => c.getAttribute('aria-checked'));

    expect(checked().every(v => v === 'false')).toBe(true);

    wizard.selectType(lang.t().wizard.types[1].key);
    wizard.step.set(1);
    fixture.detectChanges();

    expect(checked().filter(v => v === 'true')).toHaveLength(1);
    expect(checked()[1]).toBe('true');
  });

  it('moves the focus with the arrow keys without selecting anything', () => {
    create();
    /* Selecting also advances the wizard, so an arrow key must not select:
       arrowing through the options would otherwise walk the visitor forward. */
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    cardEls()[0].dispatchEvent(event);
    fixture.detectChanges();

    // Without this the page scrolls out from under whoever is arrowing.
    expect(event.defaultPrevented).toBe(true);
    expect(wizard.focusedType()).toBe(1);
    expect(wizard.projectType()).toBe('');
    expect(wizard.step()).toBe(1);
    expect(cardEls().map(c => c.getAttribute('tabindex'))).toEqual(['-1', '0', '-1', '-1', '-1', '-1']);
  });

  it('wraps around at both ends and jumps with Home and End', () => {
    create();
    const last = lang.t().wizard.types.length - 1;

    press(0, 'ArrowLeft');
    expect(wizard.focusedType()).toBe(last);

    press(last, 'ArrowDown');
    expect(wizard.focusedType()).toBe(0);

    press(0, 'End');
    expect(wizard.focusedType()).toBe(last);

    press(last, 'Home');
    expect(wizard.focusedType()).toBe(0);
    expect(wizard.projectType()).toBe('');
  });

  it('selects with Space, exactly like a click does', () => {
    create();

    press(2, ' ');

    expect(wizard.projectType()).toBe(lang.t().wizard.types[2].key);
    expect(wizard.step()).toBe(2);
  });

  it('leaves keys it does not handle to the browser', () => {
    create();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });

    cardEls()[0].dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(wizard.focusedType()).toBe(0);
  });

  it('marks the chosen budget and timeline chips as pressed', () => {
    create();
    wizard.step.set(2);
    wizard.budget.set(lang.t().wizard.budgets[2]);
    wizard.timeline.set(lang.t().wizard.timelines[0]);
    fixture.detectChanges();

    const pressed = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.chip[aria-pressed="true"]'),
    ).map(c => c.textContent?.trim());

    expect(pressed).toEqual([lang.t().wizard.budgets[2], lang.t().wizard.timelines[0]]);
  });

  it('names the current step for assistive tech, and only the current one', () => {
    create();
    const current = () => Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.wizard-progress li'),
    ).map(li => li.getAttribute('aria-current'));

    expect(current()[0]).toBe('step');
    expect(current().filter(v => v === 'step')).toHaveLength(1);

    wizard.step.set(3);
    fixture.detectChanges();

    expect(current()[2]).toBe('step');
    expect(current().filter(v => v === 'step')).toHaveLength(1);
  });

  it('points at the privacy policy where the data is entered', () => {
    create();
    wizard.step.set(3);
    fixture.detectChanges();
    const note = (fixture.nativeElement as HTMLElement).querySelector('.privacy-note');

    expect(note?.textContent).toContain(lang.t().contact.privacyNote.text);
    const link = note?.querySelector('a');
    expect(link?.textContent?.trim()).toBe(lang.t().contact.privacyNote.linkLabel);
    // The localized route, not a hardcoded path.
    expect(link?.getAttribute('href')).toBe(lang.pagePath('privacy'));
  });

  it('selects on click, which is also the path Enter takes', () => {
    create();
    /* Enter activates a button natively, so it arrives here as a click. Space
       is the one the keydown handler has to serve itself. */
    cardEls()[2].click();
    fixture.detectChanges();

    expect(wizard.projectType()).toBe(lang.t().wizard.types[2].key);
    expect(wizard.step()).toBe(2);
  });

  it('leaves modified arrow keys to the browser', () => {
    create();
    /* Alt+Left is Back, Cmd+Up jumps to the top: not ours to take. */
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true, bubbles: true, cancelable: true });

    cardEls()[0].dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(false);
    expect(wizard.focusedType()).toBe(0);
  });

  it('puts the tab stop on the type an offer card preselected', () => {
    /* Someone arriving from a service page finds that type already chosen; the
       group must be entered there, not on the first card. */
    TestBed.inject(InquiryService).projectType.set(lang.t().wizard.types[3].key);
    create();

    expect(cardEls()[3].getAttribute('aria-checked')).toBe('true');
    expect(cardEls().map(c => c.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1', '0', '-1', '-1']);
  });

  it('moves the tab stop back to the first card after a reset', () => {
    create();
    wizard.selectType(lang.t().wizard.types[4].key);

    wizard.reset();
    fixture.detectChanges();

    expect(cardEls().every(c => c.getAttribute('aria-checked') === 'false')).toBe(true);
    expect(cardEls()[0].getAttribute('tabindex')).toBe('0');
  });
});
