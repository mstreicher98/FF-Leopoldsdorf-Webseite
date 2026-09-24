import { fail } from '@sveltejs/kit';
import { asc, eq, sql } from 'drizzle-orm';
import { EINSATZ_GROUPS, type EinsatzGroup } from '$lib/einsatz';
import { logAction } from '$lib/server/audit';
import { db } from '$lib/server/db';
import { einsatzarten, posts } from '$lib/server/db/schema';
import { checked, intOrNull, requirePermission, str } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'content.manage');
	const rows = await db
		.select({
			id: einsatzarten.id,
			code: einsatzarten.code,
			label: einsatzarten.label,
			group: einsatzarten.group,
			countsInStats: einsatzarten.countsInStats,
			active: einsatzarten.active,
			sortOrder: einsatzarten.sortOrder,
			used: sql<number>`(SELECT count(*) FROM ${posts} WHERE ${posts.einsatzartId} = ${einsatzarten.id})`
		})
		.from(einsatzarten)
		.orderBy(asc(einsatzarten.sortOrder), asc(einsatzarten.code))
		.all();
	return { arten: rows };
};

function parse(f: FormData) {
	const group = str(f.get('gruppe'), 20) as EinsatzGroup;
	return {
		code: str(f.get('code'), 10).toUpperCase(),
		label: str(f.get('bezeichnung'), 80),
		group: EINSATZ_GROUPS.includes(group) ? group : ('sonstiges' as const),
		countsInStats: checked(f.get('statistik')),
		active: checked(f.get('aktiv'))
	};
}

export const actions: Actions = {
	speichern: async ({ locals, request }) => {
		const me = requirePermission(locals, 'content.manage');
		const f = await request.formData();
		const id = intOrNull(f.get('id'));
		const v = parse(f);
		if (!v.code || !v.label) return fail(400, { error: 'Bitte Kürzel und Bezeichnung eingeben.' });
		const clash = await db.select({ id: einsatzarten.id }).from(einsatzarten).where(eq(einsatzarten.code, v.code)).get();
		if (clash && clash.id !== id) return fail(400, { error: `Das Kürzel ${v.code} gibt es schon.` });
		if (id) {
			await db.update(einsatzarten).set(v).where(eq(einsatzarten.id, id));
		} else {
			const max = Number((await db.select({ m: sql<number>`coalesce(max(${einsatzarten.sortOrder}), 0)` }).from(einsatzarten).get())?.m ?? 0);
			await db.insert(einsatzarten).values({ ...v, sortOrder: max + 1 });
		}
		await logAction(me.id, id ? 'geändert' : 'erstellt', 'einsatzart', id, `${v.code} ${v.label}`);
		return { message: id ? `${v.code} gespeichert` : `${v.code} angelegt` };
	},

	loeschen: async ({ locals, request }) => {
		const me = requirePermission(locals, 'content.manage');
		const id = intOrNull((await request.formData()).get('id'));
		const row = id ? await db.select().from(einsatzarten).where(eq(einsatzarten.id, id)).get() : null;
		if (!row) return fail(404, { error: 'Nicht gefunden.' });
		const used = Number((await db.select({ n: sql<number>`count(*)` }).from(posts).where(eq(posts.einsatzartId, row.id)).get())?.n ?? 0);
		if (used) return fail(400, { error: `${row.code} wird in ${used} Berichten verwendet. Stattdessen „nicht mehr anbieten“ wählen.` });
		await db.delete(einsatzarten).where(eq(einsatzarten.id, row.id));
		await logAction(me.id, 'gelöscht', 'einsatzart', row.id, `${row.code} ${row.label}`);
		return { message: `${row.code} gelöscht` };
	}
};
