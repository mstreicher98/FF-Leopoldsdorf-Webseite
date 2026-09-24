import { pastEvents, upcomingEvents } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [upcoming, past] = await Promise.all([upcomingEvents(100), pastEvents(12)]);
	return { upcoming, past };
};
