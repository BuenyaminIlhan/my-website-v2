import { ChangeDetectionStrategy, Component, inject, effect, signal, OnDestroy } from '@angular/core';
import { Hero } from '../hero/hero';
import { Offerings } from '../offerings/offerings';
import { Process } from '../process/process';
import { Faq } from '../faq/faq';
import { AboutMe } from '../about-me/about-me';
import { Stats } from '../stats/stats';
import { Skills } from '../skills/skills';
import { Portfolio } from '../portfolio/portfolio';
import { Reviews } from '../reviews/reviews';
import { Testimonials } from '../testimonials/testimonials';
import { Contact } from '../contact/contact';
import { WebsiteCheck } from '../website-check/website-check';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';
import { urlPathsFor } from '../i18n/route-map';
import { buildSiteGraph } from '../i18n/jsonld';
import { SITE_CONFIG } from '../config/site.config';

@Component({
  selector: 'app-home',
  imports: [Hero, Offerings, Process, AboutMe, Stats, Skills, Portfolio, Reviews, Testimonials, Faq, WebsiteCheck, Contact],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnDestroy {
  private lang = inject(LangService);
  private seo = inject(SeoService);

  /** Only the home page has a Turkish counterpart we know the URL of; a signal so specs can set it. */
  readonly turkishSiteUrl = signal<string>(SITE_CONFIG.turkishSiteUrl);

  constructor() {
    effect(() => {
      const t = this.lang.t();
      const lang = this.lang.current();
      const trUrl = this.turkishSiteUrl();
      this.seo.update({
        title: t.meta.homeTitle,
        description: t.meta.homeDesc,
        lang,
        paths: urlPathsFor('home'),
        externalAlternates: trUrl ? [{ hreflang: 'tr', href: trUrl }] : [],
      });
      this.seo.setJsonLd(buildSiteGraph(lang, t));
    });
  }

  ngOnDestroy() {
    this.seo.clearJsonLd();
  }
}
