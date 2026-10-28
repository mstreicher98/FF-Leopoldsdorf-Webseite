import { todayVienna } from '$lib/format';
import { latestEinsatz, listPosts, mediaById, pageBySlug, pinnedPosts, postVehicleRefs, upcomingEvents } from '$lib/server/content';
import { getSettings } from '$lib/server/settings';
import { einsatzStats } from '$lib/server/stats';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const s = await getSettings();
	const year = Number(todayVienna().slice(0, 4));
	const [pinned, last] = await Promise.all([pinnedPosts(), latestEinsatz()]);
	const shown = [...pinned.map((p) => p.id), ...(last ? [last.id] : [])];
	const [einsaetze, others, stats, upcoming, vehicles, hero, about] = await Promise.all([
		// Einsatzbuch zeigt die letzten Einsätze vollständig – auch den aus der Depesche und angeheftete
		listPosts({ category: 'einsatz', pageSize: 5 }),
		listPosts({ notCategory: 'einsatz', pageSize: 3, exclude: shown }),
		einsatzStats(year),
		upcomingEvents(3),
		last ? postVehicleRefs(last.id) : [],
		mediaById(s.heroMediaId),
		pageBySlug('ueber-uns', 'feuerwehr')
	]);
	// "Mitglied werden" führt zur Seite "Über uns" – gibt es die nicht, direkt zur E-Mail
	const joinHref = about ? '/feuerwehr/ueber-uns' : `mailto:${s.email}?subject=${encodeURIComponent('Mitglied werden')}`;
	return {
		pinned,
		lastEinsatz: last ? { ...last, vehicles } : null,
		einsaetze: einsaetze.items,
		others: others.items,
		stats,
		upcoming,
		hero,
		joinHref
	};
};
