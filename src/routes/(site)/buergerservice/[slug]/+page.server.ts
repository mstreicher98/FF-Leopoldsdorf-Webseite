import { loadTextPage } from '$lib/server/textpage';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => loadTextPage(params.slug, 'buergerservice');
