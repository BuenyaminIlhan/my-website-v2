// Blog articles exist in German (local German search queries) and Turkish
// (Turkish-speaking businesses in Germany + clients in Turkey). No English
// blog: mixed-language listings would hurt rather than help EN indexing.
// Slugs and dates live in blog-registry.json (shared with the sitemap generator).

import registryJson from './blog-registry.json';
import { Lang } from '../i18n/translations';

export interface ArticleSection {
  h2: string;
  paragraphs: string[];
  list?: string[];
  table?: { head: string[]; rows: string[][] };
}

export interface BlogArticleContent {
  title: string;
  metaTitle: string;
  metaDescription: string;
  dateDisplay: string;
  readingMinutes: number;
  teaser: string;
  intro: string[];
  sections: ArticleSection[];
  ctaTitle: string;
  ctaText: string;
}

export interface BlogArticle {
  id: string;
  dateIso: string;
  slugs: Partial<Record<Lang, string>>;
  locales: Partial<Record<Lang, BlogArticleContent>>;
}

const contents: Record<string, Partial<Record<Lang, BlogArticleContent>>> = {
  'website-kosten-handwerker': {
    de: {
      title: 'Was kostet eine Website für Handwerker?',
      metaTitle: 'Was kostet eine Website für Handwerker? Ehrliche Preisübersicht 2026',
      metaDescription:
        'Baukasten, Freelancer oder Agentur? Was eine Handwerker-Website wirklich kostet, welche laufenden Kosten dazukommen und woran Sie ein faires Angebot erkennen.',
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
    tr: {
      title: 'Esnaf ve zanaatkârlar için bir web sitesi ne kadar tutar?',
      metaTitle: 'Esnaf İçin Web Sitesi Ne Kadar Tutar? Dürüst Fiyat Rehberi 2026',
      metaDescription:
        'Hazır site kurucusu, freelancer veya ajans? Bir işletme web sitesinin gerçekte ne kadar tuttuğu, hangi sürekli maliyetlerin eklendiği ve adil bir teklifi nasıl tanıyacağınız.',
      dateDisplay: '21 Ağustos 2026',
      readingMinutes: 6,
      teaser:
        'Piyasada 0 Euro’dan 15.000 Euro’ya kadar her şey var — bu makale, farkların nerede olduğunu ve bir işletme için gerçekten neyin mantıklı olduğunu dürüstçe açıklıyor.',
      intro: [
        'Bir işletme sahibi olarak web sitesi yaptırmak istediğinizde, fiyat sorusuna nadiren net bir yanıt alırsınız. Bunun dürüst bir nedeni var: Web sitesi raftan alınan bir ürün değil, bir hizmettir — ve fiyat, sitenin ne yapması gerektiğine bağlıdır. Yine de piyasayı iyi bir şekilde sınıflandırmak mümkün, ve bu makale tam olarak bunu yapıyor.',
        'Önce genel bir çerçeve: Profesyonelce geliştirilmiş bir işletme web sitesi — özel tasarım, arama motoru optimizasyonu ve tüm zorunlu yasal sayfalarla birlikte — freelancer’larda genellikle düşük ile orta dört haneli Euro aralığındadır. Ajanslar aynı hizmet için çoğu zaman bunun iki-üç katını ister; hazır site kurucuları ise neredeyse ücretsiz görünür. Aradaki farkın neden bu kadar büyük olduğunu üç yol üzerinden detaylıca görelim.',
      ],
      sections: [
        {
          h2: 'Üç yolun karşılaştırması',
          paragraphs: [
            'İşletmeler için web sitesine giden temelde üç yol vardır — çok farklı maliyetler ve çok farklı sonuçlarla:',
          ],
          table: {
            head: ['Yol', 'Tipik maliyet', 'Kimler için uygun'],
            rows: [
              [
                'Hazır site kurucusu (Wix, Jimdo vb.), kendiniz yapıyorsunuz',
                'yakl. ayda 10–40 € + saatlerce kendi emeğiniz',
                'Bütçe gerçekten yoksa geçici bir çözüm. Çoğunlukla şablon gibi görünür, Google’da nadiren iyi sıralanır — ve bir usta olarak kendi zamanınız her ajans saatinden daha değerlidir.',
              ],
              [
                'Freelancer / bağımsız geliştirici',
                'çoğunlukla tek seferlik yakl. 1.500–5.000 €',
                'Çoğu işletme için ideal nokta: özel tasarım, temiz teknik altyapı, SEO — doğrudan muhatap ve ajans masrafları olmadan.',
              ],
              [
                'Ajans',
                'çoğunlukla 5.000–15.000 € ve üzeri',
                'Çok şubeli, kampanyalı ve kurumsal kimlik süreçli büyük projelerde mantıklı. Standart bir işletme sitesinde proje yöneticisinin ve ofisin maliyetini de siz ödersiniz.',
              ],
            ],
          },
        },
        {
          h2: 'Fiyatı gerçekte ne belirler',
          paragraphs: [
            '„Bir web sitesi" için iki teklif arasında binlerce Euro fark olabilir — çünkü arkasında farklı hizmet kapsamları vardır. En önemli beş fiyat faktörü:',
          ],
          list: [
            'Kapsam: Hizmetler, referanslar ve iletişimden oluşan kompakt bir site; kariyer portalı ve konfigüratörlü on iki alt sayfadan daha ucuzdur.',
            'Metinler ve fotoğraflar: İçerikleri kendiniz mi sağlıyorsunuz, yoksa metinlerin yazılması ve fotoğrafçı ayarlanması mı gerekiyor? Bu çoğu zaman dört haneli bir farktır.',
            'Fonksiyonlar: İletişim formu standarttır. Online randevu, teklif hesaplayıcısı veya müşteri paneli ise geliştirme işidir ve buna göre maliyeti vardır.',
            'Arama motoru optimizasyonu: „Google’da bulunmak" bir onay kutusu değil; teknik, metin ve yerel kayıtlar üzerinde çalışmaktır. SEO içermeyen teklifler daha ucuzdur — ve daha az müşteri getirir.',
            'Yayın sonrası bakım: Çalışma saatlerini, fotoğrafları, güvenlik güncellemelerini sonradan kim yapacak? Kendiniz, tek tek sipariş vererek veya bakım sözleşmesiyle — bu, teklifte yer almalıdır.',
          ],
        },
        {
          h2: 'Sürekli maliyetleri unutmayın',
          paragraphs: [
            'Tek seferlik ücretle iş bitmiyor — gerçekçi olarak şunlar eklenir: alan adı ve hosting (sağlayıcıya göre ayda yaklaşık 5–20 €) ve isteğe bağlı olarak bir bakım paketi, piyasada genellikle ayda 30 ile 100 € arasında. Kulağa az geliyor, ama baştan planlanmalı: Üç yıl kimsenin dokunmadığı bir web sitesi eninde sonunda yavaş, güvensiz ve içerik olarak güncelliğini yitirmiş olur — ve hiç site olmamasından daha kötü bir vitrine dönüşür.',
          ],
        },
        {
          h2: 'Adil bir teklifi nasıl tanırsınız',
          paragraphs: ['Kiminle çalışırsanız çalışın — ciddiyeti satış taktiğinden şu noktalar ayırır:'],
          list: [
            'Fiyattan önce bir görüşme vardır. İşletmenizi tanımadan size sabit fiyat veren biri, şablon satıyordur.',
            'Teklif neyin dahil olduğunu listeler — sayfa sayısı, metin yazımı, SEO, mobil optimizasyon, zorunlu yasal sayfalar (künye, gizlilik), bakım.',
            'Sahibi siz kalırsınız: Alan adı ve web sitesi size aittir, hizmet sağlayıcıya değil. Sitesiz çıkamayacağınız kiralama modellerine dikkat.',
            'Referanslar gerçek ve ulaşılabilirdir — şüphedeyseniz adı geçen işletmeyi arayıverin.',
            'Gerçekçi vaatler: „Google’da 1. sıra, garantili" kesin bir uyarı işaretidir.',
          ],
        },
        {
          h2: 'Sonuç: önce ihtiyaç, sonra fiyat',
          paragraphs: [
            'Fiyat sorusunun dürüst yanıtı şu: Web sitenizin işletmeniz için ne yapması gerektiğine bağlı — ve tam da bu yüzden işin başında bir fiyat listesi değil, bir görüşme olmalı. İyi bir hizmet sağlayıcı önce dinler, hangi kapsama ihtiyacınız olmadığını da söyler ve ardından bütçenize uygun, şeffaf bir teklif sunar.',
          ],
        },
      ],
      ctaTitle: 'Web sitenizin ne kadar tutacağını öğrenmek ister misiniz?',
      ctaText:
        'Ücretsiz ön görüşmede dürüst bir değerlendirme, ardından şeffaf bir teklif alırsınız — işletmenize göre hazırlanmış, gizli maliyet olmadan.',
    },
  },
  'website-relaunch-5-anzeichen': {
    de: {
      title: '5 Anzeichen, dass Ihre Website ein Update braucht',
      metaTitle: '5 Anzeichen für ein Website-Redesign — Checkliste 2026',
      metaDescription:
        'Lädt Ihre Website langsam, sieht veraltet aus oder bringt kaum noch Anfragen? 5 klare Anzeichen, an denen Sie erkennen, ob sich eine Modernisierung lohnt.',
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
    tr: {
      title: 'Web sitenizin yenilenmesi gerektiğini gösteren 5 işaret',
      metaTitle: 'Web Sitesi Yenileme İçin 5 İşaret — Kontrol Listesi 2026',
      metaDescription:
        'Web siteniz yavaş mı yükleniyor, eski mi görünüyor veya artık neredeyse hiç müşteri getirmiyor mu? Yenilemenin gerekip gerekmediğini gösteren 5 net işaret.',
      dateDisplay: '22 Ağustos 2026',
      readingMinutes: 5,
      teaser:
        'Yıllar önce iyi olan bir web sitesi otomatik olarak kötü değildir — ama çoğu zaman olabileceği kadar iyi de değildir. Bu beş işaret, daha yakından bakmanın ne zaman gerektiğini gösteriyor.',
      intro: [
        'Çoğu web sitesi bir anda kötüleşmez — sinsice eskir. Tasarım bir noktada artık çağdaş görünmez, yükleme süresi fark edilir şekilde uzar ve site üzerinden gelen müşteri talepleri, tek bir neden görünmeden yavaş yavaş azalır. Bu süreç çok yavaş ilerlediği için, çoğu zaman en son site sahipleri fark eder.',
        'Aşağıdaki beş işaret dürüst bir değerlendirme için yardımcı olur: Birden fazlası sizin için geçerliyse, en azından daha ayrıntılı bir analiz yapmaya değer — illa komple yeni bir site değil, ama sitenin bugün ne yaptığına ve ne yapabileceğine hedefli bir bakış.',
      ],
      sections: [
        {
          h2: '1. Site fark edilir şekilde yavaş yükleniyor — özellikle telefonda',
          paragraphs: [
            'Bir sayfanın içeriği görünene kadar belirgin şekilde zaman geçiyorsa veya öğeler yüklenirken gözle görülür biçimde zıplıyorsa, bu yalnızca kozmetik bir sorun değildir: Ziyaretçileri, daha ne sunduğunuzu görmeden kaybettirir. Özellikle akıllı telefonda — çoğu işletme için artık trafiğin çoğunluğu — yavaş bir site özellikle göze batar.',
            'İyi bir ilk test: Kendi web sitenizi telefonunuzda Wi-Fi yerine mobil bağlantıyla açın. Siz bile sabırsızlanıyorsanız, potansiyel müşterileriniz için de durum farklı değildir.',
          ],
        },
        {
          h2: '2. Tasarım başka bir zamandan kalmış gibi duruyor',
          paragraphs: [
            'Web tasarımı gelişmeye devam ediyor — yazı tipleri, görsel dil, ana sayfa kurgusu. Yedi-sekiz yıl önce modern görünen bir site, içerik olarak her şey doğru olsa bile bugün çoğu zaman eskimiş durur. Bu bir güven sorunudur: Ziyaretçiler sitenin izlenimini farkında olmadan arkasındaki işletmeye aktarır. Eskimiş bir sayfa, doğru olup olmadığından bağımsız olarak, hızla eskimiş bir işletme izlenimi verir.',
          ],
        },
        {
          h2: '3. Google’da artık neredeyse görünmüyor',
          paragraphs: [
            'Arama motoru optimizasyonu tek seferlik bir durum değil, hareketli bir hedeftir: Google değerlendirme kriterlerini sürekli günceller ve rakipleriniz kendi sitelerine yatırım yapmaya devam eder. Yıllar önce iyi sıralanan ve o zamandan beri değişmeyen bir sayfa, zamanla neredeyse kaçınılmaz olarak görünürlük kaybeder — kötüleştiği için değil, diğerleri arayı kapattığı için.',
            'Basit bir test: Google’da en önemli hizmetlerinizi bulunduğunuz şehirle birlikte aratın. Kendinizi ancak ikinci veya üçüncü sayfada buluyorsanız, bu net bir sinyaldir.',
          ],
        },
        {
          h2: '4. İçerikler eski, eksik veya net bir sonraki adımdan yoksun',
          paragraphs: [
            'Eski fiyatlar, ayrılmış çalışanların olduğu bir ekip fotoğrafı, çoktan sunulmayan hizmetler — bu detaylar tek tek zararsız görünür ama toplandığında yarım kalmış bir izlenim yaratır. Aynı derecede önemli: Site, ziyaretçiyi net bir eyleme yönlendiriyor mu? Belirgin bir sonraki adımı olmayan bir sayfa — aramak, formu doldurmak, teklif istemek — içerik aslında yerinde olsa bile müşteri taleplerini boşa harcar.',
          ],
        },
        {
          h2: '5. Telefonda kullanımı zor',
          paragraphs: [
            'Çok küçük butonlar, telefonda ancak yakınlaştırınca okunabilen metinler, zar zor doldurulabilen formlar: Büyük ekranda zararsız görünen şey, telefonda hızla engele dönüşür. Aramaların büyük bölümü bugün mobilden yapıldığı için, mobil kullanılabilirlik çoğu zaman bir ziyaretin talebe dönüşüp dönüşmeyeceğini doğrudan belirler.',
          ],
        },
        {
          h2: 'Hemen komple yeni bir site mi gerekiyor?',
          paragraphs: [
            'Şart değil. İşaretlerden yalnızca biri veya ikisi geçerliyse, çoğu zaman hedefli bir yenileme yeterlidir: daha hızlı görseller, güncellenmiş içerikler, yükleme süresinde teknik iyileştirmeler. Birden fazla nokta aynı anda geçerliyse — özellikle eskimiş tasarım ile Google’da zayıf görünürlük bir aradaysa — genellikle yeniden yapılanmaya dürüstçe bakmak daha mantıklıdır; çünkü temelden eski bir yapıya yapılan çok sayıda küçük düzeltme artık pek karşılığını vermez.',
            'Her iki durumda da geçerli: Karar öncesi bir analiz size kısa bir görüşmeden başka bir şeye mal olmaz — ve yanlış yöne yatırım yapmaktan kurtarır.',
          ],
        },
        {
          h2: 'Sonuç',
          paragraphs: [
            'Bu beş işaretten hiçbiri tek başına dramatik değildir. Ama bir arada, bir web sitesinin hâlâ yapabileceğini yapıp yapmadığını — yoksa artık yardım etmekten çok engel mi olduğunu — oldukça güvenilir şekilde gösterirler. İlk adım yeniden tasarım kararı değil, dürüst bir durum tespitidir.',
          ],
        },
      ],
      ctaTitle: 'Web sitenizin nerede durduğundan emin değil misiniz?',
      ctaText:
        'Bana URL’nizi gönderin — neyin iyileştirilmeye değer olduğuna ve yeniden tasarımın gerçekten gerekli olup olmadığına dair dürüst bir değerlendirme alırsınız.',
    },
  },
};

export const blogArticles: BlogArticle[] = registryJson.articles.map(entry => ({
  id: entry.id,
  dateIso: entry.dateIso,
  slugs: entry.slugs as Partial<Record<Lang, string>>,
  locales: contents[entry.id] ?? {},
}));

/** Articles available in a locale, newest first. */
export function articlesFor(lang: Lang): BlogArticle[] {
  return blogArticles
    .filter(a => a.locales[lang] !== undefined && a.slugs[lang] !== undefined)
    .sort((a, b) => b.dateIso.localeCompare(a.dateIso));
}
