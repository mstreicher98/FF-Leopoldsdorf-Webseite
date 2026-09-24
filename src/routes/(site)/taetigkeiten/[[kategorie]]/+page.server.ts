import { error } from '@sveltejs/kit';
import { categoryByPath } from '$lib/categories';
import { todayVienna } from '$lib/format';
import { listPosts, postYears } from '$lib/server/content';
import { einsatzStats } from '$lib/server/stats';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const cat = params.kategorie ? categoryByPath(params.kategorie) : undefined;
	if (params.kategorie && !cat) error(404, 'Diese Seite gibt es nicht.');

	const years = await postYears(cat?.id);
	const yearParam = Number(url.searchParams.get('jahr'));
	const year = years.includes(yearParam) ? yearParam : undefined;
	const page = Math.max(1, Number(url.searchParams.get('seite')) || 1);

	const result = await listPosts({ category: cat?.id, year, page, pageSize: 12 });
	if (page > result.pages) error(404, 'Diese Seite gibt es nicht.');

	// Einsatzstatistik für das gewählte bzw. aktuelle Jahr
	const statsYear = year ?? Number(todayVienna().slice(0, 4));
	const stats = cat?.id === 'einsatz' ? await einsatzStats(statsYear) : null;

	return { category: cat ?? null, years, year: year ?? null, ...result, stats };
};
