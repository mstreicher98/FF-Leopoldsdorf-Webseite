import { error } from '@sveltejs/kit';
import { postBySlug, relatedPosts } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	// Angemeldete sehen auch Entwürfe – als Vorschau
	const post = await postBySlug(params.slug, !!locals.user);
	if (!post) error(404, 'Diesen Beitrag gibt es nicht (mehr).');
	return { post, related: await relatedPosts(post, 3) };
};
