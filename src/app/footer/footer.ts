import { Component, signal, computed, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';

const STORAGE_KEY_X = 'fab-x';
const STORAGE_KEY_Y = 'fab-y';
const FAB_SIZE = 48;
const MARGIN = 16;
const DRAG_THRESHOLD = 5;

@Component({
  selector: 'app-footer',
  imports: [RouterLink, NgStyle],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  lang = inject(LangService);
  private platformId = inject(PLATFORM_ID);
  readonly year = new Date().getFullYear();

  scrolled = signal(false);
  dragging = signal(false);

  // null = default CSS position (bottom-right via stylesheet)
  private fabLeft = signal<number | null>(null);
  private fabTop  = signal<number | null>(null);

  fabStyle = computed(() => {
    const x = this.fabLeft();
    const y = this.fabTop();
    if (x === null || y === null) return {};
    return { left: `${x}px`, top: `${y}px`, right: 'auto', bottom: 'auto' };
  });

  private dragStart = { mouseX: 0, mouseY: 0, fabX: 0, fabY: 0 };
  private moved = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.restorePosition();
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 200);
  }

  onFabPointerDown(e: PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this.moved = false;
    this.dragging.set(true);

    const currentX = this.fabLeft() ?? (window.innerWidth  - FAB_SIZE - MARGIN);
    const currentY = this.fabTop()  ?? (window.innerHeight - FAB_SIZE - MARGIN);

    this.dragStart = { mouseX: e.clientX, mouseY: e.clientY, fabX: currentX, fabY: currentY };
  }

  onFabPointerMove(e: PointerEvent) {
    if (!this.dragging()) return;
    const dx = e.clientX - this.dragStart.mouseX;
    const dy = e.clientY - this.dragStart.mouseY;

    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      this.moved = true;
    }

    this.fabLeft.set(this.clamp(this.dragStart.fabX + dx, MARGIN, window.innerWidth  - FAB_SIZE - MARGIN));
    this.fabTop .set(this.clamp(this.dragStart.fabY + dy, MARGIN, window.innerHeight - FAB_SIZE - MARGIN));
  }

  onFabPointerUp() {
    if (!this.dragging()) return;
    this.dragging.set(false);
    if (this.moved) this.savePosition();
  }

  onFabClick() {
    if (this.moved) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  private savePosition() {
    localStorage.setItem(STORAGE_KEY_X, String(this.fabLeft()));
    localStorage.setItem(STORAGE_KEY_Y, String(this.fabTop()));
  }

  private restorePosition() {
    const x = localStorage.getItem(STORAGE_KEY_X);
    const y = localStorage.getItem(STORAGE_KEY_Y);
    if (x === null || y === null) return;

    const nx = this.clamp(Number(x), MARGIN, window.innerWidth  - FAB_SIZE - MARGIN);
    const ny = this.clamp(Number(y), MARGIN, window.innerHeight - FAB_SIZE - MARGIN);
    this.fabLeft.set(nx);
    this.fabTop .set(ny);
  }
}
