import { takeFlash } from '$lib/server/flash';
import { requireUser } from '$lib/server/guard';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const me = requireUser(locals);
	return {
		me: { id: me.id, name: me.name, username: me.username, role: me.role, owner: me.owner },
		theme: locals.theme,
		flash: takeFlash(cookies)
	};
};
