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

CREATE TABLE `ResourceProgress` (
	`userId` varchar(191) NOT NULL,
	`contentResourceId` varchar(191) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`completedAt` datetime(3),
	`updatedAt` datetime(3),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `ResourceProgress_userId_contentResourceId_pk` PRIMARY KEY(`userId`,`contentResourceId`)
);

CREATE TABLE `RolePermission` (
	`roleId` varchar(255) NOT NULL,
	`permissionId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `RolePermission_roleId_permissionId_pk` PRIMARY KEY(`roleId`,`permissionId`)
);

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

CREATE TABLE `UserPermission` (
	`userId` varchar(255) NOT NULL,
	`permissionId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `UserPermission_userId_permissionId_pk` PRIMARY KEY(`userId`,`permissionId`)
);

CREATE TABLE `UserRole` (
	`userId` varchar(255) NOT NULL,
	`roleId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `UserRole_userId_roleId_pk` PRIMARY KEY(`userId`,`roleId`)
);

DROP TABLE `LessonProgress`;
ALTER TABLE `Product` RENAME COLUMN `productType` TO `type`;
ALTER TABLE `UpgradableProducts` RENAME COLUMN `upgradableFromId` TO `upgradableFrom`;
DROP INDEX `Purchase_userId_idx` ON `Purchase`;
ALTER TABLE `Account` DROP PRIMARY KEY;
ALTER TABLE `Comment` DROP PRIMARY KEY;
ALTER TABLE `DeviceAccessToken` DROP PRIMARY KEY;
ALTER TABLE `DeviceVerification` DROP PRIMARY KEY;
ALTER TABLE `Session` DROP PRIMARY KEY;
ALTER TABLE `UpgradableProducts` DROP PRIMARY KEY;
ALTER TABLE `VerificationToken` DROP PRIMARY KEY;
ALTER TABLE `Account` MODIFY COLUMN `type` varchar(255) NOT NULL;
ALTER TABLE `Account` MODIFY COLUMN `provider` varchar(255) NOT NULL;
ALTER TABLE `Account` MODIFY COLUMN `providerAccountId` varchar(255) NOT NULL;
ALTER TABLE `Account` MODIFY COLUMN `refresh_token` text;
ALTER TABLE `Account` MODIFY COLUMN `access_token` text;
ALTER TABLE `Account` MODIFY COLUMN `expires_at` int;
ALTER TABLE `Account` MODIFY COLUMN `token_type` varchar(255);
ALTER TABLE `Account` MODIFY COLUMN `scope` varchar(255);
ALTER TABLE `Account` MODIFY COLUMN `id_token` text;
ALTER TABLE `Account` MODIFY COLUMN `session_state` varchar(255);
ALTER TABLE `Account` MODIFY COLUMN `oauth_token_secret` text;
ALTER TABLE `Account` MODIFY COLUMN `oauth_token` text;
ALTER TABLE `Account` MODIFY COLUMN `userId` varchar(255) NOT NULL;
ALTER TABLE `Comment` MODIFY COLUMN `userId` varchar(255) NOT NULL;
ALTER TABLE `Comment` MODIFY COLUMN `context` json DEFAULT ('{}');
ALTER TABLE `Comment` MODIFY COLUMN `updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `Comment` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `Coupon` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `Coupon` MODIFY COLUMN `expires` timestamp(3);
ALTER TABLE `Coupon` MODIFY COLUMN `default` boolean NOT NULL;
ALTER TABLE `Coupon` MODIFY COLUMN `default` boolean NOT NULL DEFAULT false;
ALTER TABLE `DeviceAccessToken` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `DeviceVerification` MODIFY COLUMN `deviceCode` text NOT NULL;
ALTER TABLE `DeviceVerification` MODIFY COLUMN `userCode` text NOT NULL;
ALTER TABLE `DeviceVerification` MODIFY COLUMN `expires` timestamp(3) NOT NULL;
ALTER TABLE `DeviceVerification` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `DeviceVerification` MODIFY COLUMN `verifiedAt` timestamp(3);
ALTER TABLE `DeviceVerification` MODIFY COLUMN `verifiedByUserId` varchar(255);
ALTER TABLE `MerchantAccount` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `MerchantCharge` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `MerchantCustomer` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `MerchantPrice` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `MerchantProduct` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `Price` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `Product` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `Purchase` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `PurchaseUserTransfer` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `PurchaseUserTransfer` MODIFY COLUMN `expiresAt` timestamp(3);
ALTER TABLE `PurchaseUserTransfer` MODIFY COLUMN `canceledAt` timestamp(3);
ALTER TABLE `PurchaseUserTransfer` MODIFY COLUMN `confirmedAt` timestamp(3);
ALTER TABLE `PurchaseUserTransfer` MODIFY COLUMN `completedAt` timestamp(3);
ALTER TABLE `Session` MODIFY COLUMN `sessionToken` varchar(255) NOT NULL;
ALTER TABLE `Session` MODIFY COLUMN `userId` varchar(255) NOT NULL;
ALTER TABLE `Session` MODIFY COLUMN `expires` timestamp NOT NULL;
ALTER TABLE `UpgradableProducts` MODIFY COLUMN `upgradableToId` varchar(255) NOT NULL;
ALTER TABLE `UpgradableProducts` MODIFY COLUMN `upgradableFrom` varchar(255) NOT NULL;
ALTER TABLE `User` MODIFY COLUMN `id` varchar(255) NOT NULL;
ALTER TABLE `User` MODIFY COLUMN `name` varchar(255);
ALTER TABLE `User` MODIFY COLUMN `email` varchar(255) NOT NULL;
ALTER TABLE `User` MODIFY COLUMN `emailVerified` timestamp(3);
ALTER TABLE `User` MODIFY COLUMN `image` varchar(255);
ALTER TABLE `VerificationToken` MODIFY COLUMN `token` varchar(255) NOT NULL;
ALTER TABLE `VerificationToken` MODIFY COLUMN `identifier` varchar(255) NOT NULL;
ALTER TABLE `VerificationToken` MODIFY COLUMN `expires` timestamp NOT NULL;
ALTER TABLE `VerificationToken` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT (now());
ALTER TABLE `Account` ADD PRIMARY KEY(`provider`,`providerAccountId`);
ALTER TABLE `Comment` ADD PRIMARY KEY(`id`);
ALTER TABLE `DeviceAccessToken` ADD PRIMARY KEY(`token`);
ALTER TABLE `DeviceVerification` ADD PRIMARY KEY(`deviceCode`);
ALTER TABLE `Session` ADD PRIMARY KEY(`sessionToken`);
ALTER TABLE `UpgradableProducts` ADD PRIMARY KEY(`upgradableToId`,`upgradableFrom`);
ALTER TABLE `VerificationToken` ADD PRIMARY KEY(`identifier`,`token`);
ALTER TABLE `User` ADD CONSTRAINT `User_email_unique` UNIQUE(`email`);
ALTER TABLE `Account` DROP INDEX `Account_provider_providerAccountId_key`;
ALTER TABLE `DeviceVerification` DROP INDEX `DeviceVerification_deviceCode_key`;
ALTER TABLE `User` DROP INDEX `User_email_key`;
ALTER TABLE `VerificationToken` DROP INDEX `VerificationToken_identifier_token_key`;
ALTER TABLE `Comment` ADD `deletedAt` timestamp(3);
ALTER TABLE `Coupon` ADD `fields` json DEFAULT ('{}');
ALTER TABLE `Price` ADD `fields` json DEFAULT ('{}');
ALTER TABLE `Product` ADD `fields` json DEFAULT ('{}');
ALTER TABLE `Purchase` ADD `fields` json DEFAULT ('{}');
ALTER TABLE `UpgradableProducts` ADD `position` double DEFAULT 0 NOT NULL;
ALTER TABLE `UpgradableProducts` ADD `metadata` json DEFAULT ('{}');
ALTER TABLE `UpgradableProducts` ADD `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `UpgradableProducts` ADD `updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `UpgradableProducts` ADD `deletedAt` timestamp(3);
ALTER TABLE `User` ADD `role` enum('user','admin') DEFAULT 'user';
ALTER TABLE `User` ADD `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);
CREATE INDEX `name_idx` ON `CommunicationChannel` (`name`);
CREATE INDEX `userId_idx` ON `CommunicationPreference` (`userId`);
CREATE INDEX `preferenceTypeId_idx` ON `CommunicationPreference` (`preferenceTypeId`);
CREATE INDEX `channelId_idx` ON `CommunicationPreference` (`channelId`);
CREATE INDEX `userId_idx` ON `ContentContribution` (`userId`);
CREATE INDEX `contentId_idx` ON `ContentContribution` (`contentId`);
CREATE INDEX `contributionTypeId_idx` ON `ContentContribution` (`contributionTypeId`);
CREATE INDEX `type_idx` ON `ContentResource` (`type`);
CREATE INDEX `createdById_idx` ON `ContentResource` (`createdById`);
CREATE INDEX `createdAt_idx` ON `ContentResource` (`createdAt`);
CREATE INDEX `contentResourceId_idx` ON `ContentResourceProduct` (`productId`);
CREATE INDEX `resourceId_idx` ON `ContentResourceProduct` (`resourceId`);
CREATE INDEX `contentResourceId_idx` ON `ContentResourceResource` (`resourceOfId`);
CREATE INDEX `resourceId_idx` ON `ContentResourceResource` (`resourceId`);
CREATE INDEX `name_idx` ON `ContributionType` (`name`);
CREATE INDEX `slug_idx` ON `ContributionType` (`slug`);
CREATE INDEX `name_idx` ON `Permission` (`name`);
CREATE INDEX `crp_userId_contentResourceId_idx` ON `ResourceProgress` (`userId`,`contentResourceId`);
CREATE INDEX `contentResourceId_idx` ON `ResourceProgress` (`contentResourceId`);
CREATE INDEX `resourceId_idx` ON `ResourceProgress` (`userId`);
CREATE INDEX `roleId_idx` ON `RolePermission` (`roleId`);
CREATE INDEX `permissionId_idx` ON `RolePermission` (`permissionId`);
CREATE INDEX `name_idx` ON `Role` (`name`);
CREATE INDEX `userId_idx` ON `UserPermission` (`userId`);
CREATE INDEX `permissionId_idx` ON `UserPermission` (`permissionId`);
CREATE INDEX `userId_idx` ON `UserRole` (`userId`);
CREATE INDEX `roleId_idx` ON `UserRole` (`roleId`);
CREATE INDEX `userId_idx` ON `Account` (`userId`);
CREATE INDEX `crr_userIdId_idx` ON `Comment` (`userId`);
CREATE INDEX `Coupon_id_code_index` ON `Coupon` (`id`,`code`);
CREATE INDEX `userId_idx` ON `DeviceAccessToken` (`userId`);
CREATE INDEX `userId_idx` ON `Session` (`userId`);
CREATE INDEX `upgradableFromId_idx` ON `UpgradableProducts` (`upgradableToId`);
CREATE INDEX `upgradableToId_idx` ON `UpgradableProducts` (`upgradableFrom`);
CREATE INDEX `email_idx` ON `User` (`email`);
CREATE INDEX `role_idx` ON `User` (`role`);
CREATE INDEX `created_at_idx` ON `User` (`createdAt`);
ALTER TABLE `Account` DROP COLUMN `id`;
ALTER TABLE `Session` DROP COLUMN `id`;
ALTER TABLE `User` DROP COLUMN `roles`;
ALTER TABLE `User` DROP COLUMN `fields`;
