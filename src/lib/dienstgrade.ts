/**
 * Dienstgrade der NÖ Feuerwehren. Das Abzeichen liegt unter /dienstgrade/<code>.png,
 * `short` ist das angezeigte Kürzel (Varianten wie JFM1 werden als JFM gezeigt).
 * `order`: höher = höherer Dienstgrad (für die Sortierung).
 */
export interface Dienstgrad {
	code: string;
	short: string;
	name: string;
	group: 'Jugend' | 'Mannschaft' | 'Unteroffiziere' | 'Verwaltung' | 'Sachbearbeiter' | 'Offiziere';
	order: number;
}

export const DIENSTGRADE: Dienstgrad[] = [
	{ code: 'JFM', short: 'JFM', name: 'Jugendfeuerwehrmitglied', group: 'Jugend', order: 1 },
	{ code: 'JFM1', short: 'JFM', name: 'Jugendfeuerwehrmitglied (Stufe 1)', group: 'Jugend', order: 2 },
	{ code: 'JFM2', short: 'JFM', name: 'Jugendfeuerwehrmitglied (Stufe 2)', group: 'Jugend', order: 3 },
	{ code: 'JFM3', short: 'JFM', name: 'Jugendfeuerwehrmitglied (Stufe 3)', group: 'Jugend', order: 4 },
	{ code: 'JFM4', short: 'JFM', name: 'Jugendfeuerwehrmitglied (Stufe 4)', group: 'Jugend', order: 5 },
	{ code: 'PFM', short: 'PFM', name: 'Probefeuerwehrmann', group: 'Mannschaft', order: 10 },
	{ code: 'FM', short: 'FM', name: 'Feuerwehrmann', group: 'Mannschaft', order: 11 },
	{ code: 'OFM', short: 'OFM', name: 'Oberfeuerwehrmann', group: 'Mannschaft', order: 12 },
	{ code: 'HFM', short: 'HFM', name: 'Hauptfeuerwehrmann', group: 'Mannschaft', order: 13 },
	{ code: 'LM', short: 'LM', name: 'Löschmeister', group: 'Unteroffiziere', order: 20 },
	{ code: 'OLM', short: 'OLM', name: 'Oberlöschmeister', group: 'Unteroffiziere', order: 21 },
	{ code: 'HLM', short: 'HLM', name: 'Hauptlöschmeister', group: 'Unteroffiziere', order: 22 },
	{ code: 'BM', short: 'BM', name: 'Brandmeister', group: 'Unteroffiziere', order: 23 },
	{ code: 'OBM', short: 'OBM', name: 'Oberbrandmeister', group: 'Unteroffiziere', order: 24 },
	{ code: 'HBM', short: 'HBM', name: 'Hauptbrandmeister', group: 'Unteroffiziere', order: 25 },
	{ code: 'VM', short: 'VM', name: 'Verwaltungsmeister', group: 'Verwaltung', order: 30 },
	{ code: 'OVM', short: 'OVM', name: 'Oberverwaltungsmeister', group: 'Verwaltung', order: 31 },
	{ code: 'HVM', short: 'HVM', name: 'Hauptverwaltungsmeister', group: 'Verwaltung', order: 32 },
	{ code: 'V', short: 'V', name: 'Verwalter', group: 'Verwaltung', order: 33 },
	{ code: 'OV', short: 'OV', name: 'Oberverwalter', group: 'Verwaltung', order: 34 },
	{ code: 'HV', short: 'HV', name: 'Hauptverwalter', group: 'Verwaltung', order: 35 },
	{ code: 'SB', short: 'SB', name: 'Sachbearbeiter', group: 'Sachbearbeiter', order: 40 },
	{ code: 'ASB', short: 'ASB', name: 'Abschnittssachbearbeiter', group: 'Sachbearbeiter', order: 41 },
	{ code: 'BSB', short: 'BSB', name: 'Bezirkssachbearbeiter', group: 'Sachbearbeiter', order: 42 },
	{ code: 'BI', short: 'BI', name: 'Brandinspektor', group: 'Offiziere', order: 50 },
	{ code: 'OBI', short: 'OBI', name: 'Oberbrandinspektor', group: 'Offiziere', order: 51 },
	{ code: 'HBI', short: 'HBI', name: 'Hauptbrandinspektor', group: 'Offiziere', order: 52 },
	{ code: 'ABI', short: 'ABI', name: 'Abschnittsbrandinspektor', group: 'Offiziere', order: 53 },
	{ code: 'BR', short: 'BR', name: 'Brandrat', group: 'Offiziere', order: 54 },
	{ code: 'BR2', short: 'BR', name: 'Brandrat (zweites Abzeichen)', group: 'Offiziere', order: 55 },
	{ code: 'OBR', short: 'OBR', name: 'Oberbrandrat', group: 'Offiziere', order: 56 }
];

const BY_CODE = new Map(DIENSTGRADE.map((d) => [d.code, d]));

export function dienstgrad(code: string): Dienstgrad {
	return BY_CODE.get(code) ?? { code, short: code, name: code, group: 'Mannschaft', order: 0 };
}

export const isKnownRank = (code: string) => BY_CODE.has(code);

/** Angezeigtes Kürzel inkl. Ehrendienstgrad, z. B. "EHBI" */
export function rankShort(code: string, honorary = false): string {
	return `${honorary ? 'E' : ''}${dienstgrad(code).short}`;
}

export function rankName(code: string, honorary = false): string {
	const name = dienstgrad(code).name;
	return honorary ? `Ehren-${name}` : name;
}

export const DIENSTGRAD_GROUPS = [...new Set(DIENSTGRADE.map((d) => d.group))];
