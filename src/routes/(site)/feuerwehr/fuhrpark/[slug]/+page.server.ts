import { error } from '@sveltejs/kit';
import { vehicleBySlug } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const vehicle = await vehicleBySlug(params.slug);
	if (!vehicle) error(404, 'Dieses Fahrzeug gibt es nicht.');
	return { vehicle };
};
