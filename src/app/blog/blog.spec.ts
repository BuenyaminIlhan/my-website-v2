import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { articleById, articleContent, articlesFor, blogArticles } from './blog-data';
import { BlogIndex } from './blog-index';
import { BlogArticlePage } from './blog-article';
import { LangService } from '../services/lang.service';
import { text } from '../../testing/fixture';

describe('blog data', () => {
  it('lists only articles that exist in the locale, newest first', () => {
    const de = articlesFor('de');

    expect(de.length).toBeGreaterThan(0);
    expect(de.every(a => a.locales.de !== undefined && a.slugs.de !== undefined)).toBe(true);
    expect([...de].sort((a, b) => b.dateIso.localeCompare(a.dateIso))).toEqual(de);
  });

  it('has no articles in English', () => {
    expect(articlesFor('en')).toEqual([]);
  });

  it('looks an article up by id', () => {
    const first = blogArticles[0];
    expect(articleById(first.id)).toBe(first);
  });

  it('throws on an id the registry does not know', () => {
    expect(() => articleById('does-not-exist')).toThrowError(/does-not-exist/);
  });

  it('returns the localized content of an article', () => {
    const article = articlesFor('de')[0];
    expect(articleContent(article, 'de')).toBe(article.locales.de);
  });

  it('throws when an article has no content for the locale', () => {
    const article = articlesFor('de')[0];
    expect(() => articleContent(article, 'en')).toThrowError(/en/);
  });
});

describe('BlogIndex', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(LangService).applyRoute('de', 'blog');
  });

  it('renders one teaser per article of the active locale', () => {
    const fixture = TestBed.createComponent(BlogIndex);
    fixture.detectChanges();

    const articles = fixture.componentInstance.articles();
    expect(articles).toHaveLength(articlesFor('de').length);
    expect(text(fixture)).toContain(articles[0].content.title);
  });

  it('drops the list when the locale has no articles', () => {
    const fixture = TestBed.createComponent(BlogIndex);
    fixture.detectChanges();

    TestBed.inject(LangService).applyRoute('en', 'home');
    fixture.detectChanges();

    expect(fixture.componentInstance.articles()).toEqual([]);
  });
});

describe('BlogArticlePage', () => {
  const article = blogArticles[0];

  const mount = () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { articleId: article.id } } } },
      ],
    });
    TestBed.inject(LangService).applyRoute('de', 'blog', article.id);
    // The real index.html ships a canonical link; SeoService only updates an existing
    // one, and the JSON-LD test below compares the graph against it.
    const canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);

    const fixture = TestBed.createComponent(BlogArticlePage);
    fixture.detectChanges();
    return fixture;
  };

  afterEach(() => {
    document.getElementById('page-jsonld')?.remove();
    document.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]')
      .forEach(el => el.remove());
  });

  it('renders the article the route points at', () => {
    const fixture = mount();

    expect(fixture.componentInstance.article).toBe(article.locales.de);
    expect(text(fixture)).toContain(article.locales.de?.title);
  });

  it('publishes BlogPosting JSON-LD and removes it again on destroy', () => {
    const fixture = mount();

    const script = document.getElementById('page-jsonld');
    expect(script).not.toBeNull();
    const payload = JSON.parse(script?.textContent ?? '{}') as Record<string, unknown>;
    expect(payload['@type']).toBe('BlogPosting');
    expect(payload['datePublished']).toBe(article.dateIso);
    // The graph has to name the same address as the canonical link on the page —
    // it built its own URL once and stayed a slash behind (cold review 2026-09-10).
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
    expect(payload['url']).toBe(canonical);
    expect(payload['mainEntityOfPage']).toBe(canonical);

    fixture.destroy();
    expect(document.getElementById('page-jsonld')).toBeNull();
  });
});
