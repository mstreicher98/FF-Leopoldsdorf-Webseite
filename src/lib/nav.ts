import type { Component } from 'svelte';
import Archive from '@lucide/svelte/icons/archive';
import Backpack from '@lucide/svelte/icons/backpack';
import FileText from '@lucide/svelte/icons/file-text';
import FireExtinguisher from '@lucide/svelte/icons/fire-extinguisher';
import Info from '@lucide/svelte/icons/info';
import MapPinned from '@lucide/svelte/icons/map-pinned';
import Megaphone from '@lucide/svelte/icons/megaphone';
import Newspaper from '@lucide/svelte/icons/newspaper';
import Phone from '@lucide/svelte/icons/phone';
import Shield from '@lucide/svelte/icons/shield';
import Siren from '@lucide/svelte/icons/siren';
import Split from '@lucide/svelte/icons/split';
import Target from '@lucide/svelte/icons/target';
import Truck from '@lucide/svelte/icons/truck';
import Users from '@lucide/svelte/icons/users';
import { CATEGORIES } from '$lib/categories';
import type { MenuPage } from '$lib/types';

export interface NavItem {
	href: string;
	title: string;
	text: string;
	icon: Component;
}

export interface NavGroup {
	id: string;
	label: string;
	/** Kurzer Satz links im aufgeklappten Menü */
	intro: string;
	/** Pfad-Präfixe, bei denen der Menüpunkt als aktiv gilt */
	match: string[];
	items: NavItem[];
}

const PAGE_ICONS: Record<string, Component> = {
	'ueber-uns': Info,
	sirenensignale: Megaphone,
	notruf: Phone,
	rettungsgasse: Split,
	'richtig-loeschen': FireExtinguisher,
	'abschnitt-schwechat-land': MapPinned
};

const pageItem = (p: MenuPage): NavItem => ({
	href: `/${p.section}/${p.slug}`,
	title: p.title,
	text: p.menuText,
	icon: PAGE_ICONS[p.slug] ?? FileText
});

export function buildNav(pages: MenuPage[]): NavGroup[] {
	const c = CATEGORIES;
	return [
		{
			id: 'taetigkeiten',
			label: 'Tätigkeiten',
			intro: 'Was wir tun: Einsätze, Übungen, Jugendarbeit und Veranstaltungen.',
			match: ['/taetigkeiten', '/beitrag'],
			items: [
				{ href: `/taetigkeiten/${c.einsatz.path}`, title: c.einsatz.title, text: 'Berichte und Einsatzstatistik', icon: Siren },
				{ href: `/taetigkeiten/${c.uebung.path}`, title: c.uebung.title, text: 'Übungen und Schulungen', icon: Target },
				{ href: `/taetigkeiten/${c.jugend.path}`, title: c.jugend.title, text: 'Was unsere Jugend erlebt', icon: Backpack },
				{ href: `/taetigkeiten/${c.allgemein.path}`, title: c.allgemein.title, text: 'Veranstaltungen und mehr', icon: Newspaper },
				{ href: '/taetigkeiten', title: 'Alle Beiträge', text: 'Das gesamte Archiv', icon: Archive }
			]
		},
		{
			id: 'feuerwehr',
			label: 'Feuerwehr',
			intro: 'Wer wir sind und womit wir ausrücken.',
			match: ['/feuerwehr'],
			items: [
				...pages.filter((p) => p.section === 'feuerwehr').map(pageItem),
				{ href: '/feuerwehr/kommando', title: 'Kommando', text: 'Wer unsere Feuerwehr führt', icon: Shield },
				{ href: '/feuerwehr/mannschaft', title: 'Mannschaft', text: 'Die Frauen und Männer der Feuerwehr', icon: Users },
				{ href: '/feuerwehr/fuhrpark', title: 'Fuhrpark', text: 'Unsere Fahrzeuge im Überblick', icon: Truck }
			]
		},
		{
			id: 'buergerservice',
			label: 'Bürgerservice',
			intro: 'Wissen, das im Ernstfall hilft.',
			match: ['/buergerservice'],
			items: pages.filter((p) => p.section === 'buergerservice').map(pageItem)
		}
	];
}
