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
  githubUrl: string;
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
      index: '01', title: 'Zephir',
      stack: ['Swift', 'SwiftUI', 'Firebase', 'Google API'],
      description: 'Your Quotation App – Everything at a Glance. Helps small businesses create professional quotes instantly, saving time and boosting productivity on any device.',
      descriptionDe: 'Deine Angebots-App – alles auf einen Blick. Hilft kleinen Unternehmen, professionelle Angebote sofort zu erstellen und spart Zeit auf jedem Gerät.',
      image: 'assets/img/Zephir.webp',
      pitchUrl: 'https://www.figma.com/proto/yM5J0JLIIQroRnEABYY301/Zephir_IOS?page-id=99%3A59&node-id=99-63&viewport=710%2C-2011%2C0.41&t=o081hi0UvT5Mt22r-1&scaling=contain&content-scaling=fixed',
      githubUrl: 'https://github.com/SI-Classroom-Batch-019/abschlussprojekt-BuenyaminIlhan',
    },
    {
      index: '02', title: 'Labbayk',
      stack: ['Kotlin', 'Jetpack Compose', 'Room DB'],
      description: 'The Quran in Different Languages. Always free and available offline in 90 languages for recitation and reference.',
      descriptionDe: 'Der Quran in verschiedenen Sprachen. Immer kostenlos und offline in 90 Sprachen verfügbar.',
      image: 'assets/img/Labbayk.webp',
      pitchUrl: 'https://www.figma.com/proto/C6KuxVx0iJFaaBsa6aapvH/Labbayk?page-id=31%3A50&node-id=31-74&p=f&viewport=696%2C-2210%2C0.54&t=wEXwGIiS4lfyWauH-1&scaling=contain&content-scaling=fixed',
      githubUrl: 'https://github.com/BuenyaminIlhan/Labbayk/tree/master',
    },
    {
      index: '03', title: 'Join',
      stack: ['JavaScript', 'HTML', 'CSS'],
      description: 'Task manager inspired by the Kanban System. Create and organise tasks using drag and drop, assign users and categories.',
      descriptionDe: 'Aufgaben-Manager nach dem Kanban-Prinzip. Aufgaben per Drag & Drop erstellen, Nutzer und Kategorien zuweisen.',
      image: 'assets/img/Join-Kanban.webp',
      demoUrl: 'https://ilhan-buenyamin.com/Join-Kanban/',
      githubUrl: 'https://github.com/BuenyaminIlhan/Join-Kanban',
    },
    {
      index: '04', title: 'Sharkie',
      stack: ['JavaScript', 'HTML', 'CSS'],
      description: "Embark on a simple game driven by an object-oriented approach. Join Sharkie's adventure to uncover poisons and take on the enraged Shark End Boss.",
      descriptionDe: 'Ein einfaches Spiel mit objektorientiertem Ansatz. Begleite Sharkie auf seinem Abenteuer gegen den wütenden Hai-Endboss.',
      image: 'assets/img/Sharkie.webp',
      demoUrl: 'https://ilhan-buenyamin.com/Sharkie/',
      githubUrl: 'https://github.com/BuenyaminIlhan/Sharkie',
    },
    {
      index: '05', title: 'DA-Bubble',
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
