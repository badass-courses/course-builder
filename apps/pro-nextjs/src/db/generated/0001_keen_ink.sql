ALTER TABLE `Comment` MODIFY COLUMN `updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `Comment` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `CommunicationChannel` MODIFY COLUMN `active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `CommunicationPreference` MODIFY COLUMN `active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `CommunicationPreferenceType` MODIFY COLUMN `active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `ContentContribution` MODIFY COLUMN `active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `ContentResource` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `ContentResource` MODIFY COLUMN `updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `ContentResourceProduct` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `ContentResourceProduct` MODIFY COLUMN `updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `ContentResourceResource` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `ContentResourceResource` MODIFY COLUMN `updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `ContributionType` MODIFY COLUMN `active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `Coupon` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `Coupon` MODIFY COLUMN `default` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `Coupon` MODIFY COLUMN `default` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `MerchantAccount` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `MerchantCharge` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `MerchantCustomer` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `MerchantPrice` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `MerchantProduct` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `Permission` MODIFY COLUMN `active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `Price` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `Product` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `Purchase` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `PurchaseUserTransfer` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `ResourceProgress` MODIFY COLUMN `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `Role` MODIFY COLUMN `active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `RolePermission` MODIFY COLUMN `active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `User` MODIFY COLUMN `fields` json DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `UserPermission` MODIFY COLUMN `active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `UserPrefs` MODIFY COLUMN `userId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `UserPrefs` MODIFY COLUMN `fields` json DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `UserPrefs` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `UserPrefs` MODIFY COLUMN `updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `UserRole` MODIFY COLUMN `active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `VerificationToken` MODIFY COLUMN `token` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `VerificationToken` MODIFY COLUMN `identifier` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `VerificationToken` MODIFY COLUMN `expires` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `VerificationToken` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT (now());--> statement-breakpoint
ALTER TABLE `Account` ADD PRIMARY KEY(`provider`,`providerAccountId`);--> statement-breakpoint
ALTER TABLE `Comment` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ContentResourceProduct` ADD PRIMARY KEY(`productId`,`resourceId`);--> statement-breakpoint
ALTER TABLE `ContentResourceResource` ADD PRIMARY KEY(`resourceOfId`,`resourceId`);--> statement-breakpoint
ALTER TABLE `ResourceProgress` ADD PRIMARY KEY(`userId`,`contentResourceId`);--> statement-breakpoint
ALTER TABLE `RolePermission` ADD PRIMARY KEY(`roleId`,`permissionId`);--> statement-breakpoint
ALTER TABLE `Session` ADD PRIMARY KEY(`sessionToken`);--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD PRIMARY KEY(`upgradableToId`,`upgradableFrom`);--> statement-breakpoint
ALTER TABLE `UserPermission` ADD PRIMARY KEY(`userId`,`permissionId`);--> statement-breakpoint
ALTER TABLE `UserPrefs` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `UserRole` ADD PRIMARY KEY(`userId`,`roleId`);--> statement-breakpoint
ALTER TABLE `VerificationToken` ADD PRIMARY KEY(`identifier`,`token`);--> statement-breakpoint
ALTER TABLE `User` ADD CONSTRAINT `User_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `Comment` ADD `deletedAt` timestamp(3);--> statement-breakpoint
ALTER TABLE `Coupon` ADD `fields` json DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `Price` ADD `fields` json DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `Product` ADD `fields` json DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `Purchase` ADD `fields` json DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD `position` double DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD `metadata` json DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD `updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD `deletedAt` timestamp(3);--> statement-breakpoint
ALTER TABLE `User` ADD `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `UserPrefs` ADD `deletedAt` timestamp(3);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `Account` (`userId`);--> statement-breakpoint
CREATE INDEX `crr_userIdId_idx` ON `Comment` (`userId`);--> statement-breakpoint
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
CREATE INDEX `Coupon_id_code_index` ON `Coupon` (`id`,`code`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `Permission` (`name`);--> statement-breakpoint
CREATE INDEX `crp_userId_contentResourceId_idx` ON `ResourceProgress` (`userId`,`contentResourceId`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `ResourceProgress` (`contentResourceId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `ResourceProgress` (`userId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `Role` (`name`);--> statement-breakpoint
CREATE INDEX `roleId_idx` ON `RolePermission` (`roleId`);--> statement-breakpoint
CREATE INDEX `permissionId_idx` ON `RolePermission` (`permissionId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `Session` (`userId`);--> statement-breakpoint
CREATE INDEX `upgradableFromId_idx` ON `UpgradableProducts` (`upgradableToId`);--> statement-breakpoint
CREATE INDEX `upgradableToId_idx` ON `UpgradableProducts` (`upgradableFrom`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `User` (`email`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `User` (`role`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `User` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `UserPermission` (`userId`);--> statement-breakpoint
CREATE INDEX `permissionId_idx` ON `UserPermission` (`permissionId`);--> statement-breakpoint
CREATE INDEX `crr_userIdId_idx` ON `UserPrefs` (`userId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `UserRole` (`userId`);--> statement-breakpoint
CREATE INDEX `roleId_idx` ON `UserRole` (`roleId`);--> statement-breakpoint
ALTER TABLE `Account` DROP COLUMN `id`;--> statement-breakpoint
ALTER TABLE `Session` DROP COLUMN `id`;
