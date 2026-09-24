import { describe, expect, it } from 'vitest';
import { icsCalendar } from './ics';

const base = { location: '', description: '', postSlug: null, startTime: null, endDate: null, endTime: null };

describe('iCalendar-Export', () => {
	it('schreibt ganztägige und mehrtägige Termine als Datum', () => {
		const ics = icsCalendar([{ ...base, id: 1, title: 'Heuriger', startDate: '2026-10-10', endDate: '2026-10-11' }], 'https://ff.example');
		expect(ics).toContain('DTSTART;VALUE=DATE:20261010');
		// Ende ist bei ganztägigen Terminen exklusiv
		expect(ics).toContain('DTEND;VALUE=DATE:20261012');
		expect(ics).toContain('UID:termin-1@ff.example');
	});

	it('nutzt die Wiener Zeitzone und ergänzt eine Standarddauer', () => {
		const ics = icsCalendar([{ ...base, id: 2, title: 'Übung', startDate: '2026-10-03', startTime: '18:30' }], 'https://ff.example');
		expect(ics).toContain('DTSTART;TZID=Europe/Vienna:20261003T183000');
		expect(ics).toContain('DTEND;TZID=Europe/Vienna:20261003T203000');
	});

	it('maskiert Sonderzeichen und bricht lange Zeilen um', () => {
		const ics = icsCalendar(
			[{ ...base, id: 3, title: 'Fest; mit, Komma', startDate: '2026-10-03', description: 'Zeile 1\nZeile 2 '.repeat(10) }],
			'https://ff.example'
		);
		expect(ics).toContain('SUMMARY:Fest\\; mit\\, Komma');
		for (const line of ics.split('\r\n')) expect(line.length).toBeLessThanOrEqual(75);
	});
});
