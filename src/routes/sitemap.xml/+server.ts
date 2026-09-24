import { CATEGORIES } from '$lib/categories';
import { sitemapEntries } from '$lib/server/content';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const o = url.origin;
	const { postRows, vehicleRows, pageRows } = await sitemapEntries();
	const day = (d: Date) => d.toISOString().slice(0, 10);
	const urls: { loc: string; lastmod?: string }[] = [
		{ loc: `${o}/` },
		{ loc: `${o}/taetigkeiten` },
		...Object.values(CATEGORIES).map((c) => ({ loc: `${o}/taetigkeiten/${c.path}` })),
		{ loc: `${o}/termine` },
		{ loc: `${o}/feuerwehr/kommando` },
		{ loc: `${o}/feuerwehr/mannschaft` },
		{ loc: `${o}/feuerwehr/fuhrpark` },
		...pageRows.map((p) => ({
			loc: p.section === 'rechtliches' ? `${o}/${p.slug}` : `${o}/${p.section}/${p.slug}`,
			lastmod: day(p.updatedAt)
		})),
		...vehicleRows.map((v) => ({ loc: `${o}/feuerwehr/fuhrpark/${v.slug}`, lastmod: day(v.updatedAt) })),
		...postRows.map((p) => ({ loc: `${o}/beitrag/${p.slug}`, lastmod: day(p.updatedAt) }))
	];
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
	return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
