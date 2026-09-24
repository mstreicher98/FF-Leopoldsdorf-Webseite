import type { EinsatzGroup } from '$lib/einsatz';
import type { MediaRef } from '$lib/media';
import type { MemberStatus, PostCategory } from '$lib/server/db/schema';

export interface EinsatzInfo {
	nummer: string | null;
	code: string | null;
	label: string | null;
	group: EinsatzGroup | null;
	stichwort: string | null;
	ort: string | null;
}

export interface PostSummary {
	id: number;
	slug: string;
	title: string;
	category: PostCategory;
	date: string;
	time: string | null;
	excerpt: string;
	pinned: boolean;
	status: 'entwurf' | 'veroeffentlicht';
	cover: MediaRef | null;
	einsatz: EinsatzInfo | null;
}

export interface VehicleRef {
	id: number;
	slug: string;
	name: string;
	shortName: string;
	radioName: string;
}

export interface MemberView {
	id: number;
	firstName: string;
	lastName: string;
	rank: string;
	honoraryRank: boolean;
	functionTitle: string;
	status: MemberStatus;
	chargen: boolean;
	kommandoPosition: string | null;
	kommandoText: string;
	/** null, wenn kein Foto da ist oder es nicht freigegeben ist */
	photo: MediaRef | null;
}

export interface EventView {
	id: number;
	title: string;
	startDate: string;
	startTime: string | null;
	endDate: string | null;
	endTime: string | null;
	location: string;
	description: string;
	postSlug: string | null;
}

export interface MenuPage {
	slug: string;
	title: string;
	menuText: string;
	section: 'feuerwehr' | 'buergerservice' | 'rechtliches';
}

/** Überblick über eine Sicherung vor dem Wiederherstellen */
export interface BackupSummary {
	/** Zeitstempel aus dem Ordnernamen, z. B. "2026-09-24-033255" */
	stamp: string | null;
	posts: number;
	members: number;
	vehicles: number;
	events: number;
	/** Bilder und PDFs in der Mediathek */
	media: number;
	/** Bilddateien in der Sicherung (je Bild mehrere Größen) */
	files: number;
	users: string[];
	lastPost: string | null;
	/** Stammt die Sicherung von einer älteren Version? Dann wird sie beim Wiederherstellen angepasst. */
	older: boolean;
}
