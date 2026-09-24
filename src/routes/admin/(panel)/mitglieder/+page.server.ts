import { asc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db } from '$lib/server/db';
import { media, members } from '$lib/server/db/schema';
import { requirePermission } from '$lib/server/guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'content.manage');
	const photo = alias(media, 'photo');
	const rows = await db
		.select({
			id: members.id,
			firstName: members.firstName,
			lastName: members.lastName,
			rank: members.rank,
			honoraryRank: members.honoraryRank,
			status: members.status,
			functionTitle: members.functionTitle,
			chargen: members.chargen,
			kommandoPosition: members.kommandoPosition,
			publicVisible: members.publicVisible,
			photoApproved: members.photoApproved,
			photoFile: photo.file,
			photoWidths: photo.widths
		})
		.from(members)
		.leftJoin(photo, eq(photo.id, members.photoMediaId))
		.orderBy(asc(members.lastName), asc(members.firstName))
		.all();
	return { members: rows };
};
