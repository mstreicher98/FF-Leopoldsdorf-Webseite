#!/usr/bin/env node
/**
 * Übernimmt die Inhalte der bisherigen WordPress-Seite (ff-leopoldsdorf.net):
 * Beiträge samt Bildern und PDFs, Mannschaft und Kommando, Fuhrpark, Termine,
 * Textseiten sowie Weiterleitungen von den alten Adressen.
 *
 *   node scripts/import-wordpress.mjs            alles übernehmen
 *   node scripts/import-wordpress.mjs --probe    nur prüfen, nichts schreiben
 *   Optionen: --quelle <url>  --nur beitraege,mitglieder,fahrzeuge,seiten,termine
 *             --parallel <n>  --neu (Daten neu abrufen statt Zwischenspeicher)
 *
 * Im Docker-Container: docker compose exec app node scripts/import-wordpress.mjs
 *
 * Bereits Übernommenes wird übersprungen (Tabelle import_map) – ein Abbruch
 * lässt sich durch erneutes Starten fortsetzen. Heruntergeladene Dateien liegen
 * zwischengespeichert in <DATA_DIR>/import-cache und können danach gelöscht werden.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import heicDecode from 'heic-decode';
import sanitizeHtml from 'sanitize-html';
import sharp from 'sharp';

/* ================================================================ Einstellungen */

const args = Object.fromEntries(
	process.argv.slice(2).reduce((acc, a, i, all) => {
		if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
		return acc;
	}, [])
);
const SOURCE = String(args.quelle || 'https://ff-leopoldsdorf.net').replace(/\/+$/, '');
const SOURCE_HOST = new URL(SOURCE).host.replace(/^www\./, '');
const PROBE = !!args.probe;
const PARALLEL = Number(args.parallel) || 6;
const ONLY = typeof args.nur === 'string' ? new Set(args.nur.split(',')) : null;
const want = (part) => !ONLY || ONLY.has(part);

const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
const DB_FILE = path.join(DATA_DIR, 'feuerwehr.db');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const CACHE_DIR = path.join(DATA_DIR, 'import-cache');
const WIDTHS = [400, 800, 1600];
const UA = 'Mozilla/5.0 (Datenuebernahme FF Leopoldsdorf)';

const DIENSTGRADE = new Set(
	'JFM JFM1 JFM2 JFM3 JFM4 PFM FM OFM HFM LM OLM HLM BM OBM HBM VM OVM HVM V OV HV SB ASB BSB BI OBI HBI ABI BR BR2 OBR'.split(' ')
);

/* WordPress-Kategorien → neue Kategorie (Unterkategorien erben vom Elternteil) */
const CAT_EINSATZ = [13, 80];
const CAT_UEBUNG = [14];
const CAT_JUGEND = [17];
const CAT_VERANSTALTUNG = [83];
const CAT_INTERN = 99;
const CAT_BUERGERSERVICE = 85;
const CAT_FAHRZEUGE = [7, 21];

/* Beiträge, die zu Seiten werden oder nicht übernommen werden */
const SKIP_POSTS = new Set(['slider-test', 'rezept-nudelsalat', 'impressum-2', 'kommando-2']);
const PAGE_POSTS = {
	'unser-auftrag': 'ueber-uns',
	notruf: 'notruf',
	sirenensignale: 'sirenensignale',
	'loeschen-von-fettbraenden': 'fettbraende',
	'verhalten-im-brandfall': 'verhalten-im-brandfall',
	'waldbrandverordnung-2': 'waldbrandverordnung',
	'handhabung-feuerloscher': 'richtig-loeschen',
	'richtig-loeschen': 'richtig-loeschen',
	'fmd-raum': 'sicherheitszentrum',
	fahrzeughalle: 'sicherheitszentrum'
};
const SACHGEBIET_RE = /^sachgebiet-/;

/* ================================================================ Hilfen */

const t0 = Date.now();
const log = (...m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s]`, ...m);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»', bdquo: '„', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', euro: '€', deg: '°', times: '×' };
function decodeEntities(s) {
	return String(s ?? '')
		.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
		.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
		.replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);
}
const textOf = (html) =>
	decodeEntities(
		String(html)
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<\/(p|h\d|li|div)>/gi, '\n')
			.replace(/<[^>]+>/g, '')
	)
		.replace(/[ \t ]+/g, ' ')
		.replace(/\n\s+/g, '\n')
		.trim();

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

function normalizePath(p) {
	let out = p;
	try {
		out = decodeURIComponent(out);
	} catch {
		/* so lassen */
	}
	out = out.toLowerCase();
	if (out.length > 1) out = out.replace(/\/+$/, '');
	return out || '/';
}

/** Adresse vervollständigen; eigene Domain immer als https://ff-leopoldsdorf.net */
function absolutize(u) {
	if (!u) return null;
	try {
		const url = new URL(decodeEntities(u).trim(), `${SOURCE}/`);
		if (url.host.replace(/^www\./, '') === SOURCE_HOST) {
			url.protocol = 'https:';
			url.host = SOURCE_HOST;
		}
		return url.href;
	} catch {
		return null;
	}
}
const isOwn = (u) => {
	try {
		return new URL(u).host.replace(/^www\./, '') === SOURCE_HOST;
	} catch {
		return false;
	}
};

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

/* ================================================================ Abrufen */

async function httpGet(url, { json = false, tries = 4 } = {}) {
	for (let t = 1; ; t++) {
		try {
			const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(90_000) });
			if (r.status === 404 || r.status === 410 || r.status === 403) return null;
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
			return json ? { data: await r.json(), headers: r.headers } : Buffer.from(await r.arrayBuffer());
		} catch (err) {
			if (t >= tries) throw new Error(`${url}: ${err.message}`);
			await sleep(1500 * t);
		}
	}
}

async function fetchAll(type, extra = '') {
	const file = path.join(CACHE_DIR, 'json', `${type}.json`);
	if (!args.neu && fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
	const out = [];
	for (let page = 1; ; page++) {
		const res = await httpGet(`${SOURCE}/wp-json/wp/v2/${type}?per_page=100&page=${page}${extra}`, { json: true });
		if (!res) break;
		out.push(...res.data);
		const pages = Number(res.headers.get('x-wp-totalpages') || 1);
		if (page >= pages) break;
	}
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, JSON.stringify(out));
	log(`${type}: ${out.length} abgerufen`);
	return out;
}

/** Datei herunterladen, mit Zwischenspeicher */
async function download(url) {
	const ext = (url.split('?')[0].match(/\.([a-z0-9]{2,5})$/i) || [, 'bin'])[1].toLowerCase();
	const file = path.join(CACHE_DIR, 'files', `${sha1(url)}.${ext}`);
	if (fs.existsSync(file)) return fs.readFileSync(file);
	const buf = await httpGet(url);
	if (!buf) return null;
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, buf);
	return buf;
}

/* ================================================================ Datenbank */

const db = createClient({ url: `file:${DB_FILE}`, timeout: 15_000 });
const rows = async (sql, a = []) => (await db.execute({ sql, args: a })).rows;
const first = async (sql, a = []) => (await rows(sql, a))[0];
const exec = async (sql, a = []) => (PROBE ? { lastInsertRowid: 0n } : db.execute({ sql, args: a }));
const insertId = async (sql, a) => Number((await exec(sql, a)).lastInsertRowid);
const bool = (b) => (b ? 1 : 0);

async function mapGet(key) {
	return (await first('SELECT entity_id AS id FROM import_map WHERE key = ?', [key]))?.id ?? null;
}
async function mapSet(key, entity, id) {
	await exec('INSERT OR REPLACE INTO import_map (key, entity, entity_id) VALUES (?, ?, ?)', [key, entity, id]);
}
async function addRedirect(from, to) {
	const f = normalizePath(from);
	if (!f || f === '/' || normalizePath(to) === f) return;
	await exec('INSERT OR REPLACE INTO redirects (from_path, to_path) VALUES (?, ?)', [f, to]);
}

/* ================================================================ Bilder & Dokumente */

const IMG_EXT = /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tiff?)$/i;
const DOC_EXT = /\.pdf$/i;
const stripSize = (u) => u.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '');
const imgKey = (u) =>
	'wp:img:' +
	stripSize(u)
		.replace(/-scaled(?=\.[a-z0-9]+$)/i, '')
		.replace(/^https?:\/\/(www\.)?/, '')
		.toLowerCase();

/** Beste Adresse eines Bildes: verlinktes Original > größte srcset-Variante > src ohne Größe > src */
function imageCandidates({ src, srcset, href }) {
	const c = [];
	if (href && IMG_EXT.test(href.split('?')[0])) c.push({ url: href, w: 1e6 });
	for (const part of String(srcset || '').split(',')) {
		const [u, w] = part.trim().split(/\s+/);
		if (u) c.push({ url: u, w: parseInt(w, 10) || 0 });
	}
	if (src) c.push({ url: stripSize(src), w: 1e6 - 1 }, { url: src, w: 1 });
	const list = c
		.map((x) => ({ ...x, url: absolutize(x.url) }))
		.filter((x) => x.url && !/s\.w\.org|gravatar|emoji|warnwidget/i.test(x.url) && IMG_EXT.test(x.url.split('?')[0]));
	// HEIC kann sharp nicht lesen → JPEG-Varianten von WordPress vorziehen
	const plain = list.filter((x) => !/\.(heic|heif)$/i.test(x.url));
	const use = (plain.length ? plain : list).sort((a, b) => b.w - a.w).map((x) => x.url);
	return [...new Set(use)];
}

const mediaByKey = new Map();
const pendingImages = new Map();
const pendingDocs = new Map();

function wantImage(img) {
	if (!img.cands.length) return null;
	if (!pendingImages.has(img.key)) pendingImages.set(img.key, img);
	return img.key;
}
function wantDoc(url) {
	const key = `wp:doc:${url.toLowerCase()}`;
	if (!pendingDocs.has(key)) pendingDocs.set(key, url);
	return key;
}

/** HEIC (iPhone) kann sharp nicht lesen – mit libheif (WebAssembly) in ein JPEG umwandeln */
async function heicToJpeg(buf) {
	const { width, height, data } = await heicDecode({ buffer: buf });
	return sharp(Buffer.from(data.buffer), { raw: { width, height, channels: 4 } }).jpeg({ quality: 92 }).toBuffer();
}
const isHeif = (buf) => /^ftyp(heic|heix|hevc|hevx|mif1|msf1)/.test(buf.subarray(4, 12).toString('latin1'));

async function processImage(input) {
	const buf = isHeif(input) ? await heicToJpeg(input) : input;
	const meta = await sharp(buf, { animated: false }).metadata();
	if (!meta.width || !meta.height) throw new Error('keine Bildgröße');
	const srcWidth = (meta.orientation ?? 1) >= 5 ? meta.height : meta.width;
	const widths = WIDTHS.filter((w) => w <= srcWidth);
	if (!widths.length || widths[widths.length - 1] < Math.min(srcWidth, WIDTHS[WIDTHS.length - 1])) widths.push(Math.min(srcWidth, WIDTHS.at(-1)));
	const unique = [...new Set(widths)].sort((a, b) => a - b);
	const file = crypto.randomBytes(10).toString('hex');
	let info;
	for (const w of unique) {
		info = await sharp(buf, { animated: false })
			.rotate()
			.resize({ width: w, withoutEnlargement: true })
			.webp({ quality: 78, effort: 4 })
			.toFile(path.join(UPLOAD_DIR, `${file}-${w}.webp`));
	}
	return { file, widths: unique.join(','), width: info.width, height: info.height, size: info.size };
}

const stats = { images: 0, imagesFailed: 0, docs: 0, docsFailed: 0 };

async function importPendingMedia() {
	const imgs = [];
	for (const [key, img] of pendingImages) {
		const id = await mapGet(key);
		if (id) mediaByKey.set(key, id);
		else imgs.push(img);
	}
	const docs = [];
	for (const [key, url] of pendingDocs) {
		const id = await mapGet(key);
		if (id) mediaByKey.set(key, id);
		else docs.push({ key, url });
	}
	log(`Bilder: ${pendingImages.size} benötigt, ${imgs.length} neu. Dokumente: ${pendingDocs.size} benötigt, ${docs.length} neu.`);
	if (PROBE) return;
	fs.mkdirSync(UPLOAD_DIR, { recursive: true });

	/** Erste Adresse, die sich laden und umrechnen lässt; wirft den letzten Fehler */
	async function importFrom(img, cands) {
		let lastErr = new Error('nicht gefunden');
		for (const url of cands) {
			try {
				const buf = await download(url);
				if (!buf) continue;
				const p = await processImage(buf);
				const id = await insertId(
					"INSERT INTO media (kind, file, original_name, widths, width, height, size_bytes, alt, created_at) VALUES ('bild', ?, ?, ?, ?, ?, ?, ?, ?)",
					[p.file, img.name.slice(0, 200), p.widths, p.width, p.height, p.size, img.alt.slice(0, 300), img.date || Date.now()]
				);
				await mapSet(img.key, 'media', id);
				mediaByKey.set(img.key, id);
				stats.images++;
				return;
			} catch (err) {
				lastErr = err;
			}
		}
		throw lastErr;
	}

	let done = 0;
	await pool(imgs, PARALLEL, async (img) => {
		try {
			await importFrom(img, img.cands);
		} catch (err) {
			// iPhone-Fotos (HEIC) kann sharp nicht lesen – oft gibt es in WordPress eine umgewandelte Fassung
			const alt = /\.(heic|heif)$/i.test(img.cands[0]) ? await convertedAlternative(img.cands[0]) : [];
			try {
				if (!alt.length) throw err;
				await importFrom(img, alt);
			} catch (e) {
				stats.imagesFailed++;
				console.warn(`  ! Bild übersprungen: ${img.cands[0]} (${e.message})`);
			}
		}
		if (++done % 100 === 0) log(`  ${done}/${imgs.length} Bilder verarbeitet`);
	});

	await pool(docs, PARALLEL, async ({ key, url }) => {
		try {
			const buf = await download(url);
			if (!buf || buf.subarray(0, 5).toString('latin1') !== '%PDF-') throw new Error('kein PDF');
			const name = decodeURIComponent(path.basename(new URL(url).pathname));
			const file = `${crypto.randomBytes(10).toString('hex')}-${slugify(name.replace(/\.pdf$/i, ''), 60) || 'dokument'}.pdf`;
			fs.writeFileSync(path.join(UPLOAD_DIR, file), buf);
			const id = await insertId(
				"INSERT INTO media (kind, file, original_name, widths, width, height, size_bytes, alt, created_at) VALUES ('dokument', ?, ?, '', 0, 0, ?, '', ?)",
				[file, name.slice(0, 200), buf.length, Date.now()]
			);
			await mapSet(key, 'media', id);
			mediaByKey.set(key, id);
			stats.docs++;
		} catch (err) {
			stats.docsFailed++;
			console.warn(`  ! Dokument übersprungen: ${url} (${err.message})`);
		}
	});
}

/** Sucht in der WordPress-Mediathek eine JPEG/PNG-Fassung mit gleichem Dateinamen */
async function convertedAlternative(url) {
	const base = path.basename(new URL(url).pathname).replace(/\.(heic|heif)$/i, '');
	const res = await httpGet(`${SOURCE}/wp-json/wp/v2/media?search=${encodeURIComponent(base)}&per_page=20&_fields=source_url,mime_type,media_details`, { json: true }).catch(() => null);
	for (const m of res?.data ?? []) {
		if (/heic|heif/i.test(m.mime_type)) continue;
		const name = path.basename(new URL(m.source_url).pathname).replace(/(-scaled)?\.[a-z0-9]+$/i, '');
		if (name !== base) continue;
		const sizes = Object.values(m.media_details?.sizes ?? {}).sort((a, b) => b.width - a.width).map((s) => s.source_url);
		return [...new Set([...sizes, m.source_url])];
	}
	return [];
}

const mediaRows = new Map();
async function mediaRow(key) {
	const id = mediaByKey.get(key);
	if (!id) return null;
	if (!mediaRows.has(id)) mediaRows.set(id, await first('SELECT id, kind, file, widths, width, height, alt FROM media WHERE id = ?', [id]));
	return mediaRows.get(id);
}

/* ================================================================ HTML umwandeln */

function embedLink(raw) {
	let url = absolutize(raw) || raw;
	const yt = url.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{6,})/);
	if (yt) url = `https://www.youtube.com/watch?v=${yt[1]}`;
	const label = /youtu/.test(url)
		? 'Video auf YouTube ansehen'
		: /facebook/.test(url)
			? 'Auf Facebook ansehen'
			: /instagram/.test(url)
				? 'Auf Instagram ansehen'
				: /vimeo/.test(url)
					? 'Video auf Vimeo ansehen'
					: 'Inhalt ansehen';
	return `<p><a href="${url}">${label}</a></p>`;
}

/**
 * WordPress-HTML → erlaubtes HTML der neuen Seite.
 * Bilder werden gesammelt und durch Platzhalter [[BILD:n]] ersetzt,
 * PDF-Links durch /__dok__/<schlüssel>, interne Links auf neue Adressen umgebogen.
 */
function convert(html, { linkMap, date }) {
	const images = [];
	let h = String(html || '');
	h = h.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '');
	// Emojis sind in WordPress oft Bilder – als Zeichen behalten
	h = h.replace(/<img\b[^>]*class="[^"]*(?:wp-smiley|emoji)[^"]*"[^>]*>/gi, (img) => (img.match(/alt="([^"]*)"/) || [, ''])[1]);
	// Überbleibsel der früheren Joomla-Seite
	h = h.replace(/\{youtube\}\s*([\w-]{6,})(?:\|[^{]*)?\{\/youtube\}/gi, (_, id) => embedLink(`https://www.youtube.com/watch?v=${id}`));
	h = h.replace(/\{([a-z0-9_]+)\}[^{}]*\{\/\1\}/gi, '').replace(/\{\/?[a-z][a-z0-9_-]*(?:[\s|:=][^{}]*)?\}/gi, '');
	// Datei-Blöcke (PDF mit "Herunterladen"-Knopf) → ein einzelner Link
	h = h.replace(/<div[^>]*class="[^"]*wp-block-file[^"]*"[^>]*>[\s\S]*?(<a\b[^>]*href="[^"]+"[^>]*>[\s\S]*?<\/a>)[\s\S]*?<\/div>/gi, '<p>$1</p>');
	// Eingebettete Inhalte → einfacher Link (keine Fremddienste einbetten)
	h = h.replace(/<figure[^>]*wp-block-embed[^>]*>[\s\S]*?wp-block-embed__wrapper">\s*([^<\s]+)\s*<\/div>[\s\S]*?<\/figure>/gi, (_, u) => embedLink(u));
	h = h.replace(/<iframe\b[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/iframe>/gi, (_, u) => embedLink(u));
	h = h.replace(/<figcaption[\s\S]*?<\/figcaption>/gi, '');

	const token = (img, href) => {
		const attr = (n) => (img.match(new RegExp(`\\s${n}="([^"]*)"`, 'i')) || [])[1];
		const cands = imageCandidates({ src: attr('src') || attr('data-src') || attr('data-lazy-src'), srcset: attr('srcset') || attr('data-srcset'), href });
		if (!cands.length) return ' ';
		let name = cands[0];
		try {
			name = decodeURIComponent(path.basename(new URL(cands[0]).pathname));
		} catch {
			/* Name wie er ist */
		}
		images.push({ key: imgKey(cands[0]), cands, alt: decodeEntities(attr('alt') || '').trim(), name, date });
		return ` [[BILD:${images.length - 1}]] `;
	};
	h = h.replace(/<a\b[^>]*href="([^"]*)"[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi, (_, href, img) => token(img, absolutize(href)));
	h = h.replace(/<img\b[^>]*>/gi, (img) => token(img, null));
	// Tabellen gibt es im Editor nicht – Zeilen werden Absätze
	h = h.replace(/<\/t[dh]>/gi, ' </td>').replace(/<tr\b[^>]*>/gi, '<p>').replace(/<\/tr>/gi, '</p>');

	const out = sanitizeHtml(h, {
		allowedTags: ['p', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'hr', 'br'],
		allowedAttributes: { a: ['href'], ol: ['start'] },
		allowedSchemes: ['http', 'https', 'mailto', 'tel'],
		transformTags: {
			h1: 'h2',
			h5: 'h4',
			h6: 'h4',
			b: 'strong',
			i: 'em',
			a: (tagName, attribs) => {
				const target = mapLink(attribs.href, linkMap);
				return target ? { tagName: 'a', attribs: { href: target } } : { tagName: 'span', attribs: {} };
			}
		},
		exclusiveFilter: (frame) => ['p', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 'a', 'li', 'blockquote'].includes(frame.tag) && !frame.text.trim()
	});
	return { html: out, images };
}

/** Linkziel umschreiben: eigene Seite → neue Adresse, PDFs → Mediathek, Bilder → weg */
function mapLink(href, linkMap) {
	if (!href) return null;
	if (/^(mailto|tel):/i.test(href)) return href;
	const url = absolutize(href);
	if (!url || !/^https?:/.test(url)) return null;
	if (!isOwn(url)) return url;
	const u = new URL(url);
	if (u.pathname.startsWith('/wp-content/uploads/')) {
		if (DOC_EXT.test(u.pathname)) return `/__dok__/${encodeURIComponent(wantDoc(url))}`;
		return null;
	}
	return linkMap.get(normalizePath(u.pathname)) ?? null;
}

/** Platzhalter auflösen: Bilder inline oder entfernen, Dokument-Links auf die Mediathek */
async function finalize(html, images, { inline }) {
	let out = html;
	const parts = out.split(/\s*\[\[BILD:(\d+)\]\]\s*/);
	if (parts.length > 1) {
		let res = parts[0];
		for (let i = 1; i < parts.length; i += 2) {
			let tag = ' ';
			if (inline) {
				const m = await mediaRow(images[Number(parts[i])].key);
				if (m?.kind === 'bild') {
					const w = Math.max(...m.widths.split(',').map(Number).filter((x) => x <= 1600));
					tag = `<img src="/medien/${m.file}-${w}.webp" alt="${String(images[Number(parts[i])].alt || m.alt || '').replace(/"/g, '&quot;')}" />`;
				}
			}
			res += tag + parts[i + 1];
		}
		out = res;
	}
	const docRefs = [...out.matchAll(/\/__dok__\/([^"]+)/g)];
	for (const [whole, enc] of docRefs) {
		const m = await mediaRow(decodeURIComponent(enc));
		out = out.replace(whole, m ? `/medien/${m.file}` : '#');
	}
	out = out.replace(/<a href="#">([\s\S]*?)<\/a>/g, '$1');
	out = cleanupHtml(out, { inline });
	// Bilder aus Absätzen lösen, leere Absätze und doppelte Umbrüche entfernen
	out = out
		.replace(/<p>\s*(<img [^>]+>)\s*<\/p>/g, '$1')
		.replace(/<p>(\s|&nbsp;|<br \/>)*<\/p>/g, '')
		.replace(/(<br \/>\s*){3,}/g, '<br /><br />')
		.replace(/<p>\s*(<br \/>\s*)+/g, '<p>')
		.replace(/(\s*<br \/>)+\s*<\/p>/g, '</p>')
		.trim();
	return out;
}

/**
 * Aufräumen nach dem Umwandeln: "Weiterlesen"-Links, Überschriften von Galerien
 * (die Bilder stehen in der Galerie unter dem Text), lose Links in Absätze, Leerzeilen.
 */
function cleanupHtml(html, { inline = false } = {}) {
	let out = html.replace(/<a\b[^>]*>\s*Weiterlesen[\s\S]*?<\/a>/gi, '');
	if (!inline) out = out.replace(/<h[2-4]>\s*(Galerie|Bildergalerie|Bilder|Fotos|Impressionen)\s*:?\s*<\/h[2-4]>/gi, '');
	return out
		.replace(/^(\s*)(<a\b[^>]*>[\s\S]*?<\/a>)\s*$/gm, '$1<p>$2</p>')
		.replace(/<p>\s*<\/p>/g, '')
		.replace(/\n\s*\n+/g, '\n')
		.trim();
}

/** "01.01.2013 – KFZ Bergung" → "KFZ Bergung" (das Datum steht ohnehin am Beitrag) */
function stripTitleDate(title) {
	const rest = title.replace(/^\s*\d{1,2}[.\s]\s?\d{1,2}[.\s]\s?(?:\d{4}|\d{2})\b\s*[–—:-]?\s*/, '').trim();
	return rest.length >= 3 ? rest.replace(/^[a-zäöü]/, (c) => c.toUpperCase()) : title;
}

/** Wiederholte Blöcke (z. B. doppelte Zeitleisten-Überschriften von WordPress) entfernen */
function dedupeBlocks(html) {
	const blocks = html.match(/<(p|h2|h3|h4|ul|ol|blockquote)\b[\s\S]*?<\/\1>|<img [^>]+>|<hr \/>/g) || [];
	const recent = [];
	const out = [];
	for (const b of blocks) {
		const key = b.startsWith('<img') ? b : textOf(b);
		if (key && recent.includes(key)) continue;
		out.push(b);
		recent.push(key);
		if (recent.length > 4) recent.shift();
	}
	return out.join('\n');
}

/* ================================================================ Einsätze erkennen */

const TITLE_RE =
	/^\s*(\d{1,3}(?:\s*[+\-–]\s*\d{1,3})*)\s*\/\s*(\d{2})\s*(?:[–—-]+\s*)?(?:(?:BE|TE|SE|SOE)\s*-\s*)?(SOF\d|BSW|[BTS]\d)\b\s*[-–—:]?\s*(.*)$/i;
const TITLE_CODE_FIRST = /^\s*(SOF\d|BSW|[BTS][0-4])\b\s*[-–—:]?\s*(.+)$/i;

function parseEinsatzTitle(title) {
	let m = title.match(TITLE_RE);
	if (m) return { nummer: `${m[1].replace(/\s+/g, '').replace('–', '-')}/${m[2]}`, code: m[3].toUpperCase(), rest: m[4].trim() };
	m = title.match(TITLE_CODE_FIRST);
	if (m) return { nummer: null, code: m[1].toUpperCase(), rest: m[2].trim() };
	return null;
}

/** "Baum-umgestürzt" → "Baum umgestürzt", "Bergung-PKW" bleibt */
const niceStichwort = (s) => s.replace(/([a-zäöüß])-(?=[a-zäöüß])/g, '$1 ').replace(/\s+/g, ' ').trim();

function groupOfCode(code) {
	if (code.startsWith('SOF') || code === 'BSW') return 'sonstiges';
	return { B: 'brand', T: 'technik', S: 'schadstoff' }[code[0]] ?? 'sonstiges';
}

const pad = (n) => String(n).padStart(2, '0');

/** Alarmdatum/-zeit und Einsatzort aus dem ersten Absatz ("🕰️: 19.09.2026, 22:02 Uhr / 📍: Himbergerstraße") */
function parsePreamble(html, postDay) {
	const firstP = html.match(/^\s*<p>([\s\S]*?)<\/p>/);
	if (firstP) {
		const t = textOf(firstP[1]);
		const m = t.match(/^[^\d]{0,8}(\d{1,2})\.(\d{1,2})\.(\d{4}),?\s*(?:um\s*)?(\d{1,2})[:.](\d{2})\s*Uhr\s*\n?\s*(?:[^\wÄÖÜäöü\n]{0,6}\s*:?\s*)?([^\n]*)/u);
		if (m) {
			return {
				day: `${m[3]}-${pad(m[2])}-${pad(m[1])}`,
				time: `${pad(m[4])}:${m[5]}`,
				ort: m[6].replace(/^[\s:]+/, '').trim() || null,
				html: html.slice(firstP[0].length).trim()
			};
		}
	}
	// Ältere Berichte: "Am 25.12.2012 um 19:48 Uhr …"
	const text = textOf(html).slice(0, 600);
	const m = text.match(/(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})\s*(?:,|um|gegen)?\s*(?:um\s*|gegen\s*)?(\d{1,2})[:.](\d{2})\s*Uhr/);
	if (m) {
		const day = `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
		const diff = (Date.parse(postDay) - Date.parse(day)) / 86_400_000;
		if (diff >= -1 && diff <= 14) return { day, time: `${pad(m[4])}:${m[5]}`, ort: null, html };
	}
	const tm = text.match(/\bum\s*(\d{1,2})[:.](\d{2})\s*Uhr/);
	// "am Samstag, dem 28. März, um 19:38 Uhr" – Monatsname ohne Jahr
	const named = text.match(/(\d{1,2})\.\s*(Jänner|Januar|Februar|Feber|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\b(?:\s+(\d{4}))?/i);
	let day = postDay;
	if (named) {
		const month = MONATE[named[2].toLowerCase()];
		let year = Number(named[3] || postDay.slice(0, 4));
		if (!named[3] && month > Number(postDay.slice(5, 7))) year--;
		const candidate = `${year}-${pad(month)}-${pad(named[1])}`;
		const diff = (Date.parse(postDay) - Date.parse(candidate)) / 86_400_000;
		if (diff >= -1 && diff <= 14) day = candidate;
	}
	if (tm && Number(tm[1]) < 24) return { day, time: `${pad(tm[1])}:${tm[2]}`, ort: null, html };
	if (day !== postDay) return { day, time: null, ort: null, html };
	return { day: postDay, time: null, ort: null, html };
}

/* ================================================================ Hauptprogramm */

async function main() {
	if (!fs.existsSync(DB_FILE)) throw new Error(`Datenbank ${DB_FILE} fehlt – bitte die App einmal starten.`);
	const tables = new Set((await rows("SELECT name FROM sqlite_master WHERE type = 'table'")).map((r) => r.name));
	const cols = new Set((await rows('PRAGMA table_info(media)')).map((r) => r.name));
	if (!tables.has('import_map') || !tables.has('redirects') || !cols.has('kind')) {
		throw new Error('Die Datenbank ist nicht auf dem neuesten Stand – bitte die App einmal starten (Migrationen).');
	}
	log(`Quelle ${SOURCE}, Daten ${DATA_DIR}${PROBE ? ' (nur Probe, es wird nichts geschrieben)' : ''}`);

	const [categories, pages, posts] = await Promise.all([fetchAll('categories'), fetchAll('pages'), fetchAll('posts')]);
	const catParent = new Map(categories.map((c) => [c.id, c.parent]));
	const root = (id) => {
		let c = id;
		while (catParent.get(c)) c = catParent.get(c);
		return c;
	};
	const inCat = (p, list) => p.categories.some((c) => list.includes(c) || list.includes(root(c)));
	const pageBySlug = new Map(pages.map((p) => [p.slug, p]));
	const postBySlug = new Map(posts.map((p) => [decodeURIComponent(p.slug), p]));

	// Titelbilder: Adressen und Beschreibungen der Medien-Einträge
	const featuredIds = [...new Set(posts.map((p) => p.featured_media).filter(Boolean))];
	const featured = new Map();
	const mediaFile = path.join(CACHE_DIR, 'json', 'featured.json');
	let mediaItems = !args.neu && fs.existsSync(mediaFile) ? JSON.parse(fs.readFileSync(mediaFile, 'utf8')) : null;
	if (!mediaItems) {
		mediaItems = [];
		for (let i = 0; i < featuredIds.length; i += 100) {
			const res = await httpGet(`${SOURCE}/wp-json/wp/v2/media?per_page=100&include=${featuredIds.slice(i, i + 100).join(',')}`, { json: true });
			if (res) mediaItems.push(...res.data);
		}
		fs.writeFileSync(mediaFile, JSON.stringify(mediaItems));
	}
	for (const m of mediaItems) {
		const sizes = Object.values(m.media_details?.sizes ?? {}).map((s) => `${s.source_url} ${s.width}w`);
		featured.set(m.id, { src: m.source_url, srcset: sizes.join(', '), alt: decodeEntities(m.alt_text || '') });
	}

	/* -------------------------------------------- Einteilung und neue Adressen */
	const linkMap = new Map();
	const setLink = (oldUrl, to) => oldUrl && linkMap.set(normalizePath(new URL(oldUrl, SOURCE).pathname), to);

	// Fahrzeuge: Karten der Fuhrpark-Seite
	const vehicleCards = parseFuhrpark(pageBySlug.get('fuhrpark')?.content.rendered ?? '');
	const usedVehicleSlugs = new Set();
	for (const v of vehicleCards) {
		let slug = slugify(v.short) || 'fahrzeug';
		for (let i = 2; usedVehicleSlugs.has(slug); i++) slug = `${slugify(v.short)}-${i}`;
		usedVehicleSlugs.add(slug);
		v.slug = slug;
		if (v.link) setLink(v.link, `/feuerwehr/fuhrpark/${slug}`);
	}
	const vehiclePostSlugs = new Set(vehicleCards.map((v) => v.link && normalizePath(new URL(v.link, SOURCE).pathname)).filter(Boolean));

	const postPlan = [];
	const usedSlugs = new Set((await rows('SELECT slug FROM posts')).map((r) => r.slug));
	for (const p of posts) {
		const slug = decodeURIComponent(p.slug);
		const oldPath = normalizePath(new URL(p.link).pathname);
		// Interne und passwortgeschützte Beiträge bleiben draußen
		if (SKIP_POSTS.has(slug) || p.categories.includes(CAT_INTERN) || p.content?.protected) continue;
		if (PAGE_POSTS[slug]) {
			const target = { 'ueber-uns': '/feuerwehr/ueber-uns', sicherheitszentrum: '/feuerwehr/sicherheitszentrum' }[PAGE_POSTS[slug]] ?? `/buergerservice/${PAGE_POSTS[slug]}`;
			linkMap.set(oldPath, target);
			continue;
		}
		if (SACHGEBIET_RE.test(slug)) {
			linkMap.set(oldPath, '/feuerwehr/sachgebiete');
			continue;
		}
		if (vehiclePostSlugs.has(oldPath)) continue;
		let category = 'allgemein';
		if (inCat(p, CAT_EINSATZ)) category = 'einsatz';
		else if (inCat(p, CAT_UEBUNG)) category = 'uebung';
		// vor Jugend: auf der Seite „Veranstaltungen“ stehen auch Jugend-Bewerbe, die wir ausgerichtet haben
		else if (inCat(p, CAT_VERANSTALTUNG)) category = 'veranstaltung';
		else if (inCat(p, CAT_JUGEND)) category = 'jugend';
		else if (p.categories.includes(CAT_BUERGERSERVICE)) category = 'allgemein';
		let newSlug = slugify(slug) || slugify(decodeEntities(p.title.rendered)) || `beitrag-${p.id}`;
		const existingId = await mapGet(`wp:post:${p.id}`);
		if (existingId) {
			newSlug = (await first('SELECT slug FROM posts WHERE id = ?', [existingId]))?.slug ?? newSlug;
		} else {
			const base = newSlug;
			for (let i = 2; usedSlugs.has(newSlug); i++) newSlug = `${base}-${i}`;
			usedSlugs.add(newSlug);
		}
		linkMap.set(oldPath, `/beitrag/${newSlug}`);
		postPlan.push({ p, category, slug: newSlug, existingId });
	}

	// Feste Seiten und Übersichten
	const fixed = {
		'/mannschaft-4': '/feuerwehr/mannschaft',
		'/mannschaft-2': '/feuerwehr/ueber-uns',
		'/2023/07/18/kommando-2': '/feuerwehr/kommando',
		'/kommandanten': '/feuerwehr/kommando',
		'/fuhrpark': '/feuerwehr/fuhrpark',
		'/das-sicherheitszentrum': '/feuerwehr/sicherheitszentrum',
		'/sachgebiete': '/feuerwehr/sachgebiete',
		'/feuerwehrjugend': '/feuerwehr/feuerwehrjugend',
		'/veranstaltungen': '/termine',
		'/einsaetze': '/taetigkeiten/einsaetze',
		'/uebungen': '/taetigkeiten/uebungen',
		'/buergerservice': '/buergerservice/notruf',
		'/publikationen': '/taetigkeiten/allgemeines',
		'/die-groessten-einsaetze': '/taetigkeiten/einsaetze',
		'/startseite-neu': '/',
		'/links': '/',
		'/2023/07/18/impressum-2': '/impressum',
		'/category/einsaetze': '/taetigkeiten/einsaetze',
		'/category/uebungen': '/taetigkeiten/uebungen',
		'/category/feuerwehrjugend': '/taetigkeiten/jugend',
		'/category/allgemein': '/taetigkeiten/allgemeines',
		'/category/veranstaltungen': '/taetigkeiten/veranstaltungen',
		'/category/fahrzeuge': '/feuerwehr/fuhrpark',
		'/category/publikationen': '/taetigkeiten/allgemeines'
	};
	for (const [from, to] of Object.entries(fixed)) linkMap.set(normalizePath(from), to);
	for (const c of categories) {
		const parentSlug = categories.find((x) => x.id === c.parent)?.slug;
		const year = c.name.match(/^J?(\d{4})$/)?.[1];
		if (parentSlug === 'einsaetze' && year) linkMap.set(normalizePath(`/category/einsaetze/${c.slug}`), `/taetigkeiten/einsaetze?jahr=${year}`);
		if (parentSlug === 'feuerwehrjugend' && year) linkMap.set(normalizePath(`/category/feuerwehrjugend/${c.slug}`), `/taetigkeiten/jugend?jahr=${year}`);
	}

	/* -------------------------------------------- Beiträge vorbereiten */
	const prepared = [];
	if (want('beitraege')) {
		for (const plan of postPlan) {
			if (plan.existingId) continue;
			const { p } = plan;
			const day = p.date.slice(0, 10);
			let title = stripTitleDate(decodeEntities(p.title.rendered).replace(/\s+/g, ' ').trim());
			const conv = convert(p.content.rendered, { linkMap, date: Date.parse(p.date_gmt + 'Z') });
			let html = conv.html;
			let einsatz = null;
			let date = day;
			let time = null;
			if (plan.category === 'einsatz') {
				const t = parseEinsatzTitle(title);
				const pre = parsePreamble(html, day);
				html = pre.html;
				date = pre.day;
				time = pre.time;
				einsatz = { nummer: t?.nummer ?? null, code: t?.code ?? null, stichwort: t?.rest ? niceStichwort(t.rest) : null, ort: pre.ort };
				if (t?.rest) title = niceStichwort(t.rest);
				else if (t?.code) title = `Einsatz ${t.code}`;
			}
			const imageKeys = [];
			for (const img of conv.images) {
				const k = wantImage(img);
				if (k && !imageKeys.includes(k)) imageKeys.push(k);
			}
			let coverKey = null;
			const f = p.featured_media && featured.get(p.featured_media);
			if (f) {
				const cands = imageCandidates(f);
				if (cands.length) coverKey = wantImage({ key: imgKey(cands[0]), cands, alt: f.alt, name: path.basename(cands[0]), date: Date.parse(p.date_gmt + 'Z') });
			}
			prepared.push({ plan, title: title || 'Ohne Titel', html, images: conv.images, imageKeys, coverKey, date, time, einsatz });
		}
		log(`Beiträge: ${prepared.length} neu vorbereitet (${postPlan.length - prepared.length} schon übernommen)`);
	}

	/* -------------------------------------------- Mitglieder, Fahrzeuge, Seiten, Termine vorbereiten */
	const memberCards = want('mitglieder') ? parseMannschaft(pageBySlug.get('mannschaft-4')?.content.rendered ?? '') : [];
	const kommando = want('mitglieder') ? parseKommando(postBySlug.get('kommando-2')?.content.rendered ?? '') : [];
	for (const m of [...memberCards, ...kommando]) if (m.photo) m.photoKey = wantImage(m.photo);

	const vehicles = [];
	if (want('fahrzeuge')) {
		for (const v of vehicleCards) {
			const post = v.link ? posts.find((p) => normalizePath(new URL(p.link).pathname) === normalizePath(new URL(v.link, SOURCE).pathname)) : null;
			const detail = post ? parseVehiclePost(post, linkMap) : null;
			if (v.image) v.imageKey = wantImage(v.image);
			if (detail) {
				for (const img of detail.images) wantImage(img);
				if (post.featured_media && featured.get(post.featured_media)) {
					const fm = featured.get(post.featured_media);
					const cands = imageCandidates(fm);
					if (cands.length) detail.coverKey = wantImage({ key: imgKey(cands[0]), cands, alt: fm.alt, name: path.basename(cands[0]) });
				}
			}
			vehicles.push({ ...v, post, detail });
		}
	}

	const pagePlans = want('seiten') ? preparePages({ pageBySlug, postBySlug, linkMap }) : [];
	for (const pp of pagePlans) {
		for (const img of pp.images) wantImage(img);
		if (pp.banner) pp.bannerKey = wantImage(pp.banner);
	}
	const eventCards = want('termine') ? parseVeranstaltungen(pageBySlug.get('veranstaltungen')?.content.rendered ?? '', linkMap) : [];

	if (PROBE) {
		probeReport({ prepared, memberCards, kommando, vehicles, pagePlans, eventCards });
		await importPendingMedia();
		return;
	}

	/* -------------------------------------------- Bilder und Dokumente */
	await importPendingMedia();

	/* -------------------------------------------- Einsatzarten ergänzen */
	const arten = new Map((await rows('SELECT id, code FROM einsatzarten')).map((r) => [r.code, Number(r.id)]));
	let maxSort = Number((await first('SELECT coalesce(max(sort_order), 0) AS m FROM einsatzarten')).m);
	const LABEL = { brand: 'Brandeinsatz', technik: 'Technischer Einsatz', schadstoff: 'Schadstoffeinsatz', sonstiges: 'Sonstiger Einsatz' };
	for (const pr of prepared) {
		const code = pr.einsatz?.code;
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

	/* -------------------------------------------- Beiträge schreiben */
	let n = 0;
	for (const pr of prepared) {
		const { p, category, slug } = pr.plan;
		const html = await finalize(pr.html, pr.images, { inline: false });
		const gallery = pr.imageKeys.map((k) => mediaByKey.get(k)).filter(Boolean);
		let cover = pr.coverKey ? mediaByKey.get(pr.coverKey) : null;
		if (!cover && gallery.length) cover = gallery.shift();
		const galleryIds = [...new Set(gallery.filter((id) => id !== cover))];
		const created = Date.parse(p.date_gmt + 'Z');
		const updated = Date.parse(p.modified_gmt + 'Z');
		const id = await insertId(
			`INSERT INTO posts (slug, title, category, date, time, status, pinned, summary, content_html, cover_media_id,
				einsatz_nummer, einsatzart_id, stichwort, einsatzort, published_at, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, 'veroeffentlicht', 0, '', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				slug,
				pr.title.slice(0, 200),
				category,
				pr.date,
				pr.time,
				html,
				cover,
				pr.einsatz?.nummer ?? null,
				pr.einsatz?.code ? (arten.get(pr.einsatz.code) ?? null) : null,
				pr.einsatz?.stichwort ?? null,
				pr.einsatz?.ort ?? null,
				created,
				created,
				updated
			]
		);
		for (const [i, mid] of galleryIds.entries()) await exec('INSERT OR IGNORE INTO post_images (post_id, media_id, sort_order) VALUES (?, ?, ?)', [id, mid, i]);
		await mapSet(`wp:post:${p.id}`, 'post', id);
		await addRedirect(new URL(p.link).pathname, `/beitrag/${slug}`);
		if (++n % 100 === 0) log(`  ${n}/${prepared.length} Beiträge eingetragen`);
	}
	if (prepared.length) log(`Beiträge: ${n} eingetragen`);

	/* -------------------------------------------- Mitglieder */
	let members = 0;
	for (const [i, m] of [...kommando.map((k, j) => ({ ...k, kommandoSort: j + 1 })), ...memberCards].entries()) {
		const key = `wp:member:${slugify(`${m.firstName} ${m.lastName}`)}`;
		if (await mapGet(key)) continue;
		const photo = m.photoKey ? (mediaByKey.get(m.photoKey) ?? null) : null;
		const id = await insertId(
			`INSERT INTO members (first_name, last_name, rank, honorary_rank, function_title, status, chargen, kommando_position, kommando_sort,
				kommando_text, photo_media_id, public_visible, photo_approved, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
			[
				m.firstName,
				m.lastName,
				m.rank,
				bool(m.honorary),
				m.functionTitle ?? '',
				m.status,
				bool(m.chargen),
				m.kommandoPosition ?? null,
				m.kommandoSort ?? 0,
				m.kommandoText ?? '',
				photo,
				bool(!!photo),
				Date.now(),
				Date.now() + i
			]
		);
		await mapSet(key, 'member', id);
		members++;
	}
	if (want('mitglieder')) log(`Mitglieder: ${members} eingetragen`);

	/* -------------------------------------------- Fahrzeuge */
	let vcount = 0;
	for (const [i, v] of vehicles.entries()) {
		const key = `wp:vehicle:${v.slug}`;
		if (await mapGet(key)) continue;
		const d = v.detail;
		const spec = d?.spec ?? {};
		const html = d ? await finalize(d.html, d.images, { inline: false }) : '';
		const gallery = [...new Set((d?.images ?? []).map((img) => mediaByKey.get(img.key)).filter(Boolean))];
		const cover = (v.imageKey && mediaByKey.get(v.imageKey)) || (d?.coverKey && mediaByKey.get(d.coverKey)) || gallery[0] || null;
		const extra = [...(d?.extra ?? [])];
		if (spec.tactical && spec.tactical.replace(/[\s-]/g, '') !== v.short.replace(/[\s-]/g, '')) extra.unshift({ label: 'Taktische Bezeichnung', value: spec.tactical });
		if (v.years) extra.unshift({ label: 'Im Dienst', value: v.years.replace('-', '–') });
		const yearNum = Number(String(spec.year ?? '').match(/\d{4}/)?.[0]) || null;
		const id = await insertId(
			`INSERT INTO vehicles (slug, name, short_name, radio_name, description_html, chassis, body, year, weight, crew, purpose, extra_specs,
				cover_media_id, sort_order, in_service, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				v.slug,
				(v.long || spec.tactical || v.short).slice(0, 120),
				v.short.slice(0, 30),
				(spec.radio ?? '').slice(0, 60),
				html,
				(spec.chassis ?? '').slice(0, 120),
				(spec.body ?? '').slice(0, 120),
				yearNum,
				(spec.weight ?? '').slice(0, 40),
				(spec.crew ?? '').slice(0, 40),
				(spec.purpose ?? '').slice(0, 160),
				JSON.stringify(extra),
				cover,
				i,
				bool(v.section !== 'historisch'),
				Date.now(),
				Date.now()
			]
		);
		for (const [j, mid] of gallery.filter((g) => g !== cover).entries()) {
			await exec('INSERT OR IGNORE INTO vehicle_images (vehicle_id, media_id, sort_order) VALUES (?, ?, ?)', [id, mid, j]);
		}
		await mapSet(key, 'vehicle', id);
		if (v.post) await addRedirect(new URL(v.post.link).pathname, `/feuerwehr/fuhrpark/${v.slug}`);
		vcount++;
	}
	if (want('fahrzeuge')) log(`Fahrzeuge: ${vcount} eingetragen`);

	/* -------------------------------------------- Seiten */
	for (const pp of pagePlans) {
		if (pp.reorderOnly) {
			await exec('UPDATE pages SET sort_order = ? WHERE slug = ?', [pp.sortOrder, pp.slug]);
			continue;
		}
		const key = `wp:page:${pp.slug}`;
		if (await mapGet(key)) continue;
		let html = dedupeBlocks(await finalize(pp.html, pp.images, { inline: true }));
		const existing = await first('SELECT id, content_html FROM pages WHERE slug = ?', [pp.slug]);
		if (pp.keepFrom && existing) {
			const i = String(existing.content_html).indexOf(pp.keepFrom);
			if (i >= 0) html += `\n${String(existing.content_html).slice(i)}`;
		}
		const banner = pp.bannerKey ? (mediaByKey.get(pp.bannerKey) ?? null) : null;
		let id;
		if (existing) {
			await exec('UPDATE pages SET content_html = ?, banner_media_id = coalesce(?, banner_media_id), updated_at = ? WHERE id = ?', [html, banner, Date.now(), existing.id]);
			id = Number(existing.id);
		} else {
			id = await insertId(
				'INSERT INTO pages (slug, section, title, subtitle, menu_text, content_html, banner_media_id, sort_order, system, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
				[pp.slug, pp.section, pp.title, pp.subtitle, pp.menuText, html, banner, pp.sortOrder, Date.now(), Date.now()]
			);
		}
		if (pp.sortOrder != null && existing) await exec('UPDATE pages SET sort_order = ? WHERE id = ?', [pp.sortOrder, existing.id]);
		await mapSet(key, 'page', id);
	}
	if (want('seiten')) log(`Seiten: ${pagePlans.length} übernommen`);

	/* -------------------------------------------- Termine */
	let ecount = 0;
	for (const e of eventCards) {
		const key = `wp:event:${slugify(e.title)}:${e.startDate}`;
		if (await mapGet(key)) continue;
		const postId = e.postPath ? ((await first('SELECT id FROM posts WHERE slug = ?', [e.postPath.replace('/beitrag/', '')]))?.id ?? null) : null;
		const id = await insertId('INSERT INTO events (title, start_date, end_date, location, description, post_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
			e.title,
			e.startDate,
			e.endDate,
			e.location,
			e.description,
			postId,
			Date.now(),
			Date.now()
		]);
		await mapSet(key, 'event', id);
		ecount++;
	}
	if (want('termine')) log(`Termine: ${ecount} eingetragen`);

	/* -------------------------------------------- Weiterleitungen der übrigen Adressen */
	for (const [from, to] of linkMap) await addRedirect(from, to);

	log(
		`Fertig. Bilder ${stats.images} neu (${stats.imagesFailed} nicht ladbar), Dokumente ${stats.docs} neu (${stats.docsFailed} nicht ladbar).`
	);
}

/* ================================================================ Einzelne Seiten zerlegen */

const attrOf = (tag, name) => decodeEntities((tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i')) || [, ''])[1]);
const imgInfo = (tag, href = null) => {
	const cands = imageCandidates({ src: attrOf(tag, 'src'), srcset: attrOf(tag, 'srcset'), href });
	return cands.length ? { key: imgKey(cands[0]), cands, alt: attrOf(tag, 'alt'), name: path.basename(cands[0]) } : null;
};

/** Namen säubern: "MAtthias" → "Matthias", "reeh" → "Reeh" */
function fixCase(name) {
	return name
		.split(/(\s+|-)/)
		.map((w) => {
			if (!/[a-zäöüß]/i.test(w)) return w;
			const rest = w.slice(1);
			if (/^[a-zäöüß]/.test(w) || (/[A-ZÄÖÜ]/.test(rest) && w !== w.toUpperCase())) return w[0].toUpperCase() + rest.toLowerCase();
			return w;
		})
		.join('');
}
/** Nur verrutschte Großbuchstaben mitten im Wort korrigieren: "ANhänger" → "Anhänger", "mit" bleibt klein */
function fixInnerCaps(text) {
	return text
		.split(/(\s+|-)/)
		.map((w) => (/[A-ZÄÖÜ]/.test(w.slice(1)) && w !== w.toUpperCase() && /^[A-ZÄÖÜ]/.test(w) && w.length > 3 ? w[0] + w.slice(1).toLowerCase() : w))
		.join('');
}

function splitName(full) {
	const parts = fixCase(decodeEntities(full).replace(/\s+/g, ' ').trim()).split(' ');
	const lastName = parts.pop() ?? '';
	return { firstName: parts.join(' ') || lastName, lastName };
}
function parseRank(raw) {
	const r = decodeEntities(raw).replace(/[^A-Z0-9]/gi, '').toUpperCase();
	if (DIENSTGRADE.has(r)) return { rank: r, honorary: false };
	if (r.startsWith('E') && DIENSTGRADE.has(r.slice(1))) return { rank: r.slice(1), honorary: true };
	return { rank: r || 'FM', honorary: false };
}

function parseMannschaft(html) {
	const heads = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => ({ at: m.index, text: textOf(m[1]).toLowerCase() }));
	const sectionAt = (pos) => {
		const h = heads.filter((x) => x.at < pos).at(-1)?.text ?? '';
		if (h.includes('reserv')) return 'reserve';
		if (h.includes('charge') || h.includes('funktion')) return 'chargen';
		return 'aktiv';
	};
	const cards = [...html.matchAll(/<div class="fm-card">([\s\S]*?)<\/div><\/div>/g)];
	const photoCount = new Map();
	const out = [];
	for (const c of cards) {
		const body = c[1];
		const img = body.match(/<img\b[^>]*class="fm-image[^"]*"[^>]*>/)?.[0] ?? body.match(/<img\b[^>]*>/)?.[0];
		const name = textOf(body.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? '');
		if (!name) continue;
		const funktion = textOf(body.match(/class="fm-funktion">([\s\S]*?)<\/div>/)?.[1] ?? '');
		const dg = textOf(body.match(/class="fm-dienstgrad">([\s\S]*)$/)?.[1] ?? '');
		const section = sectionAt(c.index);
		const photo = img ? imgInfo(img) : null;
		if (photo) photoCount.set(photo.key, (photoCount.get(photo.key) ?? 0) + 1);
		out.push({ ...splitName(name), ...parseRank(dg), functionTitle: funktion, status: section === 'reserve' ? 'reserve' : 'aktiv', chargen: section === 'chargen', photo });
	}
	// Platzhalterbilder (mehrfach verwendet oder "kein Bild") nicht übernehmen
	for (const m of out) {
		if (m.photo && (photoCount.get(m.photo.key) > 1 || /kein|platzhalter|placeholder|avatar|default/i.test(m.photo.name))) m.photo = null;
	}
	return out;
}

function parseKommando(html) {
	const out = [];
	// Personenfoto + Name (h4); der Rest reicht bis zum nächsten Personenfoto (das Dienstgrad-Abzeichen liegt dazwischen)
	const person = String.raw`<figure[^>]*wp-block-image[^>]*>\s*(<img\b[^>]*>)\s*<\/figure>\s*<h4[^>]*>`;
	const re = new RegExp(`${person}([\\s\\S]*?)<\\/h4>([\\s\\S]*?)(?=${person}|$)`, 'g');
	for (const m of html.matchAll(re)) {
		const rest = m[3];
		const position = textOf(rest.match(/<h6[^>]*>([\s\S]*?)<\/h6>/)?.[1] ?? '');
		const about = textOf(rest.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '');
		const shortTexts = [...rest.matchAll(/>([^<>]{1,6})</g)].map((x) => decodeEntities(x[1]).trim()).filter((x) => /^E?[A-Z]{1,4}\d?$/.test(x));
		const pos = position
			.replace(/^\w/, (c) => c.toUpperCase())
			.replace(/Kommandant Stellvertreter/i, 'Kommandant-Stellvertreter');
		out.push({
			...splitName(textOf(m[2])),
			...parseRank(shortTexts.at(-1) ?? ''),
			kommandoPosition: pos,
			kommandoText: about,
			functionTitle: '',
			status: 'aktiv',
			chargen: false,
			photo: imgInfo(m[1])
		});
	}
	return out;
}

function parseFuhrpark(html) {
	const sonder = html.search(/Sonderfahrzeuge/i);
	const hist = html.search(/>\s*Historisch/i);
	const out = [];
	for (const m of html.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/g)) {
		const short = textOf(m[1]).replace(/\s+/g, ' ');
		if (!short || /^historisch$/i.test(short)) continue;
		const before = html.slice(Math.max(0, m.index - 4000), m.index);
		const figAt = before.lastIndexOf('<figure');
		const fig = figAt >= 0 ? before.slice(figAt) : '';
		const imgTag = fig.match(/<img\b[^>]*>/)?.[0];
		const figLink = fig.match(/<a\b[^>]*href="([^"]+)"/)?.[1];
		const after = html.slice(m.index, m.index + 2500);
		const nextH4 = after.slice(5).search(/<h4/);
		const block = nextH4 > 0 ? after.slice(0, nextH4 + 5) : after;
		const long = textOf(block.match(/<h6[^>]*>([\s\S]*?)<\/h6>/)?.[1] ?? '');
		const years = textOf(block).match(/\b(1[89]\d{2}|20\d{2}|19XX)\s*[-–]\s*(\d{4}|X{4})\b/)?.[0] ?? null;
		const button = block.match(/<a\b[^>]*class="[^"]*wp-block-button__link[^"]*"[^>]*href="([^"]+)"/)?.[1] ?? block.match(/<a\b[^>]*href="([^"]+)"[^>]*class="[^"]*wp-block-button__link/)?.[1];
		const link = [button, figLink].map((l) => l && absolutize(l)).find((l) => l && isOwn(l) && !/wp-content/.test(l)) ?? null;
		const image = imgTag ? imgInfo(imgTag) : null;
		const section = hist >= 0 && m.index > hist ? 'historisch' : sonder >= 0 && m.index > sonder ? 'sonder' : 'aktiv';
		out.push({
			short,
			long: fixInnerCaps(long).replace(/^\w/, (c) => c.toUpperCase()),
			years: years && !/X/.test(years) ? years : null,
			link,
			image: image && !/kein_bild/i.test(image.name) ? image : null,
			section
		});
	}
	return out;
}

const SPEC_FIELDS = [
	[/^taktische bezeichnung/i, 'name'],
	[/^funkrufname/i, 'radio'],
	[/^fahrgestell/i, 'chassis'],
	[/^aufbau/i, 'body'],
	[/^baujahr/i, 'year'],
	[/gesamtgewicht|^gewicht/i, 'weight'],
	[/^besatzung/i, 'crew'],
	[/^einsatzbereich/i, 'purpose']
];

function parseVehiclePost(post, linkMap) {
	const conv = convert(post.content.rendered, { linkMap });
	const lines = textOf(conv.html.replace(/\[\[BILD:\d+\]\]/g, ''))
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);
	const spec = {};
	const extra = [];
	const dbAt = lines.findIndex((l) => /^datenblatt$/i.test(l));
	if (dbAt >= 0) {
		for (let i = dbAt + 1; i < lines.length - 1; i++) {
			const label = lines[i].match(/^(.{2,60}?):\s*(.*)$/);
			if (!label) continue;
			const value = (label[2] || lines[i + 1] || '').trim();
			if (!value || /:$/.test(value)) continue;
			const field = SPEC_FIELDS.find(([re]) => re.test(label[1].trim()));
			if (field) spec[field[1]] = value;
			else if (!/^(galerie)$/i.test(label[1])) extra.push({ label: label[1].trim(), value });
			if (!label[2]) i++;
		}
	}
	if (spec.name) {
		spec.tactical = spec.name;
		delete spec.name;
	}
	// Beschreibung: der Text vor dem Datenblatt
	let html = conv.html;
	const cut = html.search(/<(h\d|p)>\s*(<strong>)?\s*Datenblatt/i);
	if (cut >= 0) html = html.slice(0, cut);
	// Überschrift mit dem Fahrzeugnamen am Anfang weglassen – der Name steht schon groß darüber
	const plain = (s) => textOf(s).toLowerCase().replace(/[\s-]/g, '');
	const lead = html.match(/^\s*<(h\d|p)>([\s\S]*?)<\/\1>/);
	if (lead && plain(lead[2]) === plain(post.title.rendered)) html = html.slice(lead[0].length);
	return { html, images: conv.images, spec, extra };
}

const MONATE = { jänner: 1, januar: 1, februar: 2, feber: 2, märz: 3, april: 4, mai: 5, juni: 6, juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12 };

function parseVeranstaltungen(html, linkMap) {
	const out = [];
	const stop = html.search(/Beiträge der Kategorie/i);
	const part = stop > 0 ? html.slice(0, stop) : html;
	for (const m of part.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>([\s\S]*?)(?=<h4|$)/g)) {
		const title = textOf(m[1]);
		const p = m[2].match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';
		const lines = textOf(p).split('\n').map((l) => l.trim()).filter(Boolean);
		const dateLine = lines.find((l) => /\d{4}/.test(l)) ?? '';
		const dm = dateLine.match(/^(\d{1,2})\.\s*(?:(?:&|und|-|–)\s*(\d{1,2})\.\s*)?([A-Za-zäÄ]+)\s+(\d{4})/);
		if (!title || !dm) continue;
		const month = MONATE[dm[3].toLowerCase()];
		if (!month) continue;
		const startDate = `${dm[4]}-${pad(month)}-${pad(dm[1])}`;
		const endDate = dm[2] ? `${dm[4]}-${pad(month)}-${pad(dm[2])}` : null;
		const location = lines.filter((l) => l !== dateLine)[0] ?? '';
		const rueck = m[2].match(/<a\b[^>]*href="([^"]+)"[^>]*>[^<]*Rückblick/i)?.[1];
		const postPath = rueck ? linkMap.get(normalizePath(new URL(absolutize(rueck)).pathname)) : null;
		out.push({ title: title.replace(/^\w/, (c) => c.toUpperCase()), startDate, endDate, location, description: '', postPath: postPath?.startsWith('/beitrag/') ? postPath : null });
	}
	return out;
}

/** Seiten der neuen Webseite aus WordPress-Seiten und -Beiträgen zusammenstellen */
function preparePages({ pageBySlug, postBySlug, linkMap }) {
	const plans = [];
	const heroOf = (html) => {
		const m = html.match(/<div class="wp-block-cover[^"]*"[^>]*>\s*(<img\b[^>]*>)/);
		return m ? { banner: imgInfo(m[1]), html: html.replace(/<div class="wp-block-cover[\s\S]*?<\/div>\s*<\/div>/, '') } : { banner: null, html };
	};
	const fromHtml = (src) => {
		const { banner, html } = heroOf(src);
		const conv = convert(html, { linkMap });
		return { banner, html: conv.html, images: conv.images };
	};
	const add = (slug, section, title, subtitle, menuText, sortOrder, parts, extra = {}) => {
		const html = parts.map((p) => p.html).join('\n');
		const images = [];
		let offset = 0;
		const merged = parts
			.map((p) => {
				const shifted = p.html.replace(/\[\[BILD:(\d+)\]\]/g, (_, i) => `[[BILD:${Number(i) + offset}]]`);
				images.push(...p.images);
				offset += p.images.length;
				return shifted;
			})
			.join('\n');
		plans.push({ slug, section, title, subtitle, menuText, sortOrder, html: merged || html, images, banner: parts.find((p) => p.banner)?.banner ?? null, ...extra });
	};
	const post = (s) => postBySlug.get(s);
	const heading = (t) => ({ html: `<h2>${t}</h2>`, images: [], banner: null });

	// Über uns: "unser Auftrag", der Abschnitt "Mitmachen" bleibt erhalten
	if (post('unser-auftrag')) add('ueber-uns', 'feuerwehr', 'Über uns', 'Die Freiwillige Feuerwehr Leopoldsdorf stellt sich vor', 'Unser Auftrag und wie du mitmachen kannst', 0, [fromHtml(post('unser-auftrag').content.rendered)], { keepFrom: '<h2>Mitmachen</h2>' });

	if (pageBySlug.get('das-sicherheitszentrum')) {
		const main = fromHtml(pageBySlug.get('das-sicherheitszentrum').content.rendered);
		main.html = main.html.replace(/^\s*<p>\s*Sicherheitszentrum\s*<\/p>/i, '');
		const rooms = ['fahrzeughalle', 'fmd-raum'].filter(post).flatMap((s) => [heading(decodeEntities(post(s).title.rendered)), fromHtml(post(s).content.rendered)]);
		add('sicherheitszentrum', 'feuerwehr', 'Sicherheitszentrum', 'Unser Feuerwehrhaus, gemeinsam mit Rettung und Polizei', 'Unser Feuerwehrhaus in Leopoldsdorf', 1, [main, ...rooms]);
	}

	const sg = [...postBySlug.values()]
		.filter((p) => SACHGEBIET_RE.test(decodeURIComponent(p.slug)))
		.sort((a, b) => decodeEntities(a.title.rendered).localeCompare(decodeEntities(b.title.rendered), 'de'));
	if (sg.length) {
		const hero = pageBySlug.get('sachgebiete') ? heroOf(pageBySlug.get('sachgebiete').content.rendered).banner : null;
		const parts = sg.flatMap((p) => [heading(decodeEntities(p.title.rendered).replace(/^Sachgebiet\s+/i, '')), fromHtml(p.content.rendered)]);
		if (hero) parts[0].banner = hero;
		add('sachgebiete', 'feuerwehr', 'Sachgebiete', 'Fachbereiche und Funktionen in unserer Feuerwehr', 'Atemschutz, Ausbildung, EDV und mehr', 2, parts);
	}

	if (pageBySlug.get('feuerwehrjugend')) {
		let src = pageBySlug.get('feuerwehrjugend').content.rendered;
		const cut = src.search(/Beiträge der Kategorie/i);
		if (cut > 0) src = src.slice(0, src.lastIndexOf('<', cut));
		const part = fromHtml(src);
		part.html = part.html.replace(/^\s*<p>\s*Feuerwehrjugend\s*<\/p>/i, '') + '\n<p><a href="/taetigkeiten/jugend">Alle Berichte unserer Feuerwehrjugend</a></p>';
		add('feuerwehrjugend', 'feuerwehr', 'Feuerwehrjugend', 'Lernen, trainieren und Spaß haben', 'Unsere Jugend stellt sich vor', 3, [part]);
	}

	const bs = [
		['notruf', 'notruf', 'Notruf', 'So setzen Sie einen Notruf richtig ab', 'Das richtige Absetzen eines Notrufs', 0],
		['sirenensignale', 'sirenensignale', 'Sirenensignale', 'Was die Sirenen bedeuten und was dann zu tun ist', 'Die Bedeutung verschiedener Sirenensignale', 1],
		['verhalten-im-brandfall', 'verhalten-im-brandfall', 'Verhalten im Brandfall', 'Was im Ernstfall zu tun ist', 'Richtiges Verhalten im Brandfall', 2],
		['loeschen-von-fettbraenden', 'fettbraende', 'Fettbrände', 'Brennendes Fett niemals mit Wasser löschen', 'Der Umgang mit Fettbränden', 4],
		['waldbrandverordnung-2', 'waldbrandverordnung', 'Waldbrandverordnung', 'Was bei Waldbrandgefahr gilt', 'Was bei Waldbrandgefahr gilt', 6]
	];
	for (const [wp, slug, title, subtitle, menuText, sort] of bs) {
		if (post(wp)) add(slug, 'buergerservice', title, subtitle, menuText, sort, [fromHtml(post(wp).content.rendered)]);
	}
	// Reihenfolge der bestehenden Bürgerservice-Seiten anpassen
	plans.push(
		{ slug: 'richtig-loeschen', section: 'buergerservice', sortOrder: 3, reorderOnly: true },
		{ slug: 'rettungsgasse', section: 'buergerservice', sortOrder: 5, reorderOnly: true },
		{ slug: 'abschnitt-schwechat-land', section: 'buergerservice', sortOrder: 7, reorderOnly: true }
	);
	return plans.map((p) => (p.reorderOnly ? { ...p, html: null, images: [] } : p));
}

function probeReport({ prepared, memberCards, kommando, vehicles, pagePlans, eventCards }) {
	const byCat = {};
	for (const p of prepared) byCat[p.plan.category] = (byCat[p.plan.category] ?? 0) + 1;
	log('Beiträge je Kategorie', byCat);
	const e = prepared.filter((p) => p.einsatz);
	log(`Einsätze: ${e.length}, mit Einsatzart ${e.filter((x) => x.einsatz.code).length}, mit Nummer ${e.filter((x) => x.einsatz.nummer).length}, mit Uhrzeit ${e.filter((x) => x.time).length}, mit Ort ${e.filter((x) => x.einsatz.ort).length}`);
	for (const x of e.slice(0, 6)) console.log('   ', x.date, x.time, x.einsatz.nummer, x.einsatz.code, '|', x.title, '|', x.einsatz.ort);
	console.log('   Codes:', [...new Set(e.map((x) => x.einsatz.code).filter(Boolean))].join(' '));
	log(`Kommando: ${kommando.map((k) => `${k.firstName} ${k.lastName} (${k.kommandoPosition}, ${k.honorary ? 'E' : ''}${k.rank})`).join('; ')}`);
	log(`Mitglieder: ${memberCards.length} (Chargen ${memberCards.filter((m) => m.chargen).length}, Reserve ${memberCards.filter((m) => m.status === 'reserve').length}, mit Foto ${memberCards.filter((m) => m.photo).length})`);
	console.log('   ', memberCards.slice(0, 4).map((m) => `${m.firstName} ${m.lastName} ${m.honorary ? 'E' : ''}${m.rank} ${m.functionTitle}`).join(' | '));
	log(`Fahrzeuge: ${vehicles.length}`);
	for (const v of vehicles) console.log(`    ${v.section.padEnd(10)} ${v.short.padEnd(12)} ${v.slug.padEnd(14)} ${v.long.padEnd(34)} ${v.years ?? ''} Beitrag:${v.post ? 'ja' : '-'} ${v.detail ? JSON.stringify(v.detail.spec).slice(0, 110) : ''}`);
	log(`Seiten: ${pagePlans.filter((p) => !p.reorderOnly).map((p) => `${p.slug} (${p.images.length} Bilder)`).join(', ')}`);
	log(`Termine: ${eventCards.map((e) => `${e.title} ${e.startDate}${e.endDate ? `–${e.endDate}` : ''} @ ${e.location}`).join('; ')}`);
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(`\nAbbruch: ${err.message}`);
		process.exit(1);
	});
