import { json, redirect, type Handle, type HandleServerError, type ServerInit } from '@sveltejs/kit';
import { clearSessionCookie, SESSION_COOKIE, validateSession } from '$lib/server/auth';
import { scheduleMaintenance } from '$lib/server/backup';
import { ensureDatabase } from '$lib/server/db';
import { findRedirect } from '$lib/server/redirects';

export const init: ServerInit = async () => {
	await ensureDatabase();
	scheduleMaintenance();
};

/** Admin-Seiten, die ohne Anmeldung erreichbar sein müssen */
const OPEN_ADMIN = ['/admin/login'];
/** Seiten, die während der Ersteinrichtung (Passwort, 2FA) erlaubt sind */
const SETUP_PATHS = ['/admin/einrichtung', '/admin/logout'];

const isAdmin = (path: string) => path === '/admin' || path.startsWith('/admin/');
const matches = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(`${p}/`));

export const handle: Handle = async ({ event, resolve }) => {
	await ensureDatabase();

	event.locals.user = null;
	event.locals.sessionToken = null;
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const user = await validateSession(token);
		if (user) {
			event.locals.user = user;
			event.locals.sessionToken = token;
		} else {
			clearSessionCookie(event.cookies);
		}
	}

	const path = event.url.pathname;
	const admin = isAdmin(path);
	const theme = event.cookies.get('theme');
	event.locals.theme = theme === 'light' || theme === 'dark' ? theme : 'system';

	if (admin && !matches(path, OPEN_ADMIN)) {
		const user = event.locals.user;
		if (!user) {
			if (path.startsWith('/admin/api/')) return json({ message: 'Nicht angemeldet' }, { status: 401 });
			const next = path === '/admin' ? '' : `?weiter=${encodeURIComponent(path + event.url.search)}`;
			redirect(303, `/admin/login${next}`);
		}
		// Erst neues Passwort und Authenticator-App einrichten, dann alles andere
		if ((user.mustChangePassword || !user.totpEnabled) && !matches(path, SETUP_PATHS)) {
			if (path.startsWith('/admin/api/')) return json({ message: 'Einrichtung nicht abgeschlossen' }, { status: 403 });
			redirect(303, '/admin/einrichtung');
		}
	}

	// Öffentliche Seiten immer hell, der Admin folgt der Einstellung bzw. dem System
	const htmlTheme = admin ? (event.locals.theme === 'system' ? '' : event.locals.theme) : 'light';
	const response = await resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('%ff.theme%', htmlTheme).replace('%ff.themecolor%', admin ? '#f4f5f7' : '#af2b1e'),
		preload: ({ type, path }) => type === 'js' || type === 'css' || (type === 'font' && path.includes('latin-wdth-normal'))
	});

	// Alte Adressen (z. B. der früheren WordPress-Seite) auf die neue Seite umleiten
	if (response.status === 404 && event.request.method === 'GET' && !admin && !event.isDataRequest) {
		const target = await findRedirect(path);
		if (target) return new Response(null, { status: 301, headers: { Location: target } });
	}

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
	if (admin) {
		response.headers.set('X-Robots-Tag', 'noindex, nofollow');
		response.headers.set('Cache-Control', 'no-store');
	}
	return response;
};

export const handleError: HandleServerError = ({ error, status }) => {
	if (status !== 404) console.error(error);
	return { message: status === 404 ? 'Diese Seite gibt es nicht.' : 'Unerwarteter Fehler – bitte versuchen Sie es erneut.' };
};
