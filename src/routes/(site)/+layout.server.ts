import { menuPages } from '$lib/server/content';
import { getSettings } from '$lib/server/settings';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const s = await getSettings();
	return {
		menu: await menuPages(),
		site: {
			name: s.name,
			claim: s.claim,
			street: s.street,
			zip: s.zip,
			city: s.city,
			email: s.email,
			phone: s.phone,
			phoneNote: s.phoneNote,
			iban: s.iban,
			bic: s.bic,
			donationNote: s.donationNote,
			facebook: s.facebook,
			instagram: s.instagram,
			x: s.x,
			youtube: s.youtube
		},
		signedIn: !!locals.user
	};
};
