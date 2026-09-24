import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { slugify } from '$lib/slug';
import { logAction } from '$lib/server/audit';
import { mediaById } from '$lib/server/content';
import { db } from '$lib/server/db';
import { pages } from '$lib/server/db/schema';
import { setFlash } from '$lib/server/flash';
import { intOrNull, requirePermission, str } from '$lib/server/guard';
import { cleanHtml } from '$lib/server/sanitize';
import type { Actions, PageServerLoad } from './$types';

/** Diese Adressen sind im Menü „Feuerwehr“ schon vergeben */
const RESERVED = ['kommando', 'mannschaft', 'fuhrpark'];

async function find(idParam: string) {
	if (idParam === 'neu') return null;
	const p = await db
		.select()
		.from(pages)
		.where(eq(pages.id, Number(idParam) || 0))
		.get();
	if (!p) error(404, 'Diese Seite gibt es nicht.');
	return p;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	requirePermission(locals, 'content.manage');
	const page = await find(params.id);
	return { page, banner: await mediaById(page?.bannerMediaId) };
};

export const actions: Actions = {
	speichern: async ({ locals, params, request, cookies }) => {
		const me = requirePermission(locals, 'content.manage');
		const existing = await find(params.id);
		const f = await request.formData();
		const values = {
			title: str(f.get('titel'), 100),
			subtitle: str(f.get('untertitel'), 200),
			menuText: str(f.get('menutext'), 120),
			contentHtml: cleanHtml(String(f.get('inhalt') ?? '')),
			bannerMediaId: intOrNull(f.get('banner')),
			sortOrder: intOrNull(f.get('reihenfolge')) ?? 0,
			updatedById: me.id
		};
		if (!values.title) return fail(400, { error: 'Bitte einen Titel eingeben.' });

		let id: number;
		if (existing) {
			await db.update(pages).set(values).where(eq(pages.id, existing.id));
			id = existing.id;
		} else {
			const section = f.get('bereich') === 'buergerservice' ? 'buergerservice' : 'feuerwehr';
			const slug = slugify(str(f.get('adresse'), 60) || values.title, 60);
			if (!slug) return fail(400, { error: 'Bitte eine gültige Adresse eingeben.' });
			if (section === 'feuerwehr' && RESERVED.includes(slug)) return fail(400, { error: `Die Adresse „${slug}“ ist schon vergeben.` });
			if (await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, slug)).get()) {
				return fail(400, { error: `Es gibt schon eine Seite mit der Adresse „${slug}“.` });
			}
			id = (await db.insert(pages).values({ ...values, slug, section }).returning({ id: pages.id }).get()).id;
		}
		await logAction(me.id, existing ? 'geändert' : 'erstellt', 'seite', id, values.title);
		setFlash(cookies, existing ? 'Seite gespeichert' : 'Seite angelegt');
		redirect(303, `/admin/seiten/${id}`);
	},

	loeschen: async ({ locals, params, cookies }) => {
		const me = requirePermission(locals, 'content.manage');
		const existing = await find(params.id);
		if (!existing) redirect(303, '/admin/seiten');
		if (existing.system) return fail(400, { error: 'Impressum und Datenschutz können nicht gelöscht werden.' });
		await db.delete(pages).where(eq(pages.id, existing.id));
		await logAction(me.id, 'gelöscht', 'seite', existing.id, existing.title);
		setFlash(cookies, `„${existing.title}“ gelöscht`);
		redirect(303, '/admin/seiten');
	}
};
