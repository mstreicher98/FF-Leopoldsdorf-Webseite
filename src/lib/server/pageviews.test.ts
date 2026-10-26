import { describe, expect, it } from 'vitest';
import { isCountablePath } from './pageviews';

describe('isCountablePath', () => {
	it('zählt eigene öffentliche Seiten', () => {
		expect(isCountablePath('/')).toBe(true);
		expect(isCountablePath('/beitrag/27-25-be-b1-brandmeldeanlage')).toBe(true);
		expect(isCountablePath('/taetigkeiten/einsaetze')).toBe(true);
	});

	it('lässt keine Links auf fremde Seiten durch', () => {
		expect(isCountablePath('//andere-seite.at')).toBe(false);
		expect(isCountablePath('//andere-seite.at/admin/login')).toBe(false);
		expect(isCountablePath('/termine//x')).toBe(false);
		expect(isCountablePath('https://andere-seite.at')).toBe(false);
	});

	it('ignoriert den internen Bereich, Punktpfade und Unsinn', () => {
		expect(isCountablePath('/admin')).toBe(false);
		expect(isCountablePath('/admin/seiten')).toBe(false);
		expect(isCountablePath('/beitrag/../admin')).toBe(false);
		expect(isCountablePath('/./termine')).toBe(false);
		expect(isCountablePath('/<script>')).toBe(false);
		expect(isCountablePath(`/${'a'.repeat(250)}`)).toBe(false);
	});
});
