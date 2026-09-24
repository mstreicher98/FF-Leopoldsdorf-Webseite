import { sql } from 'drizzle-orm';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { DEFAULT_EINSATZARTEN } from '$lib/einsatz';
import { generatePassword, hashPassword } from '../auth';
import { db } from './index';
import { einsatzarten, pages, users } from './schema';
import { SEED_PAGES } from './seed-pages';

const count = async (table: typeof users | typeof einsatzarten | typeof pages) =>
	Number((await db.select({ n: sql<number>`count(*)` }).from(table).get())?.n ?? 0);

/** Grunddaten für eine brandneue Installation – bestehende Daten bleiben unberührt */
export async function bootstrap() {
	if ((await count(users)) === 0) await createInitialAdmin();
	if ((await count(einsatzarten)) === 0) {
		for (const [i, e] of DEFAULT_EINSATZARTEN.entries()) {
			await db.insert(einsatzarten).values({ ...e, countsInStats: e.countsInStats ?? true, sortOrder: i });
		}
	}
	if ((await count(pages)) === 0) {
		for (const p of SEED_PAGES) await db.insert(pages).values(p);
	}
}

async function createInitialAdmin() {
	const username = (env.INITIAL_ADMIN_USERNAME || 'admin').trim().toLowerCase();
	const fromEnv = env.INITIAL_ADMIN_PASSWORD;
	const password = fromEnv || (dev ? 'feuerwehr-admin' : generatePassword(16));
	await db.insert(users).values({
		username,
		name: env.INITIAL_ADMIN_NAME || 'Administrator',
		email: env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase() || null,
		role: 'admin',
		owner: true,
		passwordHash: await hashPassword(password),
		mustChangePassword: !dev
	});
	const line = '─'.repeat(60);
	console.info(
		`\n${line}\n  Erster Admin-Zugang angelegt\n  Adresse:      /admin\n  Benutzername: ${username}\n  Passwort:     ${fromEnv ? '(aus INITIAL_ADMIN_PASSWORD)' : password}\n  Beim ersten Login werden ein neues Passwort und die\n  Zwei-Faktor-Anmeldung (Authenticator-App) eingerichtet.\n${line}\n`
	);
}
