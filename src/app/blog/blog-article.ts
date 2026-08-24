import { Component, inject, OnDestroy } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';
import { blogArticleUrlPaths, blogArticleUrlPath } from '../i18n/route-map';
import { blogArticles, BlogArticleContent } from './blog-data';
import { SITE_CONFIG } from '../config/site.config';

@Component({
  selector: 'app-blog-article',
  imports: [RouterLink],
  templateUrl: './blog-article.html',
  styleUrl: './blog.scss',
})
export class BlogArticlePage implements OnDestroy {
  lang = inject(LangService);
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);

  private articleId = this.route.snapshot.data['articleId'] as string;
  private meta = blogArticles.find(a => a.id === this.articleId)!;

  article: BlogArticleContent = this.meta.locales[this.lang.current()]!;
  dateIso = this.meta.dateIso;

  constructor() {
    const currentLang = this.lang.current();
    const url = SITE_CONFIG.baseUrl + '/' + blogArticleUrlPath(this.articleId, currentLang)!;
    this.seo.update({
      title: this.article.metaTitle,
      description: this.article.metaDescription,
      lang: currentLang,
      paths: blogArticleUrlPaths(this.articleId),
    });
    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: this.article.title,
      description: this.article.metaDescription,
      datePublished: this.dateIso,
      inLanguage: currentLang,
      url,
      author: { '@id': SITE_CONFIG.baseUrl + '/#person' },
      publisher: { '@id': SITE_CONFIG.baseUrl + '/#person' },
      mainEntityOfPage: url,
    });
  }

  ngOnDestroy() {
    this.seo.clearJsonLd();
  }
}
