import { asc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { pages } from '$lib/server/db/schema';
import { requirePermission } from '$lib/server/guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'content.manage');
	const rows = await db
		.select({ id: pages.id, slug: pages.slug, section: pages.section, title: pages.title, subtitle: pages.subtitle, updatedAt: pages.updatedAt, system: pages.system })
		.from(pages)
		.orderBy(asc(pages.section), asc(pages.sortOrder), asc(pages.title))
		.all();
	return { pages: rows };
};
