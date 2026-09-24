import type { EventView } from '$lib/types';

/** iCalendar-Export (RFC 5545) – zum Abonnieren oder Hinzufügen einzelner Termine */

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Zeilen über 75 Zeichen umbrechen (Fortsetzung beginnt mit Leerzeichen) */
function fold(line: string): string {
	const out: string[] = [];
	let rest = line;
	while (rest.length > 74) {
		out.push(rest.slice(0, 74));
		rest = ` ${rest.slice(74)}`;
	}
	out.push(rest);
	return out.join('\r\n');
}

const compactDay = (d: string) => d.replace(/-/g, '');
const compactTime = (t: string) => `${t.replace(':', '')}00`;

function nextDay(day: string): string {
	const d = new Date(`${day}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10);
}

function plusHours(day: string, time: string, hours: number): { day: string; time: string } {
	const [h, m] = time.split(':').map(Number);
	const total = h * 60 + m + hours * 60;
	if (total >= 24 * 60) return { day: nextDay(day), time: '00:00' };
	return { day, time: `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` };
}

const VTIMEZONE = [
	'BEGIN:VTIMEZONE',
	'TZID:Europe/Vienna',
	'BEGIN:DAYLIGHT',
	'TZOFFSETFROM:+0100',
	'TZOFFSETTO:+0200',
	'TZNAME:CEST',
	'DTSTART:19700329T020000',
	'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
	'END:DAYLIGHT',
	'BEGIN:STANDARD',
	'TZOFFSETFROM:+0200',
	'TZOFFSETTO:+0100',
	'TZNAME:CET',
	'DTSTART:19701025T030000',
	'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
	'END:STANDARD',
	'END:VTIMEZONE'
];

export function icsCalendar(events: EventView[], origin: string, name = 'Feuerwehr Leopoldsdorf – Termine'): string {
	const host = new URL(origin).host;
	const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Freiwillige Feuerwehr Leopoldsdorf//Webseite//DE',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${esc(name)}`,
		'X-WR-TIMEZONE:Europe/Vienna',
		...VTIMEZONE
	];
	for (const e of events) {
		lines.push('BEGIN:VEVENT', `UID:termin-${e.id}@${host}`, `DTSTAMP:${stamp}`);
		const endDay = e.endDate || e.startDate;
		if (!e.startTime) {
			lines.push(`DTSTART;VALUE=DATE:${compactDay(e.startDate)}`, `DTEND;VALUE=DATE:${compactDay(nextDay(endDay))}`);
		} else {
			lines.push(`DTSTART;TZID=Europe/Vienna:${compactDay(e.startDate)}T${compactTime(e.startTime)}`);
			const end = e.endTime ? { day: endDay, time: e.endTime } : plusHours(e.startDate, e.startTime, 2);
			lines.push(`DTEND;TZID=Europe/Vienna:${compactDay(end.day)}T${compactTime(end.time)}`);
		}
		lines.push(`SUMMARY:${esc(e.title)}`);
		if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
		if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
		lines.push(`URL:${origin}/termine`, 'END:VEVENT');
	}
	lines.push('END:VCALENDAR');
	return lines.map(fold).join('\r\n') + '\r\n';
}
