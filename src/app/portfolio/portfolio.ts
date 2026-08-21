import { Component, signal, computed, inject } from '@angular/core';
import { LangService } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';

interface Project {
  index: string;
  title: string;
  stack: string[];
  description: string;
  descriptionDe: string;
  image: string;
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
})
export class Portfolio {
  lang = inject(LangService);
  activeIndex = signal<number>(0);
  fading = signal<boolean>(false);

  readonly projects: Project[] = [
    {
      index: '01', title: 'HausVio',
      stack: ['Angular', 'TypeScript', 'SaaS', 'DSGVO'],
      description: 'Property management software for German homeowner associations (WEG) — annual statements at the push of a button, income and expense tracking, cost allocation keys. A complete SaaS product, live in production: from concept and design to development, hosting and operations.',
      descriptionDe: 'Hausverwaltungs-Software für Wohnungseigentümergemeinschaften — Jahresabrechnung auf Knopfdruck, Einnahmen- und Ausgabenverwaltung, Umlageschlüssel. Ein komplettes SaaS-Produkt, live im Einsatz: von Konzept und Design über Entwicklung bis zu Hosting und Betrieb.',
      image: 'assets/img/HausVio.webp',
      demoUrl: 'https://hausvio.de/',
      isLiveProduct: true,
    },
    {
      index: '02', title: 'Badeo',
      stack: ['Web-App', 'Digitale Unterschrift', 'Foto-Dokumentation'],
      description: 'Quotation app for a bathroom renovation company — create professional quotes on site at the customer\'s home, document with photos and have them signed digitally on the spot. From survey to signature in a single appointment. Built as a customer project, live in daily use.',
      descriptionDe: 'Angebots-App für einen Badumbau-Betrieb — Angebote direkt beim Kunden vor Ort erstellen, mit Fotos dokumentieren und sofort digital unterschreiben lassen. Vom Aufmaß bis zur Unterschrift in einem einzigen Termin. Als Kundenprojekt entwickelt, täglich im Einsatz.',
      image: 'assets/img/Badeo.webp',
      demoUrl: 'https://badeo.net/',
      isLiveProduct: true,
    },
    {
      index: '03', title: 'Labbayk',
      stack: ['Kotlin', 'Jetpack Compose', 'Room DB'],
      description: 'The Quran in Different Languages. Always free and available offline in 90 languages for recitation and reference.',
      descriptionDe: 'Der Quran in verschiedenen Sprachen. Immer kostenlos und offline in 90 Sprachen verfügbar.',
      image: 'assets/img/Labbayk.webp',
      pitchUrl: 'https://www.figma.com/proto/C6KuxVx0iJFaaBsa6aapvH/Labbayk?page-id=31%3A50&node-id=31-74&p=f&viewport=696%2C-2210%2C0.54&t=wEXwGIiS4lfyWauH-1&scaling=contain&content-scaling=fixed',
      githubUrl: 'https://github.com/BuenyaminIlhan/Labbayk/tree/master',
    },
    {
      index: '04', title: 'Join',
      stack: ['JavaScript', 'HTML', 'CSS'],
      description: 'Task manager inspired by the Kanban System. Create and organise tasks using drag and drop, assign users and categories.',
      descriptionDe: 'Aufgaben-Manager nach dem Kanban-Prinzip. Aufgaben per Drag & Drop erstellen, Nutzer und Kategorien zuweisen.',
      image: 'assets/img/Join-Kanban.webp',
      demoUrl: 'https://ilhan-buenyamin.com/Join-Kanban/',
      githubUrl: 'https://github.com/BuenyaminIlhan/Join-Kanban',
    },
    {
      index: '05', title: 'Sharkie',
      stack: ['JavaScript', 'HTML', 'CSS'],
      description: "Embark on a simple game driven by an object-oriented approach. Join Sharkie's adventure to uncover poisons and take on the enraged Shark End Boss.",
      descriptionDe: 'Ein einfaches Spiel mit objektorientiertem Ansatz. Begleite Sharkie auf seinem Abenteuer gegen den wütenden Hai-Endboss.',
      image: 'assets/img/Sharkie.webp',
      demoUrl: 'https://ilhan-buenyamin.com/Sharkie/',
      githubUrl: 'https://github.com/BuenyaminIlhan/Sharkie',
    },
    {
      index: '06', title: 'DA-Bubble',
      stack: ['Angular', 'TypeScript', 'Firebase', 'SCSS'],
      description: 'Slack Clone — authentication via Google, chatting in channels, replying in threads. Google Firebase as the backend.',
      descriptionDe: 'Slack-Klon — Google-Authentifizierung, Chatten in Channels, Antworten in Threads. Google Firebase als Backend.',
      image: 'assets/img/DA-Bubble.webp',
      demoUrl: 'https://da-bubble.ilhan-buenyamin.com/',
      githubUrl: 'https://github.com/BuenyaminIlhan/Da-Bubble',
    },
  ];

  activeProject = computed(() => this.projects[this.activeIndex()]);
  activeDescription = computed(() =>
    this.lang.current() === 'de'
      ? this.activeProject().descriptionDe
      : this.activeProject().description
  );

  setActive(index: number): void {
    if (index === this.activeIndex()) return;
    this.fading.set(true);
    setTimeout(() => {
      this.activeIndex.set(index);
      this.fading.set(false);
    }, 180);
  }
}
