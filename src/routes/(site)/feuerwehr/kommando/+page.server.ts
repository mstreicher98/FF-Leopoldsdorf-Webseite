import { publicMembers } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { visible, hidden } = await publicMembers();
	return {
		kommando: visible.filter((m) => m.kommandoPosition).sort((a, b) => a.kommandoSort - b.kommandoSort),
		hidden: hidden.kommando
	};
};
