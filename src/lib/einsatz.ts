export const EINSATZ_GROUPS = ['brand', 'technik', 'schadstoff', 'sonstiges'] as const;
export type EinsatzGroup = (typeof EINSATZ_GROUPS)[number];

export const GROUP_LABELS: Record<EinsatzGroup, string> = {
	brand: 'Brandeinsatz',
	technik: 'Technischer Einsatz',
	schadstoff: 'Schadstoffeinsatz',
	sonstiges: 'Sonstiges'
};

export const GROUP_PLURAL: Record<EinsatzGroup, string> = {
	brand: 'Brandeinsätze',
	technik: 'Technische Einsätze',
	schadstoff: 'Schadstoffeinsätze',
	sonstiges: 'Sonstige'
};

/** Vorbelegung nach der Einteilung in Niederösterreich – im Admin änderbar */
export const DEFAULT_EINSATZARTEN: {
	code: string;
	label: string;
	group: EinsatzGroup;
	countsInStats?: boolean;
}[] = [
	{ code: 'B1', label: 'Brandeinsatz Stufe 1', group: 'brand' },
	{ code: 'B2', label: 'Brandeinsatz Stufe 2', group: 'brand' },
	{ code: 'B3', label: 'Brandeinsatz Stufe 3', group: 'brand' },
	{ code: 'B4', label: 'Brandeinsatz Stufe 4', group: 'brand' },
	{ code: 'T1', label: 'Technischer Einsatz Stufe 1', group: 'technik' },
	{ code: 'T2', label: 'Technischer Einsatz Stufe 2', group: 'technik' },
	{ code: 'T3', label: 'Technischer Einsatz Stufe 3', group: 'technik' },
	{ code: 'S1', label: 'Schadstoffeinsatz Stufe 1', group: 'schadstoff' },
	{ code: 'S2', label: 'Schadstoffeinsatz Stufe 2', group: 'schadstoff' },
	{ code: 'S3', label: 'Schadstoffeinsatz Stufe 3', group: 'schadstoff' },
	{ code: 'BSW', label: 'Brandsicherheitswache', group: 'sonstiges', countsInStats: false }
];
