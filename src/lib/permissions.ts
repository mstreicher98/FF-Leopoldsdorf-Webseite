/**
 * Rollen und Rechte an einer Stelle. Wer eine Rolle anders zuschneiden will,
 * ändert nur die Tabelle PERMISSIONS.
 */
export const ROLES = ['admin', 'redakteur'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
	admin: 'Admin',
	redakteur: 'Redakteur'
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
	admin: 'Alles, inklusive Benutzer, Einstellungen und Sicherungen',
	redakteur: 'Beiträge, Termine, Mitglieder, Fahrzeuge, Seiten und Bilder pflegen'
};

const PERMISSIONS = {
	'content.manage': ['admin', 'redakteur'],
	'users.manage': ['admin'],
	'settings.manage': ['admin']
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, permission: Permission): boolean {
	if (!role) return false;
	return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
