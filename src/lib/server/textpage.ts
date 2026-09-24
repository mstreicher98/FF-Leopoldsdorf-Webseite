import { error } from '@sveltejs/kit';
import type { PageSection } from './db/schema';
import { DEFAULT_BANNERS } from './db/seed-pages';
import { menuPages, pageBySlug } from './content';

const SECTION_BANNER: Record<PageSection, string> = {
	feuerwehr: '/banner/ueber-uns.webp',
	buergerservice: '/banner/notruf.webp',
	rechtliches: '/banner/impressum.webp'
};

/** Gemeinsamer Loader für alle Textseiten (Über uns, Bürgerservice, Impressum …) */
export async function loadTextPage(slug: string, section: PageSection) {
	const page = await pageBySlug(slug, section);
	if (!page) error(404, 'Diese Seite gibt es nicht.');
	const siblings = section === 'buergerservice' ? (await menuPages()).filter((p) => p.section === section) : [];
	return {
		page,
		banner: page.banner ?? DEFAULT_BANNERS[page.slug] ?? SECTION_BANNER[section],
		siblings
	};
}
