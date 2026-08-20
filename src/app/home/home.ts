import { Component, inject, effect } from '@angular/core';
import { Hero } from '../hero/hero';
import { AboutMe } from '../about-me/about-me';
import { Stats } from '../stats/stats';
import { Skills } from '../skills/skills';
import { Portfolio } from '../portfolio/portfolio';
import { Contact } from '../contact/contact';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-home',
  imports: [Hero, AboutMe, Stats, Skills, Portfolio, Contact],
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
          ? 'Web- & App-Entwickler aus Siegburg bei Köln/Bonn. Ich entwickle moderne Websites, Web-Apps und native iOS- & Android-Apps mit Angular, Swift & Kotlin.'
          : 'Web & app developer from Siegburg near Cologne/Bonn. I build modern websites, web apps and native iOS & Android apps with Angular, Swift & Kotlin.',
      );
    });
  }
}
