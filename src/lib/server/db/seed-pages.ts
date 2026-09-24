import type { PageSection } from './schema';

/**
 * Startinhalt der Textseiten. Wird nur beim allerersten Start angelegt,
 * danach werden die Seiten ausschließlich im Admin bearbeitet.
 * Die Texte der Bürgerservice-Seiten stammen aus dem Prototyp (überarbeitet).
 */
export interface SeedPage {
	slug: string;
	section: PageSection;
	title: string;
	subtitle: string;
	menuText: string;
	sortOrder: number;
	system: boolean;
	contentHtml: string;
}

const UEBER_UNS = `
<p>Die Freiwillige Feuerwehr Leopoldsdorf ist rund um die Uhr für die Menschen in Leopoldsdorf da – ehrenamtlich. Wenn die Sirene heult oder der Pager piept, lassen unsere Mitglieder Arbeit, Familie und Freizeit stehen und rücken aus: zu Bränden, Verkehrsunfällen, Unwettern und Schadstoffaustritten.</p>
<p>Damit das im Ernstfall klappt, üben wir regelmäßig, bilden uns weiter und halten Fahrzeuge und Geräte einsatzbereit. Unsere Feuerwehrjugend lernt dabei schon früh, worauf es ankommt.</p>
<h2>Mitmachen</h2>
<p>Wir freuen uns über jede helfende Hand – ob im Einsatzdienst, in der Verwaltung oder bei der Feuerwehrjugend. Vorkenntnisse brauchst du keine, alles Nötige lernst du bei uns.</p>
<p>Schreib uns einfach eine E-Mail oder komm bei einer Übung im Feuerwehrhaus vorbei.</p>
`;

const SIRENEN = `
<p>Die Sirenensignale sind Teil des österreichischen Warn- und Alarmsystems. Sie alarmieren die Feuerwehr und warnen die Bevölkerung vor Gefahren. Es lohnt sich, die Signale zu kennen, damit man im Ernstfall richtig reagiert.</p>
<h2>Sirenenprobe</h2>
<p><strong>15 Sekunden Dauerton</strong></p>
<p>Jeden Samstag gegen 12 Uhr werden die Sirenen getestet. Einmal im Jahr, am ersten Samstag im Oktober, findet zusätzlich der österreichweite Zivilschutz-Probealarm statt, bei dem alle Signale erklingen.</p>
<h2>Feuerwehralarm</h2>
<p><strong>3 × 15 Sekunden Dauerton mit kurzen Pausen</strong></p>
<p>Die Feuerwehr wird zu einem Einsatz gerufen. Bitte halten Sie die Zufahrt zum Feuerwehrhaus und die Straßen frei, damit die Einsatzkräfte schnell ausrücken können.</p>
<h2>Warnung</h2>
<p><strong>3 Minuten gleichbleibender Dauerton</strong></p>
<p>Eine Gefahr kommt auf Sie zu. Schalten Sie Radio oder Fernsehen (ORF) ein und beachten Sie die Verhaltensmaßnahmen, die dort durchgegeben werden.</p>
<h2>Alarm</h2>
<p><strong>1 Minute auf- und abschwellender Heulton</strong></p>
<p>Die Gefahr ist unmittelbar. Suchen Sie sofort schützende Räume auf und befolgen Sie die Anweisungen der Behörden über Radio und Fernsehen.</p>
<ul>
<li>Ruhe bewahren und Fenster und Türen schließen.</li>
<li>Geschützte Räume aufsuchen – je nach Gefahr im Gebäudeinneren oder in höher gelegenen Stockwerken.</li>
<li>Radio oder Fernsehen eingeschaltet lassen.</li>
<li>Anweisungen der Einsatzkräfte und Behörden sofort befolgen.</li>
</ul>
<h2>Entwarnung</h2>
<p><strong>1 Minute gleichbleibender Dauerton</strong></p>
<p>Die Gefahr ist vorbei. Achten Sie trotzdem weiter auf Hinweise in Radio und Fernsehen, denn Einschränkungen können noch eine Zeit lang gelten.</p>
<p>Zusätzlich zu den Sirenen warnen die Behörden in Österreich über AT-Alert direkt aufs Handy.</p>
`;

const NOTRUF = `
<p><strong>Feuerwehr 122</strong> · <strong>Polizei 133</strong> · <strong>Rettung 144</strong> · <strong>Euro-Notruf 112</strong></p>
<p>Notrufe sind kostenlos und funktionieren auch ohne Guthaben und bei gesperrtem Handy. Wer einen Notruf absetzt, sollte an die fünf W-Fragen denken. So kann die Leitstelle rasch die richtige Hilfe schicken.</p>
<h2>Wo ist es passiert?</h2>
<p>Nennen Sie den Ort so genau wie möglich: Ort, Straße, Hausnummer, Stockwerk – oder auf Freilandstraßen die Straßennummer, Fahrtrichtung und den Kilometer. Markante Gebäude oder Kreuzungen helfen beim Finden.</p>
<p>Zum Beispiel: „Leopoldsdorf, Achauer Straße auf Höhe der Einfahrt zum Supermarkt, Richtung Achau.“</p>
<h2>Was ist passiert?</h2>
<p>Beschreiben Sie kurz die Lage: Brennt es, gibt es einen Verkehrsunfall, tritt eine Flüssigkeit aus, ist jemand eingeklemmt?</p>
<p>Zum Beispiel: „Zwei Autos sind zusammengestoßen, aus einem Auto kommt Rauch.“</p>
<h2>Wie viele Verletzte gibt es?</h2>
<p>Sagen Sie, wie viele Personen betroffen sind und wie es ihnen ungefähr geht. So kann die Leitstelle genug Rettungsmittel schicken.</p>
<h2>Wer ruft an?</h2>
<p>Nennen Sie Ihren Namen und eine Rückrufnummer und sagen Sie, ob Sie selbst betroffen sind oder etwas beobachtet haben.</p>
<h2>Warten auf Rückfragen</h2>
<p>Legen Sie nicht selbst auf. Die Leitstelle beendet das Gespräch, wenn alle Informationen da sind. Oft gibt sie Ihnen noch Anweisungen, etwa zur Ersten Hilfe, bis die Einsatzkräfte eintreffen.</p>
`;

const RETTUNGSGASSE = `
<p>Seit 1. Jänner 2012 muss in Österreich auf Autobahnen und Schnellstraßen eine Rettungsgasse gebildet werden, sobald der Verkehr stockt – nicht erst, wenn ein Einsatzfahrzeug kommt.</p>
<h2>So geht’s</h2>
<ul>
<li>Fahrzeuge auf dem <strong>linken Fahrstreifen</strong> weichen nach <strong>links</strong> aus.</li>
<li>Fahrzeuge auf <strong>allen anderen Fahrstreifen</strong> weichen nach <strong>rechts</strong> aus.</li>
<li>Der Pannenstreifen bleibt frei – auch er ist ein Weg für die Einsatzkräfte.</li>
</ul>
<p><img src="/bilder/buergerservice/rettungsgasse.webp" alt="Grafik der ASFINAG zur Rettungsgasse" width="1280" height="613"></p>
<h2>Warum das wichtig ist</h2>
<ul>
<li>Einsatzfahrzeuge kommen schneller zur Unfallstelle.</li>
<li>Auch breite Fahrzeuge wie Tanklöschfahrzeuge und Kräne kommen durch.</li>
<li>Verletzte werden früher versorgt – jede Minute zählt.</li>
<li>Die Unfallstelle ist schneller geräumt und der Verkehr fließt wieder.</li>
</ul>
<h2>Weitere Informationen</h2>
<ul>
<li><a href="https://www.asfinag.at/verkehr-sicherheit/verkehrsmanagement/rettungsgasse/">Rettungsgasse bei der ASFINAG</a></li>
<li><a href="https://www.oeamtc.at/thema/verkehr/rettungsgasse-bilden-wie-funktioniert-sie-16185270">Rettungsgasse beim ÖAMTC</a></li>
</ul>
`;

const LOESCHEN = `
<p>Ein Feuerlöscher kann einen Entstehungsbrand stoppen, bevor er groß wird. Damit das gelingt, kommt es auf die richtige Technik an.</p>
<h2>Die wichtigsten Regeln</h2>
<ul>
<li>Feuer immer <strong>in Windrichtung</strong> angreifen.</li>
<li>Flächenbrände <strong>von vorne nach hinten</strong> und von unten nach oben löschen.</li>
<li>Tropf- und Fließbrände dagegen <strong>von oben nach unten</strong> löschen.</li>
<li>Bei größeren Bränden <strong>mehrere Löscher gleichzeitig</strong> einsetzen, nicht hintereinander.</li>
<li>Vorsicht vor <strong>Wiederentzündung</strong>: Glutnester mit Wasser nachlöschen.</li>
<li>Benutzte Feuerlöscher nicht zurückhängen, sondern <strong>neu füllen</strong> lassen.</li>
</ul>
<p><img src="/bilder/buergerservice/loeschen.webp" alt="Grafik des Bundesministeriums für Inneres: falsches und richtiges Vorgehen beim Löschen" width="1306" height="1745"></p>
<h2>Fettbrand</h2>
<p>Brennendes Fett oder Öl <strong>niemals mit Wasser</strong> löschen – es kommt zu einer Fettexplosion. Deckel drauf, Herd ausschalten und bei Bedarf einen Fettbrandlöscher (Brandklasse F) verwenden.</p>
<h2>Wartung</h2>
<p>Feuerlöscher sollten alle zwei Jahre von einer Fachfirma überprüft werden. Und: Im Zweifel lieber sofort 122 wählen.</p>
`;

const ABSCHNITT = `
<p>Die Freiwillige Feuerwehr Leopoldsdorf gehört zum Feuerwehrabschnitt Schwechat-Land im Bezirk Bruck an der Leitha. Bei größeren Einsätzen arbeiten die Feuerwehren im Abschnitt eng zusammen.</p>
<ul>
<li><a href="https://www.ffebergassing.at/">Feuerwehr Ebergassing</a></li>
<li><a href="https://www.feuerwehr-fischamend.at/">Feuerwehr Fischamend</a></li>
<li><a href="https://www.ff-gramatneusiedl.at/">Feuerwehr Gramatneusiedl</a></li>
<li><a href="https://www.feuerwehr-himberg.at/">Feuerwehr Himberg</a></li>
<li><a href="https://ff-kleinneusiedl.jimdofree.com/">Feuerwehr Kleinneusiedl</a></li>
<li><a href="https://fflanzendorf.at/">Feuerwehr Lanzendorf</a></li>
<li><a href="https://www.facebook.com/ffmala/">Feuerwehr Maria Lanzendorf</a></li>
<li><a href="https://www.ff-moosbrunn.at/">Feuerwehr Moosbrunn</a></li>
<li><a href="https://www.ff-pellendorf.at/">Feuerwehr Pellendorf</a></li>
<li><a href="https://www.ff-rauchenwarth.at/">Feuerwehr Rauchenwarth</a></li>
<li><a href="https://www.ff-schwadorf.at/">Feuerwehr Schwadorf</a></li>
<li><a href="http://www.ff-wienerherberg.hietz.at/">Feuerwehr Wienerherberg</a></li>
<li><a href="https://www.facebook.com/ffzwoelfaxing/">Feuerwehr Zwölfaxing</a></li>
</ul>
`;

const IMPRESSUM = `
<h2>Offenlegung gemäß § 25 Mediengesetz</h2>
<p><strong>Medieninhaber und Herausgeber</strong><br>Freiwillige Feuerwehr Leopoldsdorf<br>Achauerstraße 43<br>2333 Leopoldsdorf<br>Österreich</p>
<p><strong>Rechtsform</strong><br>Körperschaft öffentlichen Rechts nach dem NÖ Feuerwehrgesetz 2015</p>
<p><strong>Unternehmensgegenstand</strong><br>Wahrnehmung der Aufgaben im Sinne des NÖ Feuerwehrgesetzes samt Dienstordnung und Dienstanweisungen des NÖ Landesfeuerwehrverbandes.</p>
<p><strong>Organe</strong><br>Feuerwehrkommandant, Mitgliederversammlung</p>
<p><strong>Für den Inhalt verantwortlich</strong><br>Das Kommando der Freiwilligen Feuerwehr Leopoldsdorf</p>
<p><strong>Blattlinie</strong><br>Information über Aufbau, Organisation, Einsätze und Tätigkeiten der Freiwilligen Feuerwehr Leopoldsdorf.</p>
<h2>Kontakt</h2>
<p>E-Mail: <a href="mailto:leopoldsdorf.2333@feuerwehr.gv.at">leopoldsdorf.2333@feuerwehr.gv.at</a><br>Telefon: <a href="tel:+43223547202">+43 2235 47202</a> (nicht ständig besetzt)<br>Notruf Feuerwehr: <a href="tel:122">122</a></p>
<h2>Haftung für Inhalte und Links</h2>
<p>Die Inhalte dieser Webseite werden mit größter Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit und Aktualität übernehmen wir dennoch keine Gewähr. Für die Inhalte verlinkter fremder Webseiten sind ausschließlich deren Betreiber verantwortlich.</p>
<h2>Urheberrecht</h2>
<p>Texte und Fotos auf dieser Webseite stammen, soweit nicht anders angegeben, von der Freiwilligen Feuerwehr Leopoldsdorf. Eine Verwendung ist nur nach vorheriger Zustimmung erlaubt.</p>
`;

const DATENSCHUTZ = `
<p>Der Schutz Ihrer persönlichen Daten ist uns wichtig. Wir verarbeiten Ihre Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen – der Datenschutz-Grundverordnung (DSGVO), des Datenschutzgesetzes (DSG) und des Telekommunikationsgesetzes 2021 (TKG 2021). Hier informieren wir Sie darüber, welche Daten wir beim Besuch dieser Webseite verarbeiten.</p>
<h2>Verantwortlicher</h2>
<p>Freiwillige Feuerwehr Leopoldsdorf<br>Achauerstraße 43, 2333 Leopoldsdorf<br>E-Mail: <a href="mailto:leopoldsdorf.2333@feuerwehr.gv.at">leopoldsdorf.2333@feuerwehr.gv.at</a><br>Telefon: +43 2235 47202</p>
<h2>Bereitstellung der Webseite</h2>
<p>Beim Aufruf dieser Webseite überträgt Ihr Browser technisch bedingt Daten an unseren Server, insbesondere Ihre IP-Adresse, Datum und Uhrzeit des Aufrufs, die aufgerufene Seite sowie Browser und Betriebssystem. Diese Daten sind nötig, um die Webseite auszuliefern und ihre Sicherheit zu gewährleisten. Sie werden nicht mit anderen Daten zusammengeführt und nicht dauerhaft gespeichert.</p>
<p>Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und funktionierenden Betrieb der Webseite (Art. 6 Abs. 1 lit. f DSGVO).</p>
<p>Die Webseite wird bei einem Hosting-Anbieter mit Serverstandort in der Europäischen Union betrieben, der die Daten in unserem Auftrag auf Grundlage eines Auftragsverarbeitungsvertrags (Art. 28 DSGVO) verarbeitet.</p>
<h2>Zugriffsstatistik</h2>
<p>Um zu sehen, welche Inhalte gelesen werden, zählen wir die Aufrufe je Seite und Tag. Dabei speichern wir ausschließlich die Summe der Aufrufe – keine IP-Adressen, keine Cookies und keine Angaben zu Ihrem Gerät. Ein Rückschluss auf Ihre Person ist nicht möglich.</p>
<h2>Cookies</h2>
<p>Der öffentliche Teil dieser Webseite setzt keine Cookies. Nur im geschützten Bereich für unsere Redakteurinnen und Redakteure wird nach der Anmeldung ein technisch notwendiges Cookie gespeichert, das die Anmeldung aufrechterhält (§ 165 Abs. 3 TKG 2021). Dafür ist keine Einwilligung nötig.</p>
<h2>Keine externen Dienste</h2>
<p>Wir binden keine Dienste von Drittanbietern ein: keine Analyse-Werkzeuge, keine Werbung, keine eingebetteten Videos oder Karten. Schriften und Bilder werden von unserem eigenen Server geladen.</p>
<p>Auf unsere Auftritte in sozialen Netzwerken (Facebook, Instagram, X, YouTube) verweisen wir nur mit einfachen Links. Erst wenn Sie einen solchen Link anklicken, gelangen Sie auf die Seite des jeweiligen Anbieters; dort gelten dessen Datenschutzbestimmungen. Dasselbe gilt für die Teilen-Schaltflächen unter unseren Beiträgen.</p>
<h2>Fotos und Namen unserer Mitglieder</h2>
<p>Namen, Dienstgrade und Fotos unserer Mitglieder veröffentlichen wir nur mit deren Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), bei Minderjährigen mit Einwilligung der Erziehungsberechtigten. Eine Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen werden – eine formlose Nachricht an uns genügt.</p>
<h2>Berichte und Fotos von Einsätzen und Veranstaltungen</h2>
<p>Über unsere Einsätze, Übungen und Veranstaltungen berichten wir im Rahmen unserer Öffentlichkeitsarbeit (Art. 6 Abs. 1 lit. f DSGVO). Wir achten darauf, dass betroffene Personen nicht erkennbar sind: keine Namen von Beteiligten, keine erkennbaren Gesichter von Verletzten, keine lesbaren Kennzeichen. Sollten Sie sich dennoch auf einem Bild wiedererkennen und das nicht wünschen, entfernen wir es auf Ihre Nachricht hin umgehend.</p>
<h2>Kontakt per E-Mail oder Telefon</h2>
<p>Wenn Sie uns kontaktieren, verarbeiten wir Ihre Angaben, um Ihr Anliegen zu bearbeiten (Art. 6 Abs. 1 lit. b bzw. f DSGVO). Wir löschen die Daten, sobald sie dafür nicht mehr gebraucht werden und keine gesetzlichen Aufbewahrungspflichten bestehen.</p>
<h2>Ihre Rechte</h2>
<p>Ihnen stehen grundsätzlich die Rechte auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21) zu. Eine erteilte Einwilligung können Sie jederzeit widerrufen (Art. 7 Abs. 3 DSGVO). Wenden Sie sich dazu einfach an die oben genannte Adresse.</p>
<p>Wenn Sie glauben, dass die Verarbeitung Ihrer Daten gegen das Datenschutzrecht verstößt, können Sie sich bei der Aufsichtsbehörde beschweren. In Österreich ist das die Datenschutzbehörde, Barichgasse 40–42, 1030 Wien, <a href="https://www.dsb.gv.at">www.dsb.gv.at</a>.</p>
`;

export const SEED_PAGES: SeedPage[] = [
	{
		slug: 'ueber-uns',
		section: 'feuerwehr',
		title: 'Über uns',
		subtitle: 'Die Freiwillige Feuerwehr Leopoldsdorf stellt sich vor',
		menuText: 'Wer wir sind und wie du mitmachen kannst',
		sortOrder: 0,
		system: false,
		contentHtml: UEBER_UNS
	},
	{
		slug: 'sirenensignale',
		section: 'buergerservice',
		title: 'Sirenensignale',
		subtitle: 'Was die Sirenen bedeuten und was dann zu tun ist',
		menuText: 'Die Signale des österreichischen Warnsystems',
		sortOrder: 0,
		system: false,
		contentHtml: SIRENEN
	},
	{
		slug: 'notruf',
		section: 'buergerservice',
		title: 'Notruf',
		subtitle: 'So setzen Sie einen Notruf richtig ab',
		menuText: 'Die fünf W-Fragen beim Notruf',
		sortOrder: 1,
		system: false,
		contentHtml: NOTRUF
	},
	{
		slug: 'rettungsgasse',
		section: 'buergerservice',
		title: 'Rettungsgasse',
		subtitle: 'Bei stockendem Verkehr sofort Platz machen',
		menuText: 'Links nach links, alle anderen nach rechts',
		sortOrder: 2,
		system: false,
		contentHtml: RETTUNGSGASSE
	},
	{
		slug: 'richtig-loeschen',
		section: 'buergerservice',
		title: 'Richtig löschen',
		subtitle: 'So setzen Sie einen Feuerlöscher richtig ein',
		menuText: 'Der richtige Umgang mit dem Feuerlöscher',
		sortOrder: 3,
		system: false,
		contentHtml: LOESCHEN
	},
	{
		slug: 'abschnitt-schwechat-land',
		section: 'buergerservice',
		title: 'Abschnitt Schwechat-Land',
		subtitle: 'Die Feuerwehren in unserer Nachbarschaft',
		menuText: 'Alle Feuerwehren im Abschnitt',
		sortOrder: 4,
		system: false,
		contentHtml: ABSCHNITT
	},
	{
		slug: 'impressum',
		section: 'rechtliches',
		title: 'Impressum',
		subtitle: 'Offenlegung und Kontakt',
		menuText: '',
		sortOrder: 0,
		system: true,
		contentHtml: IMPRESSUM
	},
	{
		slug: 'datenschutz',
		section: 'rechtliches',
		title: 'Datenschutz',
		subtitle: 'Wie wir mit Ihren Daten umgehen',
		menuText: '',
		sortOrder: 1,
		system: true,
		contentHtml: DATENSCHUTZ
	}
].map((p) => ({ ...p, contentHtml: p.contentHtml.trim() })) as SeedPage[];

/** Standard-Titelbilder der Seiten, falls im Admin keines gewählt ist */
export const DEFAULT_BANNERS: Record<string, string> = {
	'ueber-uns': '/banner/ueber-uns.webp',
	sirenensignale: '/banner/sirene.webp',
	notruf: '/banner/notruf.webp',
	rettungsgasse: '/banner/rettungsgasse.webp',
	'richtig-loeschen': '/banner/richtig-loeschen.webp',
	'abschnitt-schwechat-land': '/banner/abschnitt.webp',
	impressum: '/banner/impressum.webp',
	datenschutz: '/banner/impressum.webp'
};
