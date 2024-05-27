-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `Account` (
	`id` varchar(191) NOT NULL,
	`type` varchar(191) NOT NULL,
	`provider` varchar(191) NOT NULL,
	`providerAccountId` varchar(191) NOT NULL,
	`refresh_token` varchar(191),
	`access_token` varchar(191),
	`expires_at` bigint,
	`token_type` varchar(191),
	`scope` varchar(191),
	`id_token` varchar(191),
	`session_state` varchar(191),
	`oauth_token_secret` varchar(191),
	`oauth_token` varchar(191),
	`userId` varchar(191) NOT NULL,
	`refresh_token_expires_in` int,
	CONSTRAINT `Account_id` PRIMARY KEY(`id`),
	CONSTRAINT `Account_provider_providerAccountId_key` UNIQUE(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `Comment` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`text` text NOT NULL,
	`context` json,
	`updatedAt` datetime(3),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `Comment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Coupon` (
	`id` varchar(191) NOT NULL,
	`code` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`expires` datetime(3),
	`maxUses` int NOT NULL DEFAULT -1,
	`default` tinyint NOT NULL DEFAULT 0,
	`merchantCouponId` varchar(191),
	`status` int NOT NULL DEFAULT 0,
	`usedCount` int NOT NULL DEFAULT 0,
	`percentageDiscount` decimal(3,2) NOT NULL,
	`restrictedToProductId` varchar(191),
	`bulkPurchaseId` varchar(191),
	CONSTRAINT `Coupon_id` PRIMARY KEY(`id`),
	CONSTRAINT `Coupon_code_key` UNIQUE(`code`),
	CONSTRAINT `Coupon_bulkPurchaseId_key` UNIQUE(`bulkPurchaseId`)
);
--> statement-breakpoint
CREATE TABLE `DeviceAccessToken` (
	`token` varchar(191) NOT NULL,
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`userId` varchar(191) NOT NULL,
	CONSTRAINT `DeviceAccessToken_token` PRIMARY KEY(`token`)
);
--> statement-breakpoint
CREATE TABLE `DeviceVerification` (
	`deviceCode` varchar(191) NOT NULL,
	`userCode` varchar(191) NOT NULL,
	`expires` datetime(3) NOT NULL,
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`verifiedAt` datetime(3),
	`verifiedByUserId` varchar(191),
	CONSTRAINT `DeviceVerification_deviceCode` PRIMARY KEY(`deviceCode`),
	CONSTRAINT `DeviceVerification_deviceCode_key` UNIQUE(`deviceCode`)
);
--> statement-breakpoint
CREATE TABLE `LessonProgress` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`lessonId` varchar(191),
	`sectionId` varchar(191),
	`moduleId` varchar(191),
	`lessonSlug` varchar(191),
	`lessonVersion` varchar(191),
	`completedAt` datetime(3),
	`updatedAt` datetime(3),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `LessonProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `MerchantAccount` (
	`id` varchar(191) NOT NULL,
	`status` int NOT NULL DEFAULT 0,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`label` varchar(191),
	`identifier` varchar(191),
	CONSTRAINT `MerchantAccount_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `MerchantCharge` (
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
CREATE TABLE `MerchantCoupon` (
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
CREATE TABLE `MerchantCustomer` (
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
CREATE TABLE `MerchantPrice` (
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
CREATE TABLE `MerchantProduct` (
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
CREATE TABLE `MerchantSession` (
	`id` varchar(191) NOT NULL,
	`identifier` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	CONSTRAINT `MerchantSession_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Price` (
	`id` varchar(191) NOT NULL,
	`productId` varchar(191),
	`nickname` varchar(191),
	`status` int NOT NULL DEFAULT 0,
	`unitAmount` decimal(10,2) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `Price_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Product` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`key` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`status` int NOT NULL DEFAULT 0,
	`quantityAvailable` int NOT NULL DEFAULT -1,
	`productType` varchar(191),
	CONSTRAINT `Product_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Purchase` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`totalAmount` decimal(65,30) NOT NULL,
	`ip_address` varchar(191),
	`city` varchar(191),
	`state` varchar(191),
	`country` varchar(191),
	`couponId` varchar(191),
	`bulkCouponId` varchar(191),
	`redeemedBulkCouponId` varchar(191),
	`productId` varchar(191) NOT NULL,
	`merchantChargeId` varchar(191),
	`upgradedFromId` varchar(191),
	`status` varchar(191) NOT NULL DEFAULT 'Valid',
	`merchantSessionId` varchar(191),
	CONSTRAINT `Purchase_id` PRIMARY KEY(`id`),
	CONSTRAINT `Purchase_upgradedFromId_key` UNIQUE(`upgradedFromId`)
);
--> statement-breakpoint
CREATE TABLE `PurchaseUserTransfer` (
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
CREATE TABLE `Session` (
	`id` varchar(191) NOT NULL,
	`sessionToken` varchar(191) NOT NULL,
	`userId` varchar(191),
	`expires` datetime(3),
	CONSTRAINT `Session_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `UpgradableProducts` (
	`upgradableToId` varchar(191) NOT NULL,
	`upgradableFromId` varchar(191) NOT NULL,
	CONSTRAINT `UpgradableProducts_upgradableToId_upgradableFromId` PRIMARY KEY(`upgradableToId`,`upgradableFromId`)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191),
	`email` varchar(191) NOT NULL,
	`emailVerified` datetime(3),
	`image` varchar(191),
	`roles` varchar(191) NOT NULL DEFAULT 'User',
	`fields` json,
	CONSTRAINT `User_id` PRIMARY KEY(`id`),
	CONSTRAINT `User_email_key` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `VerificationToken` (
	`token` varchar(191) NOT NULL,
	`identifier` varchar(191) NOT NULL,
	`expires` datetime(3),
	`createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `VerificationToken_token` PRIMARY KEY(`token`),
	CONSTRAINT `VerificationToken_identifier_token_key` UNIQUE(`identifier`,`token`)
);
--> statement-breakpoint
CREATE INDEX `LessonProgress_userId_lessonId_idx` ON `LessonProgress` (`userId`,`lessonId`);--> statement-breakpoint
CREATE INDEX `LessonProgress_completedAt_idx` ON `LessonProgress` (`completedAt`);--> statement-breakpoint
CREATE INDEX `Purchase_userId_idx` ON `Purchase` (`userId`);
*/