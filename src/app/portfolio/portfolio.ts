import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LangService, Lang } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';

interface Project {
  index: string;
  title: string;
  stack: string[];
  descriptions: Record<Lang, string>;
  /** Desktop capture — always present, drives the laptop frame. */
  image: string;
  /** Intrinsic size of `image`, so the browser reserves the right box. */
  imageWidth: number;
  imageHeight: number;
  /** Responsive captures. Absent where the app has no public URL to
      capture from; the frame is then simply not rendered. */
  tabletImage?: string;
  phoneImage?: string;
  /** Dark-mode captures of the very same screens, present only for apps
      that actually ship a dark mode. Same pixel size as their light
      counterparts so the swap does not resize the frame. Both are rendered
      and CSS picks one — see portfolio.scss. */
  imageDark?: string;
  tabletImageDark?: string;
  phoneImageDark?: string;
  demoUrl?: string;
  pitchUrl?: string;
  githubUrl?: string;
  isLiveProduct?: boolean;
}

@Component({
  selector: 'app-portfolio',
  imports: [RevealDirective],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Portfolio {
  lang = inject(LangService);

  readonly projects: Project[] = [
    {
      index: '01', title: 'HausVio',
      stack: ['Angular', 'TypeScript', 'SaaS', 'DSGVO'],
      descriptions: {
        en: 'Property management software for German homeowner associations (WEG) — annual statements at the push of a button, income and expense tracking, cost allocation keys. A complete SaaS product, live in production: from concept and design to development, hosting and operations.',
        de: 'Hausverwaltungs-Software für Wohnungseigentümergemeinschaften — Jahresabrechnung auf Knopfdruck, Einnahmen- und Ausgabenverwaltung, Umlageschlüssel. Ein komplettes SaaS-Produkt, live im Einsatz: von Konzept und Design über Entwicklung bis zu Hosting und Betrieb.',
      },
      image: 'assets/img/HausVio.webp', imageWidth: 1424, imageHeight: 801,
      tabletImage: 'assets/img/hausvio-tablet.webp',
      phoneImage: 'assets/img/hausvio-phone.webp',
      imageDark: 'assets/img/HausVio-dark.webp',
      tabletImageDark: 'assets/img/hausvio-tablet-dark.webp',
      phoneImageDark: 'assets/img/hausvio-phone-dark.webp',
      demoUrl: 'https://hausvio.de/',
      isLiveProduct: true,
    },
    {
      index: '02', title: 'Zephir',
      stack: ['Angular', 'Digitale Unterschrift', 'Foto-Dokumentation', 'DSGVO'],
      descriptions: {
        en: 'Quotation app for a bathroom renovation company — create professional quotes on site at the customer\'s home, document with photos and have them signed digitally on the spot. From survey to signature in a single appointment. Built as a customer project, live in daily use.',
        de: 'Angebots-App für einen Badumbau-Betrieb — Angebote direkt beim Kunden vor Ort erstellen, mit Fotos dokumentieren und sofort digital unterschreiben lassen. Vom Aufmaß bis zur Unterschrift in einem einzigen Termin. Als Kundenprojekt entwickelt, täglich im Einsatz.',
      },
      /* The app runs on live customer records and has no demo data set, so
         every name, customer number and amount visible in these captures
         was replaced with a fictional one before the shot was taken — the
         layout is real, the data is not. No dark variants: no dark mode. */
      image: 'assets/img/Zephir.webp', imageWidth: 1424, imageHeight: 801,
      tabletImage: 'assets/img/zephir-tablet.webp',
      phoneImage: 'assets/img/zephir-phone.webp',
      demoUrl: 'https://badeo.net/',
      isLiveProduct: true,
    },
  ];

  description(project: Project): string {
    return project.descriptions[this.lang.current()];
  }

}
