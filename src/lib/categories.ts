import type { PostCategory } from '$lib/server/db/schema';

export interface CategoryInfo {
	id: PostCategory;
	/** Einzahl, z. B. am Beitrag */
	label: string;
	/** Überschrift der Übersicht */
	title: string;
	/** Pfad unter /taetigkeiten/ */
	path: string;
	description: string;
	banner: string;
}

export const CATEGORIES: Record<PostCategory, CategoryInfo> = {
	einsatz: {
		id: 'einsatz',
		label: 'Einsatz',
		title: 'Einsätze',
		path: 'einsaetze',
		description: 'Berichte von unseren Einsätzen in Leopoldsdorf und Umgebung',
		banner: '/banner/einsatz.webp'
	},
	uebung: {
		id: 'uebung',
		label: 'Übung',
		title: 'Übungen',
		path: 'uebungen',
		description: 'Übungen und Schulungen, damit im Ernstfall jeder Handgriff sitzt',
		banner: '/banner/uebung.webp'
	},
	jugend: {
		id: 'jugend',
		label: 'Jugend',
		title: 'Feuerwehrjugend',
		path: 'jugend',
		description: 'Was unsere Feuerwehrjugend erlebt und lernt',
		banner: '/banner/jugend.webp'
	},
	veranstaltung: {
		id: 'veranstaltung',
		label: 'Veranstaltung',
		title: 'Veranstaltungen',
		path: 'veranstaltungen',
		description: 'Feuerwehrfest, Florianifeier, Adventmarkt und was wir sonst veranstalten',
		banner: '/banner/termine.webp'
	},
	allgemein: {
		id: 'allgemein',
		label: 'Allgemein',
		title: 'Allgemeines',
		path: 'allgemeines',
		description: 'Neuigkeiten, Ausbildungen und was sonst bei uns los ist',
		banner: '/banner/allgemein.webp'
	}
};

export const CATEGORY_ORDER: PostCategory[] = ['einsatz', 'uebung', 'jugend', 'veranstaltung', 'allgemein'];

export function categoryByPath(path: string): CategoryInfo | undefined {
	return Object.values(CATEGORIES).find((c) => c.path === path);
}
