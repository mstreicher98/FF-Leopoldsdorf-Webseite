import { describe, expect, it } from 'vitest';
import { slugify } from './slug';
import { rankName, rankShort } from './dienstgrade';

describe('slugify', () => {
	it('wandelt Umlaute und Sonderzeichen um', () => {
		expect(slugify('149/26 T1 – Auspumparbeiten')).toBe('149-26-t1-auspumparbeiten');
		expect(slugify('Übung: Löschangriff an der Straße')).toBe('uebung-loeschangriff-an-der-strasse');
		expect(slugify('  --  ')).toBe('');
	});
});

describe('Dienstgrade', () => {
	it('zeigt Varianten und Ehrendienstgrade richtig an', () => {
		expect(rankShort('JFM3')).toBe('JFM');
		expect(rankShort('HBI', true)).toBe('EHBI');
		expect(rankName('HLM', true)).toBe('Ehren-Hauptlöschmeister');
	});
});
