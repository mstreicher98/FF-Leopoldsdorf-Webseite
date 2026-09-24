import { todayVienna } from '$lib/format';
import { latestEinsatz, listPosts, mediaById, pageBySlug, pinnedPosts, upcomingEvents } from '$lib/server/content';
import { getSettings } from '$lib/server/settings';
import { einsatzStats } from '$lib/server/stats';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const s = await getSettings();
	const year = Number(todayVienna().slice(0, 4));
	const pinned = await pinnedPosts();
	const [latest, stats, upcoming, lastEinsatz, hero, about] = await Promise.all([
		listPosts({ pageSize: 6, exclude: pinned.map((p) => p.id) }),
		einsatzStats(year),
		upcomingEvents(3),
		latestEinsatz(),
		mediaById(s.heroMediaId),
		pageBySlug('ueber-uns', 'feuerwehr')
	]);
	// "Mitglied werden" führt zur Seite "Über uns" – gibt es die nicht, direkt zur E-Mail
	const joinHref = about ? '/feuerwehr/ueber-uns' : `mailto:${s.email}?subject=${encodeURIComponent('Mitglied werden')}`;
	return { pinned, latest: latest.items, totalPosts: latest.total + pinned.length, stats, upcoming, lastEinsatz, hero, joinHref };
};
