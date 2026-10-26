import { asc } from 'drizzle-orm';
import { BANNER_PAGES } from '$lib/banners';
import { logAction } from '$lib/server/audit';
import { chosenBanners } from '$lib/server/banners';
import { db } from '$lib/server/db';
import { pages } from '$lib/server/db/schema';
import { intOrNull, requirePermission } from '$lib/server/guard';
import { getSettings, saveSettings, type SiteSettings } from '$lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'content.manage');
	const rows = await db
		.select({ id: pages.id, slug: pages.slug, section: pages.section, title: pages.title, subtitle: pages.subtitle, updatedAt: pages.updatedAt, system: pages.system })
		.from(pages)
		.orderBy(asc(pages.section), asc(pages.sortOrder), asc(pages.title))
		.all();
	return { pages: rows, banners: await chosenBanners() };
};

export const actions: Actions = {
	/** Titelbilder der festen Seiten; ein leeres Feld heißt Standardbild */
	titelbilder: async ({ locals, request }) => {
		const me = requirePermission(locals, 'content.manage');
		const f = await request.formData();
		const banners: SiteSettings['banners'] = {};
		let heroMediaId = (await getSettings()).heroMediaId;
		for (const b of BANNER_PAGES) {
			const id = intOrNull(f.get(`bild-${b.key}`));
			if (b.key === 'start') heroMediaId = id;
			else if (id) banners[b.key] = id;
		}
		await saveSettings({ heroMediaId, banners });
		await logAction(me.id, 'geändert', 'einstellungen', null, 'Titelbilder der Seiten');
		return { message: 'Titelbilder gespeichert' };
	}
};
