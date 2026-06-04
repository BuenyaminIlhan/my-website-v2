import { Directive, ElementRef, Input, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements OnInit, OnDestroy {
  @Input('appReveal') delay: number = 0;

  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this.el.nativeElement as HTMLElement;
    let initialized = false;

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (!initialized) {
          initialized = true;
          if (entry.isIntersecting) {
            // already visible on load — no animation
            this.observer?.disconnect();
            return;
          }
          el.style.opacity = '0';
          el.style.transform = 'translateY(28px)';
          el.style.transition = `opacity 650ms ease ${this.delay}ms, transform 650ms ease ${this.delay}ms`;
          return;
        }
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          this.observer?.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    this.observer.observe(el);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
