import { pageBanner } from '$lib/server/banners';
import { publicMembers } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ ...(await publicMembers()), banner: await pageBanner('mannschaft') });
