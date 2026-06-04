import { Component, signal, inject, PLATFORM_ID, ElementRef, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LangService } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';

interface Skill {
  name: string;
  icon: string;
  level: number; // 0–100
}

@Component({
  selector: 'app-skills',
  imports: [RevealDirective],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
})
export class Skills implements AfterViewInit {
  lang = inject(LangService);
  private platformId = inject(PLATFORM_ID);
  private el = inject(ElementRef);

  barWidths = signal<number[]>([]);
  private animated = false;

  readonly web: Skill[] = [
    { name: 'Angular',     icon: 'assets/img/Angular.svg',     level: 85 },
    { name: 'TypeScript',  icon: 'assets/img/TypeScript.svg',  level: 80 },
    { name: 'JavaScript',  icon: 'assets/img/JavaScript.svg',  level: 85 },
    { name: 'HTML',        icon: 'assets/img/HTML.svg',        level: 95 },
    { name: 'CSS',         icon: 'assets/img/CSS.svg',         level: 90 },
    { name: 'REST API',    icon: 'assets/img/API.svg',         level: 78 },
  ];

  readonly mobile: Skill[] = [
    { name: 'Swift',           icon: 'assets/img/swift.png',            level: 78 },
    { name: 'Kotlin',          icon: 'assets/img/Kotlin.png',           level: 74 },
    { name: 'Firebase',        icon: 'assets/img/Firebase.svg',         level: 72 },
    { name: 'Git',             icon: 'assets/img/Git.svg',              level: 82 },
    { name: 'Scrum',           icon: 'assets/img/Scrum.svg',            level: 75 },
    { name: 'Material Design', icon: 'assets/img/MaterialDesign.svg',   level: 68 },
  ];

  readonly allLevels = [...this.web, ...this.mobile].map(s => s.level);

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      this.barWidths.set(this.allLevels);
      return;
    }

    this.barWidths.set(this.allLevels.map(() => 0));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.animateBars();
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(this.el.nativeElement);
  }

  private animateBars() {
    if (this.animated) return;
    this.animated = true;

    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 2);
      this.barWidths.set(this.allLevels.map(l => Math.round(l * ease)));
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  webWidth(i: number)    { return this.barWidths()[i] ?? 0; }
  mobileWidth(i: number) { return this.barWidths()[this.web.length + i] ?? 0; }
}
