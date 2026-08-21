import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../services/seo.service';
import { blogArticles } from './blog-data';

@Component({
  selector: 'app-blog-index',
  imports: [RouterLink],
  templateUrl: './blog-index.html',
  styleUrl: './blog.scss',
})
export class BlogIndex {
  private seo = inject(SeoService);

  articles = blogArticles;

  constructor() {
    this.seo.update(
      'Blog — Websites & digitale Tipps für Unternehmen | Bünyamin Ilhan',
      'Ehrliche Antworten auf die Fragen, die sich Unternehmen vor dem Website-Projekt stellen — von Kosten über Baukasten-Vergleiche bis SEO. Ohne Fachchinesisch.',
      'blog',
    );
  }
}
