import { ChangeDetectionStrategy, Component, signal, computed, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LangService, Lang } from '../services/lang.service';

interface SlideCopy {
  /** What kind of thing this is — read before the sentence. */
  role: string;
  /** Who uses it and what they get out of it. */
  note: string;
  tags: string[];
}

export interface ShowcaseSlide {
  index: string;
  title: string;
  image: string;
  /** Only set where the product is genuinely in daily use. */
  live: boolean;
  copy: Record<Lang, SlideCopy>;
}

/** How long one project stays on the stage before the next glides in. */
export const SLIDE_DWELL_MS = 6000;

/**
 * The live products, shown large behind the hero headline. The project that
 * is up next stays visible behind the active one, so a turn reads as two
 * objects trading places rather than a crossfade. Visitors can take over at
 * any point — once they do, the stage stops moving on its own.
 */
@Component({
  selector: 'app-project-stage',
  imports: [],
  templateUrl: './project-stage.html',
  styleUrl: './project-stage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectStage implements OnDestroy {
  lang = inject(LangService);
  private platformId = inject(PLATFORM_ID);

  readonly slides: ShowcaseSlide[] = [
    {
      index: '01',
      title: 'Dachplaner',
      image: 'assets/img/Dachplaner.webp',
      live: false,
      copy: {
        de: {
          role: 'Web-App · 3D-Konfigurator',
          note: 'Dachdecker und Solarbetriebe planen am echten Gebäude statt auf dem Blatt: Adresse eingeben, das Haus steht in 3D. Fläche, Neigung und Materialbedarf kommen aus amtlichen Gebäudedaten — der Richtpreis steht sofort daneben.',
          tags: ['Amtliche LoD2-Daten', 'Fotorealistisches 3D', 'Angebot in Minuten'],
        },
        en: {
          role: 'Web app · 3D configurator',
          note: 'Roofers and solar installers plan on the actual building instead of on paper: type an address and the house appears in 3D. Area, pitch and material demand come from official building data — with a price attached right away.',
          tags: ['Official LoD2 data', 'Photorealistic 3D', 'Quote in minutes'],
        },
        tr: {
          role: 'Web uygulaması · 3D yapılandırıcı',
          note: 'Çatı ustaları ve solar firmaları kağıt üzerinde değil, gerçek binada planlar: adresi girin, ev 3D olarak belirir. Alan, eğim ve malzeme ihtiyacı resmî bina verilerinden gelir — fiyat da hemen yanında.',
          tags: ['Resmî LoD2 verileri', 'Fotogerçekçi 3D', 'Dakikalar içinde teklif'],
        },
      },
    },
    {
      index: '02',
      title: 'HausVio',
      image: 'assets/img/HausVio.webp',
      live: true,
      copy: {
        de: {
          role: 'SaaS · Hausverwaltung',
          note: 'Wohnungseigentümergemeinschaften rechnen ihr Jahr auf Knopfdruck ab. Einnahmen, Ausgaben, Wasserzähler und Umlageschlüssel liegen an einem Ort — von Konzept und Design über Entwicklung bis zu Hosting und Betrieb.',
          tags: ['Angular', 'SaaS', 'DSGVO-konform'],
        },
        en: {
          role: 'SaaS · property management',
          note: 'German homeowner associations close their year at the push of a button. Income, expenses, water meters and cost allocation keys live in one place — from concept and design through development to hosting and operations.',
          tags: ['Angular', 'SaaS', 'GDPR compliant'],
        },
        tr: {
          role: 'SaaS · emlak yönetimi',
          note: 'Konut sahipleri birlikleri yıllık hesabını tek tuşla kapatır. Gelir, gider, su sayaçları ve dağıtım anahtarları tek yerde — konsept ve tasarımdan geliştirmeye, hosting ve işletmeye kadar.',
          tags: ['Angular', 'SaaS', 'KVKK/DSGVO uyumlu'],
        },
      },
    },
    {
      index: '03',
      title: 'Zephir',
      image: 'assets/img/Zephir.webp',
      live: true,
      copy: {
        de: {
          role: 'Web-App · Außendienst',
          note: 'Der Badumbauer schreibt sein Angebot im Wohnzimmer des Kunden: Aufmaß aufnehmen, mit Fotos dokumentieren, sofort digital unterschreiben lassen. Vom ersten Termin zum unterschriebenen Auftrag, ohne zweiten Besuch.',
          tags: ['Vor-Ort-Angebot', 'Foto-Dokumentation', 'Digitale Unterschrift'],
        },
        en: {
          role: 'Web app · field sales',
          note: 'The bathroom fitter writes the quote in the customer\'s living room: take the measurements, document with photos, have it signed digitally on the spot. From first appointment to signed order without a second visit.',
          tags: ['Quote on site', 'Photo documentation', 'Digital signature'],
        },
        tr: {
          role: 'Web uygulaması · saha satışı',
          note: 'Banyo ustası teklifini müşterinin oturma odasında yazar: ölçü alın, fotoğraflarla belgeleyin, anında dijital imzalatın. İlk randevudan imzalı siparişe, ikinci ziyaret olmadan.',
          tags: ['Yerinde teklif', 'Fotoğraf belgeleme', 'Dijital imza'],
        },
      },
    },
  ];

  readonly activeSlide = signal(0);

  /** False once a visitor has taken over — nothing is more annoying than a
      carousel that snatches the slide back while you are reading it. */
  readonly autoplay = signal(true);

  /** Only the one that is up next waits behind the active panel. Stacking
      every remaining slide there would pile identical cards on the same
      spot, where all but the topmost are invisible anyway. */
  readonly nextSlide = computed(() => (this.activeSlide() + 1) % this.slides.length);
  readonly prevSlide = computed(() => (this.activeSlide() - 1 + this.slides.length) % this.slides.length);

  private slideTimer?: ReturnType<typeof setInterval>;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    // A rotating stage is decoration, not information — someone who asked
    // for less motion keeps the first project and never sees it move.
    if (this.prefersReducedMotion()) {
      this.autoplay.set(false);
      return;
    }
    this.slideTimer = setInterval(() => this.advanceSlide(), SLIDE_DWELL_MS);
  }

  advanceSlide(): void {
    this.activeSlide.update(i => (i + 1) % this.slides.length);
  }

  /** Visitor picked a project: jump there and hand over control for good. */
  select(index: number): void {
    this.stopAutoplay();
    this.activeSlide.set(index);
  }

  goNext(): void {
    this.stopAutoplay();
    this.advanceSlide();
  }

  goPrev(): void {
    this.stopAutoplay();
    this.activeSlide.update(i => (i - 1 + this.slides.length) % this.slides.length);
  }

  copyFor(slide: ShowcaseSlide): SlideCopy {
    return slide.copy[this.lang.current()];
  }

  private stopAutoplay(): void {
    clearInterval(this.slideTimer);
    this.slideTimer = undefined;
    this.autoplay.set(false);
  }

  private prefersReducedMotion(): boolean {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  ngOnDestroy() {
    clearInterval(this.slideTimer);
  }
}
