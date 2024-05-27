CREATE TABLE `CommunicationChannel` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `CommunicationChannel_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `CommunicationPreferenceType` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `CommunicationPreferenceType_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `CommunicationPreference` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`channelId` varchar(255) NOT NULL,
	`preferenceLevel` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`preferenceTypeId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`optInAt` timestamp(3),
	`optOutAt` timestamp(3),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `CommunicationPreference_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ContentContribution` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`contentId` varchar(255) NOT NULL,
	`contributionTypeId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `ContentContribution_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ContentResource` (
	`id` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`createdById` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `ContentResource_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ContentResourceProduct` (
	`productId` varchar(255) NOT NULL,
	`resourceId` varchar(255) NOT NULL,
	`position` double NOT NULL DEFAULT 0,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `ContentResourceProduct_productId_resourceId_pk` PRIMARY KEY(`productId`,`resourceId`)
);
--> statement-breakpoint
CREATE TABLE `ContentResourceResource` (
	`resourceOfId` varchar(255) NOT NULL,
	`resourceId` varchar(255) NOT NULL,
	`position` double NOT NULL DEFAULT 0,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `ContentResourceResource_resourceOfId_resourceId_pk` PRIMARY KEY(`resourceOfId`,`resourceId`)
);
--> statement-breakpoint
CREATE TABLE `ContributionType` (
	`id` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `ContributionType_id` PRIMARY KEY(`id`),
	CONSTRAINT `ContributionType_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `Permission` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `Permission_id` PRIMARY KEY(`id`),
	CONSTRAINT `Permission_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `ResourceProgresses` (
	`userId` varchar(191) NOT NULL,
	`contentResourceId` varchar(191) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`completedAt` datetime(3),
	`updatedAt` datetime(3),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `ResourceProgresses_userId_contentResourceId_pk` PRIMARY KEY(`userId`,`contentResourceId`)
);
--> statement-breakpoint
CREATE TABLE `RolePermission` (
	`roleId` varchar(255) NOT NULL,
	`permissionId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `RolePermission_roleId_permissionId_pk` PRIMARY KEY(`roleId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `Role` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `Role_id` PRIMARY KEY(`id`),
	CONSTRAINT `Role_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `UserPermission` (
	`userId` varchar(255) NOT NULL,
	`permissionId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `UserPermission_userId_permissionId_pk` PRIMARY KEY(`userId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `UserRole` (
	`userId` varchar(255) NOT NULL,
	`roleId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `UserRole_userId_roleId_pk` PRIMARY KEY(`userId`,`roleId`)
);
--> statement-breakpoint
DROP TABLE `Comment`;--> statement-breakpoint
DROP TABLE `DeviceAccessToken`;--> statement-breakpoint
DROP TABLE `DeviceVerification`;--> statement-breakpoint
DROP TABLE `LessonProgress`;--> statement-breakpoint
RENAME TABLE `Coupon` TO `Coupons`;--> statement-breakpoint
RENAME TABLE `MerchantAccount` TO `MerchantAccounts`;--> statement-breakpoint
RENAME TABLE `MerchantCharge` TO `MerchantCharges`;--> statement-breakpoint
RENAME TABLE `MerchantCoupon` TO `MerchantCoupons`;--> statement-breakpoint
RENAME TABLE `MerchantCustomer` TO `MerchantCustomers`;--> statement-breakpoint
RENAME TABLE `MerchantPrice` TO `MerchantPrices`;--> statement-breakpoint
RENAME TABLE `MerchantProduct` TO `MerchantProducts`;--> statement-breakpoint
RENAME TABLE `MerchantSession` TO `MerchantSessions`;--> statement-breakpoint
RENAME TABLE `Price` TO `Prices`;--> statement-breakpoint
RENAME TABLE `Product` TO `Products`;--> statement-breakpoint
RENAME TABLE `PurchaseUserTransfer` TO `PurchaseUserTransfers`;--> statement-breakpoint
RENAME TABLE `Purchase` TO `Purchases`;--> statement-breakpoint
ALTER TABLE `UpgradableProducts` RENAME COLUMN `upgradableFromId` TO `upgradableFrom`;--> statement-breakpoint
DROP INDEX `Purchase_userId_idx` ON ``.`Purchases`;--> statement-breakpoint
ALTER TABLE `Account` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `Session` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `UpgradableProducts` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `VerificationToken` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `type` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `provider` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `providerAccountId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `refresh_token` text;--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `access_token` text;--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `expires_at` int;--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `token_type` varchar(255);--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `scope` varchar(255);--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `id_token` text;--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `session_state` varchar(255);--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `oauth_token_secret` text;--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `oauth_token` text;--> statement-breakpoint
ALTER TABLE `Account` MODIFY COLUMN `userId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `Session` MODIFY COLUMN `sessionToken` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `Session` MODIFY COLUMN `userId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `Session` MODIFY COLUMN `expires` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `UpgradableProducts` MODIFY COLUMN `upgradableToId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `UpgradableProducts` MODIFY COLUMN `upgradableFrom` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `User` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `User` MODIFY COLUMN `name` varchar(255);--> statement-breakpoint
ALTER TABLE `User` MODIFY COLUMN `email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `User` MODIFY COLUMN `emailVerified` timestamp(3);--> statement-breakpoint
ALTER TABLE `User` MODIFY COLUMN `image` varchar(255);--> statement-breakpoint
ALTER TABLE `VerificationToken` MODIFY COLUMN `token` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `VerificationToken` MODIFY COLUMN `identifier` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `VerificationToken` MODIFY COLUMN `expires` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `VerificationToken` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT (now());--> statement-breakpoint
ALTER TABLE `Coupons` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `Coupons` MODIFY COLUMN `expires` timestamp(3);--> statement-breakpoint
ALTER TABLE `Coupons` MODIFY COLUMN `default` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `Coupons` MODIFY COLUMN `default` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `MerchantAccounts` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `MerchantCharges` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `MerchantCustomers` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `MerchantPrices` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `MerchantProducts` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `Prices` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `Products` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `PurchaseUserTransfers` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `PurchaseUserTransfers` MODIFY COLUMN `expiresAt` timestamp(3);--> statement-breakpoint
ALTER TABLE `PurchaseUserTransfers` MODIFY COLUMN `canceledAt` timestamp(3);--> statement-breakpoint
ALTER TABLE `PurchaseUserTransfers` MODIFY COLUMN `confirmedAt` timestamp(3);--> statement-breakpoint
ALTER TABLE `PurchaseUserTransfers` MODIFY COLUMN `completedAt` timestamp(3);--> statement-breakpoint
ALTER TABLE `Purchases` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `Account` ADD PRIMARY KEY(`provider`,`providerAccountId`);--> statement-breakpoint
ALTER TABLE `Session` ADD PRIMARY KEY(`sessionToken`);--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD PRIMARY KEY(`upgradableToId`,`upgradableFrom`);--> statement-breakpoint
ALTER TABLE `VerificationToken` ADD PRIMARY KEY(`identifier`,`token`);--> statement-breakpoint
ALTER TABLE `User` ADD CONSTRAINT `User_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `Account` DROP INDEX `Account_provider_providerAccountId_key`;--> statement-breakpoint
ALTER TABLE `User` DROP INDEX `User_email_key`;--> statement-breakpoint
ALTER TABLE `VerificationToken` DROP INDEX `VerificationToken_identifier_token_key`;--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD `position` double DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD `metadata` json DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD `updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD `deletedAt` timestamp(3);--> statement-breakpoint
ALTER TABLE `User` ADD `role` enum('user','admin') DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `User` ADD `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `Coupons` ADD `fields` json DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `Prices` ADD `fields` json DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `Products` ADD `type` varchar(191);--> statement-breakpoint
ALTER TABLE `Products` ADD `fields` json DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `Purchases` ADD `fields` json DEFAULT ('{}');--> statement-breakpoint
CREATE INDEX `name_idx` ON `CommunicationChannel` (`name`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `CommunicationPreference` (`userId`);--> statement-breakpoint
CREATE INDEX `preferenceTypeId_idx` ON `CommunicationPreference` (`preferenceTypeId`);--> statement-breakpoint
CREATE INDEX `channelId_idx` ON `CommunicationPreference` (`channelId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `ContentContribution` (`userId`);--> statement-breakpoint
CREATE INDEX `contentId_idx` ON `ContentContribution` (`contentId`);--> statement-breakpoint
CREATE INDEX `contributionTypeId_idx` ON `ContentContribution` (`contributionTypeId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `ContentResource` (`type`);--> statement-breakpoint
CREATE INDEX `createdById_idx` ON `ContentResource` (`createdById`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `ContentResource` (`createdAt`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `ContentResourceProduct` (`productId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `ContentResourceProduct` (`resourceId`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `ContentResourceResource` (`resourceOfId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `ContentResourceResource` (`resourceId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `ContributionType` (`name`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `ContributionType` (`slug`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `Permission` (`name`);--> statement-breakpoint
CREATE INDEX `crp_userId_contentResourceId_idx` ON `ResourceProgresses` (`userId`,`contentResourceId`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `ResourceProgresses` (`contentResourceId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `ResourceProgresses` (`userId`);--> statement-breakpoint
CREATE INDEX `roleId_idx` ON `RolePermission` (`roleId`);--> statement-breakpoint
CREATE INDEX `permissionId_idx` ON `RolePermission` (`permissionId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `Role` (`name`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `UserPermission` (`userId`);--> statement-breakpoint
CREATE INDEX `permissionId_idx` ON `UserPermission` (`permissionId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `UserRole` (`userId`);--> statement-breakpoint
CREATE INDEX `roleId_idx` ON `UserRole` (`roleId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `Account` (`userId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `Session` (`userId`);--> statement-breakpoint
CREATE INDEX `upgradableFromId_idx` ON `UpgradableProducts` (`upgradableToId`);--> statement-breakpoint
CREATE INDEX `upgradableToId_idx` ON `UpgradableProducts` (`upgradableFrom`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `User` (`email`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `User` (`role`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `User` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Coupon_id_code_index` ON `Coupons` (`id`,`code`);--> statement-breakpoint
ALTER TABLE `Account` DROP COLUMN `id`;--> statement-breakpoint
ALTER TABLE `Session` DROP COLUMN `id`;--> statement-breakpoint
ALTER TABLE `User` DROP COLUMN `roles`;--> statement-breakpoint
ALTER TABLE `User` DROP COLUMN `fields`;--> statement-breakpoint
ALTER TABLE `Products` DROP COLUMN `productType`;