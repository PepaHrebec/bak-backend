CREATE TABLE `lists_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wordId` int NOT NULL,
	CONSTRAINT `lists_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transcriptions_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wordId` int NOT NULL,
	`transcription` varchar(255) NOT NULL,
	CONSTRAINT `transcriptions_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `words_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`word` varchar(255) NOT NULL,
	CONSTRAINT `words_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `repeated_words_table`;--> statement-breakpoint
ALTER TABLE `lists_table` ADD CONSTRAINT `lists_table_userId_users_table_id_fk` FOREIGN KEY (`userId`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lists_table` ADD CONSTRAINT `lists_table_wordId_words_table_id_fk` FOREIGN KEY (`wordId`) REFERENCES `words_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transcriptions_table` ADD CONSTRAINT `transcriptions_table_wordId_words_table_id_fk` FOREIGN KEY (`wordId`) REFERENCES `words_table`(`id`) ON DELETE no action ON UPDATE no action;