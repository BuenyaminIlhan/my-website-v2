import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Lang = 'en' | 'de';

export interface LangTranslations {
  nav:       { about: string; skills: string; portfolio: string; contact: string; legal: string; privacy: string };
  hero:      { label: string; title1: string; title2: string; sub: string; cta1: string; cta2: string; scroll: string };
  about:     { label: string; title1: string; title2: string; p1: string; p2: string; p3: string; p4: string; cta: string };
  skills:    { label: string; title: string };
  portfolio: { label: string; title: string; sub: string; demo: string; pitch: string; github: string };
  contact:   { label: string; title: string; titleAccent: string; intro: string; name: string; email: string; message: string; namePh: string; emailPh: string; messagePh: string; send: string; sending: string; successTitle: string; successSub: string; sendAnother: string; error: string };
  footer:    { legal: string; privacy: string; back: string; sayHi: string };
}

const translations: Record<Lang, LangTranslations> = {
  en: {
    nav: {
      about: 'About me', skills: 'Skills', portfolio: 'Portfolio',
      contact: 'Contact', legal: 'Legal notice', privacy: 'Privacy policy',
    },
    hero: {
      label: 'Available for new projects',
      title1: 'Web & Mobile', title2: 'Developer',
      sub: 'Crafting digital experiences with precision — from native iOS & Android apps to modern web applications.',
      cta1: 'View work', cta2: "Let's talk", scroll: 'Scroll down',
    },
    about: {
      label: 'About me', title1: 'Building ideas', title2: 'into reality',
      p1: "I'm a passionate web and app developer driven by creativity. My journey started with JavaScript books and YouTube tutorials, which sparked my love for building digital experiences.",
      p2: 'That passion led me to a professional software development school in Germany where I deepened both individual and team skills on numerous frontend projects.',
      p3: 'I then extended my skill set into native mobile development — iOS with Swift and Android with Kotlin — specialising in innovative, user-friendly apps.',
      p4: "Now I'm ready for the next challenge: joining a creative team, working on cutting-edge projects and creating real value through my craft.",
      cta: "Let's talk",
    },
    skills: { label: 'Tech stack', title: 'My skills' },
    portfolio: {
      label: 'Selected work', title: 'My portfolio',
      sub: 'A sample of my work — feel free to explore each project.',
      demo: 'Live Demo', pitch: 'Pitch', github: 'GitHub',
    },
    contact: {
      label: 'Get in touch', title: 'Say', titleAccent: 'Hi!',
      intro: "Want to discuss a new project? Let's talk — I'm always open to exciting opportunities and collaborations.",
      name: 'Your name', email: 'Your email', message: 'Your message',
      namePh: 'John Doe', emailPh: 'john@example.com', messagePh: 'Tell me about your project...',
      send: 'Send message', sending: 'Sending…',
      successTitle: 'Message received!', successSub: "Thanks for reaching out — I'll reply shortly.",
      sendAnother: 'Send another', error: 'Something went wrong. Please try emailing me directly.',
    },
    footer: { legal: 'Legal notice', privacy: 'Privacy policy', back: '← Back', sayHi: 'Say Hi!' },
  },
  de: {
    nav: {
      about: 'Über mich', skills: 'Skills', portfolio: 'Portfolio',
      contact: 'Kontakt', legal: 'Impressum', privacy: 'Datenschutz',
    },
    hero: {
      label: 'Offen für neue Projekte',
      title1: 'Web & Mobile', title2: 'Entwickler',
      sub: 'Digitale Erlebnisse mit Präzision gestalten — von nativen iOS- & Android-Apps bis zu modernen Webanwendungen.',
      cta1: 'Projekte ansehen', cta2: 'Kontakt aufnehmen', scroll: 'Nach unten',
    },
    about: {
      label: 'Über mich', title1: 'Ideen', title2: 'verwirklichen',
      p1: 'Ich bin ein leidenschaftlicher Web- und App-Entwickler, angetrieben von Kreativität. Meine Reise begann mit JavaScript-Büchern und YouTube-Tutorials, die meine Begeisterung für digitale Erlebnisse entfachten.',
      p2: 'Diese Leidenschaft führte mich zu einer professionellen Software-Entwicklungsschule in Deutschland, wo ich individuelle und Team-Skills in zahlreichen Frontend-Projekten vertiefte.',
      p3: 'Anschließend erweiterte ich mein Know-how in die native Mobile-Entwicklung — iOS mit Swift und Android mit Kotlin — mit Fokus auf innovative, nutzerfreundliche Apps.',
      p4: 'Jetzt bin ich bereit für die nächste Herausforderung: in einem kreativen Team zu arbeiten, an wegweisenden Projekten mitzuwirken und echten Mehrwert zu schaffen.',
      cta: 'Kontakt aufnehmen',
    },
    skills: { label: 'Tech-Stack', title: 'Meine Skills' },
    portfolio: {
      label: 'Ausgewählte Projekte', title: 'Mein Portfolio',
      sub: 'Eine Auswahl meiner Projekte — entdecke die Details.',
      demo: 'Live-Demo', pitch: 'Pitch', github: 'GitHub',
    },
    contact: {
      label: 'Kontakt', title: 'Sag', titleAccent: 'Hallo!',
      intro: 'Möchtest du ein neues Projekt besprechen? Schreib mir — ich bin immer offen für spannende Möglichkeiten und Kooperationen.',
      name: 'Dein Name', email: 'Deine E-Mail', message: 'Deine Nachricht',
      namePh: 'Max Mustermann', emailPh: 'max@beispiel.de', messagePh: 'Erzähl mir von deinem Projekt...',
      send: 'Nachricht senden', sending: 'Wird gesendet…',
      successTitle: 'Nachricht erhalten!', successSub: 'Danke für deine Nachricht — ich melde mich bald.',
      sendAnother: 'Weitere Nachricht', error: 'Etwas ist schiefgelaufen. Schreib mir direkt per E-Mail.',
    },
    footer: { legal: 'Impressum', privacy: 'Datenschutz', back: '← Zurück', sayHi: 'Schreib mir!' },
  },
};

@Injectable({ providedIn: 'root' })
export class LangService {
  private platformId = inject(PLATFORM_ID);
  current = signal<Lang>('en');
  t = computed<LangTranslations>(() =>
    this.current() === 'de' ? translations.de : translations.en
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('lang') as Lang | null;
      if (saved === 'de' || saved === 'en') this.current.set(saved);
    }
  }

  toggle() {
    const next: Lang = this.current() === 'en' ? 'de' : 'en';
    this.current.set(next);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lang', next);
    }
  }
}
