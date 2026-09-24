import { listVehicles } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ vehicles: await listVehicles() });
