import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) =>
	new Response(`User-agent: *\nDisallow: /admin\n\nSitemap: ${url.origin}/sitemap.xml\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
