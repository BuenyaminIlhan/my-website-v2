import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Reviews } from './reviews';
import { LangService } from '../services/lang.service';
import { SITE_CONFIG } from '../config/site.config';
import { stubIntersectionObserver } from '../../testing/browser-stubs';
import { host } from '../../testing/fixture';

const REVIEW_URL = 'https://g.page/r/example/review';

/* Text alone is not enough: a drawn star is still a star. The Google "G"
   is the one shape allowed here, so every path is measured against the
   star silhouette — ten or more line segments in one sub-path. */
function expectNoDrawnStar(el: Element | null): void {
  expect(el?.querySelectorAll('[class*="star"], [class*="rating"]')).toHaveLength(0);

  for (const path of Array.from(el?.querySelectorAll('svg path') ?? [])) {
    const segments = (path.getAttribute('d') ?? '').match(/[LlMm]/g)?.length ?? 0;
    expect(segments).toBeLessThan(10);
  }
}

describe('Reviews', () => {
  let fixture: ComponentFixture<Reviews>;
  let reviews: Reviews;
  let lang: LangService;
  let io: ReturnType<typeof stubIntersectionObserver>;

  const section = () => host(fixture).querySelector('section');

  beforeEach(() => {
    io = stubIntersectionObserver();
    TestBed.configureTestingModule({});
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');

    fixture = TestBed.createComponent(Reviews);
    reviews = fixture.componentInstance;
  });

  afterEach(() => io.restore());

  it('takes its link from the site config', () => {
    // Asserting the wiring, not the value — the config gains a real URL the
    // day the Google profile exists, and this spec must survive that.
    expect(reviews.url()).toBe(SITE_CONFIG.googleReviewUrl);
  });

  it('renders nothing while no review link is configured', () => {
    reviews.url.set('');

    fixture.detectChanges();

    expect(section()).toBeNull();
    expect(host(fixture).textContent?.trim()).toBe('');
  });

  it('states the empty case without a star, a rating or a count', () => {
    reviews.url.set(REVIEW_URL);

    for (const locale of ['de', 'en', 'tr'] as const) {
      lang.applyRoute(locale, 'home');
      fixture.detectChanges();

      const rendered = section()?.textContent ?? '';
      expect(rendered).not.toBe('');
      expect(rendered).not.toMatch(/[★☆⭐]/);
      // Any digit would read as a rating or a review count.
      expect(rendered).not.toMatch(/\d/);

      expectNoDrawnStar(section());
    }
  });

  it('invites the first review and links out to the configured profile', () => {
    reviews.url.set(REVIEW_URL);
    lang.applyRoute('en', 'home');
    fixture.detectChanges();

    const t = lang.t().reviews;
    expect(section()?.textContent).toContain(t.empty);

    const cta = host(fixture).querySelector<HTMLAnchorElement>('.review-cta');
    expect(cta?.textContent?.trim()).toBe(t.cta);
    expect(cta?.getAttribute('href')).toBe(REVIEW_URL);
    expect(cta?.getAttribute('rel')).toBe('noopener');
    expect(cta?.getAttribute('target')).toBe('_blank');
  });

  it('keeps the label, title and copy in the active locale', () => {
    reviews.url.set(REVIEW_URL);
    lang.applyRoute('tr', 'home');
    fixture.detectChanges();

    const t = lang.t().reviews;
    const rendered = section()?.textContent ?? '';
    expect(rendered).toContain(t.label);
    expect(rendered).toContain(t.title);
    expect(rendered).toContain(t.sub);
  });
});
