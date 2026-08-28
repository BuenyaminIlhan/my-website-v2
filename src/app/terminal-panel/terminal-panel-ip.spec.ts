import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TerminalPanel } from './terminal-panel';
import { LangService } from '../services/lang.service';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

/* The two interactive lines of the terminal: the address lookup and the
   accessibility contract around it. Split from terminal-panel.spec.ts only
   because the suite outgrew the 400-line lint budget. */
describe('TerminalPanel — the IP line and its accessibility', () => {
  let fixture: ComponentFixture<TerminalPanel>;
  let lang: LangService;

  beforeEach(() => {
    localStorage.clear();
    // A stored theme and language keep the two optional lines out of the way.
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('lang', 'de');

    TestBed.configureTestingModule({});
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');

    fixture = TestBed.createComponent(TerminalPanel);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });


  /* The address is asked for on click and comes from this site's own server —
     a third-party lookup would contradict the no-tracking line right above it. */
  it('fetches the address from the site’s own endpoint and announces it', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ip: '203.0.113.7' }));

    const host: HTMLElement = fixture.nativeElement;
    await fixture.componentInstance.toggleIp();
    fixture.detectChanges();

    expect(fetchSpy).toHaveBeenCalledWith('/api/ip.php', expect.anything());
    const status = host.querySelector('.ip-status');
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.textContent).toContain('203.0.113.7');
    expect(status?.textContent).toContain(lang.t().hero.terminal.ipNote);
  });

  /* Removing or disabling the control that was just clicked drops focus back
     to the document body and leaves a keyboard user with no idea what happened. */
  it('keeps the same button, and the focus on it, once the address arrives', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ip: '203.0.113.7' }));

    const host: HTMLElement = fixture.nativeElement;
    const button = host.querySelector<HTMLButtonElement>('.ip-line .term-action');
    button?.focus();

    await fixture.componentInstance.toggleIp();
    fixture.detectChanges();

    expect(host.querySelector('.ip-line .term-action')).toBe(button);
    expect(button?.disabled).toBe(false);
    expect(document.activeElement).toBe(button);
    expect(button?.textContent?.trim()).toBe(lang.t().hero.terminal.ipHide);
  });

  it('takes the address off screen again on a second click', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ip: '203.0.113.7' }));

    await fixture.componentInstance.toggleIp();
    await fixture.componentInstance.toggleIp();
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(fixture.componentInstance.visitorIp()).toBeNull();
    expect(host.querySelector('.ip-status')?.textContent).toBe('');
    expect(host.querySelector('.ip-line .term-action')?.textContent?.trim())
      .toBe(lang.t().hero.terminal.ipShow);
  });

  /* One flaky request must not take the feature away for the rest of the visit. */
  it('says the server did not answer and stays retryable', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    await fixture.componentInstance.toggleIp();
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.ip-line')).not.toBeNull();
    expect(host.querySelector('.ip-status')?.textContent).toBe(lang.t().hero.terminal.ipFailed);
    expect(host.querySelector('.ip-line .term-action')?.textContent?.trim())
      .toBe(lang.t().hero.terminal.ipShow);

    fetchSpy.mockResolvedValue(jsonResponse({ ip: '203.0.113.7' }));
    await fixture.componentInstance.toggleIp();
    fixture.detectChanges();

    expect(host.querySelector('.ip-status')?.textContent).toContain('203.0.113.7');
  });

  it('gives up instead of leaving the visitor with a control that never answers', async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
      );

      const pending = fixture.componentInstance.toggleIp();
      await vi.advanceTimersByTimeAsync(7000);
      await pending;

      expect(fixture.componentInstance.ipState()).toBe('failed');
    } finally {
      vi.useRealTimers();
    }
  });

  /* The build log is an animation and stays hidden, but a button inside an
     aria-hidden subtree is a control nobody using assistive tech can reach —
     and the claims it makes have to be readable somewhere. */
  it('hides the animation, offers its content plainly, and keeps its controls reachable', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.terminal-bar')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.cursor')?.closest('[aria-hidden="true"]')).not.toBeNull();

    const spoken = Array.from(el.querySelectorAll('ul.sr-only li')).map(li => li.textContent ?? '');
    expect(spoken).toHaveLength(lang.t().hero.terminal.steps.length);
    for (const step of lang.t().hero.terminal.steps) {
      expect(spoken.some(text => text.includes(step.label) && text.includes(step.note))).toBe(true);
    }

    for (const control of el.querySelectorAll<HTMLElement>('.term-action')) {
      expect(control.closest('[aria-hidden="true"]')).toBeNull();
      expect(control.getAttribute('aria-label')).toBeTruthy();
    }
  });
});
