CREATE TABLE `import_map` (
	`key` text PRIMARY KEY NOT NULL,
	`entity` text NOT NULL,
	`entity_id` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `redirects` (
	`from_path` text PRIMARY KEY NOT NULL,
	`to_path` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `media` ADD `kind` text DEFAULT 'bild' NOT NULL;