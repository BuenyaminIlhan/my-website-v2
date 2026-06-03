import { Component, inject, effect } from '@angular/core';
import { Hero } from '../hero/hero';
import { AboutMe } from '../about-me/about-me';
import { Skills } from '../skills/skills';
import { Portfolio } from '../portfolio/portfolio';
import { Contact } from '../contact/contact';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-home',
  imports: [Hero, AboutMe, Skills, Portfolio, Contact],
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
        isDE ? 'Bünyamin Ilhan — Web & Mobile Entwickler' : 'Bünyamin Ilhan — Web & Mobile Developer',
        this.lang.t().hero.sub,
      );
    });
  }
}
