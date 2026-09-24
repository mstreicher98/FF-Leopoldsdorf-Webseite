import fs from 'node:fs';
import { fail } from '@sveltejs/kit';
import { logAction } from '$lib/server/audit';
import { createBackup, listBackups } from '$lib/server/backup';
import { mediaById } from '$lib/server/content';
import { DB_FILE } from '$lib/server/db';
import { intOrNull, requirePermission, str } from '$lib/server/guard';
import { uploadsSize } from '$lib/server/media';
import { getSettings, saveSettings, type SiteSettings } from '$lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requirePermission(locals, 'settings.manage');
	const settings = await getSettings();
	return {
		settings,
		hero: await mediaById(settings.heroMediaId),
		backups: listBackups(),
		sizes: { db: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0, uploads: uploadsSize() }
	};
};

const url = (v: FormDataEntryValue | null) => {
	const s = str(v, 300);
	return !s || /^https:\/\//i.test(s) ? s : null;
};

export const actions: Actions = {
	speichern: async ({ locals, request }) => {
		const me = requirePermission(locals, 'settings.manage');
		const f = await request.formData();
		const social = { facebook: url(f.get('facebook')), instagram: url(f.get('instagram')), x: url(f.get('x')), youtube: url(f.get('youtube')) };
		if (Object.values(social).some((v) => v === null)) return fail(400, { error: 'Links zu sozialen Netzwerken müssen mit https:// beginnen.' });
		const patch: Partial<SiteSettings> = {
			name: str(f.get('name'), 100) || 'Freiwillige Feuerwehr Leopoldsdorf',
			claim: str(f.get('claim'), 160),
			street: str(f.get('strasse'), 100),
			zip: str(f.get('plz'), 10),
			city: str(f.get('ort'), 60),
			email: str(f.get('email'), 120),
			phone: str(f.get('telefon'), 40),
			phoneNote: str(f.get('telefonHinweis'), 80),
			iban: str(f.get('iban'), 40),
			bic: str(f.get('bic'), 20),
			donationNote: str(f.get('spendenHinweis'), 200),
			facebook: social.facebook!,
			instagram: social.instagram!,
			x: social.x!,
			youtube: social.youtube!,
			heroMediaId: intOrNull(f.get('titelbild'))
		};
		await saveSettings(patch);
		await logAction(me.id, 'geändert', 'einstellungen', null, 'Angaben der Feuerwehr');
		return { message: 'Einstellungen gespeichert' };
	},

	sichern: async ({ locals }) => {
		requirePermission(locals, 'settings.manage');
		const name = await createBackup();
		return { message: `Sicherung ${name} erstellt` };
	}
};
