CREATE TABLE `UserPrefs` (
	`id` varchar(191) NOT NULL,
	`type` varchar(191) NOT NULL DEFAULT 'Global',
	`userId` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `UserPrefs_id_pk` PRIMARY KEY(`id`)
);
CREATE INDEX `crr_userIdId_idx` ON `UserPrefs` (`userId`);
