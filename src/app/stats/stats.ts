import { Component, signal, computed, inject, PLATFORM_ID, ElementRef, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LangService } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';

@Component({
  selector: 'app-stats',
  imports: [RevealDirective],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class Stats implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private el = inject(ElementRef);
  lang = inject(LangService);

  counters = signal([0, 0, 0, 0]);
  private animated = false;

  readonly targets = [5, 3, 2, 100];
  readonly suffixes = ['+', '', '+', '%'];

  items = computed(() => {
    const isDE = this.lang.current() === 'de';
    const labels = isDE
      ? ['Projekte', 'Plattformen', 'Jahre Coding', 'Leidenschaft']
      : ['Projects', 'Platforms', 'Years Coding', 'Passion'];
    return this.targets.map((_, i) => ({
      value: this.counters()[i],
      suffix: this.suffixes[i],
      label: labels[i],
    }));
  });

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.runCounters();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(this.el.nativeElement);
  }

  private runCounters() {
    if (this.animated) return;
    this.animated = true;

    const duration = 1600;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      this.counters.set(this.targets.map(v => Math.round(v * ease)));
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }
}
