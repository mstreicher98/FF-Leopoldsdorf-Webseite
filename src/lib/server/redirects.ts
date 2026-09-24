import { eq } from 'drizzle-orm';
import { db } from './db';
import { redirects } from './db/schema';

/** Pfad vereinheitlichen: ohne Schrägstrich am Ende, dekodiert, klein geschrieben */
export function normalizePath(path: string): string {
	let p = path;
	try {
		p = decodeURIComponent(p);
	} catch {
		/* ungültige Kodierung – so lassen */
	}
	p = p.toLowerCase();
	if (p.length > 1) p = p.replace(/\/+$/, '');
	return p || '/';
}

export async function findRedirect(path: string): Promise<string | null> {
	const row = await db
		.select({ to: redirects.toPath })
		.from(redirects)
		.where(eq(redirects.fromPath, normalizePath(path)))
		.get();
	return row?.to ?? null;
}
