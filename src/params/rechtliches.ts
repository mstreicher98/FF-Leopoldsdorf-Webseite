import type { ParamMatcher } from '@sveltejs/kit';

/** /impressum und /datenschutz liegen direkt unter der Wurzel */
export const match: ParamMatcher = (param) => param === 'impressum' || param === 'datenschutz';
