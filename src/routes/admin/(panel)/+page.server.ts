import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { todayVienna } from '$lib/format';
import { recentActions } from '$lib/server/audit';
import { upcomingEvents } from '$lib/server/content';
import { db } from '$lib/server/db';
import { members, pageViews, posts, vehicles } from '$lib/server/db/schema';
import { einsatzStats } from '$lib/server/stats';
import type { PageServerLoad } from './$types';

function daysBack(n: number): string[] {
	const out: string[] = [];
	const base = new Date(`${todayVienna()}T12:00:00Z`);
	for (let i = n - 1; i >= 0; i--) {
		const d = new Date(base);
		d.setUTCDate(d.getUTCDate() - i);
		out.push(d.toISOString().slice(0, 10));
	}
	return out;
}

const count = (n: unknown) => Number(n ?? 0);

export const load: PageServerLoad = async () => {
	const year = Number(todayVienna().slice(0, 4));
	const days = daysBack(30);

	const [viewRows, topRows, stats, drafts, events, actions, counts] = await Promise.all([
		db
			.select({ day: pageViews.day, n: sql<number>`sum(${pageViews.views})` })
			.from(pageViews)
			.where(gte(pageViews.day, days[0]))
			.groupBy(pageViews.day)
			.all(),
		db
			.select({ path: pageViews.path, n: sql<number>`sum(${pageViews.views})` })
			.from(pageViews)
			.where(gte(pageViews.day, days[0]))
			.groupBy(pageViews.path)
			.orderBy(desc(sql`sum(${pageViews.views})`))
			.limit(8)
			.all(),
		einsatzStats(year),
		db
			.select({ id: posts.id, title: posts.title, category: posts.category, updatedAt: posts.updatedAt })
			.from(posts)
			.where(eq(posts.status, 'entwurf'))
			.orderBy(desc(posts.updatedAt))
			.limit(6)
			.all(),
		upcomingEvents(4),
		recentActions(10),
		Promise.all([
			db
				.select({ n: sql<number>`count(*)` })
				.from(posts)
				.where(and(eq(posts.status, 'veroeffentlicht'), sql`substr(${posts.date}, 1, 4) = ${String(year)}`))
				.get(),
			db.select({ n: sql<number>`count(*)` }).from(members).get(),
			db.select({ n: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.inService, true)).get()
		]).then(([p, m, v]) => ({ published: p?.n, members: m?.n, vehicles: v?.n }))
	]);

	const perDay = new Map(viewRows.map((r) => [r.day, count(r.n)]));
	const views = days.map((day) => ({ day, n: perDay.get(day) ?? 0 }));

	// Beitragsadressen in Titel übersetzen
	const slugs = topRows.map((r) => r.path.match(/^\/beitrag\/(.+)$/)?.[1]).filter((s): s is string => !!s);
	const titles = slugs.length
		? new Map(
				(await db.select({ slug: posts.slug, title: posts.title }).from(posts).where(and(inArray(posts.slug, slugs))).all()).map((r) => [
					r.slug,
					r.title
				])
			)
		: new Map<string, string>();
	const top = topRows.map((r) => {
		const slug = r.path.match(/^\/beitrag\/(.+)$/)?.[1];
		return { path: r.path, title: slug ? (titles.get(slug) ?? r.path) : r.path, n: count(r.n) };
	});

	return {
		year,
		views,
		viewsTotal: views.reduce((a, b) => a + b.n, 0),
		top,
		stats,
		drafts,
		events,
		actions,
		counts: { published: count(counts?.published), members: count(counts?.members), vehicles: count(counts?.vehicles) }
	};
};
