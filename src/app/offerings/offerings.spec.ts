import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Offerings } from './offerings';
import { LangService } from '../services/lang.service';
import { InquiryService } from '../services/inquiry.service';
import { stubIntersectionObserver } from '../../testing/browser-stubs';

describe('Offerings', () => {
  let fixture: ComponentFixture<Offerings>;
  let offerings: Offerings;
  let lang: LangService;
  let io: ReturnType<typeof stubIntersectionObserver>;

  beforeEach(() => {
    io = stubIntersectionObserver();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');

    fixture = TestBed.createComponent(Offerings);
    offerings = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => io.restore());

  it('renders every offer the locale defines', () => {
    const el: HTMLElement = fixture.nativeElement;
    const cards = el.querySelectorAll('.offer-card');

    expect(cards).toHaveLength(lang.t().offers.items.length);
    expect(cards[0].querySelector('h3')?.textContent).toBe(lang.t().offers.items[0].title);
  });

  /* Pinned to the offer's own title, not to the component's constants —
     a mis-assigned core tile has to fail here. */
  it('gives the big tile to Business-Web-Apps and the band to the care package', () => {
    for (const locale of ['de', 'en', 'tr'] as const) {
      lang.applyRoute(locale, 'home');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const cards = Array.from(el.querySelectorAll('.offer-card'));
      const items = lang.t().offers.items;

      const core = cards.filter(c => c.classList.contains('is-core'));
      const band = cards.filter(c => c.classList.contains('is-band'));
      expect(core).toHaveLength(1);
      expect(band).toHaveLength(1);

      const coreTitle = items.find(i => i.slug === 'web-app-entwicklung')?.title;
      const bandTitle = items.find(i => i.slug === 'sorglos-paket')?.title;
      expect(core[0].querySelector('h3')?.textContent).toBe(coreTitle);
      expect(band[0].querySelector('h3')?.textContent).toBe(bandTitle);

      // The core tile names itself as such and carries the signature.
      expect(core[0].textContent).toContain(lang.t().offers.core);
      expect(core[0].querySelector('.signature')?.getAttribute('aria-hidden')).toBe('true');
      expect(core[0].querySelector('.sweep')?.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('keeps both conversion paths on every card', () => {
    const el: HTMLElement = fixture.nativeElement;

    for (const card of Array.from(el.querySelectorAll('.offer-card'))) {
      expect(card.querySelector('.card-more')).not.toBeNull();
      expect(card.querySelector('.card-cta')?.getAttribute('href')).toBe('#contact');
    }
  });

  it('prefills the inquiry wizard with the project type of the clicked offer', () => {
    const inquiry = TestBed.inject(InquiryService);
    const el: HTMLElement = fixture.nativeElement;
    const coreCard = el.querySelector('.offer-card.is-core');

    coreCard?.querySelector<HTMLAnchorElement>('.card-cta')?.click();

    expect(inquiry.projectType()).toBe('webApp');
    expect(offerings.isCore('web-app-entwicklung')).toBe(true);
    expect(offerings.isCore('website-erstellen-lassen')).toBe(false);
  });

  it('leaves the locale order untouched — the bento only changes positions', () => {
    const el: HTMLElement = fixture.nativeElement;
    const titles = Array.from(el.querySelectorAll('.offer-card h3')).map(h => h.textContent);

    expect(titles).toEqual(lang.t().offers.items.map(i => i.title));
  });
});
