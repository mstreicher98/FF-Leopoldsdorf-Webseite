import { error, fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { logAction } from '$lib/server/audit';
import { mediaById } from '$lib/server/content';
import { db } from '$lib/server/db';
import { events, media, postImages, posts, postVehicles } from '$lib/server/db/schema';
import { setFlash } from '$lib/server/flash';
import { requirePermission } from '$lib/server/guard';
import { MEDIA_COLUMNS } from '$lib/server/media';
import { parsePostForm, postFormOptions, savePost } from '$lib/server/posts';
import { nextEinsatzNummer } from '$lib/server/stats';
import type { MediaRef } from '$lib/media';
import type { Actions, PageServerLoad } from './$types';

async function findPost(idParam: string) {
	const post = await db
		.select()
		.from(posts)
		.where(eq(posts.id, Number(idParam) || 0))
		.get();
	if (!post) error(404, 'Diesen Beitrag gibt es nicht.');
	return post;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	requirePermission(locals, 'content.manage');
	const post = await findPost(params.id);
	const [gallery, vehicleRows, cover, options, nummerVorschlag] = await Promise.all([
		db
			.select(MEDIA_COLUMNS)
			.from(postImages)
			.innerJoin(media, eq(media.id, postImages.mediaId))
			.where(eq(postImages.postId, post.id))
			.orderBy(asc(postImages.sortOrder))
			.all(),
		db.select({ id: postVehicles.vehicleId }).from(postVehicles).where(eq(postVehicles.postId, post.id)).all(),
		mediaById(post.coverMediaId),
		postFormOptions(),
		nextEinsatzNummer(post.date)
	]);
	return {
		...options,
		nummerVorschlag,
		values: {
			id: post.id,
			slug: post.slug,
			title: post.title,
			category: post.category,
			date: post.date,
			time: post.time ?? '',
			status: post.status,
			pinned: post.pinned,
			summary: post.summary,
			contentHtml: post.contentHtml,
			cover,
			gallery: gallery as MediaRef[],
			einsatzNummer: post.einsatzNummer ?? '',
			einsatzartId: post.einsatzartId,
			stichwort: post.stichwort ?? '',
			einsatzort: post.einsatzort ?? '',
			vehicleIds: vehicleRows.map((v) => v.id)
		}
	};
};

export const actions: Actions = {
	speichern: async ({ locals, params, request, cookies }) => {
		const me = requirePermission(locals, 'content.manage');
		const post = await findPost(params.id);
		const { input, error: problem } = parsePostForm(await request.formData());
		if (!input) return fail(400, { error: problem });
		await savePost(post.id, input, me.id);
		const wasOnline = post.status === 'veroeffentlicht';
		const msg =
			input.status === 'veroeffentlicht'
				? wasOnline
					? 'Änderungen gespeichert'
					: 'Beitrag veröffentlicht'
				: input.status === 'statistik'
					? wasOnline
						? 'Bericht ist offline – der Einsatz zählt weiter in der Statistik'
						: 'Einsatz für die Statistik gespeichert'
					: wasOnline
						? 'Beitrag ist jetzt offline'
						: 'Entwurf gespeichert';
		setFlash(cookies, msg);
		redirect(303, `/admin/beitraege/${post.id}`);
	},

	loeschen: async ({ locals, params, cookies }) => {
		const me = requirePermission(locals, 'content.manage');
		const post = await findPost(params.id);
		// Abhängige Zeilen ausdrücklich mitlöschen – unabhängig von den Fremdschlüssel-Einstellungen
		await db.transaction(async (tx) => {
			await tx.delete(postImages).where(eq(postImages.postId, post.id));
			await tx.delete(postVehicles).where(eq(postVehicles.postId, post.id));
			await tx.update(events).set({ postId: null }).where(eq(events.postId, post.id));
			await tx.delete(posts).where(eq(posts.id, post.id));
		});
		await logAction(me.id, 'gelöscht', 'beitrag', post.id, post.title);
		setFlash(cookies, `„${post.title}“ gelöscht`);
		redirect(303, '/admin/beitraege');
	}
};
