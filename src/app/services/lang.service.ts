import { Injectable, signal, computed, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';

export type Lang = 'en' | 'de';

export interface OfferItem {
  title: string;
  desc: string;
  points: string[];
}

export interface LangTranslations {
  nav:       { offers: string; about: string; skills: string; portfolio: string; contact: string; legal: string; privacy: string };
  hero:      { label: string; title1: string; title2: string; sub: string; cta1: string; cta2: string; scroll: string; badges: string[] };
  offers:    { label: string; title: string; sub: string; items: OfferItem[]; why: string; priceNote: string; cta: string; mailHint: string };
  process:   { label: string; title: string; sub: string; steps: { title: string; desc: string }[] };
  faq:       { label: string; title: string; sub: string; items: { q: string; a: string }[] };
  about:     { label: string; title1: string; title2: string; p1: string; p2: string; p3: string; p4: string; cta: string };
  skills:    { label: string; title: string };
  portfolio: { label: string; title: string; sub: string; demo: string; pitch: string; github: string };
  contact:   { label: string; title: string; titleAccent: string; intro: string; name: string; email: string; message: string; namePh: string; emailPh: string; messagePh: string; send: string; sending: string; successTitle: string; successSub: string; sendAnother: string; error: string };
  footer:    { legal: string; privacy: string; back: string; sayHi: string; servicesTitle: string; contactTitle: string; location: string; noTracking: string };
}

const translations: Record<Lang, LangTranslations> = {
  en: {
    nav: {
      offers: 'Services', about: 'About me', skills: 'Skills', portfolio: 'Portfolio',
      contact: 'Contact', legal: 'Legal notice', privacy: 'Privacy policy',
    },
    hero: {
      label: 'Your partner for digital projects',
      title1: 'Digital solutions.', title2: 'Real results.',
      sub: 'I build websites and business web apps that move your company forward — personal, tailor-made, and with genuine attention to detail.',
      cta1: 'View services', cta2: 'Free consultation', scroll: 'Scroll down',
      badges: ['100% custom — no website builders', 'SEO & performance included', 'Reply within 24 hours'],
    },
    offers: {
      label: 'What I can do for you',
      title: 'My services',
      sub: 'No website builders, no off-the-shelf templates — every project is designed and developed individually for you.',
      items: [
        {
          title: 'Websites that sell',
          desc: 'Your website is your digital storefront. I create modern, fast, search-engine-optimised websites that turn visitors into customers — and present your brand unmistakably.',
          points: ['Individual design instead of templates', 'SEO & fast loading included', 'Flawless on every device'],
        },
        {
          title: 'Business web apps',
          desc: 'Digitise processes, save time, grow: I develop web applications tailored precisely to your workflows — from internal tools to full customer platforms.',
          points: ['Custom features for your workflows', 'Modern, future-proof technology', 'Scalable & maintainable'],
        },
        {
          title: 'Optimisation & modernisation',
          desc: 'Your current website feels dated or loads too slowly? I analyse, optimise and modernise — for better rankings, more inquiries and a fresh appearance.',
          points: ['Performance analysis', 'SEO optimisation', 'Redesign with substance'],
        },
        {
          title: 'All-in-one care-free package',
          desc: 'You focus on your business, I take care of your web presence: from the first idea through design and development to maintenance and updates — all from one hand.',
          points: ['Concept to launch', 'Ongoing support & updates', 'One personal contact'],
        },
      ],
      why: 'What sets me apart from run-of-the-mill agencies? I listen, I think along with you, and I stand behind my work — with a direct line to me instead of a ticket system.',
      priceNote: 'Every project is unique — that is why I only quote prices once I know what you really need. Write to me without obligation: you will receive a fair, transparent offer that fits your budget.',
      cta: 'Request a free quote',
      mailHint: 'Or reach me directly:',
    },
    process: {
      label: 'Simple & transparent',
      title: 'How your project unfolds',
      sub: 'No surprises, no jargon — you always know where your project stands.',
      steps: [
        {
          title: 'Free consultation',
          desc: 'You talk, I listen: describe your idea by email or contact form — no obligation, no tech jargon. I get back to you within 24 hours.',
        },
        {
          title: 'Concept & quote',
          desc: 'I work out a clear proposal that fits your goals and your budget — with a transparent offer. You know exactly where you stand from day one.',
        },
        {
          title: 'Design & development',
          desc: 'Now your project takes shape: modern, fast and search-engine optimised. You see regular progress and your feedback flows straight in.',
        },
        {
          title: 'Launch & support',
          desc: 'Your website goes live — tested, optimised and ready to perform. And if you wish, I stay at your side with maintenance, updates and quick answers.',
        },
      ],
    },
    faq: {
      label: 'Good to know',
      title: 'Frequently asked questions',
      sub: 'The most common questions before a project starts — answered honestly.',
      items: [
        {
          q: 'What does a website or web app cost?',
          a: 'That depends entirely on the scope — a compact business site costs less than a custom web app. That is why I only quote after the free consultation: you receive a fair, transparent offer with no hidden costs, tailored to your budget.',
        },
        {
          q: 'How long does it take?',
          a: 'A typical business website is often online within a few weeks; more complex web apps take correspondingly longer. Your quote includes a realistic timeline — and I keep you posted throughout.',
        },
        {
          q: 'What do I need to prepare?',
          a: 'Just your idea. Everything else — structure, copy, images, technology — we work out together. I guide you step by step, even if you have never commissioned a website before.',
        },
        {
          q: 'Who takes care of the website after launch?',
          a: 'Entirely up to you: either you maintain it yourself — I will gladly show you how — or you choose the all-in-one package and I keep your website up to date, secure and fast.',
        },
        {
          q: 'Do you also work with existing websites?',
          a: 'Yes! Slow loading times, dated design or poor Google rankings — I analyse your existing site and modernise it where it counts. Often a lot can be achieved with manageable effort.',
        },
      ],
    },
    about: {
      label: 'About me', title1: 'The person', title2: 'behind your project',
      p1: "Behind every good website is someone who listens. I'm Bünyamin — web and app developer from Siegburg near Cologne/Bonn, and I love turning ideas into digital experiences.",
      p2: 'My training at a professional software school in Germany and countless projects — from frontend to native apps — taught me one thing: technology is only a means to an end. What counts is that it works for you.',
      p3: "That's why you won't get off-the-shelf solutions from me, but a partner who thinks along: honest in consultation, precise in execution, and reachable when you need me.",
      p4: "Whether a new website, a business web app or a fresh look for your existing presence — let's create something together that you are proud of.",
      cta: 'Get in touch',
    },
    skills: { label: 'Tech stack', title: 'My skills' },
    portfolio: {
      label: 'Selected work', title: 'My portfolio',
      sub: 'A selection of my projects — see for yourself what your solution could look like.',
      demo: 'Live Demo', pitch: 'Pitch', github: 'GitHub',
    },
    contact: {
      label: 'Get in touch', title: "Let's talk about", titleAccent: 'your project',
      intro: "Tell me about your project — completely without obligation. I usually reply within 24 hours with an honest assessment and the next steps.",
      name: 'Your name', email: 'Your email', message: 'Your message',
      namePh: 'John Doe', emailPh: 'john@example.com', messagePh: 'Tell me about your project...',
      send: 'Send message', sending: 'Sending…',
      successTitle: 'Message received!', successSub: 'Thank you for your trust — I will get back to you as soon as possible.',
      sendAnother: 'Send another', error: 'Something went wrong. Please email me directly at mail@ilhan-buenyamin.com.',
    },
    footer: {
      legal: 'Legal notice', privacy: 'Privacy policy', back: '← Back', sayHi: 'Say Hi!',
      servicesTitle: 'Services', contactTitle: 'Contact', location: 'Siegburg near Cologne/Bonn',
      noTracking: 'This website respects your privacy — no cookies, no tracking.',
    },
  },
  de: {
    nav: {
      offers: 'Leistungen', about: 'Über mich', skills: 'Skills', portfolio: 'Portfolio',
      contact: 'Kontakt', legal: 'Impressum', privacy: 'Datenschutz',
    },
    hero: {
      label: 'Ihr Partner für digitale Projekte',
      title1: 'Digitale Lösungen.', title2: 'Echte Ergebnisse.',
      sub: 'Ich entwickle Websites und Business-Web-Apps, die Ihr Unternehmen voranbringen — persönlich, maßgeschneidert und mit echter Liebe zum Detail.',
      cta1: 'Leistungen ansehen', cta2: 'Kostenloses Erstgespräch', scroll: 'Nach unten',
      badges: ['100 % individuell — kein Baukasten', 'SEO & Performance inklusive', 'Antwort innerhalb von 24 Stunden'],
    },
    offers: {
      label: 'Was ich für Sie tun kann',
      title: 'Meine Leistungen',
      sub: 'Kein Baukasten, keine Massenware — jedes Projekt wird individuell für Sie konzipiert und entwickelt.',
      items: [
        {
          title: 'Websites, die verkaufen',
          desc: 'Ihre Website ist Ihr digitales Schaufenster. Ich gestalte moderne, schnelle und suchmaschinenoptimierte Websites, die aus Besuchern Kunden machen — und Ihre Marke unverwechselbar präsentieren.',
          points: ['Individuelles Design statt Vorlage', 'SEO & schnelle Ladezeiten inklusive', 'Perfekt auf jedem Gerät'],
        },
        {
          title: 'Business-Web-Apps',
          desc: 'Prozesse digitalisieren, Zeit sparen, wachsen: Ich entwickle Webanwendungen, die exakt auf Ihre Abläufe zugeschnitten sind — vom internen Tool bis zur Kundenplattform.',
          points: ['Maßgeschneiderte Funktionen', 'Moderne, zukunftssichere Technologie', 'Skalierbar & wartbar'],
        },
        {
          title: 'Optimierung & Modernisierung',
          desc: 'Ihre bestehende Website wirkt in die Jahre gekommen oder lädt zu langsam? Ich analysiere, optimiere und modernisiere — für bessere Rankings, mehr Anfragen und einen frischen Auftritt.',
          points: ['Performance-Analyse', 'SEO-Optimierung', 'Redesign mit Substanz'],
        },
        {
          title: 'All-in-One Sorglos-Paket',
          desc: 'Sie kümmern sich um Ihr Geschäft — ich mich um Ihren Webauftritt: von der ersten Idee über Design und Entwicklung bis zu Pflege und Updates. Alles aus einer Hand.',
          points: ['Vom Konzept bis zum Launch', 'Laufende Betreuung & Updates', 'Ein persönlicher Ansprechpartner'],
        },
      ],
      why: 'Was mich von 08/15-Anbietern unterscheidet? Ich höre zu, denke mit und stehe hinter meiner Arbeit — mit direktem Draht zu mir statt Ticketsystem.',
      priceNote: 'Jedes Projekt ist einzigartig — deshalb nenne ich Preise erst, wenn ich weiß, was Sie wirklich brauchen. Schreiben Sie mir unverbindlich: Sie erhalten ein faires, transparentes Angebot, das zu Ihrem Budget passt.',
      cta: 'Unverbindlich anfragen',
      mailHint: 'Oder direkt per E-Mail:',
    },
    process: {
      label: 'Einfach & transparent',
      title: 'So läuft Ihr Projekt ab',
      sub: 'Keine Überraschungen, kein Fachchinesisch — Sie wissen jederzeit, wo Ihr Projekt steht.',
      steps: [
        {
          title: 'Kostenloses Erstgespräch',
          desc: 'Sie erzählen, ich höre zu: Schildern Sie mir Ihr Vorhaben per E-Mail oder Kontaktformular — unverbindlich und ohne Fachchinesisch. Innerhalb von 24 Stunden melde ich mich bei Ihnen.',
        },
        {
          title: 'Konzept & Angebot',
          desc: 'Ich erarbeite einen klaren Vorschlag, der zu Ihren Zielen und Ihrem Budget passt — mit transparentem Angebot. Sie wissen von Anfang an, woran Sie sind.',
        },
        {
          title: 'Design & Umsetzung',
          desc: 'Jetzt nimmt Ihr Projekt Gestalt an: modern, schnell und suchmaschinenoptimiert. Sie sehen regelmäßig Zwischenstände — Ihr Feedback fließt direkt ein.',
        },
        {
          title: 'Launch & Betreuung',
          desc: 'Ihre Website geht online — getestet, optimiert und startklar. Und wenn Sie möchten, bleibe ich an Ihrer Seite: mit Pflege, Updates und schnellen Antworten.',
        },
      ],
    },
    faq: {
      label: 'Gut zu wissen',
      title: 'Häufige Fragen',
      sub: 'Die häufigsten Fragen vor dem Projektstart — ehrlich beantwortet.',
      items: [
        {
          q: 'Was kostet eine Website oder Web-App?',
          a: 'Das hängt ganz vom Umfang ab — eine kompakte Unternehmensseite kostet weniger als eine individuelle Web-App. Deshalb nenne ich Preise erst nach dem kostenlosen Erstgespräch: Sie erhalten ein faires, transparentes Angebot ohne versteckte Kosten, zugeschnitten auf Ihr Budget.',
        },
        {
          q: 'Wie lange dauert die Umsetzung?',
          a: 'Eine typische Unternehmens-Website ist oft innerhalb weniger Wochen online, komplexere Web-Apps brauchen entsprechend länger. Im Angebot erhalten Sie einen realistischen Zeitplan — und ich halte Sie während der Umsetzung immer auf dem Laufenden.',
        },
        {
          q: 'Was muss ich vorbereiten?',
          a: 'Nur Ihre Idee. Alles Weitere — Struktur, Texte, Bilder, Technik — erarbeiten wir gemeinsam. Ich führe Sie Schritt für Schritt durch den Prozess, auch wenn Sie noch nie eine Website beauftragt haben.',
        },
        {
          q: 'Wer kümmert sich nach dem Launch um die Website?',
          a: 'Ganz wie Sie möchten: Entweder übernehmen Sie die Pflege selbst — ich weise Sie gern ein — oder Sie wählen das All-in-One-Paket und ich halte Ihre Website aktuell, sicher und schnell.',
        },
        {
          q: 'Arbeiten Sie auch mit bestehenden Websites?',
          a: 'Ja! Ob langsame Ladezeiten, veraltetes Design oder schlechte Google-Platzierung — ich analysiere Ihre bestehende Seite und modernisiere sie gezielt. Oft lässt sich mit überschaubarem Aufwand viel erreichen.',
        },
      ],
    },
    about: {
      label: 'Über mich', title1: 'Der Mensch', title2: 'hinter Ihrem Projekt',
      p1: 'Hinter jeder guten Website steht jemand, der zuhört. Ich bin Bünyamin — Web- und App-Entwickler aus Siegburg bei Köln/Bonn, und ich liebe es, Ideen in digitale Erlebnisse zu verwandeln.',
      p2: 'Meine Ausbildung an einer professionellen Software-Schule in Deutschland und zahlreiche Projekte — vom Frontend bis zur nativen App — haben mich eines gelehrt: Technik ist nur Mittel zum Zweck. Was zählt, ist, dass sie für Sie arbeitet.',
      p3: 'Deshalb bekommen Sie bei mir keine Lösungen von der Stange, sondern einen Partner, der mitdenkt: ehrlich in der Beratung, präzise in der Umsetzung und erreichbar, wenn Sie mich brauchen.',
      p4: 'Ob neue Website, Business-Web-App oder frischer Wind für Ihren bestehenden Auftritt — lassen Sie uns gemeinsam etwas schaffen, worauf Sie stolz sind.',
      cta: 'Jetzt Kontakt aufnehmen',
    },
    skills: { label: 'Tech-Stack', title: 'Meine Skills' },
    portfolio: {
      label: 'Ausgewählte Projekte', title: 'Mein Portfolio',
      sub: 'Eine Auswahl meiner Projekte — sehen Sie selbst, wie Ihre Lösung aussehen könnte.',
      demo: 'Live-Demo', pitch: 'Pitch', github: 'GitHub',
    },
    contact: {
      label: 'Kontakt', title: 'Sprechen wir über', titleAccent: 'Ihr Projekt',
      intro: 'Erzählen Sie mir von Ihrem Vorhaben — ganz unverbindlich. Ich melde mich in der Regel innerhalb von 24 Stunden mit einer ehrlichen Einschätzung und den nächsten Schritten.',
      name: 'Ihr Name', email: 'Ihre E-Mail', message: 'Ihre Nachricht',
      namePh: 'Max Mustermann', emailPh: 'max@beispiel.de', messagePh: 'Erzählen Sie mir von Ihrem Projekt...',
      send: 'Nachricht senden', sending: 'Wird gesendet…',
      successTitle: 'Nachricht erhalten!', successSub: 'Vielen Dank für Ihr Vertrauen — ich melde mich schnellstmöglich bei Ihnen.',
      sendAnother: 'Weitere Nachricht', error: 'Etwas ist schiefgelaufen. Schreiben Sie mir gern direkt an mail@ilhan-buenyamin.com.',
    },
    footer: {
      legal: 'Impressum', privacy: 'Datenschutz', back: '← Zurück', sayHi: 'Schreiben Sie mir!',
      servicesTitle: 'Leistungen', contactTitle: 'Kontakt', location: 'Siegburg bei Köln/Bonn',
      noTracking: 'Diese Website respektiert Ihre Privatsphäre — keine Cookies, kein Tracking.',
    },
  },
};

@Injectable({ providedIn: 'root' })
export class LangService {
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  current = signal<Lang>('de');
  t = computed<LangTranslations>(() =>
    this.current() === 'de' ? translations.de : translations.en
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('lang') as Lang | null;
      if (saved === 'de' || saved === 'en') this.current.set(saved);
    }
    effect(() => {
      this.document.documentElement.setAttribute('lang', this.current());
    });
  }

  toggle() {
    const next: Lang = this.current() === 'en' ? 'de' : 'en';
    this.current.set(next);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lang', next);
    }
  }
}
