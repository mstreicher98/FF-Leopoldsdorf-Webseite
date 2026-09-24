import { and, eq, inArray, sql } from 'drizzle-orm';
import { EINSATZ_GROUPS, type EinsatzGroup } from '$lib/einsatz';
import { db } from './db';
import { einsatzarten, posts } from './db/schema';

export interface EinsatzStats {
	year: number;
	total: number;
	byGroup: Record<EinsatzGroup, number>;
}

/**
 * Einsätze eines Jahres: veröffentlichte Einsatzberichte und Einsätze ohne Bericht („Nur Statistik“).
 * Einsatzarten mit „zählt nicht zur Statistik“ (z. B. Brandsicherheitswache)
 * bleiben draußen; Berichte ohne Einsatzart zählen als „Sonstige“.
 */
export async function einsatzStats(year: number): Promise<EinsatzStats> {
	const rows = await db
		.select({ group: einsatzarten.group, n: sql<number>`count(*)` })
		.from(posts)
		.leftJoin(einsatzarten, eq(einsatzarten.id, posts.einsatzartId))
		.where(
			and(
				eq(posts.category, 'einsatz'),
				// auch Einsätze ohne eigenen Bericht („Nur Statistik“)
				inArray(posts.status, ['veroeffentlicht', 'statistik']),
				sql`substr(${posts.date}, 1, 4) = ${String(year)}`,
				sql`(${einsatzarten.id} IS NULL OR ${einsatzarten.countsInStats} = 1)`
			)
		)
		.groupBy(einsatzarten.group)
		.all();
	const byGroup = Object.fromEntries(EINSATZ_GROUPS.map((g) => [g, 0])) as Record<EinsatzGroup, number>;
	for (const r of rows) byGroup[(r.group ?? 'sonstiges') as EinsatzGroup] += Number(r.n);
	return { year, total: Object.values(byGroup).reduce((a, b) => a + b, 0), byGroup };
}

/** Jahre, in denen es veröffentlichte Einsatzberichte gibt – neueste zuerst */
export async function einsatzYears(): Promise<number[]> {
	const rows = await db
		.selectDistinct({ y: sql<string>`substr(${posts.date}, 1, 4)` })
		.from(posts)
		.where(and(eq(posts.category, 'einsatz'), eq(posts.status, 'veroeffentlicht')))
		.all();
	return rows.map((r) => Number(r.y)).sort((a, b) => b - a);
}

/** Vorschlag für die nächste Einsatznummer im Jahr, z. B. "12/26" */
export async function nextEinsatzNummer(day: string): Promise<string> {
	const year = day.slice(0, 4);
	const rows = await db
		.select({ nr: posts.einsatzNummer })
		.from(posts)
		.where(and(eq(posts.category, 'einsatz'), sql`substr(${posts.date}, 1, 4) = ${year}`))
		.all();
	let max = 0;
	for (const r of rows) {
		const n = Number.parseInt(r.nr ?? '', 10);
		if (Number.isFinite(n) && n > max) max = n;
	}
	return `${max + 1}/${year.slice(2)}`;
}
