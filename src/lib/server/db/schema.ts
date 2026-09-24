import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const bool = (name: string) => integer(name, { mode: 'boolean' });
const stamp = (name: string) => integer(name, { mode: 'timestamp_ms' });

const timestamps = {
	createdAt: stamp('created_at')
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: stamp('updated_at')
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
};

/* ------------------------------------------------------------ Zugänge */

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	name: text('name').notNull(),
	email: text('email'),
	role: text('role', { enum: ['admin', 'redakteur'] })
		.notNull()
		.default('redakteur'),
	passwordHash: text('password_hash').notNull(),
	mustChangePassword: bool('must_change_password').notNull().default(true),
	/** Base32-Geheimnis der Authenticator-App; null = noch nicht eingerichtet */
	totpSecret: text('totp_secret'),
	totpEnabled: bool('totp_enabled').notNull().default(false),
	/** Zuletzt benutzter 30-Sekunden-Schritt – ein Code gilt nur einmal */
	totpLastStep: integer('totp_last_step'),
	/** Der erste Admin: kann nicht gelöscht oder herabgestuft werden */
	owner: bool('owner').notNull().default(false),
	active: bool('active').notNull().default(true),
	lastLoginAt: stamp('last_login_at'),
	...timestamps
});

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: stamp('expires_at').notNull(),
		persistent: bool('persistent').notNull().default(false),
		userAgent: text('user_agent'),
		createdAt: stamp('created_at')
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => [index('sessions_user_idx').on(t.userId)]
);

/** Zwischenschritt nach richtigem Passwort, bis der 2FA-Code eingegeben ist */
export const loginChallenges = sqliteTable('login_challenges', {
	id: text('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	persistent: bool('persistent').notNull().default(false),
	attempts: integer('attempts').notNull().default(0),
	expiresAt: stamp('expires_at').notNull()
});

/* ------------------------------------------------------------ Medien */

export const media = sqliteTable('media', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	/** bild = WebP in mehreren Größen, dokument = PDF zum Verlinken */
	kind: text('kind', { enum: ['bild', 'dokument'] })
		.notNull()
		.default('bild'),
	/**
	 * Bild: Dateiname ohne Größe und Endung, z. B. "k3j9x2…" → k3j9x2…-800.webp
	 * Dokument: vollständiger Dateiname, z. B. "k3j9x2…-festankuendigung.pdf"
	 */
	file: text('file').notNull().unique(),
	originalName: text('original_name').notNull().default(''),
	/** Vorhandene Breiten, aufsteigend, z. B. "400,800,1600" */
	widths: text('widths').notNull(),
	width: integer('width').notNull(),
	height: integer('height').notNull(),
	sizeBytes: integer('size_bytes').notNull().default(0),
	alt: text('alt').notNull().default(''),
	uploadedById: integer('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
	createdAt: stamp('created_at')
		.notNull()
		.$defaultFn(() => new Date())
});

/* ------------------------------------------------------------ Einsatzarten */

export const einsatzarten = sqliteTable('einsatzarten', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	code: text('code').notNull().unique(),
	label: text('label').notNull(),
	group: text('group', { enum: ['brand', 'technik', 'schadstoff', 'sonstiges'] })
		.notNull()
		.default('sonstiges'),
	countsInStats: bool('counts_in_stats').notNull().default(true),
	sortOrder: integer('sort_order').notNull().default(0),
	active: bool('active').notNull().default(true)
});

/* ------------------------------------------------------------ Fahrzeuge */

export const vehicles = sqliteTable('vehicles', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	shortName: text('short_name').notNull().default(''),
	radioName: text('radio_name').notNull().default(''),
	descriptionHtml: text('description_html').notNull().default(''),
	chassis: text('chassis').notNull().default(''),
	body: text('body').notNull().default(''),
	year: integer('year'),
	weight: text('weight').notNull().default(''),
	crew: text('crew').notNull().default(''),
	purpose: text('purpose').notNull().default(''),
	/** Weitere Angaben als JSON: [{ "label": "Pumpe", "value": "FPN 10-2000" }] */
	extraSpecs: text('extra_specs').notNull().default('[]'),
	coverMediaId: integer('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
	sortOrder: integer('sort_order').notNull().default(0),
	inService: bool('in_service').notNull().default(true),
	...timestamps
});

export const vehicleImages = sqliteTable(
	'vehicle_images',
	{
		vehicleId: integer('vehicle_id')
			.notNull()
			.references(() => vehicles.id, { onDelete: 'cascade' }),
		mediaId: integer('media_id')
			.notNull()
			.references(() => media.id, { onDelete: 'cascade' }),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [primaryKey({ columns: [t.vehicleId, t.mediaId] })]
);

/* ------------------------------------------------------------ Beiträge */

export const POST_CATEGORIES = ['allgemein', 'einsatz', 'uebung', 'jugend'] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];

export const posts = sqliteTable(
	'posts',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		slug: text('slug').notNull().unique(),
		title: text('title').notNull(),
		category: text('category', { enum: POST_CATEGORIES }).notNull().default('allgemein'),
		/** Tag des Ereignisses (YYYY-MM-DD) – bei Einsätzen der Alarmierungstag */
		date: text('date').notNull(),
		/** Uhrzeit (HH:MM) – bei Einsätzen die Alarmierung */
		time: text('time'),
		status: text('status', { enum: ['entwurf', 'veroeffentlicht'] })
			.notNull()
			.default('entwurf'),
		pinned: bool('pinned').notNull().default(false),
		summary: text('summary').notNull().default(''),
		contentHtml: text('content_html').notNull().default(''),
		coverMediaId: integer('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
		// nur bei Einsätzen
		einsatzNummer: text('einsatz_nummer'),
		einsatzartId: integer('einsatzart_id').references(() => einsatzarten.id, { onDelete: 'set null' }),
		stichwort: text('stichwort'),
		einsatzort: text('einsatzort'),
		authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
		updatedById: integer('updated_by_id').references(() => users.id, { onDelete: 'set null' }),
		publishedAt: stamp('published_at'),
		...timestamps
	},
	(t) => [index('posts_status_date_idx').on(t.status, t.date), index('posts_category_date_idx').on(t.category, t.date)]
);

export const postImages = sqliteTable(
	'post_images',
	{
		postId: integer('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		mediaId: integer('media_id')
			.notNull()
			.references(() => media.id, { onDelete: 'cascade' }),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [primaryKey({ columns: [t.postId, t.mediaId] })]
);

export const postVehicles = sqliteTable(
	'post_vehicles',
	{
		postId: integer('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		vehicleId: integer('vehicle_id')
			.notNull()
			.references(() => vehicles.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.postId, t.vehicleId] }), index('post_vehicles_vehicle_idx').on(t.vehicleId)]
);

/* ------------------------------------------------------------ Mitglieder */

export const MEMBER_STATUS = ['aktiv', 'reserve', 'jugend'] as const;
export type MemberStatus = (typeof MEMBER_STATUS)[number];

export const members = sqliteTable('members', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	/** Kürzel des Dienstgrads, siehe $lib/dienstgrade */
	rank: text('rank').notNull().default('PFM'),
	honoraryRank: bool('honorary_rank').notNull().default(false),
	functionTitle: text('function_title').notNull().default(''),
	status: text('status', { enum: MEMBER_STATUS }).notNull().default('aktiv'),
	/** Chargen = Funktionäre mit eigener Funktion (Zugskommandant, Sachbearbeiter …) */
	chargen: bool('chargen').notNull().default(false),
	/** Gesetzt = gehört zum Kommando, z. B. "Kommandant" */
	kommandoPosition: text('kommando_position'),
	kommandoSort: integer('kommando_sort').notNull().default(0),
	kommandoText: text('kommando_text').notNull().default(''),
	photoMediaId: integer('photo_media_id').references(() => media.id, { onDelete: 'set null' }),
	/** Datenschutz: nur mit Einwilligung öffentlich, bei der Jugend die der Eltern */
	publicVisible: bool('public_visible').notNull().default(false),
	photoApproved: bool('photo_approved').notNull().default(false),
	standesbuchNr: text('standesbuch_nr'),
	...timestamps
});

/* ------------------------------------------------------------ Textseiten */

export const PAGE_SECTIONS = ['feuerwehr', 'buergerservice', 'rechtliches'] as const;
export type PageSection = (typeof PAGE_SECTIONS)[number];

export const pages = sqliteTable('pages', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	section: text('section', { enum: PAGE_SECTIONS }).notNull(),
	title: text('title').notNull(),
	subtitle: text('subtitle').notNull().default(''),
	/** Kurzer Text im Menü */
	menuText: text('menu_text').notNull().default(''),
	contentHtml: text('content_html').notNull().default(''),
	bannerMediaId: integer('banner_media_id').references(() => media.id, { onDelete: 'set null' }),
	sortOrder: integer('sort_order').notNull().default(0),
	/** Systemseiten (Impressum, Datenschutz …) lassen sich nicht löschen */
	system: bool('system').notNull().default(false),
	updatedById: integer('updated_by_id').references(() => users.id, { onDelete: 'set null' }),
	...timestamps
});

/* ------------------------------------------------------------ Termine */

export const events = sqliteTable(
	'events',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		title: text('title').notNull(),
		startDate: text('start_date').notNull(),
		startTime: text('start_time'),
		endDate: text('end_date'),
		endTime: text('end_time'),
		location: text('location').notNull().default(''),
		description: text('description').notNull().default(''),
		postId: integer('post_id').references(() => posts.id, { onDelete: 'set null' }),
		...timestamps
	},
	(t) => [index('events_start_idx').on(t.startDate)]
);

/* ------------------------------------------------------------ Betrieb */

export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

/** Alte Adressen (z. B. der früheren WordPress-Seite) → neue Adresse, als 301-Weiterleitung */
export const redirects = sqliteTable('redirects', {
	fromPath: text('from_path').primaryKey(),
	toPath: text('to_path').notNull()
});

/** Merkt sich, was aus einer Fremdquelle schon übernommen wurde – ein Import lässt sich so wiederholen */
export const importMap = sqliteTable('import_map', {
	key: text('key').primaryKey(),
	entity: text('entity').notNull(),
	entityId: integer('entity_id').notNull()
});

/** Seitenaufrufe je Tag und Pfad – ohne IP-Adressen und ohne Cookies */
export const pageViews = sqliteTable(
	'page_views',
	{
		day: text('day').notNull(),
		path: text('path').notNull(),
		views: integer('views').notNull().default(0)
	},
	(t) => [primaryKey({ columns: [t.day, t.path] })]
);

export const auditLog = sqliteTable(
	'audit_log',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
		action: text('action').notNull(),
		entity: text('entity').notNull(),
		entityId: integer('entity_id'),
		label: text('label').notNull().default(''),
		createdAt: stamp('created_at')
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => [index('audit_created_idx').on(t.createdAt)]
);

export type User = typeof users.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Einsatzart = typeof einsatzarten.$inferSelect;
