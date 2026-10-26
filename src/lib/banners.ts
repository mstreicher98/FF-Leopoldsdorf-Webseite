import { CATEGORIES, CATEGORY_ORDER } from '$lib/categories';
import type { PostCategory } from '$lib/server/db/schema';

/** Feste Seiten, deren Titelbild im internen Bereich unter „Seiten“ wählbar ist */
export type BannerKey = 'start' | 'archiv' | PostCategory | 'termine' | 'kommando' | 'mannschaft' | 'fuhrpark';

export interface BannerPage {
	key: BannerKey;
	title: string;
	path: string;
	/** Bild, solange keines aus der Mediathek gewählt ist */
	fallback: string;
}

export const BANNER_PAGES: BannerPage[] = [
	{ key: 'start', title: 'Startseite', path: '/', fallback: '/banner/einsatz.webp' },
	{ key: 'archiv', title: 'Alle Beiträge', path: '/taetigkeiten', fallback: '/banner/archiv.webp' },
	...CATEGORY_ORDER.map((id) => ({ key: id, title: CATEGORIES[id].title, path: `/taetigkeiten/${CATEGORIES[id].path}`, fallback: CATEGORIES[id].banner })),
	{ key: 'termine', title: 'Termine', path: '/termine', fallback: '/banner/termine.webp' },
	{ key: 'kommando', title: 'Kommando', path: '/feuerwehr/kommando', fallback: '/banner/kdo.webp' },
	{ key: 'mannschaft', title: 'Mannschaft', path: '/feuerwehr/mannschaft', fallback: '/banner/mannschaft.webp' },
	{ key: 'fuhrpark', title: 'Fuhrpark', path: '/feuerwehr/fuhrpark', fallback: '/banner/fuhrpark.webp' }
];

export const bannerFallback = (key: BannerKey) => BANNER_PAGES.find((b) => b.key === key)?.fallback ?? '/banner/archiv.webp';
