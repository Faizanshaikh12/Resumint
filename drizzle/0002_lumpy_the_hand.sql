CREATE TABLE `template_master` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`tier` text DEFAULT 'standard' NOT NULL,
	`design` text NOT NULL,
	`layout` text NOT NULL,
	`sample_content` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `template_master_key_unique` ON `template_master` (`key`);--> statement-breakpoint
CREATE INDEX `template_master_key_idx` ON `template_master` (`key`);--> statement-breakpoint
CREATE INDEX `template_master_tier_sort_idx` ON `template_master` (`tier`,`sort_order`);