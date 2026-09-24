import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db } from '$lib/server/db';
import { media, vehicles } from '$lib/server/db/schema';
import { intOrNull, requirePermission } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

async function ordered() {
	const cover = alias(media, 'cover');
	return db
		.select({
			id: vehicles.id,
			slug: vehicles.slug,
			name: vehicles.name,
			shortName: vehicles.shortName,
			radioName: vehicles.radioName,
			inService: vehicles.inService,
			coverFile: cover.file,
			coverWidths: cover.widths
		})
		.from(vehicles)
		.leftJoin(cover, eq(cover.id, vehicles.coverMediaId))
		.orderBy(asc(vehicles.sortOrder), asc(vehicles.name))
		.all();
}

export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'content.manage');
	return { vehicles: await ordered() };
};

export const actions: Actions = {
	/** Fahrzeug um eine Stelle nach oben/unten schieben */
	verschieben: async ({ locals, request }) => {
		requirePermission(locals, 'content.manage');
		const f = await request.formData();
		const id = intOrNull(f.get('id'));
		const dir = f.get('richtung') === 'hoch' ? -1 : 1;
		const list = await ordered();
		const i = list.findIndex((v) => v.id === id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= list.length) return fail(400, { error: 'Verschieben nicht möglich.' });
		[list[i], list[j]] = [list[j], list[i]];
		await db.transaction(async (tx) => {
			for (const [k, v] of list.entries()) await tx.update(vehicles).set({ sortOrder: k }).where(eq(vehicles.id, v.id));
		});
		return { ok: true };
	}
};
