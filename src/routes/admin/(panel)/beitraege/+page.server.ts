import { and, asc, desc, eq, like, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db } from '$lib/server/db';
import { einsatzarten, media, POST_CATEGORIES, posts, type PostCategory } from '$lib/server/db/schema';
import { requirePermission } from '$lib/server/guard';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 30;

// Umlaute wie ihre Grundbuchstaben einsortieren ("Übung" bei U, nicht nach Z),
// Zeichen wie # „ " … : vor dem ersten Wort nicht mitzählen
const titleKey = sql`replace(replace(replace(replace(replace(replace(replace(ltrim(${posts.title}, '#„“"''«»…:.+*-– '), 'Ä', 'A'), 'Ö', 'O'), 'Ü', 'U'), 'ä', 'a'), 'ö', 'o'), 'ü', 'u'), 'ß', 'ss') COLLATE NOCASE`;

/** ?sortierung=… – ohne Angabe: neueste zuerst */
const SORTS = {
	neueste: [desc(posts.date), desc(posts.id)],
	aelteste: [asc(posts.date), asc(posts.id)],
	// Einsätze: „Alarmiert am … um …“ – Tag und Uhrzeit, Berichte ohne Uhrzeit am Ende des Tages
	alarmierung: [desc(posts.date), sql`${posts.time} DESC NULLS LAST`, desc(posts.id)],
	alarmierung_alt: [asc(posts.date), sql`${posts.time} ASC NULLS LAST`, asc(posts.id)],
	bearbeitet: [desc(posts.updatedAt), desc(posts.id)],
	angelegt: [desc(posts.createdAt), desc(posts.id)],
	titel: [asc(titleKey), asc(posts.id)]
} satisfies Record<string, SQL[]>;
type Sort = keyof typeof SORTS;

export const load: PageServerLoad = async ({ locals, url }) => {
	requirePermission(locals, 'content.manage');
	const q = (url.searchParams.get('suche') ?? '').trim().slice(0, 80);
	const cat = url.searchParams.get('kategorie') as PostCategory | null;
	const status = url.searchParams.get('status');
	const sortParam = url.searchParams.get('sortierung') ?? '';
	const sort: Sort = Object.hasOwn(SORTS, sortParam) ? (sortParam as Sort) : 'neueste';
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
				time: posts.time,
				status: posts.status,
				pinned: posts.pinned,
				einsatzNummer: posts.einsatzNummer,
				code: einsatzarten.code,
				group: einsatzarten.group,
				coverFile: cover.file,
				coverWidths: cover.widths,
				createdAt: posts.createdAt,
				updatedAt: posts.updatedAt
			})
			.from(posts)
			.leftJoin(einsatzarten, eq(einsatzarten.id, posts.einsatzartId))
			.leftJoin(cover, eq(cover.id, posts.coverMediaId))
			.where(where)
			.orderBy(...SORTS[sort])
			.limit(PAGE_SIZE)
			.offset((page - 1) * PAGE_SIZE)
			.all()
	]);
	const total = Number(totalRow?.n ?? 0);
	return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), filter: { q, cat: cat ?? '', status: status ?? '', sort: sort === 'neueste' ? '' : sort } };
};
