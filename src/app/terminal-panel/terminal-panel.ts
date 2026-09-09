import { ChangeDetectionStrategy, Component, computed, signal, inject, PLATFORM_ID, DestroyRef, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LangService } from '../services/lang.service';
import { ThemeService } from '../services/theme.service';
import { Lang, SUPPORTED_LOCALES } from '../i18n/translations';

/* navigator.connection is Chromium-only — Safari and Firefox ship neither the
   property nor a lib.dom typing for it, so the shape is declared here and read
   defensively. */
interface NetworkInformationLike {
  readonly effectiveType?: string;
}

type IpState = 'idle' | 'loading' | 'shown' | 'failed';

/** The address lookup must never leave the visitor with a spinner. */
const IP_TIMEOUT_MS = 6000;

@Component({
  selector: 'app-terminal-panel',
  templateUrl: './terminal-panel.html',
  styleUrl: './terminal-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalPanel {
  lang = inject(LangService);
  theme = inject(ThemeService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  /* Ticks so the clock beside the pulsing "live" dot is not frozen at the
     minute the page happened to render. */
  private readonly now = signal(new Date());

  private readonly requestStats = signal<{ total: number; foreign: number } | null>(null);

  readonly ipState = signal<IpState>('idle');
  readonly visitorIp = signal<string | null>(null);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    afterNextRender(() => {
      this.readLoadTime();
      this.watchRequests();
    });

    const tick = setInterval(() => this.now.set(new Date()), 30_000);
    this.destroyRef.onDestroy(() => clearInterval(tick));
  }

  /* Counts what this page loads, and from whom. The "0 third-party hosts"
     line is only worth showing because it is measured — so it observes for
     the page's whole life rather than reading once: a tracker that fires
     after the load event must raise the number, not hide behind it. */
  private watchRequests(): void {
    if (typeof PerformanceObserver !== 'function') return;

    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    let total = nav ? 1 : 0;
    let foreign = 0;
    let resources = 0;

    const count = (entries: PerformanceEntryList) => {
      for (const entry of entries) {
        resources++;
        total++;
        try {
          const url = new URL(entry.name, location.href);
          /* data:, blob: and filesystem: entries never leave the device, so
             only a real http(s) host counts against the no-tracking claim. */
          if (/^https?:$/.test(url.protocol) && url.host !== location.host) foreign++;
        } catch { /* an unparsable entry name is not evidence of a third party */ }
      }
      // A page that only reported its own navigation has not measured anything.
      if (resources) this.requestStats.set({ total, foreign });
    };

    const observer = new PerformanceObserver(list => count(list.getEntries()));
    // buffered:true replays what already loaded, so nothing is read twice.
    observer.observe({ type: 'resource', buffered: true });
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  /* Asks this site's own server for the caller's address. No third-party
     lookup service is involved — anything else would contradict the
     no-tracking promise on this very page. */
  async toggleIp(): Promise<void> {
    if (this.ipState() === 'loading') return;

    if (this.ipState() === 'shown') {
      this.visitorIp.set(null);
      this.ipState.set('idle');
      return;
    }

    this.ipState.set('loading');
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), IP_TIMEOUT_MS);

    try {
      const response = await fetch('/api/ip.php', {
        headers: { Accept: 'application/json' },
        signal: abort.signal,
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { ip?: string };
      if (!data.ip) throw new Error('no ip');
      this.visitorIp.set(data.ip);
      this.ipState.set('shown');
    } catch {
      // Static hosting, an offline visitor or a timeout: say so and stay retryable.
      this.ipState.set('failed');
    } finally {
      clearTimeout(timer);
    }
  }

  /** What the line's live region announces: the address, a failure, or nothing yet. */
  readonly ipStatus = computed(() => {
    const t = this.lang.t().hero.terminal;
    switch (this.ipState()) {
      case 'shown': return `${this.visitorIp()} — ${t.ipNote}`;
      case 'failed': return t.ipFailed;
      case 'idle':
      case 'loading': return '';
    }
  });

  readonly ipButtonLabel = computed(() => {
    const t = this.lang.t().hero.terminal;
    return this.ipState() === 'shown' ? t.ipHide : t.ipShow;
  });

  readonly ipButtonAria = computed(() => {
    const t = this.lang.t().hero.terminal;
    return this.ipState() === 'shown' ? t.ipAriaHide : t.ipAria;
  });

  /* Client-only, like every other visitor line: the prerendered HTML must not
     show a control that only works once Angular has hydrated. */
  readonly ipVisible = computed(() => isPlatformBrowser(this.platformId));

  /* Reads the navigation timing once the load event has delivered it. */
  private readLoadTime(): void {
    const publish = () => {
      const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const duration = entry?.duration;
      if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
        this.loadMs.set(duration);
      }
    };

    if (document.readyState === 'complete') {
      publish();
      return;
    }

    /* loadEventEnd — and with it `duration` — is still 0 while the load event
       is being dispatched, so reading it straight from the handler dropped
       the line on every cold load. One task later the value is there. */
    const onLoad = () => setTimeout(publish, 0);
    window.addEventListener('load', onLoad, { once: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('load', onLoad));
  }

  /* Greets the visitor with what their own browser reports — computed
     client-side only, nothing is sent or stored (the site promises
     "no tracking" and this must keep that promise). SSR renders no
     visitor line. */
  readonly visitorInfo = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return null;
    const t = this.lang.t().hero.terminal;
    /* Formatted with the visitor's own locale, not the page language: the
       line's whole claim is that these values come from their device. */
    const time = this.now().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    let line = `${t.visitorCmd} --${t.visitorDevice} ${this.detectDevice()} --${t.visitorTime} ${time}`;

    const region = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (region) line += ` --${t.visitorRegion} ${region}`;

    const net = this.detectConnection();
    if (net) line += ` --${t.visitorNet} ${net}`;

    return line;
  });

  /* Milliseconds this page took to load, filled once the browser knows.
     `PerformanceNavigationTiming.duration` is loadEventEnd − startTime and
     stays 0 until the load event has fired — which is after Angular's first
     render — so reading it during render would drop the line forever. */
  private readonly loadMs = signal<number | null>(null);

  /* The load time this very page needed on this very device — the strongest
     competence proof the site has, so it is always the real measurement and
     the line stays away until there is one. */
  readonly loadTimeInfo = computed(() => {
    const ms = this.loadMs();
    if (ms === null) return null;

    const seconds = Math.round(ms / 10) / 100;
    if (!seconds) return null;

    return `${this.lang.t().hero.terminal.loadTime} ${seconds.toFixed(2)}s`;
  });

  /* "19 requests · 0 third-party hosts" — the no-tracking claim two lines
     further down, turned into a number the visitor can check in their own
     network tab. */
  readonly requestInfo = computed(() => {
    const stats = this.requestStats();
    if (!stats) return null;

    const t = this.lang.t().hero.terminal;
    return `${t.requests} ${stats.total} · ${stats.foreign} ${t.requestsForeign}`;
  });

  /* Only shown when the theme really came from the system query — after a
     manual toggle the claim would be false. */
  readonly themeInfo = computed(() => {
    if (!this.theme.followedSystem()) return null;

    const t = this.lang.t().hero.terminal;
    return `${t.themeDetected} ${this.theme.isDark() ? t.themeDark : t.themeLight} — ${t.themeApplied}`;
  });

  /* The locale the browser asks for, when the visitor is not already on it.
     Someone who has switched languages once is never asked again. */
  readonly langOffer = computed<Lang | null>(() => {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (this.storedLang()) return null;

    const preferred = this.preferredLang();
    return preferred && preferred !== this.lang.current() ? preferred : null;
  });

  /* This runs while the hero renders, and storage access throws outright
     where site data is blocked. */
  private storedLang(): string | null {
    try {
      return localStorage.getItem('lang');
    } catch {
      return null;
    }
  }

  private preferredLang(): Lang | null {
    const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of tags) {
      const base = tag.split('-')[0].toLowerCase();
      // Only locales this site actually serves; a Turkish browser gets no offer here.
      const match = SUPPORTED_LOCALES.find(l => l === base);
      if (match) return match;
    }
    return null;
  }

  langName(lang: Lang): string {
    const names: Record<Lang, string> = { de: 'deutsch', en: 'english' };
    return names[lang];
  }

  /* Lines appear one after another, like a build log running through.
     Every delay is FIXED: the load-time and request lines arrive late (after
     the load event) and a delay that depended on them would restart the
     animation of lines already on screen. The info block runs at a tighter
     0.3s beat than the build log so the whole sequence still ends quickly. */
  visitorDelay(): string {
    return '0.3s';
  }

  loadTimeDelay(): string {
    return this.seconds(0.6);
  }

  requestDelay(): string {
    return this.seconds(0.9);
  }

  themeDelay(): string {
    return this.seconds(1.2);
  }

  langDelay(): string {
    return this.seconds(1.5);
  }

  ipDelay(): string {
    return this.seconds(1.8);
  }

  cmdDelay(): string {
    return this.seconds(this.visitorInfo() ? 2.1 : 0.3);
  }

  stepDelay(index: number): string {
    return this.seconds(parseFloat(this.cmdDelay()) + 0.6 + index * 0.6);
  }

  deployDelay(): string {
    return this.stepDelay(this.lang.t().hero.terminal.steps.length);
  }

  private seconds(value: number): string {
    return `${value.toFixed(1)}s`;
  }

  private detectConnection(): string | null {
    const nav = navigator as unknown as { connection?: NetworkInformationLike };
    return nav.connection?.effectiveType ?? null;
  }

  private detectDevice(): string {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) return 'Android';
    if (/Mac/.test(ua)) return 'macOS';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Browser';
  }
}
