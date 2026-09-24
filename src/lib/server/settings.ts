import { eq } from 'drizzle-orm';
import { db } from './db';
import { settings } from './db/schema';

/** Angaben der Feuerwehr, die an mehreren Stellen erscheinen (Footer, Impressum …) */
export interface SiteSettings {
	name: string;
	claim: string;
	street: string;
	zip: string;
	city: string;
	email: string;
	phone: string;
	phoneNote: string;
	iban: string;
	bic: string;
	donationNote: string;
	facebook: string;
	instagram: string;
	x: string;
	youtube: string;
	/** Titelbild der Startseite aus der Mediathek; null = Standardbild */
	heroMediaId: number | null;
}

export const DEFAULT_SETTINGS: SiteSettings = {
	name: 'Freiwillige Feuerwehr Leopoldsdorf',
	claim: 'Gemeinsam für ein sicheres Leopoldsdorf',
	street: 'Achauerstraße 43',
	zip: '2333',
	city: 'Leopoldsdorf',
	email: 'leopoldsdorf.2333@feuerwehr.gv.at',
	phone: '+43 2235 47202',
	phoneNote: 'nicht ständig besetzt',
	iban: 'AT95 3225 0000 0030 0830',
	bic: 'RLNWATWWGTD',
	donationNote: 'Bitte bei Spenden „Spende“ als Zahlungsreferenz angeben.',
	facebook: 'https://www.facebook.com/ffleopoldsdorf',
	instagram: 'https://www.instagram.com/feuerwehr_leopoldsdorf/',
	x: 'https://x.com/ffleopoldsdorf',
	youtube: 'https://www.youtube.com/@freiwilligefeuerwehrleopol7658',
	heroMediaId: null
};

const KEY = 'site';
let cache: SiteSettings | null = null;

export async function getSettings(): Promise<SiteSettings> {
	if (cache) return cache;
	const row = await db.select().from(settings).where(eq(settings.key, KEY)).get();
	let stored: Partial<SiteSettings> = {};
	try {
		stored = row ? JSON.parse(row.value) : {};
	} catch {
		/* kaputter Eintrag → Standardwerte */
	}
	cache = { ...DEFAULT_SETTINGS, ...stored };
	return cache;
}

export async function saveSettings(patch: Partial<SiteSettings>) {
	const next = { ...(await getSettings()), ...patch };
	const value = JSON.stringify(next);
	await db.insert(settings).values({ key: KEY, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
	cache = next;
}

/** "+43 2235 47202" → "tel:+43223547202" */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
