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
  {
    slug: 'website-relaunch-5-anzeichen',
    title: '5 Anzeichen, dass Ihre Website ein Update braucht',
    metaTitle: '5 Anzeichen für ein Website-Redesign — Checkliste 2026',
    metaDescription:
      'Lädt Ihre Website langsam, sieht veraltet aus oder bringt kaum noch Anfragen? 5 klare Anzeichen, an denen Sie erkennen, ob sich eine Modernisierung lohnt.',
    dateIso: '2026-08-22',
    dateDisplay: '22. August 2026',
    readingMinutes: 5,
    teaser:
      'Eine Website, die vor Jahren gut war, ist nicht automatisch schlecht — aber oft auch nicht mehr das, was sie sein könnte. Diese fünf Anzeichen zeigen, wann sich ein genauerer Blick lohnt.',
    intro: [
      'Die meisten Websites werden nicht schlagartig schlecht — sie veralten schleichend. Das Design wirkt irgendwann nicht mehr zeitgemäß, die Ladezeit wird spürbar länger, und die Zahl der Anfragen über die Website nimmt langsam ab, ohne dass ein einzelner Grund erkennbar wäre. Weil dieser Prozess so langsam verläuft, fällt er den Betreibern selbst oft am wenigsten auf.',
      'Die folgenden fünf Anzeichen helfen bei der ehrlichen Einordnung: Wenn mehrere davon zutreffen, lohnt sich zumindest eine genauere Analyse — nicht zwingend ein kompletter Neubau, aber ein gezielter Blick auf das, was die Website heute leistet und was sie leisten könnte.',
    ],
    sections: [
      {
        h2: '1. Die Website lädt spürbar langsam — besonders auf dem Handy',
        paragraphs: [
          'Wenn eine Seite erkennbar Zeit braucht, bis Inhalte erscheinen, oder Elemente beim Laden noch sichtbar herumspringen, ist das kein rein kosmetisches Problem: Es kostet Besucher, bevor diese überhaupt gesehen haben, was Sie anbieten. Gerade auf dem Smartphone — für die meisten Betriebe mittlerweile die Mehrheit des Traffics — fällt eine langsame Seite besonders auf.',
          'Ein guter erster Check: Öffnen Sie Ihre eigene Website auf dem Handy über eine mobile Verbindung statt WLAN. Wenn Sie dabei selbst ungeduldig werden, geht es Ihren potenziellen Kunden nicht anders.',
        ],
      },
      {
        h2: '2. Das Design wirkt wie aus einer anderen Zeit',
        paragraphs: [
          'Webdesign entwickelt sich weiter — Schriften, Bildsprache, Aufbau von Startseiten. Eine Website, die vor sieben oder acht Jahren modern aussah, wirkt heute oft angestaubt, selbst wenn inhaltlich alles stimmt. Das ist ein Vertrauensproblem: Besucher übertragen den Eindruck der Website unbewusst auf den Betrieb dahinter. Eine veraltete Seite suggeriert schnell einen veralteten Betrieb — unabhängig davon, ob das stimmt.',
        ],
      },
      {
        h2: '3. Sie taucht bei Google kaum noch auf',
        paragraphs: [
          'Suchmaschinenoptimierung ist kein einmaliger Zustand, sondern ein bewegliches Ziel: Google passt seine Bewertungskriterien laufend an, und die Konkurrenz investiert weiter in ihre eigenen Websites. Eine Seite, die vor Jahren gut platziert war und seitdem unverändert blieb, verliert über die Zeit fast zwangsläufig an Sichtbarkeit — nicht, weil sie schlechter geworden ist, sondern weil andere aufgeholt haben.',
          'Ein einfacher Test: Suchen Sie bei Google nach Ihren wichtigsten Leistungen in Verbindung mit Ihrem Ort. Wenn Sie sich selbst erst auf Seite zwei oder drei finden, ist das ein klares Signal.',
        ],
      },
      {
        h2: '4. Inhalte sind veraltet, unvollständig oder ohne klare nächste Schritte',
        paragraphs: [
          'Alte Preise, ein Team-Foto mit ausgeschiedenen Mitarbeitenden, Leistungen, die es längst nicht mehr gibt — solche Details wirken einzeln harmlos, summieren sich aber zu einem unfertigen Eindruck. Genauso wichtig: Führt die Website den Besucher zu einer klaren Handlung? Eine Seite ohne erkennbaren nächsten Schritt — anrufen, Formular ausfüllen, Angebot anfragen — verschenkt Anfragen, selbst wenn der Inhalt an sich in Ordnung ist.',
        ],
      },
      {
        h2: '5. Auf dem Smartphone lässt sie sich schlecht bedienen',
        paragraphs: [
          'Zu kleine Buttons, Text, der auf dem Handy erst durch Zoomen lesbar wird, Formulare, die sich kaum ausfüllen lassen: Was auf dem großen Bildschirm harmlos aussieht, wird auf dem Handy schnell zum Hindernis. Da ein Großteil der Suchanfragen heute mobil erfolgt, entscheidet die mobile Bedienbarkeit oft direkt darüber, ob aus einem Besuch eine Anfrage wird.',
        ],
      },
      {
        h2: 'Muss es gleich ein kompletter Neubau sein?',
        paragraphs: [
          'Nicht unbedingt. Wenn nur ein oder zwei der Anzeichen zutreffen, reicht oft eine gezielte Modernisierung: schnellere Bilder, aktualisierte Inhalte, technische Nacharbeit bei der Ladezeit. Treffen mehrere Punkte gleichzeitig zu — vor allem veraltetes Design in Kombination mit schwacher Sichtbarkeit bei Google — lohnt sich meist ein ehrlicher Blick auf einen Neuaufbau, weil sich viele kleine Korrekturen an einer grundlegend alten Struktur sonst kaum noch lohnen.',
          'In beiden Fällen gilt: Eine Analyse vor der Entscheidung kostet Sie nichts außer einem kurzen Gespräch — und erspart Ihnen, in die falsche Richtung zu investieren.',
        ],
      },
      {
        h2: 'Fazit',
        paragraphs: [
          'Keines dieser fünf Anzeichen ist für sich genommen dramatisch. In Kombination zeigen sie aber recht zuverlässig, ob eine Website noch das leistet, was sie könnte — oder ob sie mittlerweile eher bremst als hilft. Der erste Schritt ist nicht die Entscheidung für ein Redesign, sondern eine ehrliche Bestandsaufnahme.',
        ],
      },
    ],
    ctaTitle: 'Nicht sicher, wo Ihre Website steht?',
    ctaText:
      'Schicken Sie mir Ihre URL — Sie erhalten eine ehrliche Einschätzung, was sich lohnt zu verbessern, und ob ein Redesign überhaupt nötig ist.',
  },
];
