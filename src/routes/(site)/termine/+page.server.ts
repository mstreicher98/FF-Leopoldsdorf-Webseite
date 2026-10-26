import { pageBanner } from '$lib/server/banners';
import { pastEvents, upcomingEvents } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [upcoming, past, banner] = await Promise.all([upcomingEvents(100), pastEvents(12), pageBanner('termine')]);
	return { upcoming, past, banner };
};
