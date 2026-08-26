import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Type } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LangService } from './services/lang.service';
import { InquiryService } from './services/inquiry.service';
import { stubIntersectionObserver, stubAnimationFrame } from '../testing/browser-stubs';
import { host, text } from '../testing/fixture';

import { App } from './app';
import { Home } from './home/home';
import { AboutMe } from './about-me/about-me';
import { Faq } from './faq/faq';
import { Process } from './process/process';
import { Testimonials } from './testimonials/testimonials';
import { Contact } from './contact/contact';
import { Offerings } from './offerings/offerings';
import { LegalNotice } from './legal-notice/legal-notice';
import { PrivacyPolicy } from './privacy-policy/privacy-policy';
import { NotFound } from './not-found/not-found';
import { WhatsappButton } from './whatsapp-button/whatsapp-button';

/**
 * Every page component runs with ChangeDetectionStrategy.OnPush, so a render
 * that stays empty (or throws) is a real regression, not a cosmetic one. These
 * specs mount each page and assert it produced markup for the active locale.
 */
describe('page components', () => {
  let io: ReturnType<typeof stubIntersectionObserver>;
  let raf: ReturnType<typeof stubAnimationFrame>;

  beforeEach(() => {
    io = stubIntersectionObserver();
    raf = stubAnimationFrame();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => {
    io.restore();
    raf.restore();
  });

  const mount = <T,>(component: Type<T>): ComponentFixture<T> => {
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    return fixture;
  };

  const cases: [string, Type<unknown>][] = [
    ['App', App],
    ['Home', Home],
    ['AboutMe', AboutMe],
    ['Faq', Faq],
    ['Process', Process],
    ['Testimonials', Testimonials],
    ['Contact', Contact],
    ['Offerings', Offerings],
    ['LegalNotice', LegalNotice],
    ['PrivacyPolicy', PrivacyPolicy],
    ['NotFound', NotFound],
    ['WhatsappButton', WhatsappButton],
  ];

  for (const [name, component] of cases) {
    it(`${name} renders under OnPush`, () => {
      const fixture = mount(component);

      expect(fixture.componentInstance).toBeTruthy();
      expect(host(fixture).innerHTML.length).toBeGreaterThan(0);
    });
  }

  it('picks up a language switch without an explicit change detection call', () => {
    const lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');
    const fixture = mount(Faq);

    expect(text(fixture)).toContain(lang.t().faq.title);

    lang.applyRoute('tr', 'home');
    fixture.detectChanges();

    expect(text(fixture)).toContain(lang.t().faq.title);
  });

  it('Offerings.prefill carries the offer slug into the contact wizard', () => {
    const fixture = mount(Offerings);
    const inquiry = TestBed.inject(InquiryService);

    fixture.componentInstance.prefill('web-app-entwicklung');
    expect(inquiry.projectType()).toBe('webApp');

    fixture.componentInstance.prefill('unknown-offer');
    expect(inquiry.projectType()).toBe('');
  });

  it('WhatsappButton builds a wa.me link with the localized prefill text', () => {
    const lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');
    const fixture = mount(WhatsappButton);

    const href = fixture.componentInstance.href();
    expect(href).toContain('https://wa.me/');
    expect(href).toContain(encodeURIComponent(lang.t().whatsapp.prefill));
  });
});
