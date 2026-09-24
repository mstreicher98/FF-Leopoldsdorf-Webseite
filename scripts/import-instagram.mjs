#!/usr/bin/env node
/**
 * Gleicht die Beiträge des Instagram-Accounts mit den vorhandenen Beiträgen ab
 * und übernimmt die fehlenden (Text, Datum, Einsatzdaten, Fotos). Reels und
 * reine Videobeiträge bleiben draußen.
 *
 *   node scripts/import-instagram.mjs --datei <feed.json>            übernehmen
 *   node scripts/import-instagram.mjs --datei <feed.json> --probe    nur abgleichen
 *   Optionen: --bericht <datei.md>  Abgleich als Liste speichern
 *             --zuordnung <datei.json>  von Hand geprüfte Fälle, z. B. {"DGBuj2xNUWg": 124, "C7uEBt6IMCh": "neu"}
 *             --vorschau <code,…>   Beschriftung zerlegen und anzeigen, sonst nichts
 *             --parallel <n>        gleichzeitige Bild-Downloads (Standard 4)
 *
 * <feed.json> wird im angemeldeten Browser aus der Instagram-Webseite gelesen
 * (Aufbau siehe README). Die Bildadressen darin laufen nach einigen Tagen ab –
 * also bald nach dem Auslesen übernehmen.
 *
 * Bereits Abgeglichenes steht in der Tabelle import_map (ig:post:<code>) und wird
 * beim nächsten Lauf übersprungen – neue Instagram-Beiträge lassen sich so später
 * nachholen.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import sharp from 'sharp';

/* ================================================================ Einstellungen */

const args = Object.fromEntries(
	process.argv.slice(2).reduce((acc, a, i, all) => {
		if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
		return acc;
	}, [])
);
const PROBE = !!args.probe;
const PARALLEL = Number(args.parallel) || 4;
const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
const DB_FILE = path.join(DATA_DIR, 'feuerwehr.db');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const CACHE_DIR = path.join(DATA_DIR, 'import-cache', 'instagram');
const WIDTHS = [400, 800, 1600];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

/** Ab diesem Anteil gemeinsamer Wörter gilt ein Beitrag als schon vorhanden */
const SAME = 0.5;
/** Darunter sicher verschieden; dazwischen landet der Beitrag im Bericht unter „prüfen“ */
const MAYBE = 0.3;

const t0 = Date.now();
const log = (...m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s]`, ...m);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');

function slugify(input, max = 80) {
	return String(input)
		.toLowerCase()
		.replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[c])
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, max)
		.replace(/-+$/, '');
}

async function pool(items, n, fn) {
	let i = 0;
	const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
		while (i < items.length) {
			const idx = i++;
			await fn(items[idx], idx);
		}
	});
	await Promise.all(workers);
}

/** Kalendertag und Uhrzeit in Wien */
const VIENNA = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const viennaDay = (sec) => VIENNA.format(new Date(sec * 1000)).slice(0, 10);
const dayDiff = (a, b) => Math.abs(Date.parse(a) - Date.parse(b)) / 86_400_000;

/* ================================================================ Datenbank */

const db = createClient({ url: `file:${DB_FILE}`, timeout: 15_000 });
const rows = async (sql, a = []) => (await db.execute({ sql, args: a })).rows;
const first = async (sql, a = []) => (await rows(sql, a))[0];
const exec = async (sql, a = []) => (PROBE ? { lastInsertRowid: 0n } : db.execute({ sql, args: a }));
const insertId = async (sql, a) => Number((await exec(sql, a)).lastInsertRowid);

async function mapGet(key) {
	return (await first('SELECT entity_id AS id FROM import_map WHERE key = ?', [key]))?.id ?? null;
}
async function mapSet(key, entity, id) {
	await exec('INSERT OR REPLACE INTO import_map (key, entity, entity_id) VALUES (?, ?, ?)', [key, entity, id]);
}

/* ================================================================ Text */

// Emojis samt Hautfarben, Varianten-Selektoren und Verbindern
const EMOJI = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}‍︎️⃣]/gu;
const stripEmoji = (s) => s.replace(EMOJI, '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STOP = new Set(
	('aber alle als also am an auch auf aus bei beim bis da dabei damit dann das dass dem den der des die dies diese diesem diesen dieser dieses doch dort durch ein eine einem einen einer eines es für gab gegen hat hatte hatten ' +
		'hier ihr ihre im in ins ist jedoch kam kann konnte konnten mit nach nicht noch nun nur ob oder ohne sehr seit sich sie sind so sowie um und uns unser unsere unserem unseren unserer unter uhr vom von vor war waren ' +
		'was weiter wenn wer werden wie wieder wir wird wo wurde wurden zu zum zur zwei drei über feuerwehr leopoldsdorf ffleopoldsdorf feuerwehrleopoldsdorf kameraden kameradinnen heute gestern')
		.split(' ')
);
const words = (s) =>
	stripEmoji(String(s))
		.toLowerCase()
		.replace(/[^a-zäöüß0-9]+/g, ' ')
		.split(' ')
		.filter((w) => w.length >= 3 && !STOP.has(w));

const htmlText = (html) =>
	String(html)
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|h\d|li)>/gi, '\n')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&[a-z]+;|&#\d+;/gi, ' ');

/** Anteil gemeinsamer Wörter, bezogen auf den kürzeren Text */
function overlap(a, b) {
	if (!a.size || !b.size) return 0;
	let n = 0;
	for (const w of a) if (b.has(w)) n++;
	return n / Math.min(a.size, b.size);
}

/* ================================================================ Einsätze erkennen */

// "#96/26 - B1 Gefahrenmeldeanlage-Brand", "96/26 – T1 – Bergung-PKW", "27+28/26 T1 Baum"
const TITLE_RE = /^\s*(?:einsatz\s*)?#?\s*(\d{1,3}(?:\s*[+\-–&]\s*\d{1,3})*)\s*\/\s*(\d{2})\s*(?:[–—:-]+\s*)?(?:(?:BE|TE|SE|SOE)\s*-\s*)?(SOF\d|BSW|[BTS]\d)\b\s*[-–—:]?\s*(.*)$/i;
const TITLE_CODE_FIRST = /^\s*(SOF\d|BSW|[BTS][0-4])\b\s*[-–—:]?\s*(\p{Lu}.+)$/u;

function parseEinsatzTitle(line) {
	let m = line.match(TITLE_RE);
	if (m) return { nummer: `${m[1].replace(/\s+/g, '').replace(/[–&]/g, (c) => (c === '&' ? '+' : '-'))}/${m[2]}`, code: m[3].toUpperCase(), rest: m[4].trim() };
	m = line.match(TITLE_CODE_FIRST);
	if (m) return { nummer: null, code: m[1].toUpperCase(), rest: m[2].trim() };
	return null;
}

/** "Baum-umgestürzt" → "Baum umgestürzt", "Bergung-PKW" bleibt */
const niceStichwort = (s) => s.replace(/([a-zäöüß])-(?=[a-zäöüß])/g, '$1 ').replace(/\s+/g, ' ').trim();

function groupOfCode(code) {
	if (code.startsWith('SOF') || code === 'BSW') return 'sonstiges';
	return { B: 'brand', T: 'technik', S: 'schadstoff' }[code[0]] ?? 'sonstiges';
}

/** Alle Einsatznummern eines Eintrags: "27+28/26" → ["27/26", "28/26"], "3-5/25" → ["3/25","4/25","5/25"] */
function nummern(n) {
	const m = String(n ?? '').match(/^([\d+\-]+)\/(\d{2})$/);
	if (!m) return [];
	const out = [];
	for (const part of m[1].split('+')) {
		const [a, b] = part.split('-').map(Number);
		if (b && b > a && b - a < 10) for (let i = a; i <= b; i++) out.push(`${i}/${m[2]}`);
		else if (a) out.push(`${a}/${m[2]}`);
	}
	return out;
}

/* ================================================================ Instagram-Beitrag zerlegen */

const TITLE_TRIM = /^[\s+#*|•·:!–—-]+|[\s+#*|•·:–—-]+$/g;
/** Zeile aus Hashtags/Erwähnungen ("#feuerwehr #leopoldsdorf wirfüreuch") oder Trennlinie ("———") */
function isFooter(line) {
	const plain = stripEmoji(line).trim();
	if (!plain || /^[\s—–\-_=.·•*~]+$/.test(plain)) return true;
	const parts = plain.split(/\s+/);
	// "#127/24 …" ist eine Einsatznummer, kein Hashtag
	return parts.filter((p) => /^[#@][\p{L}_]/u.test(p)).length >= Math.max(1, parts.length * 0.6);
}

function shortTitle(line, max = 90) {
	// einzelner Schlusspunkt weg, Auslassungspunkte bleiben
	let t = stripEmoji(line).replace(/\s+/g, ' ').replace(TITLE_TRIM, '').trim().replace(/(?<!\.)\.$/, '');
	if (t.length <= max) return t;
	t = t.slice(0, max);
	return t.slice(0, t.lastIndexOf(' ') > 40 ? t.lastIndexOf(' ') : max).replace(/[\s,;:–-]+$/, '') + ' …';
}

/** GROSS geschriebene Titel wie "SAVE THE DATE" etwas ruhiger setzen – Abkürzungen bleiben */
function calmCaps(t) {
	const letters = t.replace(/[^\p{L}]/gu, '');
	if (letters.length < 8 || letters !== letters.toUpperCase()) return t;
	return t.toLowerCase().replace(/(^|[\s„"(-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
}

const GENERIC_TAG =
	/^(feuerwehr|ff|ffleopoldsdorf|fflepoldsdorf|feuerwehrleopoldsdorf|leopoldsdorf|leopoldsforf|leopoldsdorfbeiwien|freiwilligefeuerwehr|freiwillige|firefighter|firefighters|firebrigade|firehouse|volunteer|volunteers|austria|loweraustria|niederösterreich|noe|wirfüreuch|wirfüreinsicheresleopoldsdorf|feuerwehrfrau|firefightergirl)$/i;

const JUGEND = /jugend(?!lich)|\bfj\b|#fj|wissenstest|fertigkeitsabzeichen/;
const UEBUNG = /übung|uebung|schulung|ausbildung|lehrgang|leistungsabzeichen|bewerb|modul\b|training/;
// Ältere Einsatzberichte ohne Nummer: "Am 19.07.2019 um 21:20 Uhr wurde die Feuerwehr … alarmiert"
const EINSATZ = /\balarmiert\b|\balarmierung\b/;

/** Rubrik nach Überschrift und Hashtags, erst dann nach dem Anfang des Textes */
function classify(head, body, caption) {
	const h = stripEmoji(`${head} ${(caption.match(/#[\p{L}\p{N}_]+/gu) || []).join(' ')}`).toLowerCase();
	const title = stripEmoji(head).toLowerCase();
	const start = stripEmoji(`${head} ${body.slice(0, 400)}`).toLowerCase();
	if (JUGEND.test(h)) return 'jugend';
	if (UEBUNG.test(h)) return 'uebung';
	if ((EINSATZ.test(start) || /(?<!im )\beinsatz\b/.test(title)) && !/übung|uebung/.test(start)) return 'einsatz';
	if (JUGEND.test(start)) return 'jugend';
	// im Text nur eindeutige Hinweise – "Ausbildung" steht auch in Rückblicken und Weihnachtsbriefen
	if (/\bübung\b|übungsmittwoch|übungsabend|einsatzübung|ausbildungsmittwoch/.test(start.slice(0, 250))) return 'uebung';
	if (!/weihnacht|neujahr|advent|ostern|rückblick|brief|fest\b|feier/.test(title) && /schulung|ausbildung|lehrgang|kurs\b|modul\b/.test(start.slice(0, 200))) return 'uebung';
	return 'allgemein';
}

function parseCaption(item) {
	const caption = String(item.cap ?? '').replace(/\r/g, '').trim();
	const lines = caption.split('\n');
	// erste Zeile mit Buchstaben oder Einsatznummer (und nicht nur Hashtags) ist die Überschrift
	let head = 0;
	const isHead = (l) => (/\p{L}/u.test(stripEmoji(l)) || /\d{1,3}\s*\/\s*\d{2}\b/.test(l)) && !isFooter(l);
	while (head < lines.length && !isHead(lines[head])) head++;
	let headLine = lines[head] ?? '';
	let rest = lines.slice(head + 1);
	// "🚒🚒 Fronleichnamsmesse & Fahrzeugsegnung 🚒🚒 Die Feuerwehr nahm heute …" – Emojis trennen Überschrift und Text
	const inline = headLine.match(
		/^\s*(?:[\p{Extended_Pictographic}‍️\u{1F3FB}-\u{1F3FF}]+\s*)+([#\p{L}\p{N}][^\p{Extended_Pictographic}‍️\u{1F3FB}-\u{1F3FF}]*?)\s*(?:[\p{Extended_Pictographic}‍️\u{1F3FB}-\u{1F3FF}]+\s*)+([\p{L}„"].{20,})$/u
	);
	if (inline) {
		headLine = inline[1];
		rest = [inline[2], ...rest];
	}
	const headPlain = stripEmoji(headLine).replace(/\s+/g, ' ').trim();
	const takenDay = viennaDay(item.t);

	let category = null;
	let einsatz = null;
	let date = takenDay;
	let time = null;
	let title = '';

	const t = parseEinsatzTitle(headPlain.replace(TITLE_TRIM, ''));
	if (t) {
		category = 'einsatz';
		einsatz = { nummer: t.nummer, code: t.code, stichwort: t.rest ? niceStichwort(t.rest.replace(TITLE_TRIM, '')) : null, ort: null };
		title = einsatz.stichwort || `Einsatz ${t.code}`;
		// Kopfzeilen "🕰️: 22.09.2026, 11:07 Uhr" und "📍: MAN-Straße"
		const keep = [];
		let inHead = true;
		for (const line of rest) {
			const plain = stripEmoji(line).trim();
			if (inHead) {
				const dm = plain.match(/^:?\s*(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{2,4}),?\s*(?:um\s*)?(?:(\d{1,2})[:.](\d{2}))?\s*(?:Uhr)?\s*$/);
				if (dm) {
					const y = dm[3].length === 2 ? `20${dm[3]}` : dm[3];
					const d = `${y}-${pad(dm[2])}-${pad(dm[1])}`;
					if (dayDiff(d, takenDay) <= 30) date = d;
					if (dm[4]) time = `${pad(dm[4])}:${dm[5]}`;
					continue;
				}
				if (/^\s*📍/u.test(line) || (/^:\s*\S/.test(plain) && !einsatz.ort)) {
					einsatz.ort = plain.replace(/^[\s:]+/, '').trim() || null;
					continue;
				}
				if (!plain) continue;
				inHead = false;
			}
			keep.push(line);
		}
		rest = keep;
	} else {
		// "...::: Brandverdacht in der Feuerwehrstraße :::... Am 19.07.2019 …" – Überschrift und Text in einer Zeile
		const deco = headPlain.match(/^[\s.…:+*~=-]*:{2,}[\s.…]*(.+?)[\s.…]*:{2,}[\s.…:+*~=-]*(.*)$/);
		const sentence = headPlain.length > 90 && headPlain.match(/^(.{12,90}?[!?.])\s+(\S.*)$/);
		// "BMA Brand Am heutigen Samstag den 27.05.2023 …" – Titel ohne Satzzeichen vor dem Text
		const glued =
			headPlain.length > 90 &&
			headPlain.match(
				/^(.{5,70}?)\s+((?:Am|Heute|Gestern|Um)\s(?:\d|heutigen|gestrigen|vergangenen|frühen|späten|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Abend|Morgen|Nachmittag|Vormittag).*|(?:Die (?:Freiwillige )?Feuerwehr Leopoldsdorf|Unsere Feuerwehr)\s.*)$/
			);
		if (deco) {
			title = calmCaps(shortTitle(deco[1]));
			if (deco[2].trim()) rest = [deco[2].trim(), ...rest];
		} else if (glued && !/[.!?:,]$/.test(glued[1])) {
			title = calmCaps(shortTitle(glued[1]));
			rest = [glued[2], ...rest];
		} else if (sentence && !/\d\.$/.test(sentence[1])) {
			// lange erste Zeile: erster Satz als Titel, der Rest bleibt Text
			title = calmCaps(shortTitle(sentence[1].replace(/\.$/, '')));
			rest = [sentence[2], ...rest];
		} else {
			title = calmCaps(shortTitle(headLine));
			// Überschrift zu lang → ganz als erster Absatz behalten
			if (headPlain.length > 90) rest = [headLine, ...rest];
		}
	}

	// Hashtag-Zeilen und Trennlinien am Ende weg
	while (rest.length && isFooter(rest.at(-1))) rest.pop();
	// Hashtags am Ende der letzten Zeile weg
	if (rest.length) rest[rest.length - 1] = rest.at(-1).replace(/(\s+#[\p{L}\p{N}_]+)+\s*$/u, '');

	const body = rest.join('\n').trim();
	category ??= classify(title, body, caption);
	// ältere Einsatzberichte: "Am 19.07.2019 um 21:20 Uhr …", "Gestern um 19:50 Uhr …"
	if (category === 'einsatz' && !time) {
		const start = stripEmoji(body.slice(0, 300));
		const tm = start.match(/\bum\s*(\d{1,2})(?::(\d{2})|\.(\d{2})\s*Uhr)/);
		if (tm && Number(tm[1]) < 24) time = `${pad(tm[1])}:${tm[2] ?? tm[3]}`;
		const dm = start.match(/(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})/);
		const d = dm && `${dm[3]}-${pad(dm[2])}-${pad(dm[1])}`;
		if (d && Date.parse(d) <= Date.parse(takenDay) && dayDiff(d, takenDay) <= 14) date = d;
		else if (/^\W*gestern\b/i.test(start)) date = new Date(Date.parse(takenDay) - 86_400_000).toISOString().slice(0, 10);
	}
	// nur Hashtags ("#feuerwehrfest #leopoldsdorf") → erster aussagekräftiger Hashtag als Titel
	if (!title) {
		const tag = [...caption.matchAll(/#([\p{L}\p{N}_]{4,})/gu)].map((m) => m[1]).find((t) => !GENERIC_TAG.test(t));
		if (tag) title = tag[0].toUpperCase() + tag.slice(1);
	}
	return { title: title || `Beitrag vom ${takenDay.split('-').reverse().join('.')}`, category, date, time, einsatz, body, takenDay };
}

const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;!?)"'])/gi;

/** Beschriftung → Absätze; Leerzeile trennt Absätze, einzelne Umbrüche bleiben */
function bodyHtml(body) {
	return body
		.split(/\n\s*\n/)
		.map((para) => para.split('\n').map((l) => l.trim()).filter(Boolean))
		.filter((ls) => ls.length)
		.map((ls) => {
			const html = ls
				.map((l) => esc(l).replace(URL_RE, (u) => `<a href="${u.startsWith('www.') ? `https://${u}` : u}">${u}</a>`))
				.join('<br />');
			return `<p>${html}</p>`;
		})
		.join('\n');
}

/* ================================================================ Bilder */

async function download(url, name) {
	const file = path.join(CACHE_DIR, 'files', `${name}.jpg`);
	if (fs.existsSync(file)) return fs.readFileSync(file);
	for (let t = 1; ; t++) {
		try {
			const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60_000) });
			if (r.status === 403 || r.status === 404 || r.status === 410) throw new Error(`HTTP ${r.status} (Adresse abgelaufen? Feed neu auslesen)`);
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
			const buf = Buffer.from(await r.arrayBuffer());
			fs.mkdirSync(path.dirname(file), { recursive: true });
			fs.writeFileSync(file, buf);
			return buf;
		} catch (err) {
			if (t >= 3 || /abgelaufen/.test(err.message)) throw err;
			await sleep(1500 * t);
		}
	}
}

async function processImage(buf) {
	const meta = await sharp(buf).metadata();
	if (!meta.width || !meta.height) throw new Error('keine Bildgröße');
	const srcWidth = (meta.orientation ?? 1) >= 5 ? meta.height : meta.width;
	const widths = WIDTHS.filter((w) => w <= srcWidth);
	if (!widths.length || widths.at(-1) < Math.min(srcWidth, WIDTHS.at(-1))) widths.push(Math.min(srcWidth, WIDTHS.at(-1)));
	const unique = [...new Set(widths)].sort((a, b) => a - b);
	const file = crypto.randomBytes(10).toString('hex');
	let info;
	for (const w of unique) {
		info = await sharp(buf)
			.rotate()
			.resize({ width: w, withoutEnlargement: true })
			.webp({ quality: 78, effort: 4 })
			.toFile(path.join(UPLOAD_DIR, `${file}-${w}.webp`));
	}
	return { file, widths: unique.join(','), width: info.width, height: info.height, size: info.size };
}

/* ================================================================ Hauptprogramm */

async function main() {
	if (!args.datei || !fs.existsSync(args.datei)) throw new Error('Bitte mit --datei <feed.json> angeben, welche Instagram-Daten übernommen werden sollen.');
	if (!fs.existsSync(DB_FILE)) throw new Error(`Datenbank ${DB_FILE} fehlt – bitte die App einmal starten.`);
	const feed = JSON.parse(fs.readFileSync(args.datei, 'utf8'));
	const items = feed.items ?? feed;
	if (args.vorschau) {
		for (const item of items.filter((i) => args.vorschau === true || String(args.vorschau).split(',').includes(i.code))) {
			const p = parseCaption(item);
			console.log(`\n=== ${item.code} ${p.date} ${p.time ?? ''} [${p.category}] ${p.title}`, p.einsatz ? JSON.stringify(p.einsatz) : '');
			console.log(bodyHtml(p.body));
		}
		return;
	}
	log(`${items.length} Instagram-Beiträge in ${path.basename(args.datei)}${PROBE ? ' (nur Probe, es wird nichts geschrieben)' : ''}`);

	/* -------------------------------------------- Vorhandene Beiträge */
	const existing = (await rows('SELECT id, slug, title, category, date, einsatz_nummer AS nummer, content_html AS html FROM posts')).map((p) => {
		const text = htmlText(p.html);
		// Nummer nur im Titel ("🚨 #28/24 TE-T1-Verkehrsunfall") oder Sammelbericht ("Zahlreiche Einsätze im Schnee") mit Nummern im Text
		const inText = p.nummer
			? []
			: [...`${p.title} ${text}`.matchAll(/#\s?(\d{1,3}(?:\s*[-–+]\s*\d{1,3})?)\s*\/\s*(\d{2})\b/g)].flatMap((m) => nummern(`${m[1].replace(/\s/g, '').replace('–', '-')}/${m[2]}`));
		return { ...p, id: Number(p.id), words: new Set(words(`${p.title} ${text}`)), nummern: [...nummern(p.nummer), ...inText] };
	});
	const byNummer = new Map();
	for (const p of existing) for (const n of p.nummern) byNummer.set(n, [...(byNummer.get(n) ?? []), p]);

	// Von Hand geprüfte Fälle: { "<code>": <Beitrags-ID> } = schon vorhanden, { "<code>": "neu" } = übernehmen
	const manual = args.zuordnung ? JSON.parse(fs.readFileSync(args.zuordnung, 'utf8')) : {};
	const byId = new Map(existing.map((p) => [p.id, p]));

	/* -------------------------------------------- Abgleich */
	const result = { vorhanden: [], neu: [], pruefen: [], uebersprungen: [], schonAbgeglichen: 0 };
	for (const item of items) {
		const images = (item.media ?? []).filter((m) => !m.video && m.url);
		if (item.pt === 'clips' || !images.length) {
			result.uebersprungen.push({ item, grund: item.pt === 'clips' ? 'Reel' : 'nur Video' });
			continue;
		}
		if (await mapGet(`ig:post:${item.code}`)) {
			result.schonAbgeglichen++;
			continue;
		}
		const parsed = parseCaption(item);
		const w = new Set(words(`${parsed.title} ${parsed.body}`));
		const decided = manual[item.code];
		if (decided === 'neu') {
			result.neu.push({ item, parsed, images, score: 0 });
			continue;
		}
		if (byId.has(Number(decided))) {
			result.vorhanden.push({ item, parsed, post: byId.get(Number(decided)), score: 1, wie: 'von Hand' });
			continue;
		}

		// 1. gleiche Einsatznummer
		const own = nummern(parsed.einsatz?.nummer);
		const hit = own.flatMap((n) => byNummer.get(n) ?? []).find((p) => dayDiff(p.date, parsed.date) <= 60);
		if (hit) {
			result.vorhanden.push({ item, parsed, post: hit, score: 1, wie: `Einsatz ${parsed.einsatz.nummer}` });
			continue;
		}

		// 2. ähnlicher Text in zeitlicher Nähe
		let best = null;
		for (const p of existing) {
			const diff = dayDiff(p.date, parsed.date);
			if (diff > 30) continue;
			// verschiedene Einsatznummern → verschiedene Einsätze
			if (own.length && p.nummern.length) continue;
			let score = overlap(w, p.words);
			// sehr kurze Texte ("+++ Nachruf Robert Mantz +++") nur am selben Tag gelten lassen
			if (Math.min(w.size, p.words.size) < 5 && diff > 3) score *= 0.5;
			if (!p.words.size) score = 0;
			// mehr als zehn Tage auseinander nur bei fast gleichem Text (Bericht später auf die Webseite gestellt)
			if (diff > 10 && (score < 0.7 || own.length)) score = 0;
			if (!best || score > best.score) best = { post: p, score, diff };
		}
		if (best && best.score >= SAME) result.vorhanden.push({ item, parsed, post: best.post, score: best.score, wie: 'Text' });
		else if (best && best.score >= MAYBE) result.pruefen.push({ item, parsed, post: best.post, score: best.score });
		else result.neu.push({ item, parsed, images, post: best?.post, score: best?.score ?? 0 });
	}
	log(
		`Abgleich: ${result.vorhanden.length} schon vorhanden, ${result.neu.length} fehlen, ${result.pruefen.length} unsicher, ` +
			`${result.uebersprungen.length} Reels/Videos übersprungen, ${result.schonAbgeglichen} bei früherem Lauf erledigt`
	);

	if (args.bericht) {
		const ig = (i) => `[${i.code}](https://www.instagram.com/p/${i.code}/)`;
		const line = (r) => `| ${r.parsed.date} | ${ig(r.item)} | ${r.parsed.category} | ${r.parsed.einsatz?.nummer ?? ''} ${r.parsed.title.replace(/\|/g, '/')} |`;
		const vs = (r) => ` #${r.post.id} ${r.post.date} ${r.post.title.replace(/\|/g, '/')} | ${r.score.toFixed(2)} |`;
		const md = [
			`# Abgleich Instagram ↔ Webseite`,
			'',
			`## Fehlen auf der Webseite (${result.neu.length})`,
			'| Datum | Instagram | Rubrik | Titel | Ähnlichster auf der Webseite | Ähnlichkeit |',
			'|---|---|---|---|---|---|',
			...result.neu.map((r) => line(r) + (r.post && r.score >= 0.15 ? vs(r) : ' | |')),
			'',
			`## Unsicher (${result.pruefen.length}) – ähnlichster Webseiten-Beitrag`,
			'| Datum | Instagram | Rubrik | Titel | Webseite | Ähnlichkeit |',
			'|---|---|---|---|---|---|',
			...result.pruefen.map((r) => line(r) + vs(r)),
			'',
			`## Schon vorhanden (${result.vorhanden.length})`,
			'| Datum | Instagram | Rubrik | Titel | Webseite | Ähnlichkeit |',
			'|---|---|---|---|---|---|',
			...result.vorhanden.map((r) => line(r) + vs(r)),
			'',
			`## Übersprungen (${result.uebersprungen.length})`,
			...result.uebersprungen.map((r) => `- ${viennaDay(r.item.t)} ${ig(r.item)} ${r.grund}: ${shortTitle((r.item.cap ?? '').split('\n')[0], 70)}`)
		].join('\n');
		fs.writeFileSync(args.bericht, md);
		log(`Bericht: ${args.bericht}`);
	}
	if (PROBE) return;

	/* -------------------------------------------- Abgleich merken */
	for (const r of result.vorhanden) await mapSet(`ig:post:${r.item.code}`, 'post', r.post.id);

	/* -------------------------------------------- Einsatzarten ergänzen */
	const arten = new Map((await rows('SELECT id, code FROM einsatzarten')).map((r) => [r.code, Number(r.id)]));
	let maxSort = Number((await first('SELECT coalesce(max(sort_order), 0) AS m FROM einsatzarten')).m);
	const LABEL = { brand: 'Brandeinsatz', technik: 'Technischer Einsatz', schadstoff: 'Schadstoffeinsatz', sonstiges: 'Sonstiger Einsatz' };
	for (const { parsed } of result.neu) {
		const code = parsed.einsatz?.code;
		if (!code || arten.has(code)) continue;
		const group = groupOfCode(code);
		const id = await insertId('INSERT INTO einsatzarten (code, label, "group", counts_in_stats, sort_order, active) VALUES (?, ?, ?, 1, ?, 1)', [
			code,
			`${LABEL[group]} Stufe ${code.replace(/^\D+/, '')}`,
			group,
			++maxSort
		]);
		arten.set(code, id);
		log(`Einsatzart ${code} ergänzt`);
	}

	/* -------------------------------------------- Bilder */
	fs.mkdirSync(UPLOAD_DIR, { recursive: true });
	const media = new Map();
	const todo = result.neu.flatMap((r) => r.images.map((m) => ({ ...m, taken: r.item.t * 1000 })));
	let done = 0;
	let failed = 0;
	await pool(todo, PARALLEL, async (m) => {
		const key = `ig:img:${m.pk}`;
		const known = await mapGet(key);
		if (known) {
			media.set(m.pk, Number(known));
			return;
		}
		try {
			const p = await processImage(await download(m.url, m.pk));
			const id = await insertId(
				"INSERT INTO media (kind, file, original_name, widths, width, height, size_bytes, alt, created_at) VALUES ('bild', ?, ?, ?, ?, ?, ?, '', ?)",
				[p.file, `instagram-${m.pk}.jpg`, p.widths, p.width, p.height, p.size, m.taken]
			);
			await mapSet(key, 'media', id);
			media.set(m.pk, id);
		} catch (err) {
			failed++;
			console.warn(`  ! Bild übersprungen: ${m.pk} (${err.message})`);
		}
		if (++done % 100 === 0) log(`  ${done}/${todo.length} Bilder verarbeitet`);
	});

	/* -------------------------------------------- Beiträge schreiben */
	const usedSlugs = new Set((await rows('SELECT slug FROM posts')).map((r) => r.slug));
	let n = 0;
	for (const { item, parsed, images } of result.neu.sort((a, b) => a.item.t - b.item.t)) {
		const ids = images.map((m) => media.get(m.pk)).filter(Boolean);
		const e = parsed.einsatz;
		const baseSlug =
			(e ? slugify([e.nummer?.replace(/\//g, '-'), e.code, e.stichwort].filter(Boolean).join(' ')) : slugify(parsed.title)) || `beitrag-${parsed.date}`;
		let slug = baseSlug;
		for (let i = 2; usedSlugs.has(slug); i++) slug = `${baseSlug}-${i}`;
		usedSlugs.add(slug);
		const created = item.t * 1000;
		const id = await insertId(
			`INSERT INTO posts (slug, title, category, date, time, status, pinned, summary, content_html, cover_media_id,
				einsatz_nummer, einsatzart_id, stichwort, einsatzort, published_at, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, 'veroeffentlicht', 0, '', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				slug,
				parsed.title.slice(0, 200),
				parsed.category,
				parsed.date,
				parsed.time,
				bodyHtml(parsed.body),
				ids[0] ?? null,
				e?.nummer ?? null,
				e?.code ? (arten.get(e.code) ?? null) : null,
				e?.stichwort ?? null,
				e?.ort ?? null,
				created,
				created,
				created
			]
		);
		for (const [i, mid] of ids.slice(1).entries()) await exec('INSERT OR IGNORE INTO post_images (post_id, media_id, sort_order) VALUES (?, ?, ?)', [id, mid, i]);
		await mapSet(`ig:post:${item.code}`, 'post', id);
		if (++n % 100 === 0) log(`  ${n}/${result.neu.length} Beiträge eingetragen`);
	}
	log(`Fertig. ${n} Beiträge und ${media.size} Bilder übernommen (${failed} Bilder nicht ladbar). Unsichere Fälle wurden nicht übernommen.`);
}

main().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
