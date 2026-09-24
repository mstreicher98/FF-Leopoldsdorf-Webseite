import { error, fail, redirect } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { logAction } from '$lib/server/audit';
import { db } from '$lib/server/db';
import { events, posts } from '$lib/server/db/schema';
import { setFlash } from '$lib/server/flash';
import { intOrNull, isDay, isTime, requirePermission, str, strOrNull } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

async function find(idParam: string) {
	if (idParam === 'neu') return null;
	const e = await db
		.select()
		.from(events)
		.where(eq(events.id, Number(idParam) || 0))
		.get();
	if (!e) error(404, 'Diesen Termin gibt es nicht.');
	return e;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	requirePermission(locals, 'content.manage');
	const event = await find(params.id);
	const recentPosts = await db
		.select({ id: posts.id, title: posts.title, date: posts.date })
		.from(posts)
		.where(eq(posts.status, 'veroeffentlicht'))
		.orderBy(desc(posts.date))
		.limit(40)
		.all();
	return { event, recentPosts };
};

export const actions: Actions = {
	speichern: async ({ locals, params, request, cookies }) => {
		const me = requirePermission(locals, 'content.manage');
		const existing = await find(params.id);
		const f = await request.formData();
		const values = {
			title: str(f.get('titel'), 160),
			startDate: str(f.get('beginn'), 10),
			startTime: strOrNull(f.get('beginnZeit'), 5),
			endDate: strOrNull(f.get('ende'), 10),
			endTime: strOrNull(f.get('endeZeit'), 5),
			location: str(f.get('ort'), 160),
			description: str(f.get('beschreibung'), 2000),
			postId: intOrNull(f.get('beitrag'))
		};
		if (!values.title) return fail(400, { error: 'Bitte einen Titel eingeben.' });
		if (!isDay(values.startDate)) return fail(400, { error: 'Bitte ein gültiges Datum für den Beginn eingeben.' });
		if (values.endDate && (!isDay(values.endDate) || values.endDate < values.startDate)) {
			return fail(400, { error: 'Das Ende darf nicht vor dem Beginn liegen.' });
		}
		for (const t of [values.startTime, values.endTime]) if (t && !isTime(t)) return fail(400, { error: 'Uhrzeiten bitte als HH:MM eingeben.' });
		if (values.endDate === values.startDate) values.endDate = null;

		let id: number;
		if (existing) {
			await db.update(events).set(values).where(eq(events.id, existing.id));
			id = existing.id;
		} else {
			id = (await db.insert(events).values(values).returning({ id: events.id }).get()).id;
		}
		await logAction(me.id, existing ? 'geändert' : 'erstellt', 'termin', id, values.title);
		setFlash(cookies, existing ? 'Termin gespeichert' : 'Termin angelegt');
		redirect(303, '/admin/termine');
	},

	loeschen: async ({ locals, params, cookies }) => {
		const me = requirePermission(locals, 'content.manage');
		const existing = await find(params.id);
		if (!existing) redirect(303, '/admin/termine');
		await db.delete(events).where(eq(events.id, existing.id));
		await logAction(me.id, 'gelöscht', 'termin', existing.id, existing.title);
		setFlash(cookies, `„${existing.title}“ gelöscht`);
		redirect(303, '/admin/termine');
	}
};
