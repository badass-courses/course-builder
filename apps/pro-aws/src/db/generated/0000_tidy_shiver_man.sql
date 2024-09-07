CREATE TABLE `pro-aws_account` (
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
	CONSTRAINT `pro-aws_account_provider_providerAccountId_pk` PRIMARY KEY(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_communicationChannel` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `pro-aws_communicationChannel_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_communicationPreferenceType` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `pro-aws_communicationPreferenceType_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_communicationPreference` (
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
	CONSTRAINT `pro-aws_communicationPreference_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_contentContribution` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`contentId` varchar(255) NOT NULL,
	`contributionTypeId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `pro-aws_contentContribution_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_contentResource` (
	`id` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`createdById` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `pro-aws_contentResource_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_contentResourceResource` (
	`resourceOfId` varchar(255) NOT NULL,
	`resourceId` varchar(255) NOT NULL,
	`position` double NOT NULL DEFAULT 0,
	`fields` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `pro-aws_contentResourceResource_resourceOfId_resourceId_pk` PRIMARY KEY(`resourceOfId`,`resourceId`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_contributionType` (
	`id` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `pro-aws_contributionType_id` PRIMARY KEY(`id`),
	CONSTRAINT `pro-aws_contributionType_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_coupons` (
	`id` varchar(191) NOT NULL,
	`code` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`expires` datetime(3),
	`fields` json DEFAULT ('{}'),
	`maxUses` int NOT NULL DEFAULT -1,
	`default` tinyint NOT NULL DEFAULT 0,
	`merchantCouponId` varchar(191),
	`status` int NOT NULL DEFAULT 0,
	`usedCount` int NOT NULL DEFAULT 0,
	`percentageDiscount` decimal(3,2) NOT NULL,
	`restrictedToProductId` varchar(191),
	`bulkPurchaseId` varchar(191),
	CONSTRAINT `Coupon_id` PRIMARY KEY(`id`),
	CONSTRAINT `Coupon_bulkPurchaseId_key` UNIQUE(`bulkPurchaseId`),
	CONSTRAINT `Coupon_code_key` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_merchantAccounts` (
	`id` varchar(191) NOT NULL,
	`status` int NOT NULL DEFAULT 0,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`label` varchar(191),
	`identifier` varchar(191),
	CONSTRAINT `MerchantAccount_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_merchantCharges` (
	`id` varchar(191) NOT NULL,
	`status` int NOT NULL DEFAULT 0,
	`identifier` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	`merchantProductId` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`merchantCustomerId` varchar(191) NOT NULL,
	CONSTRAINT `MerchantCharge_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantCharge_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_merchantCoupons` (
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
CREATE TABLE `pro-aws_merchantCustomers` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	`identifier` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`status` int DEFAULT 0,
	CONSTRAINT `MerchantCustomer_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantCustomer_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_merchantPrices` (
	`id` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	`merchantProductId` varchar(191) NOT NULL,
	`status` int DEFAULT 0,
	`identifier` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`priceId` varchar(191),
	CONSTRAINT `MerchantPrice_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantPrice_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_merchantProducts` (
	`id` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	`productId` varchar(191) NOT NULL,
	`status` int NOT NULL DEFAULT 0,
	`identifier` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `MerchantProduct_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantProduct_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_merchantSessions` (
	`id` varchar(191) NOT NULL,
	`identifier` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	CONSTRAINT `MerchantSession_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_permission` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `pro-aws_permission_id` PRIMARY KEY(`id`),
	CONSTRAINT `pro-aws_permission_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_prices` (
	`id` varchar(191) NOT NULL,
	`productId` varchar(191),
	`nickname` varchar(191),
	`status` int NOT NULL DEFAULT 0,
	`unitAmount` decimal(10,2) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`fields` json DEFAULT ('{}'),
	CONSTRAINT `Price_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_products` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`key` varchar(191),
	`fields` json DEFAULT ('{}'),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`status` int NOT NULL DEFAULT 0,
	`quantityAvailable` int NOT NULL DEFAULT -1,
	CONSTRAINT `Product_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_purchases` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
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
CREATE TABLE `pro-aws_purchaseUserTransfers` (
	`id` varchar(191) NOT NULL,
	`transferState` enum('AVAILABLE','INITIATED','VERIFIED','CANCELED','EXPIRED','CONFIRMED','COMPLETED') NOT NULL DEFAULT 'AVAILABLE',
	`purchaseId` varchar(191) NOT NULL,
	`sourceUserId` varchar(191) NOT NULL,
	`targetUserId` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`expiresAt` datetime(3),
	`canceledAt` datetime(3),
	`confirmedAt` datetime(3),
	`completedAt` datetime(3),
	CONSTRAINT `PurchaseUserTransfer_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_resourceProgresses` (
	`userId` varchar(191) NOT NULL,
	`contentResourceId` varchar(191) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`completedAt` datetime(3),
	`updatedAt` datetime(3),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `pro-aws_resourceProgresses_userId_contentResourceId_pk` PRIMARY KEY(`userId`,`contentResourceId`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_rolePermission` (
	`roleId` varchar(255) NOT NULL,
	`permissionId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `pro-aws_rolePermission_roleId_permissionId_pk` PRIMARY KEY(`roleId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_role` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `pro-aws_role_id` PRIMARY KEY(`id`),
	CONSTRAINT `pro-aws_role_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_session` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `pro-aws_session_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_userPermission` (
	`userId` varchar(255) NOT NULL,
	`permissionId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `pro-aws_userPermission_userId_permissionId_pk` PRIMARY KEY(`userId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_userRole` (
	`userId` varchar(255) NOT NULL,
	`roleId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `pro-aws_userRole_userId_roleId_pk` PRIMARY KEY(`userId`,`roleId`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_user` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255),
	`role` enum('user','admin') DEFAULT 'user',
	`email` varchar(255) NOT NULL,
	`emailVerified` timestamp(3),
	`image` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `pro-aws_user_id` PRIMARY KEY(`id`),
	CONSTRAINT `pro-aws_user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `pro-aws_verificationToken` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	`createdAt` timestamp(3) DEFAULT (now()),
	CONSTRAINT `pro-aws_verificationToken_identifier_token_pk` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `pro-aws_account` (`userId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `pro-aws_communicationChannel` (`name`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `pro-aws_communicationPreference` (`userId`);--> statement-breakpoint
CREATE INDEX `preferenceTypeId_idx` ON `pro-aws_communicationPreference` (`preferenceTypeId`);--> statement-breakpoint
CREATE INDEX `channelId_idx` ON `pro-aws_communicationPreference` (`channelId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `pro-aws_contentContribution` (`userId`);--> statement-breakpoint
CREATE INDEX `contentId_idx` ON `pro-aws_contentContribution` (`contentId`);--> statement-breakpoint
CREATE INDEX `contributionTypeId_idx` ON `pro-aws_contentContribution` (`contributionTypeId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `pro-aws_contentResource` (`type`);--> statement-breakpoint
CREATE INDEX `createdById_idx` ON `pro-aws_contentResource` (`createdById`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `pro-aws_contentResource` (`createdAt`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `pro-aws_contentResourceResource` (`resourceOfId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `pro-aws_contentResourceResource` (`resourceId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `pro-aws_contributionType` (`name`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `pro-aws_contributionType` (`slug`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `pro-aws_permission` (`name`);--> statement-breakpoint
CREATE INDEX `crp_userId_contentResourceId_idx` ON `pro-aws_resourceProgresses` (`userId`,`contentResourceId`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `pro-aws_resourceProgresses` (`contentResourceId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `pro-aws_resourceProgresses` (`userId`);--> statement-breakpoint
CREATE INDEX `roleId_idx` ON `pro-aws_rolePermission` (`roleId`);--> statement-breakpoint
CREATE INDEX `permissionId_idx` ON `pro-aws_rolePermission` (`permissionId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `pro-aws_role` (`name`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `pro-aws_session` (`userId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `pro-aws_userPermission` (`userId`);--> statement-breakpoint
CREATE INDEX `permissionId_idx` ON `pro-aws_userPermission` (`permissionId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `pro-aws_userRole` (`userId`);--> statement-breakpoint
CREATE INDEX `roleId_idx` ON `pro-aws_userRole` (`roleId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `pro-aws_user` (`email`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `pro-aws_user` (`role`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `pro-aws_user` (`createdAt`);