import { ServicePageContent } from './translations';
import { articleById, articleContent } from '../blog/blog-data';

/** The price table of the cost article — taken, not copied, so the two cannot drift. */
function costTable(): { head: string[]; rows: string[][] } {
  const article = articleContent(articleById('website-kosten-handwerker'), 'de');
  const table = article.sections.find(section => section.table)?.table;
  if (!table) throw new Error('The cost article "website-kosten-handwerker" has no price table any more.');
  return table;
}

/**
 * "Website für Handwerker" — German only (routes.json has no English slug): a landing
 * page for local German searches. Kept out of de.ts, which would otherwise outgrow the
 * 400-line limit.
 *
 * Nothing here is new to the site. Every number is a number of the cost article (or the
 * "24 Stunden" reply time and the "3D" of the Dachplaner) — service-page.spec checks every
 * number on the page. Every other statement repeats one the site already makes; the source
 * is noted above each block ("FAQ" = de.ts faq.items, "Prozess" = de.ts process.steps,
 * "Artikel" = the cost article in blog-data.ts). FAQ 3 and "Telefon" in step 1 were
 * confirmed by the owner on 2026-10-14.
 */
export const handwerkerPage: ServicePageContent = {
  metaTitle: 'Website für Handwerker — Kosten, Ablauf & Beispiele | Softlyx',
  metaDescription: 'Website für Handwerksbetriebe in Siegburg, Köln & Bonn: bei Google gefunden werden und Anfragen bekommen — ehrliche Einschätzung, ein fester Ansprechpartner.',
  eyebrow: 'Für Handwerksbetriebe',
  h1: 'Website für Handwerker',
  lead: 'Wer einen Dachdecker in Siegburg oder eine Badsanierung in Bonn sucht, fragt zuerst Google — und ruft den Betrieb an, den er dort findet.',
  // Region, "schnell", "suchmaschinenoptimiert": servicePages['website-erstellen-lassen'];
  // Struktur und Texte gemeinsam: FAQ "Was muss ich vorbereiten?"; Ansprechpartner statt
  // Ticketsystem: servicePages['sorglos-paket'].
  intro: [
    'Ich entwickle Websites für Handwerksbetriebe aus Siegburg, Köln, Bonn und ganz Nordrhein-Westfalen: schnell, auf dem Handy einfach zu bedienen und so aufgebaut, dass Google Ihren Betrieb in Ihrer Region findet.',
    'Sie stehen auf der Baustelle, nicht am Schreibtisch. Deshalb erarbeiten wir Struktur und Texte gemeinsam, ich übernehme die Technik — und auf Wunsch auch die laufende Pflege. Sie haben einen festen Ansprechpartner statt Ticketsystem.',
  ],
  sections: [
    // included-Listen der Leistungsseiten (SEO von Anfang an, jedes Gerät, individuelles
    // Design), Optimierungsseite (langsame Ladezeiten), Artikel (Pflichtseiten) und die
    // Hero-Zeile "DSGVO-konform — Hosting in Deutschland".
    {
      h2: 'Was Ihre Website leisten muss',
      list: [
        'In Ihrer Region gefunden werden: saubere Technik, passende Texte und Suchmaschinenoptimierung von Anfang an.',
        'Auf dem Handy funktionieren: Viele Kunden suchen unterwegs — Ihre Website ist auf jedem Gerät einfach zu bedienen.',
        'Vertrauen schaffen: Ihre Leistungen, Ihr Einzugsgebiet und Fotos Ihrer echten Arbeiten statt austauschbarer Vorlagen.',
        'Schnell laden: Eine langsame Seite verliert Besucher, bevor sie Ihr Angebot sehen.',
        'Rechtlich sauber: Impressum und Datenschutzerklärung gehören dazu, gehostet in Deutschland.',
      ],
    },
    // Artikel: Teaser (0 bis 15.000 Euro) und die Tabelle selbst.
    {
      h2: 'Was kostet eine Website für Handwerker?',
      paragraphs: ['Am Markt ist zwischen 0 und 15.000 Euro alles zu haben. Zur Einordnung die drei üblichen Wege:'],
      table: costTable(),
      related: {
        text: 'Ausführlich erklärt:',
        linkLabel: 'Was kostet eine Website für Handwerker?',
        article: 'website-kosten-handwerker',
      },
    },
    // Artikel "Die laufenden Kosten …" und "Umfang"; Preis nach dem Gespräch: offers.priceNote,
    // FAQ "Was kostet eine Website oder Web-App?".
    {
      h2: 'Laufende Kosten und Ihr Preis',
      paragraphs: [
        'Dazu kommen laufende Kosten: Domain und Hosting etwa 5–20 € im Monat und, wenn Sie sich um nichts kümmern möchten, ein Pflegepaket — am Markt meist 30–100 € im Monat.',
        'Ihren genauen Preis nenne ich erst nach dem kostenlosen Erstgespräch — denn eine kompakte Betriebs-Website kostet weniger als zwölf Unterseiten mit Online-Terminbuchung. Sie erhalten ein faires, transparentes Angebot ohne versteckte Kosten.',
      ],
    },
    // servicePages['sorglos-paket']: zweiter intro-Satz und die included-Liste wörtlich.
    {
      h2: 'Das Sorglos-Paket: Sie arbeiten, ich kümmere mich',
      paragraphs: ['Nach dem Launch müssen Sie sich nicht selbst um Hosting, Sicherheitsupdates oder neue Fotos und Öffnungszeiten kümmern — das übernehme ich.'],
      list: [
        'Vom Konzept bis zum Launch aus einer Hand',
        'Laufende Pflege, Updates & Sicherheit',
        'Ein persönlicher Ansprechpartner statt Ticketsystem',
        'Schnelle Reaktionszeiten bei Änderungswünschen',
        'Planbare, transparente Kosten',
      ],
    },
    // Prozess, Schritte 1–4 gekürzt; "Telefon" vom Inhaber bestätigt.
    {
      h2: 'So läuft es ab',
      ordered: true,
      list: [
        'Kostenloses Erstgespräch — Sie schildern Ihr Vorhaben per Telefon, E-Mail oder Formular; innerhalb von 24 Stunden melde ich mich.',
        'Konzept & Angebot — ein klarer Vorschlag, der zu Ihren Zielen und Ihrem Budget passt, mit transparentem Angebot.',
        'Design & Umsetzung — modern, schnell und suchmaschinenoptimiert; Sie sehen regelmäßig Zwischenstände.',
        'Launch & Betreuung — getestet und startklar; auf Wunsch mit Pflege, Updates und schnellen Antworten.',
      ],
    },
    // portfolio.ts: Zephir ("täglich im Einsatz") und Dachplaner.
    {
      h2: 'Beispiele aus dem Handwerk',
      paragraphs: [
        'Für einen Badumbau-Betrieb habe ich eine Angebots-App entwickelt: Angebote direkt beim Kunden vor Ort erstellen, mit Fotos dokumentieren und sofort digital unterschreiben lassen — vom Aufmaß bis zur Unterschrift in einem Termin. Sie ist täglich im Einsatz.',
        'Der Dachplaner berechnet aus amtlichen 3D-Gebäudedaten Dachfläche, Neigung, First und Traufe — heraus kommt in Minuten ein Materialauszug samt Richtpreis.',
        'Beides zeigt: Ich baue nicht nur Websites, sondern auch Werkzeuge für den Handwerksalltag.',
      ],
    },
  ],
  // 1: FAQ "Was muss ich vorbereiten?" + Artikel "Texte und Fotos"; 2: FAQ "Wie lange …";
  // 3: vom Inhaber bestätigt; 4: FAQ "Wer kümmert sich nach dem Launch …".
  faq: {
    title: 'Häufige Fragen',
    items: [
      { q: 'Muss ich Texte und Fotos selbst liefern?', a: 'Nein. Struktur und Texte erarbeiten wir gemeinsam, ich führe Sie Schritt für Schritt durch — auch wenn Sie noch nie eine Website beauftragt haben. Gute Fotos Ihrer Arbeiten machen den Unterschied; was es dafür braucht, klären wir im Erstgespräch. Ob Texte und Fotos von Ihnen kommen oder erstellt werden, wirkt sich auf den Preis aus — das steht offen im Angebot.' },
      { q: 'Wie lange dauert es, bis die Website online ist?', a: 'Eine typische Betriebs-Website ist oft innerhalb weniger Wochen online. Im Angebot erhalten Sie einen realistischen Zeitplan.' },
      { q: 'Gehört mir die Website danach?', a: 'Ja. Domain und Website gehören Ihnen, nicht mir — ohne Mietmodell, aus dem Sie nicht wieder herauskommen.' },
      { q: 'Kann ich später selbst etwas ändern?', a: 'Ganz wie Sie möchten: Entweder übernehmen Sie die Pflege selbst — ich weise Sie gern ein — oder ich halte Ihre Website mit dem Sorglos-Paket aktuell, sicher und schnell.' },
    ],
  },
  forWhoTitle: 'Für wen geeignet',
  forWho: 'Für Handwerksbetriebe vom Ein-Mann-Betrieb bis zum Meisterbetrieb mit Team — ob Dach, Bad, Elektro, Maler oder Sanitär —, die online professionell auftreten und neue Aufträge über Google gewinnen möchten.',
  // Artikel-CTA.
  ctaTitle: 'Was würde Ihre Website kosten?',
  ctaText: 'Im kostenlosen Erstgespräch bekommen Sie eine ehrliche Einschätzung und danach ein transparentes Angebot, zugeschnitten auf Ihren Betrieb, ohne versteckte Kosten.',
  ctaButton: 'Kostenloses Erstgespräch anfragen',
  overviewLink: '← Alle Leistungen',
};
