import { Component, inject, OnDestroy } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SeoService } from '../services/seo.service';
import { blogArticles, BlogArticle } from './blog-data';

@Component({
  selector: 'app-blog-article',
  imports: [RouterLink],
  templateUrl: './blog-article.html',
  styleUrl: './blog.scss',
})
export class BlogArticlePage implements OnDestroy {
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);

  article: BlogArticle = blogArticles.find(a => a.slug === this.route.snapshot.data['slug'])!;

  constructor() {
    const a = this.article;
    this.seo.update(a.metaTitle, a.metaDescription, 'blog/' + a.slug);
    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: a.title,
      description: a.metaDescription,
      datePublished: a.dateIso,
      inLanguage: 'de',
      url: 'https://ilhan-buenyamin.com/blog/' + a.slug,
      author: { '@id': 'https://ilhan-buenyamin.com/#person' },
      publisher: { '@id': 'https://ilhan-buenyamin.com/#person' },
      mainEntityOfPage: 'https://ilhan-buenyamin.com/blog/' + a.slug,
    });
  }

  ngOnDestroy() {
    this.seo.clearJsonLd();
  }
}
