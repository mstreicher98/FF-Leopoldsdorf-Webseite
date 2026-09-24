import { asc, desc, sql } from 'drizzle-orm';
import { todayVienna } from '$lib/format';
import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { requirePermission } from '$lib/server/guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'content.manage');
	const today = todayVienna();
	const [upcoming, past] = await Promise.all([
		db
			.select()
			.from(events)
			.where(sql`coalesce(${events.endDate}, ${events.startDate}) >= ${today}`)
			.orderBy(asc(events.startDate), asc(events.startTime))
			.all(),
		db
			.select()
			.from(events)
			.where(sql`coalesce(${events.endDate}, ${events.startDate}) < ${today}`)
			.orderBy(desc(events.startDate))
			.limit(50)
			.all()
	]);
	return { upcoming, past };
};
