import { fail, redirect } from '@sveltejs/kit';
import { POST_CATEGORIES, type PostCategory } from '$lib/server/db/schema';
import { todayVienna } from '$lib/format';
import { setFlash } from '$lib/server/flash';
import { requirePermission } from '$lib/server/guard';
import { parsePostForm, postFormOptions, savePost } from '$lib/server/posts';
import { nextEinsatzNummer } from '$lib/server/stats';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	requirePermission(locals, 'content.manage');
	const k = url.searchParams.get('kategorie') as PostCategory | null;
	const today = todayVienna();
	return {
		...(await postFormOptions()),
		nummerVorschlag: await nextEinsatzNummer(today),
		category: k && POST_CATEGORIES.includes(k) ? k : 'allgemein',
		today
	};
};

export const actions: Actions = {
	speichern: async ({ locals, request, cookies }) => {
		const me = requirePermission(locals, 'content.manage');
		const { input, error } = parsePostForm(await request.formData());
		if (!input) return fail(400, { error });
		const id = await savePost(null, input, me.id);
		setFlash(cookies, input.status === 'veroeffentlicht' ? 'Beitrag veröffentlicht' : 'Entwurf gespeichert');
		redirect(303, `/admin/beitraege/${id}`);
	}
};
