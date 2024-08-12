CREATE TABLE `astro-party_Account` (
	`userId` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`oauth_token` text,
	`oauth_token_secret` text,
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	`refresh_token_expires_in` int,
	CONSTRAINT `astro-party_Account_provider_providerAccountId_pk` PRIMARY KEY(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_CommunicationChannel` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_CommunicationChannel_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_CommunicationPreferenceType` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_CommunicationPreferenceType_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_CommunicationPreference` (
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
	CONSTRAINT `astro-party_CommunicationPreference_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_ContentContribution` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`contentId` varchar(255) NOT NULL,
	`contributionTypeId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_ContentContribution_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_ContentResource` (
	`id` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`createdById` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_ContentResource_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_ContentResourceProduct` (
	`productId` varchar(255) NOT NULL,
	`resourceId` varchar(255) NOT NULL,
	`position` double NOT NULL DEFAULT 0,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_ContentResourceProduct_productId_resourceId_pk` PRIMARY KEY(`productId`,`resourceId`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_ContentResourceResource` (
	`resourceOfId` varchar(255) NOT NULL,
	`resourceId` varchar(255) NOT NULL,
	`position` double NOT NULL DEFAULT 0,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_ContentResourceResource_resourceOfId_resourceId_pk` PRIMARY KEY(`resourceOfId`,`resourceId`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_ContributionType` (
	`id` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_ContributionType_id` PRIMARY KEY(`id`),
	CONSTRAINT `astro-party_ContributionType_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_Coupon` (
	`id` varchar(191) NOT NULL,
	`code` varchar(191),
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`expires` timestamp(3),
	`fields` json DEFAULT ('{}'),
	`maxUses` int NOT NULL DEFAULT -1,
	`default` boolean NOT NULL DEFAULT false,
	`merchantCouponId` varchar(191),
	`status` int NOT NULL DEFAULT 0,
	`usedCount` int NOT NULL DEFAULT 0,
	`percentageDiscount` decimal(3,2) NOT NULL,
	`restrictedToProductId` varchar(191),
	CONSTRAINT `Coupon_id` PRIMARY KEY(`id`),
	CONSTRAINT `Coupon_code_key` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_MerchantAccount` (
	`id` varchar(191) NOT NULL,
	`status` int NOT NULL DEFAULT 0,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`label` varchar(191),
	`identifier` varchar(191),
	CONSTRAINT `MerchantAccount_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_MerchantCharge` (
	`id` varchar(191) NOT NULL,
	`status` int NOT NULL DEFAULT 0,
	`identifier` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	`merchantProductId` varchar(191) NOT NULL,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`merchantCustomerId` varchar(191) NOT NULL,
	CONSTRAINT `MerchantCharge_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantCharge_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_MerchantCoupon` (
	`id` varchar(191) NOT NULL,
	`identifier` varchar(191),
	`status` int NOT NULL DEFAULT 0,
	`merchantAccountId` varchar(191) NOT NULL,
	`percentageDiscount` decimal(3,2) NOT NULL,
	`type` varchar(191),
	CONSTRAINT `MerchantCoupon_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantCoupon_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_MerchantCustomer` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	`identifier` varchar(191) NOT NULL,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`status` int DEFAULT 0,
	CONSTRAINT `MerchantCustomer_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantCustomer_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_MerchantPrice` (
	`id` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	`merchantProductId` varchar(191) NOT NULL,
	`status` int DEFAULT 0,
	`identifier` varchar(191),
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`priceId` varchar(191),
	CONSTRAINT `MerchantPrice_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantPrice_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_MerchantProduct` (
	`id` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	`productId` varchar(191) NOT NULL,
	`status` int NOT NULL DEFAULT 0,
	`identifier` varchar(191),
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `MerchantProduct_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantProduct_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_MerchantSession` (
	`id` varchar(191) NOT NULL,
	`identifier` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	CONSTRAINT `MerchantSession_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_Permission` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_Permission_id` PRIMARY KEY(`id`),
	CONSTRAINT `astro-party_Permission_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_Price` (
	`id` varchar(191) NOT NULL,
	`productId` varchar(191),
	`nickname` varchar(191),
	`status` int NOT NULL DEFAULT 0,
	`unitAmount` decimal(10,2) NOT NULL,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`fields` json DEFAULT ('{}'),
	CONSTRAINT `Price_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_Product` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`key` varchar(191),
	`type` varchar(191),
	`fields` json DEFAULT ('{}'),
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`status` int NOT NULL DEFAULT 0,
	`quantityAvailable` int NOT NULL DEFAULT -1,
	CONSTRAINT `Product_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_PurchaseUserTransfer` (
	`id` varchar(191) NOT NULL,
	`transferState` enum('AVAILABLE','INITIATED','VERIFIED','CANCELED','EXPIRED','CONFIRMED','COMPLETED') NOT NULL DEFAULT 'AVAILABLE',
	`purchaseId` varchar(191) NOT NULL,
	`sourceUserId` varchar(191) NOT NULL,
	`targetUserId` varchar(191),
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`expiresAt` timestamp(3),
	`canceledAt` timestamp(3),
	`confirmedAt` timestamp(3),
	`completedAt` timestamp(3),
	CONSTRAINT `PurchaseUserTransfer_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_Purchase` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191),
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`totalAmount` decimal(65,30) NOT NULL,
	`ip_address` varchar(191),
	`city` varchar(191),
	`state` varchar(191),
	`country` varchar(191),
	`couponId` varchar(191),
	`productId` varchar(191) NOT NULL,
	`merchantChargeId` varchar(191),
	`upgradedFromId` varchar(191),
	`status` varchar(191) NOT NULL DEFAULT 'Valid',
	`bulkCouponId` varchar(191),
	`merchantSessionId` varchar(191),
	`redeemedBulkCouponId` varchar(191),
	`fields` json DEFAULT ('{}'),
	CONSTRAINT `Purchase_id` PRIMARY KEY(`id`),
	CONSTRAINT `Purchase_upgradedFromId_key` UNIQUE(`upgradedFromId`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_ResourceProgress` (
	`userId` varchar(255) NOT NULL,
	`resourceId` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`completedAt` datetime(3),
	`updatedAt` datetime(3),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `astro-party_ResourceProgress_userId_resourceId_pk` PRIMARY KEY(`userId`,`resourceId`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_RolePermission` (
	`roleId` varchar(255) NOT NULL,
	`permissionId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_RolePermission_roleId_permissionId_pk` PRIMARY KEY(`roleId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_Role` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_Role_id` PRIMARY KEY(`id`),
	CONSTRAINT `astro-party_Role_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_Session` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `astro-party_Session_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_UpgradableProducts` (
	`upgradableToId` varchar(255) NOT NULL,
	`upgradableFrom` varchar(255) NOT NULL,
	`position` double NOT NULL DEFAULT 0,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_UpgradableProducts_upgradableToId_upgradableFrom_pk` PRIMARY KEY(`upgradableToId`,`upgradableFrom`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_UserPermission` (
	`userId` varchar(255) NOT NULL,
	`permissionId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_UserPermission_userId_permissionId_pk` PRIMARY KEY(`userId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_UserRole` (
	`userId` varchar(255) NOT NULL,
	`roleId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `astro-party_UserRole_userId_roleId_pk` PRIMARY KEY(`userId`,`roleId`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_User` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255),
	`role` varchar(191) NOT NULL DEFAULT 'user',
	`email` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`emailVerified` timestamp(3),
	`image` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `astro-party_User_id` PRIMARY KEY(`id`),
	CONSTRAINT `astro-party_User_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `astro-party_VerificationToken` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	`createdAt` timestamp(3) DEFAULT (now()),
	CONSTRAINT `astro-party_VerificationToken_identifier_token_pk` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `astro-party_Account` (`userId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `astro-party_CommunicationChannel` (`name`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `astro-party_CommunicationPreference` (`userId`);--> statement-breakpoint
CREATE INDEX `preferenceTypeId_idx` ON `astro-party_CommunicationPreference` (`preferenceTypeId`);--> statement-breakpoint
CREATE INDEX `channelId_idx` ON `astro-party_CommunicationPreference` (`channelId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `astro-party_ContentContribution` (`userId`);--> statement-breakpoint
CREATE INDEX `contentId_idx` ON `astro-party_ContentContribution` (`contentId`);--> statement-breakpoint
CREATE INDEX `contributionTypeId_idx` ON `astro-party_ContentContribution` (`contributionTypeId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `astro-party_ContentResource` (`type`);--> statement-breakpoint
CREATE INDEX `createdById_idx` ON `astro-party_ContentResource` (`createdById`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `astro-party_ContentResource` (`createdAt`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `astro-party_ContentResourceProduct` (`productId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `astro-party_ContentResourceProduct` (`resourceId`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `astro-party_ContentResourceResource` (`resourceOfId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `astro-party_ContentResourceResource` (`resourceId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `astro-party_ContributionType` (`name`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `astro-party_ContributionType` (`slug`);--> statement-breakpoint
CREATE INDEX `Coupon_id_code_index` ON `astro-party_Coupon` (`id`,`code`);--> statement-breakpoint
CREATE INDEX `idx_MerchantCustomer_on_userId` ON `astro-party_MerchantCustomer` (`userId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `astro-party_Permission` (`name`);--> statement-breakpoint
CREATE INDEX `idx_Purchase_on_merchantChargeId` ON `astro-party_Purchase` (`merchantChargeId`);--> statement-breakpoint
CREATE INDEX `crp_userId_contentResourceId_idx` ON `astro-party_ResourceProgress` (`userId`,`resourceId`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `astro-party_ResourceProgress` (`resourceId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `astro-party_ResourceProgress` (`userId`);--> statement-breakpoint
CREATE INDEX `roleId_idx` ON `astro-party_RolePermission` (`roleId`);--> statement-breakpoint
CREATE INDEX `permissionId_idx` ON `astro-party_RolePermission` (`permissionId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `astro-party_Role` (`name`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `astro-party_Session` (`userId`);--> statement-breakpoint
CREATE INDEX `upgradableFromId_idx` ON `astro-party_UpgradableProducts` (`upgradableToId`);--> statement-breakpoint
CREATE INDEX `upgradableToId_idx` ON `astro-party_UpgradableProducts` (`upgradableFrom`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `astro-party_UserPermission` (`userId`);--> statement-breakpoint
CREATE INDEX `permissionId_idx` ON `astro-party_UserPermission` (`permissionId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `astro-party_UserRole` (`userId`);--> statement-breakpoint
CREATE INDEX `roleId_idx` ON `astro-party_UserRole` (`roleId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `astro-party_User` (`email`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `astro-party_User` (`role`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `astro-party_User` (`createdAt`);