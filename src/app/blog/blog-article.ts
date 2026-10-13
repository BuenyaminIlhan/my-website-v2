import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LangService } from '../services/lang.service';
import { DEFAULT_OG_IMAGE, SeoService } from '../services/seo.service';
import { absoluteUrl, blogArticleUrlPaths, blogArticleUrlPath, homePathFor } from '../i18n/route-map';
import { articleById, articleContent, BlogArticleContent } from './blog-data';
import { personRef } from '../i18n/jsonld';

@Component({
  selector: 'app-blog-article',
  imports: [RouterLink],
  templateUrl: './blog-article.html',
  styleUrl: './blog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogArticlePage implements OnDestroy {
  lang = inject(LangService);
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);

  private articleId = this.route.snapshot.data['articleId'] as string;
  private meta = articleById(this.articleId);

  article: BlogArticleContent = articleContent(this.meta, this.lang.current());
  dateIso = this.meta.dateIso;

  constructor() {
    const currentLang = this.lang.current();
    const path = blogArticleUrlPath(this.articleId, currentLang) ?? homePathFor(currentLang);
    // Same address the canonical link and the hreflang alternates of this page carry.
    const url = absoluteUrl(path);
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
      // No modification date is tracked per article, so it equals the publication
      // date. Replace it once blog-data carries one.
      dateModified: this.dateIso,
      image: DEFAULT_OG_IMAGE,
      author: personRef(),
      publisher: personRef(),
      mainEntityOfPage: url,
    });
  }

  ngOnDestroy() {
    this.seo.clearJsonLd();
  }
}
