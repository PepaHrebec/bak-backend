CREATE TABLE `repeated_words_table` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`word` varchar(255) NOT NULL,
	`transcription` varchar(255) NOT NULL,
	CONSTRAINT `repeated_words_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`expires_at` datetime NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users_table` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `users_table` ADD `password` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users_table` ADD CONSTRAINT `users_table_name_unique` UNIQUE(`name`);--> statement-breakpoint
ALTER TABLE `repeated_words_table` ADD CONSTRAINT `repeated_words_table_userId_users_table_id_fk` FOREIGN KEY (`userId`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_users_table_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;