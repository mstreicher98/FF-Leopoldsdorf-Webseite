import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { slugify } from '$lib/slug';
import type { MediaRef } from '$lib/media';
import { logAction } from '$lib/server/audit';
import { mediaById } from '$lib/server/content';
import { db } from '$lib/server/db';
import { media, postVehicles, vehicleImages, vehicles } from '$lib/server/db/schema';
import { setFlash } from '$lib/server/flash';
import { checked, idList, intOrNull, requirePermission, str } from '$lib/server/guard';
import { MEDIA_COLUMNS } from '$lib/server/media';
import { cleanHtml } from '$lib/server/sanitize';
import type { Actions, PageServerLoad } from './$types';

async function find(idParam: string) {
	if (idParam === 'neu') return null;
	const v = await db
		.select()
		.from(vehicles)
		.where(eq(vehicles.id, Number(idParam) || 0))
		.get();
	if (!v) error(404, 'Dieses Fahrzeug gibt es nicht.');
	return v;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	requirePermission(locals, 'content.manage');
	const vehicle = await find(params.id);
	const gallery = vehicle
		? ((await db
				.select(MEDIA_COLUMNS)
				.from(vehicleImages)
				.innerJoin(media, eq(media.id, vehicleImages.mediaId))
				.where(eq(vehicleImages.vehicleId, vehicle.id))
				.orderBy(asc(vehicleImages.sortOrder))
				.all()) as MediaRef[])
		: [];
	let extra: { label: string; value: string }[] = [];
	try {
		extra = vehicle ? JSON.parse(vehicle.extraSpecs) : [];
	} catch {
		/* leer */
	}
	return { vehicle, cover: await mediaById(vehicle?.coverMediaId), gallery, extra };
};

async function uniqueSlug(base: string, exceptId?: number) {
	const root = slugify(base) || 'fahrzeug';
	for (let i = 1; ; i++) {
		const s = i === 1 ? root : `${root}-${i}`;
		const clash = await db
			.select({ id: vehicles.id })
			.from(vehicles)
			.where(exceptId ? and(eq(vehicles.slug, s), ne(vehicles.id, exceptId)) : eq(vehicles.slug, s))
			.get();
		if (!clash) return s;
	}
}

export const actions: Actions = {
	speichern: async ({ locals, params, request, cookies }) => {
		const me = requirePermission(locals, 'content.manage');
		const existing = await find(params.id);
		const f = await request.formData();

		const labels = f.getAll('extraLabel').map((v) => String(v).trim().slice(0, 60));
		const valuesX = f.getAll('extraWert').map((v) => String(v).trim().slice(0, 200));
		const extra = labels.map((label, i) => ({ label, value: valuesX[i] ?? '' })).filter((e) => e.label && e.value);

		const year = intOrNull(f.get('baujahr'));
		const values = {
			name: str(f.get('bezeichnung'), 120),
			shortName: str(f.get('kurz'), 30),
			radioName: str(f.get('funk'), 60),
			descriptionHtml: cleanHtml(String(f.get('beschreibung') ?? '')),
			chassis: str(f.get('fahrgestell'), 120),
			body: str(f.get('aufbau'), 120),
			year: year && year > 1900 && year < 2200 ? year : null,
			weight: str(f.get('gewicht'), 40),
			crew: str(f.get('besatzung'), 40),
			purpose: str(f.get('bereich'), 160),
			extraSpecs: JSON.stringify(extra),
			coverMediaId: intOrNull(f.get('titelbild')),
			inService: checked(f.get('imDienst'))
		};
		if (!values.name) return fail(400, { error: 'Bitte die Bezeichnung eingeben, z. B. Hilfeleistungslöschfahrzeug 3.' });
		const gallery = idList(f, 'bilder');

		const id = await db.transaction(async (tx) => {
			let vid: number;
			if (existing) {
				await tx.update(vehicles).set(values).where(eq(vehicles.id, existing.id));
				vid = existing.id;
			} else {
				const maxSort = Number((await tx.select({ m: sql<number>`coalesce(max(${vehicles.sortOrder}), -1)` }).from(vehicles).get())?.m ?? -1);
				const slug = await uniqueSlug(values.shortName || values.radioName || values.name);
				vid = (await tx.insert(vehicles).values({ ...values, slug, sortOrder: maxSort + 1 }).returning({ id: vehicles.id }).get()).id;
			}
			await tx.delete(vehicleImages).where(eq(vehicleImages.vehicleId, vid));
			for (const [i, mediaId] of gallery.entries()) await tx.insert(vehicleImages).values({ vehicleId: vid, mediaId, sortOrder: i });
			return vid;
		});
		await logAction(me.id, existing ? 'geändert' : 'erstellt', 'fahrzeug', id, values.name);
		setFlash(cookies, existing ? 'Fahrzeug gespeichert' : 'Fahrzeug angelegt');
		redirect(303, '/admin/fahrzeuge');
	},

	loeschen: async ({ locals, params, cookies }) => {
		const me = requirePermission(locals, 'content.manage');
		const existing = await find(params.id);
		if (!existing) redirect(303, '/admin/fahrzeuge');
		await db.transaction(async (tx) => {
			await tx.delete(vehicleImages).where(eq(vehicleImages.vehicleId, existing.id));
			await tx.delete(postVehicles).where(eq(postVehicles.vehicleId, existing.id));
			await tx.delete(vehicles).where(eq(vehicles.id, existing.id));
		});
		await logAction(me.id, 'gelöscht', 'fahrzeug', existing.id, existing.name);
		setFlash(cookies, `${existing.name} gelöscht`);
		redirect(303, '/admin/fahrzeuge');
	}
};
