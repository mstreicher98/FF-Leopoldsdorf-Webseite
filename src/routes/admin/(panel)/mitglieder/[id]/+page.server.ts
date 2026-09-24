import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { isKnownRank } from '$lib/dienstgrade';
import { logAction } from '$lib/server/audit';
import { mediaById } from '$lib/server/content';
import { db } from '$lib/server/db';
import { MEMBER_STATUS, members, type MemberStatus } from '$lib/server/db/schema';
import { setFlash } from '$lib/server/flash';
import { checked, intOrNull, requirePermission, str, strOrNull } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

async function find(idParam: string) {
	if (idParam === 'neu') return null;
	const m = await db
		.select()
		.from(members)
		.where(eq(members.id, Number(idParam) || 0))
		.get();
	if (!m) error(404, 'Dieses Mitglied gibt es nicht.');
	return m;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	requirePermission(locals, 'content.manage');
	const member = await find(params.id);
	return { member, photo: await mediaById(member?.photoMediaId) };
};

export const actions: Actions = {
	speichern: async ({ locals, params, request, cookies }) => {
		const me = requirePermission(locals, 'content.manage');
		const existing = await find(params.id);
		const f = await request.formData();
		const status = str(f.get('status'), 10) as MemberStatus;
		const kommandoPosition = strOrNull(f.get('kommandoPosition'), 80);
		const values = {
			firstName: str(f.get('vorname'), 60),
			lastName: str(f.get('nachname'), 60),
			rank: str(f.get('dienstgrad'), 10),
			honoraryRank: checked(f.get('ehren')),
			functionTitle: str(f.get('funktion'), 100),
			status: MEMBER_STATUS.includes(status) ? status : 'aktiv',
			chargen: checked(f.get('chargen')),
			kommandoPosition,
			kommandoSort: intOrNull(f.get('kommandoSort')) ?? 0,
			kommandoText: kommandoPosition ? str(f.get('kommandoText'), 600) : '',
			photoMediaId: intOrNull(f.get('foto')),
			publicVisible: checked(f.get('oeffentlich')),
			photoApproved: checked(f.get('fotoFrei')),
			standesbuchNr: strOrNull(f.get('standesbuch'), 20)
		};
		if (!values.firstName || !values.lastName) return fail(400, { error: 'Bitte Vor- und Nachname eingeben.' });
		if (!isKnownRank(values.rank)) return fail(400, { error: 'Bitte einen Dienstgrad wählen.' });

		const label = `${values.firstName} ${values.lastName}`;
		let id: number;
		if (existing) {
			await db.update(members).set(values).where(eq(members.id, existing.id));
			id = existing.id;
		} else {
			id = (await db.insert(members).values(values).returning({ id: members.id }).get()).id;
		}
		await logAction(me.id, existing ? 'geändert' : 'erstellt', 'mitglied', id, label);
		setFlash(cookies, existing ? `${label} gespeichert` : `${label} angelegt`);
		redirect(303, '/admin/mitglieder');
	},

	loeschen: async ({ locals, params, cookies }) => {
		const me = requirePermission(locals, 'content.manage');
		const existing = await find(params.id);
		if (!existing) redirect(303, '/admin/mitglieder');
		await db.delete(members).where(eq(members.id, existing.id));
		const label = `${existing.firstName} ${existing.lastName}`;
		await logAction(me.id, 'gelöscht', 'mitglied', existing.id, label);
		setFlash(cookies, `${label} gelöscht`);
		redirect(303, '/admin/mitglieder');
	}
};
