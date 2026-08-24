import { Component, inject, effect, computed } from '@angular/core';
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
})
export class BlogIndex {
  lang = inject(LangService);
  private seo = inject(SeoService);

  articles = computed(() =>
    articlesFor(this.lang.current()).map(article => ({
      slug: article.slugs[this.lang.current()]!,
      content: article.locales[this.lang.current()]!,
    })),
  );

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
