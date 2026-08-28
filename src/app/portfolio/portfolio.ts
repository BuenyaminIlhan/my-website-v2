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
        tr: 'Almanya’daki konut sahipleri birlikleri (WEG) için emlak yönetim yazılımı — tek tuşla yıllık hesap özeti, gelir-gider yönetimi, gider dağıtım anahtarları. Eksiksiz bir SaaS ürünü, aktif kullanımda: konsept ve tasarımdan geliştirme, hosting ve işletmeye kadar.',
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
        tr: 'Banyo tadilat firması için teklif uygulaması — teklifleri doğrudan müşterinin evinde oluşturun, fotoğraflarla belgeleyin ve anında dijital olarak imzalatın. Ölçümden imzaya tek randevuda. Müşteri projesi olarak geliştirildi, her gün aktif kullanımda.',
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
    {
      /* Copy derived from the product's own UI (address search, LoD2 mesh,
         computed roof geometry, drone-photogrammetry upload, material list
         with price estimate). No public URL yet — no demo link is rendered. */
      index: '03', title: 'Dachplaner',
      stack: ['Angular', 'Photogrammetrie', '3D', 'LoD2-Geodaten', 'DSGVO'],
      descriptions: {
        en: '3D roof configurator working with official LoD2 building data: enter an address, load the building from the state 3D mesh, and get roof area, pitch, ridge and eaves computed automatically. Drone photogrammetry models can be added for a photorealistic view — the result is a material list and a price estimate in minutes.',
        de: '3D-Dachkonfigurator auf Basis amtlicher LoD2-Gebäudedaten: Adresse eingeben, Gebäude aus dem amtlichen 3D-Mesh laden, und Dachfläche, Neigung, First und Traufe werden automatisch berechnet. Optional lassen sich Drohnen-Photogrammetrie-Modelle einbinden — heraus kommt in Minuten ein Materialauszug samt Richtpreis.',
        tr: 'Resmî LoD2 bina verileriyle çalışan 3D çatı konfigüratörü: adresi girin, binayı resmî 3D mesh’ten yükleyin; çatı alanı, eğim, mahya ve saçak otomatik hesaplansın. İsteğe bağlı drone fotogrametri modelleri eklenebilir — sonuç, dakikalar içinde malzeme listesi ve yaklaşık fiyat.',
      },
      image: 'assets/img/Dachplaner.webp', imageWidth: 1192, imageHeight: 670,
    },
  ];

  description(project: Project): string {
    return project.descriptions[this.lang.current()];
  }

}
