import { and, desc, eq, like, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db } from '$lib/server/db';
import { einsatzarten, media, POST_CATEGORIES, posts, type PostCategory } from '$lib/server/db/schema';
import { requirePermission } from '$lib/server/guard';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 30;

export const load: PageServerLoad = async ({ locals, url }) => {
	requirePermission(locals, 'content.manage');
	const q = (url.searchParams.get('suche') ?? '').trim().slice(0, 80);
	const cat = url.searchParams.get('kategorie') as PostCategory | null;
	const status = url.searchParams.get('status');
	const page = Math.max(1, Number(url.searchParams.get('seite')) || 1);

	const conds: SQL[] = [];
	if (q) conds.push(like(posts.title, `%${q}%`));
	if (cat && POST_CATEGORIES.includes(cat)) conds.push(eq(posts.category, cat));
	if (status === 'entwurf' || status === 'veroeffentlicht') conds.push(eq(posts.status, status));
	const where = conds.length ? and(...conds) : undefined;

	const cover = alias(media, 'cover');
	const [totalRow, items] = await Promise.all([
		db.select({ n: sql<number>`count(*)` }).from(posts).where(where).get(),
		db
			.select({
				id: posts.id,
				slug: posts.slug,
				title: posts.title,
				category: posts.category,
				date: posts.date,
				status: posts.status,
				pinned: posts.pinned,
				einsatzNummer: posts.einsatzNummer,
				code: einsatzarten.code,
				group: einsatzarten.group,
				coverFile: cover.file,
				coverWidths: cover.widths
			})
			.from(posts)
			.leftJoin(einsatzarten, eq(einsatzarten.id, posts.einsatzartId))
			.leftJoin(cover, eq(cover.id, posts.coverMediaId))
			.where(where)
			.orderBy(desc(posts.date), desc(posts.id))
			.limit(PAGE_SIZE)
			.offset((page - 1) * PAGE_SIZE)
			.all()
	]);
	const total = Number(totalRow?.n ?? 0);
	return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), filter: { q, cat: cat ?? '', status: status ?? '' } };
};
