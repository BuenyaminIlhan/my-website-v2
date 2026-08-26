import { ChangeDetectionStrategy, Component, inject, effect, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';
import { urlPathsFor } from '../i18n/route-map';
import { articlesFor } from './blog-data';

@Component({
  selector: 'app-blog-index',
  imports: [RouterLink],
  templateUrl: './blog-index.html',
  styleUrl: './blog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogIndex {
  lang = inject(LangService);
  private seo = inject(SeoService);

  readonly articles = computed(() => {
    const lang = this.lang.current();
    return articlesFor(lang).flatMap(article => {
      const slug = article.slugs[lang];
      const content = article.locales[lang];
      // articlesFor already filtered these out; the guard keeps the types honest.
      return slug !== undefined && content !== undefined ? [{ slug, content }] : [];
    });
  });

  constructor() {
    effect(() => {
      const t = this.lang.t();
      this.seo.update({
        title: t.meta.blogTitle,
        description: t.meta.blogDesc,
        lang: this.lang.current(),
        paths: urlPathsFor('blog'),
      });
    });
  }
}
