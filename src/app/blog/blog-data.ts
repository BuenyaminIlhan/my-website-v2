// Blog content is intentionally German-only: articles target local German
// search queries, so translating them would double the effort for no reach.

export interface ArticleSection {
  h2: string;
  paragraphs: string[];
  list?: string[];
  table?: { head: string[]; rows: string[][] };
}

export interface BlogArticle {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  dateIso: string;
  dateDisplay: string;
  readingMinutes: number;
  teaser: string;
  intro: string[];
  sections: ArticleSection[];
  ctaTitle: string;
  ctaText: string;
}

export const blogArticles: BlogArticle[] = [
  {
    slug: 'was-kostet-eine-website-fuer-handwerker',
    title: 'Was kostet eine Website für Handwerker?',
    metaTitle: 'Was kostet eine Website für Handwerker? Ehrliche Preisübersicht 2026',
    metaDescription:
      'Baukasten, Freelancer oder Agentur? Was eine Handwerker-Website wirklich kostet, welche laufenden Kosten dazukommen und woran Sie ein faires Angebot erkennen.',
    dateIso: '2026-08-21',
    dateDisplay: '21. August 2026',
    readingMinutes: 6,
    teaser:
      'Zwischen 0 Euro und 15.000 Euro ist am Markt alles zu haben — dieser Artikel erklärt ehrlich, wo die Unterschiede liegen und was für einen Handwerksbetrieb wirklich sinnvoll ist.',
    intro: [
      'Wer als Handwerksbetrieb eine Website beauftragen will, bekommt auf die Preisfrage selten eine klare Antwort. Der Grund ist ehrlich: Eine Website ist kein Produkt von der Stange, sondern eine Dienstleistung — und der Preis hängt davon ab, was sie leisten soll. Trotzdem lässt sich der Markt gut einordnen, und genau das tut dieser Artikel.',
      'Vorweg zur Orientierung: Eine professionell entwickelte Website für einen Handwerksbetrieb — mit individuellem Design, Suchmaschinenoptimierung und allen Pflichtseiten — liegt bei Freelancern üblicherweise im niedrigen bis mittleren vierstelligen Bereich. Agenturen rufen für dieselbe Leistung oft das Doppelte bis Dreifache auf, Baukästen scheinen fast kostenlos. Warum die Spanne so groß ist, zeigen die drei Wege im Detail.',
    ],
    sections: [
      {
        h2: 'Die drei Wege im Vergleich',
        paragraphs: [
          'Für Handwerksbetriebe gibt es im Wesentlichen drei Wege zur Website — mit sehr unterschiedlichen Kosten und sehr unterschiedlichen Ergebnissen:',
        ],
        table: {
          head: ['Weg', 'Typische Kosten', 'Wofür geeignet'],
          rows: [
            [
              'Baukasten (Wix, Jimdo & Co.), selbst gebaut',
              'ca. 10–40 € / Monat + viele eigene Arbeitsstunden',
              'Übergangslösung, wenn das Budget wirklich fehlt. Sieht meist nach Vorlage aus, rankt bei Google selten gut — und die eigene Zeit ist als Meister teurer als jede Agenturstunde.',
            ],
            [
              'Freelancer / Einzelentwickler',
              'meist ca. 1.500–5.000 € einmalig',
              'Der Sweet Spot für die meisten Betriebe: individuelles Design, saubere Technik, SEO — mit direktem Ansprechpartner und ohne Agentur-Overhead.',
            ],
            [
              'Agentur',
              'oft 5.000–15.000 € und mehr',
              'Sinnvoll bei großen Projekten mit vielen Standorten, Kampagnen und Corporate-Design-Prozess. Für eine Betriebs-Website zahlt man hier auch Projektmanager und Büro mit.',
            ],
          ],
        },
      },
      {
        h2: 'Was den Preis wirklich bestimmt',
        paragraphs: [
          'Zwei Angebote für „eine Website" können sich um Tausende Euro unterscheiden — weil dahinter unterschiedlicher Leistungsumfang steckt. Die fünf wichtigsten Preisfaktoren:',
        ],
        list: [
          'Umfang: Eine kompakte Seite mit Leistungen, Referenzen und Kontakt kostet weniger als zwölf Unterseiten mit Karriereportal und Konfigurator.',
          'Texte und Fotos: Liefern Sie Inhalte selbst, oder müssen Texte geschrieben und ein Fotograf organisiert werden? Das ist oft ein vierstelliger Unterschied.',
          'Funktionen: Kontaktformular ist Standard. Online-Terminbuchung, Angebotsrechner oder Kundenbereich sind Entwicklungsarbeit und kosten entsprechend.',
          'Suchmaschinenoptimierung: „Bei Google gefunden werden" ist keine Checkbox, sondern Arbeit an Technik, Texten und lokalen Einträgen. Angebote ohne SEO sind billiger — und bringen weniger Anfragen.',
          'Pflege nach dem Launch: Wer aktualisiert später Öffnungszeiten, Fotos, Sicherheitsupdates? Selbst machen, einzeln beauftragen oder Pflegevertrag — das gehört ins Angebot.',
        ],
      },
      {
        h2: 'Die laufenden Kosten nicht vergessen',
        paragraphs: [
          'Mit dem Einmalpreis ist es nicht getan — realistisch kommen dazu: Domain und Hosting (je nach Anbieter etwa 5–20 € im Monat) sowie optional ein Pflege- oder Wartungspaket, am Markt meist zwischen 30 und 100 € monatlich. Das klingt nach wenig, sollte aber von Anfang an eingeplant sein: Eine Website, die drei Jahre niemand anfasst, ist irgendwann langsam, unsicher und inhaltlich veraltet — und damit ein schlechteres Aushängeschild als gar keine.',
        ],
      },
      {
        h2: 'Woran Sie ein faires Angebot erkennen',
        paragraphs: ['Unabhängig davon, wen Sie beauftragen — an diesen Punkten trennt sich Seriosität von Verkaufsmasche:'],
        list: [
          'Es gibt ein Gespräch vor dem Preis. Wer Ihnen einen Festpreis nennt, ohne Ihren Betrieb zu kennen, verkauft eine Vorlage.',
          'Das Angebot listet auf, was enthalten ist — Seitenzahl, Texterstellung, SEO, mobile Optimierung, rechtliche Pflichtseiten (Impressum, Datenschutz), Pflege.',
          'Sie bleiben Eigentümer: Domain und Website gehören Ihnen, nicht dem Dienstleister. Vorsicht bei Mietmodellen, aus denen man ohne Website wieder herauskommt.',
          'Referenzen sind echt und erreichbar — im Zweifel den genannten Betrieb einfach anrufen.',
          'Realistische Versprechen: „Platz 1 bei Google, garantiert" ist ein sicheres Warnsignal.',
        ],
      },
      {
        h2: 'Fazit: erst der Bedarf, dann der Preis',
        paragraphs: [
          'Die ehrliche Antwort auf die Preisfrage lautet: Es kommt darauf an, was Ihre Website für Ihren Betrieb leisten soll — und genau deshalb sollte am Anfang keine Preisliste stehen, sondern ein Gespräch. Ein guter Dienstleister hört zuerst zu, sagt Ihnen auch, welche Ausbaustufe Sie nicht brauchen, und macht dann ein transparentes Angebot, das zu Ihrem Budget passt.',
        ],
      },
    ],
    ctaTitle: 'Sie möchten wissen, was Ihre Website kosten würde?',
    ctaText:
      'Im kostenlosen Erstgespräch bekommen Sie eine ehrliche Einschätzung und danach ein transparentes Angebot — zugeschnitten auf Ihren Betrieb, ohne versteckte Kosten.',
  },
];
