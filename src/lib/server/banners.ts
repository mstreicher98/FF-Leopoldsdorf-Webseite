import { BANNER_PAGES, bannerFallback, type BannerKey } from '$lib/banners';
import type { MediaRef } from '$lib/media';
import { mediaById, mediaByIds } from './content';
import { getSettings, type SiteSettings } from './settings';

const chosenId = (s: SiteSettings, key: BannerKey) => (key === 'start' ? s.heroMediaId : (s.banners[key] ?? null));

/** Titelbild einer festen Seite: gewähltes Bild aus der Mediathek, sonst das Standardbild */
export async function pageBanner(key: BannerKey): Promise<string | MediaRef> {
	const id = chosenId(await getSettings(), key);
	return (id ? await mediaById(id) : null) ?? bannerFallback(key);
}

/** Gewählte Bilder aller festen Seiten für den internen Bereich; null = Standardbild */
export async function chosenBanners(): Promise<Record<BannerKey, MediaRef | null>> {
	const s = await getSettings();
	const ids = BANNER_PAGES.map((b) => chosenId(s, b.key)).filter((id): id is number => id != null);
	const found = new Map((await mediaByIds(ids)).map((m) => [m.id, m]));
	return Object.fromEntries(BANNER_PAGES.map((b) => [b.key, found.get(chosenId(s, b.key) ?? -1) ?? null])) as Record<BannerKey, MediaRef | null>;
}
