import { and, asc, eq, ne } from 'drizzle-orm';
import { slugify } from '$lib/slug';
import { logAction } from './audit';
import { db } from './db';
import { einsatzarten, POST_CATEGORIES, postImages, posts, postVehicles, vehicles, type PostCategory, type PostStatus } from './db/schema';
import { checked, idList, intOrNull, isDay, isTime, str, strOrNull } from './guard';
import { cleanHtml } from './sanitize';

export interface PostInput {
	title: string;
	category: PostCategory;
	date: string;
	time: string | null;
	status: PostStatus;
	pinned: boolean;
	summary: string;
	contentHtml: string;
	coverMediaId: number | null;
	gallery: number[];
	einsatzNummer: string | null;
	einsatzartId: number | null;
	stichwort: string | null;
	einsatzort: string | null;
	vehicleIds: number[];
}

export function parsePostForm(form: FormData): { input?: PostInput; error?: string } {
	const title = str(form.get('titel'), 200);
	const category = str(form.get('kategorie'), 20) as PostCategory;
	const date = str(form.get('datum'), 10);
	const time = str(form.get('uhrzeit'), 5);
	const einsatz = category === 'einsatz';
	const wanted = form.get('status');
	// „Nur Statistik“ gibt es nur bei Einsätzen
	const status: PostStatus = wanted === 'veroeffentlicht' ? 'veroeffentlicht' : wanted === 'statistik' && einsatz ? 'statistik' : 'entwurf';
	const statsOnly = status === 'statistik';

	// Ohne Bericht darf der Titel fehlen – dann gilt das Stichwort bzw. die Einsatzart (savePost)
	if (!title && !statsOnly) return { error: 'Bitte einen Titel eingeben.' };
	if (!POST_CATEGORIES.includes(category)) return { error: 'Bitte eine Kategorie wählen.' };
	if (!isDay(date)) return { error: 'Bitte ein gültiges Datum eingeben.' };
	if (time && !isTime(time)) return { error: 'Die Uhrzeit bitte im Format HH:MM eingeben.' };
	if (statsOnly && !intOrNull(form.get('einsatzart'))) return { error: 'Bitte die Einsatzart wählen – danach wird der Einsatz in der Statistik gezählt.' };

	return {
		input: {
			title,
			category,
			date,
			time: time || null,
			status,
			// ein Einsatz ohne Bericht hat keine öffentliche Seite, die man anheften könnte
			pinned: !statsOnly && checked(form.get('angeheftet')),
			summary: str(form.get('kurzfassung'), 400),
			contentHtml: cleanHtml(String(form.get('inhalt') ?? '')),
			coverMediaId: intOrNull(form.get('titelbild')),
			gallery: idList(form, 'bilder'),
			einsatzNummer: einsatz ? strOrNull(form.get('einsatznummer'), 20) : null,
			einsatzartId: einsatz ? intOrNull(form.get('einsatzart')) : null,
			stichwort: einsatz ? strOrNull(form.get('stichwort'), 120) : null,
			einsatzort: einsatz ? strOrNull(form.get('einsatzort'), 160) : null,
			vehicleIds: einsatz ? idList(form, 'fahrzeuge') : []
		}
	};
}

async function uniqueSlug(title: string, date: string, exceptId?: number): Promise<string> {
	const base = slugify(title) || `beitrag-${date}`;
	for (let i = 1; ; i++) {
		const candidate = i === 1 ? base : `${base}-${i}`;
		const clash = await db
			.select({ id: posts.id })
			.from(posts)
			.where(exceptId ? and(eq(posts.slug, candidate), ne(posts.id, exceptId)) : eq(posts.slug, candidate))
			.get();
		if (!clash) return candidate;
	}
}

/** Titel für einen Einsatz ohne Bericht, wenn keiner eingegeben wurde: Stichwort, sonst Einsatzart */
async function fallbackTitle(input: PostInput): Promise<string> {
	if (input.stichwort) return input.stichwort;
	const art = input.einsatzartId ? await db.select({ label: einsatzarten.label }).from(einsatzarten).where(eq(einsatzarten.id, input.einsatzartId)).get() : null;
	return art?.label ?? 'Einsatz';
}

/** Anlegen (id = null) oder Ändern. Liefert die ID. */
export async function savePost(id: number | null, input: PostInput, userId: number): Promise<number> {
	if (!input.title) input = { ...input, title: await fallbackTitle(input) };
	const { gallery, vehicleIds, ...fields } = input;
	const existing = id ? await db.select().from(posts).where(eq(posts.id, id)).get() : null;
	const publishing = input.status === 'veroeffentlicht' && existing?.status !== 'veroeffentlicht';

	const postId = await db.transaction(async (tx) => {
		let pid: number;
		if (existing) {
			await tx
				.update(posts)
				.set({
					...fields,
					updatedById: userId,
					publishedAt: publishing && !existing.publishedAt ? new Date() : existing.publishedAt
				})
				.where(eq(posts.id, existing.id));
			pid = existing.id;
		} else {
			const row = await tx
				.insert(posts)
				.values({
					...fields,
					slug: await uniqueSlug(input.title, input.date),
					authorId: userId,
					updatedById: userId,
					publishedAt: input.status === 'veroeffentlicht' ? new Date() : null
				})
				.returning({ id: posts.id })
				.get();
			pid = row.id;
		}
		await tx.delete(postImages).where(eq(postImages.postId, pid));
		for (const [i, mediaId] of gallery.entries()) await tx.insert(postImages).values({ postId: pid, mediaId, sortOrder: i });
		await tx.delete(postVehicles).where(eq(postVehicles.postId, pid));
		for (const vehicleId of vehicleIds) await tx.insert(postVehicles).values({ postId: pid, vehicleId });
		return pid;
	});

	const action = !existing
		? input.status === 'veroeffentlicht'
			? 'veröffentlicht'
			: 'erstellt'
		: publishing
			? 'veröffentlicht'
			: existing.status === 'veroeffentlicht' && input.status !== 'veroeffentlicht'
				? 'zurückgezogen'
				: 'geändert';
	await logAction(userId, action, 'beitrag', postId, input.title);
	return postId;
}

/** Auswahllisten für das Formular */
export async function postFormOptions() {
	const [arten, fahrzeuge] = await Promise.all([
		db.select().from(einsatzarten).orderBy(asc(einsatzarten.sortOrder), asc(einsatzarten.code)).all(),
		db
			.select({ id: vehicles.id, name: vehicles.name, shortName: vehicles.shortName, radioName: vehicles.radioName, inService: vehicles.inService })
			.from(vehicles)
			.orderBy(asc(vehicles.sortOrder), asc(vehicles.name))
			.all()
	]);
	return { einsatzarten: arten, fahrzeuge };
}
