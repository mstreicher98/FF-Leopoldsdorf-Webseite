import { and, asc, desc, eq, gte, inArray, isNotNull, notInArray, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { todayVienna } from '$lib/format';
import type { MediaRef } from '$lib/media';
import type { EinsatzGroup } from '$lib/einsatz';
import type { EventView, MemberView, MenuPage, PostSummary, VehicleRef } from '$lib/types';
import { db } from './db';
import {
	einsatzarten,
	events,
	media,
	members,
	pages,
	postImages,
	posts,
	postVehicles,
	vehicleImages,
	vehicles,
	type PostCategory
} from './db/schema';
import { MEDIA_COLUMNS } from './media';
import { excerpt } from './sanitize';

const cover = alias(media, 'cover');

const coverColumns = {
	coverId: cover.id,
	coverFile: cover.file,
	coverWidths: cover.widths,
	coverWidth: cover.width,
	coverHeight: cover.height,
	coverAlt: cover.alt
};

type CoverRow = { coverId: number | null; coverFile: string | null; coverWidths: string | null; coverWidth: number | null; coverHeight: number | null; coverAlt: string | null };

function coverOf(r: CoverRow): MediaRef | null {
	if (r.coverId == null || !r.coverFile) return null;
	return { id: r.coverId, file: r.coverFile, widths: r.coverWidths ?? '', width: r.coverWidth ?? 0, height: r.coverHeight ?? 0, alt: r.coverAlt ?? '' };
}

/* ------------------------------------------------------------ Beiträge */

const summaryColumns = {
	id: posts.id,
	slug: posts.slug,
	title: posts.title,
	category: posts.category,
	date: posts.date,
	time: posts.time,
	summary: posts.summary,
	contentHtml: posts.contentHtml,
	pinned: posts.pinned,
	status: posts.status,
	einsatzNummer: posts.einsatzNummer,
	stichwort: posts.stichwort,
	einsatzort: posts.einsatzort,
	eaCode: einsatzarten.code,
	eaLabel: einsatzarten.label,
	eaGroup: einsatzarten.group,
	...coverColumns
};

type SummaryRow = {
	id: number;
	slug: string;
	title: string;
	category: PostCategory;
	date: string;
	time: string | null;
	summary: string;
	contentHtml: string;
	pinned: boolean;
	status: 'entwurf' | 'veroeffentlicht';
	einsatzNummer: string | null;
	stichwort: string | null;
	einsatzort: string | null;
	eaCode: string | null;
	eaLabel: string | null;
	eaGroup: EinsatzGroup | null;
} & CoverRow;

function toSummary(r: SummaryRow): PostSummary {
	return {
		id: r.id,
		slug: r.slug,
		title: r.title,
		category: r.category,
		date: r.date,
		time: r.time,
		excerpt: r.summary || excerpt(r.contentHtml),
		pinned: r.pinned,
		status: r.status,
		cover: coverOf(r),
		einsatz:
			r.category === 'einsatz'
				? { nummer: r.einsatzNummer, code: r.eaCode, label: r.eaLabel, group: r.eaGroup, stichwort: r.stichwort, ort: r.einsatzort }
				: null
	};
}

function summaryQuery(where: SQL | undefined) {
	return db
		.select(summaryColumns)
		.from(posts)
		.leftJoin(cover, eq(cover.id, posts.coverMediaId))
		.leftJoin(einsatzarten, eq(einsatzarten.id, posts.einsatzartId))
		.where(where)
		.orderBy(desc(posts.date), sql`${posts.time} IS NULL`, desc(posts.time), desc(posts.id));
}

const published = eq(posts.status, 'veroeffentlicht');

export async function listPosts(opts: { category?: PostCategory; year?: number; page?: number; pageSize?: number; exclude?: number[] }) {
	const pageSize = opts.pageSize ?? 12;
	const page = Math.max(1, opts.page ?? 1);
	const conds: SQL[] = [published];
	if (opts.category) conds.push(eq(posts.category, opts.category));
	if (opts.year) conds.push(sql`substr(${posts.date}, 1, 4) = ${String(opts.year)}`);
	if (opts.exclude?.length) conds.push(notInArray(posts.id, opts.exclude));
	const where = and(...conds);
	const total = Number((await db.select({ n: sql<number>`count(*)` }).from(posts).where(where).get())?.n ?? 0);
	const rows = await summaryQuery(where)
		.limit(pageSize)
		.offset((page - 1) * pageSize)
		.all();
	return { items: rows.map(toSummary), total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function pinnedPosts(): Promise<PostSummary[]> {
	return (await summaryQuery(and(published, eq(posts.pinned, true))).limit(3).all()).map(toSummary);
}

export async function latestEinsatz(): Promise<PostSummary | null> {
	const row = await summaryQuery(and(published, eq(posts.category, 'einsatz'))).limit(1).get();
	return row ? toSummary(row) : null;
}

export async function postYears(category?: PostCategory): Promise<number[]> {
	const rows = await db
		.selectDistinct({ y: sql<string>`substr(${posts.date}, 1, 4)` })
		.from(posts)
		.where(category ? and(published, eq(posts.category, category)) : published)
		.all();
	return rows.map((r) => Number(r.y)).sort((a, b) => b - a);
}

export async function relatedPosts(post: { id: number; category: PostCategory }, limit = 3): Promise<PostSummary[]> {
	return (
		await summaryQuery(and(published, eq(posts.category, post.category), sql`${posts.id} <> ${post.id}`))
			.limit(limit)
			.all()
	).map(toSummary);
}

/** Vollständiger Beitrag; Entwürfe nur mit `drafts` (Vorschau für Angemeldete) */
export async function postBySlug(slug: string, drafts = false) {
	const row = await db
		.select({ ...summaryColumns, publishedAt: posts.publishedAt, updatedAt: posts.updatedAt })
		.from(posts)
		.leftJoin(cover, eq(cover.id, posts.coverMediaId))
		.leftJoin(einsatzarten, eq(einsatzarten.id, posts.einsatzartId))
		.where(drafts ? eq(posts.slug, slug) : and(eq(posts.slug, slug), published))
		.get();
	if (!row) return null;
	const gallery = await db
		.select(MEDIA_COLUMNS)
		.from(postImages)
		.innerJoin(media, eq(media.id, postImages.mediaId))
		.where(eq(postImages.postId, row.id))
		.orderBy(asc(postImages.sortOrder))
		.all();
	const vehicleRows = await db
		.select({ id: vehicles.id, slug: vehicles.slug, name: vehicles.name, shortName: vehicles.shortName, radioName: vehicles.radioName })
		.from(postVehicles)
		.innerJoin(vehicles, eq(vehicles.id, postVehicles.vehicleId))
		.where(eq(postVehicles.postId, row.id))
		.orderBy(asc(vehicles.sortOrder), asc(vehicles.name))
		.all();
	return {
		...toSummary(row),
		contentHtml: row.contentHtml,
		summaryText: row.summary,
		updatedAt: row.updatedAt,
		gallery: gallery as MediaRef[],
		vehicles: vehicleRows as VehicleRef[]
	};
}

/* ------------------------------------------------------------ Termine */

const eventColumns = {
	id: events.id,
	title: events.title,
	startDate: events.startDate,
	startTime: events.startTime,
	endDate: events.endDate,
	endTime: events.endTime,
	location: events.location,
	description: events.description,
	postSlug: posts.slug
};

/** Termine ab heute (mehrtägige, die noch laufen, inklusive) */
export async function upcomingEvents(limit = 50): Promise<EventView[]> {
	const today = todayVienna();
	return db
		.select(eventColumns)
		.from(events)
		.leftJoin(posts, and(eq(posts.id, events.postId), published))
		.where(sql`coalesce(${events.endDate}, ${events.startDate}) >= ${today}`)
		.orderBy(asc(events.startDate), sql`${events.startTime} IS NULL`, asc(events.startTime))
		.limit(limit)
		.all();
}

export async function pastEvents(limit = 20): Promise<EventView[]> {
	const today = todayVienna();
	return db
		.select(eventColumns)
		.from(events)
		.leftJoin(posts, and(eq(posts.id, events.postId), published))
		.where(sql`coalesce(${events.endDate}, ${events.startDate}) < ${today}`)
		.orderBy(desc(events.startDate))
		.limit(limit)
		.all();
}

export async function allEventsFrom(day: string): Promise<EventView[]> {
	return db
		.select(eventColumns)
		.from(events)
		.leftJoin(posts, and(eq(posts.id, events.postId), published))
		.where(gte(events.startDate, day))
		.orderBy(asc(events.startDate))
		.all();
}

/* ------------------------------------------------------------ Mitglieder */

const photo = alias(media, 'photo');

/**
 * Öffentliche Mitgliederliste. Wer nicht freigegeben ist, erscheint nicht;
 * Fotos nur mit Foto-Freigabe. `hidden` zählt die übrigen je Gruppe.
 */
export async function publicMembers() {
	const rows = await db
		.select({
			id: members.id,
			firstName: members.firstName,
			lastName: members.lastName,
			rank: members.rank,
			honoraryRank: members.honoraryRank,
			functionTitle: members.functionTitle,
			status: members.status,
			chargen: members.chargen,
			kommandoPosition: members.kommandoPosition,
			kommandoSort: members.kommandoSort,
			kommandoText: members.kommandoText,
			publicVisible: members.publicVisible,
			photoApproved: members.photoApproved,
			pId: photo.id,
			pFile: photo.file,
			pWidths: photo.widths,
			pWidth: photo.width,
			pHeight: photo.height,
			pAlt: photo.alt
		})
		.from(members)
		.leftJoin(photo, eq(photo.id, members.photoMediaId))
		.orderBy(asc(members.lastName), asc(members.firstName))
		.all();

	const visible: (MemberView & { kommandoSort: number })[] = [];
	const hidden = { kommando: 0, chargen: 0, aktiv: 0, reserve: 0, jugend: 0 };
	for (const r of rows) {
		const group = r.kommandoPosition ? 'kommando' : r.chargen && r.status !== 'jugend' ? 'chargen' : r.status;
		if (!r.publicVisible) {
			hidden[group]++;
			continue;
		}
		visible.push({
			id: r.id,
			firstName: r.firstName,
			lastName: r.lastName,
			rank: r.rank,
			honoraryRank: r.honoraryRank,
			functionTitle: r.functionTitle,
			status: r.status,
			chargen: r.chargen,
			kommandoPosition: r.kommandoPosition,
			kommandoText: r.kommandoText,
			kommandoSort: r.kommandoSort,
			photo:
				r.photoApproved && r.pId != null && r.pFile
					? { id: r.pId, file: r.pFile, widths: r.pWidths ?? '', width: r.pWidth ?? 0, height: r.pHeight ?? 0, alt: r.pAlt ?? '' }
					: null
		});
	}
	return { visible, hidden, total: rows.length };
}

/* ------------------------------------------------------------ Fahrzeuge */

export async function listVehicles() {
	const rows = await db
		.select({
			id: vehicles.id,
			slug: vehicles.slug,
			name: vehicles.name,
			shortName: vehicles.shortName,
			radioName: vehicles.radioName,
			year: vehicles.year,
			purpose: vehicles.purpose,
			inService: vehicles.inService,
			...coverColumns
		})
		.from(vehicles)
		.leftJoin(cover, eq(cover.id, vehicles.coverMediaId))
		.orderBy(asc(vehicles.sortOrder), asc(vehicles.name))
		.all();
	return rows.map((r) => ({
		id: r.id,
		slug: r.slug,
		name: r.name,
		shortName: r.shortName,
		radioName: r.radioName,
		year: r.year,
		purpose: r.purpose,
		inService: r.inService,
		cover: coverOf(r)
	}));
}

export async function vehicleBySlug(slug: string) {
	const row = await db
		.select({
			id: vehicles.id,
			slug: vehicles.slug,
			name: vehicles.name,
			shortName: vehicles.shortName,
			radioName: vehicles.radioName,
			descriptionHtml: vehicles.descriptionHtml,
			chassis: vehicles.chassis,
			body: vehicles.body,
			year: vehicles.year,
			weight: vehicles.weight,
			crew: vehicles.crew,
			purpose: vehicles.purpose,
			extraSpecs: vehicles.extraSpecs,
			inService: vehicles.inService,
			...coverColumns
		})
		.from(vehicles)
		.leftJoin(cover, eq(cover.id, vehicles.coverMediaId))
		.where(eq(vehicles.slug, slug))
		.get();
	if (!row) return null;
	const gallery = (await db
		.select(MEDIA_COLUMNS)
		.from(vehicleImages)
		.innerJoin(media, eq(media.id, vehicleImages.mediaId))
		.where(eq(vehicleImages.vehicleId, row.id))
		.orderBy(asc(vehicleImages.sortOrder))
		.all()) as MediaRef[];
	let extra: { label: string; value: string }[] = [];
	try {
		extra = JSON.parse(row.extraSpecs);
	} catch {
		/* leer lassen */
	}
	const einsaetze = (
		await summaryQuery(
			and(
				published,
				sql`${posts.id} IN (SELECT ${postVehicles.postId} FROM ${postVehicles} WHERE ${postVehicles.vehicleId} = ${row.id})`
			)
		)
			.limit(5)
			.all()
	).map(toSummary);
	return { ...row, cover: coverOf(row), gallery, extra, einsaetze };
}

/* ------------------------------------------------------------ Textseiten */

export async function menuPages(): Promise<MenuPage[]> {
	return db
		.select({ slug: pages.slug, title: pages.title, menuText: pages.menuText, section: pages.section })
		.from(pages)
		.orderBy(asc(pages.section), asc(pages.sortOrder), asc(pages.title))
		.all();
}

export async function pageBySlug(slug: string, section?: 'feuerwehr' | 'buergerservice' | 'rechtliches') {
	const banner = alias(media, 'banner');
	const row = await db
		.select({
			id: pages.id,
			slug: pages.slug,
			section: pages.section,
			title: pages.title,
			subtitle: pages.subtitle,
			contentHtml: pages.contentHtml,
			updatedAt: pages.updatedAt,
			bId: banner.id,
			bFile: banner.file,
			bWidths: banner.widths,
			bWidth: banner.width,
			bHeight: banner.height,
			bAlt: banner.alt
		})
		.from(pages)
		.leftJoin(banner, eq(banner.id, pages.bannerMediaId))
		.where(section ? and(eq(pages.slug, slug), eq(pages.section, section)) : eq(pages.slug, slug))
		.get();
	if (!row) return null;
	const { bId, bFile, bWidths, bWidth, bHeight, bAlt, ...page } = row;
	return {
		...page,
		banner: bId != null && bFile ? ({ id: bId, file: bFile, widths: bWidths ?? '', width: bWidth ?? 0, height: bHeight ?? 0, alt: bAlt ?? '' } as MediaRef) : null
	};
}

/* ------------------------------------------------------------ Medien */

export async function mediaById(id: number | null | undefined): Promise<MediaRef | null> {
	if (!id) return null;
	return ((await db.select(MEDIA_COLUMNS).from(media).where(eq(media.id, id)).get()) as MediaRef | undefined) ?? null;
}

export async function mediaByIds(ids: number[]): Promise<MediaRef[]> {
	if (!ids.length) return [];
	const rows = (await db.select(MEDIA_COLUMNS).from(media).where(inArray(media.id, ids)).all()) as MediaRef[];
	const byId = new Map(rows.map((r) => [r.id, r]));
	return ids.map((id) => byId.get(id)).filter((m): m is MediaRef => !!m);
}

/* ------------------------------------------------------------ Sitemap */

export async function sitemapEntries() {
	const postRows = await db
		.select({ slug: posts.slug, updatedAt: posts.updatedAt })
		.from(posts)
		.where(published)
		.orderBy(desc(posts.date))
		.all();
	const vehicleRows = await db.select({ slug: vehicles.slug, updatedAt: vehicles.updatedAt }).from(vehicles).all();
	const pageRows = await db
		.select({ slug: pages.slug, section: pages.section, updatedAt: pages.updatedAt })
		.from(pages)
		.where(isNotNull(pages.slug))
		.all();
	return { postRows, vehicleRows, pageRows };
}

