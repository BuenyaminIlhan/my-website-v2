import { Component, inject, effect } from '@angular/core';
import { Hero } from '../hero/hero';
import { Offerings } from '../offerings/offerings';
import { Process } from '../process/process';
import { Faq } from '../faq/faq';
import { AboutMe } from '../about-me/about-me';
import { Stats } from '../stats/stats';
import { Skills } from '../skills/skills';
import { Portfolio } from '../portfolio/portfolio';
import { Testimonials } from '../testimonials/testimonials';
import { Contact } from '../contact/contact';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-home',
  imports: [Hero, Offerings, Process, AboutMe, Stats, Skills, Portfolio, Testimonials, Faq, Contact],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private lang = inject(LangService);
  private seo = inject(SeoService);

  constructor() {
    effect(() => {
      const isDE = this.lang.current() === 'de';
      this.seo.update(
        isDE
          ? 'Bünyamin Ilhan — Websites, Web-Apps & Apps entwickeln lassen'
          : 'Bünyamin Ilhan — Web & App Developer | Websites, Web Apps & Mobile Apps',
        isDE
          ? 'Websites, Business-Web-Apps und Rundum-Betreuung aus einer Hand — individuell entwickelt statt 08/15. Persönlich, transparent, fair. Jetzt unverbindlich anfragen!'
          : 'Websites, business web apps and all-in-one care from a single source — individually built, not off the shelf. Personal, transparent, fair. Get in touch!',
      );
    });
  }
}
