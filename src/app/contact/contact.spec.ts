import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Contact } from './contact';
import { LangService } from '../services/lang.service';
import { SITE_CONFIG } from '../config/site.config';
import { stubIntersectionObserver } from '../../testing/browser-stubs';

describe('Contact', () => {
  let fixture: ComponentFixture<Contact>;
  let contact: Contact;
  let lang: LangService;
  let io: ReturnType<typeof stubIntersectionObserver>;

  beforeEach(() => {
    io = stubIntersectionObserver();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');

    fixture = TestBed.createComponent(Contact);
    contact = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => io.restore());

  it('offers the channels in order: WhatsApp, then mail, then the form', () => {
    const el: HTMLElement = fixture.nativeElement;
    const order = Array.from(el.querySelectorAll('.wa-card, .contact-link, app-contact-wizard'))
      .map(node => node.className || node.tagName.toLowerCase());

    expect(order[0]).toContain('wa-card');
    expect(order[1]).toContain('contact-link');
    expect(order[2]).toBe('app-contact-wizard');
  });

  it('builds a wa.me link with the configured number and an encoded prefilled message', () => {
    const href = contact.waHref();

    expect(href.startsWith(`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=`)).toBe(true);
    expect(href).toContain(encodeURIComponent(lang.t().whatsapp.prefill));
    expect(href).not.toContain(' ');
  });

  it('re-encodes the prefilled message when the language changes', () => {
    lang.applyRoute('tr', 'home');
    expect(contact.waHref()).toContain(encodeURIComponent(lang.t().whatsapp.prefill));
  });

  /* The placeholder colour was --border-2, a BORDER token: 1.35:1 against
     the field in dark mode, effectively invisible. Any token whose name says
     "border" is wrong here, so the rule is pinned to --muted by name — the
     computed value is a CSS variable the suite cannot resolve. */
  it('colours placeholders with a text token, never a border token', () => {
    const rules = Array.from(document.styleSheets)
      .flatMap(sheet => { try { return Array.from(sheet.cssRules); } catch { return []; } })
      .filter((r): r is CSSStyleRule => r instanceof CSSStyleRule)
      .filter(r => r.selectorText.includes('::placeholder'));

    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(rule.style.color).toBe('var(--muted)');
      expect(rule.style.color).not.toContain('border');
    }
  });

  it('shows the WhatsApp card because a number is configured', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(SITE_CONFIG.whatsappNumber).not.toBe('');
    expect(contact.hasWhatsapp).toBe(true);
    expect(el.querySelector('.wa-card')?.getAttribute('href')).toBe(contact.waHref());
    expect(el.querySelector('.wa-card')?.getAttribute('rel')).toContain('noopener');
  });
});
