import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { icsCalendar } from '$lib/server/ics';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) error(404, 'Nicht gefunden');
	const e = await db.select().from(events).where(eq(events.id, id)).get();
	if (!e) error(404, 'Nicht gefunden');
	const body = icsCalendar([{ ...e, postSlug: null }], url.origin, e.title);
	return new Response(body, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="termin-${id}.ics"`
		}
	});
};
