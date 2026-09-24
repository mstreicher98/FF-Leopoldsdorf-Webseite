import { todayVienna } from '$lib/format';
import { allEventsFrom } from '$lib/server/content';
import { icsCalendar } from '$lib/server/ics';
import type { RequestHandler } from './$types';

/** Alle Termine ab einem Jahr zurück – zum Abonnieren im Handy-Kalender */
export const GET: RequestHandler = async ({ url }) => {
	const from = `${Number(todayVienna().slice(0, 4)) - 1}${todayVienna().slice(4)}`;
	const body = icsCalendar(await allEventsFrom(from), url.origin);
	return new Response(body, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': 'inline; filename="feuerwehr-leopoldsdorf.ics"',
			'Cache-Control': 'public, max-age=900'
		}
	});
};
