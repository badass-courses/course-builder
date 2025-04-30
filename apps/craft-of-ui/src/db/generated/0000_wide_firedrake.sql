CREATE TABLE `TCOUI_Account` (
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
	CONSTRAINT `TCOUI_Account_provider_providerAccountId_pk` PRIMARY KEY(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_Comment` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`organizationMembershipId` varchar(255),
	`context` json DEFAULT ('{}'),
	`text` text NOT NULL,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_Comment_id_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_CommunicationChannel` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_CommunicationChannel_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_CommunicationPreferenceType` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_CommunicationPreferenceType_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_CommunicationPreference` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`userId` varchar(255) NOT NULL,
	`organizationMembershipId` varchar(255),
	`channelId` varchar(255) NOT NULL,
	`preferenceLevel` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`preferenceTypeId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`optInAt` timestamp(3),
	`optOutAt` timestamp(3),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_CommunicationPreference_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_ContentContribution` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`organizationMembershipId` varchar(255),
	`contentId` varchar(255) NOT NULL,
	`contributionTypeId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_ContentContribution_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_ContentResource` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`createdByOrganizationMembershipId` varchar(191),
	`type` varchar(255) NOT NULL,
	`createdById` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`currentVersionId` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_ContentResource_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_ContentResourceProduct` (
	`productId` varchar(255) NOT NULL,
	`resourceId` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`position` double NOT NULL DEFAULT 0,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_ContentResourceProduct_productId_resourceId_pk` PRIMARY KEY(`productId`,`resourceId`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_ContentResourceResource` (
	`resourceOfId` varchar(255) NOT NULL,
	`resourceId` varchar(255) NOT NULL,
	`position` double NOT NULL DEFAULT 0,
	`metadata` json DEFAULT ('{}'),
	`organizationId` varchar(191),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_ContentResourceResource_resourceOfId_resourceId_pk` PRIMARY KEY(`resourceOfId`,`resourceId`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_ContentResourceTag` (
	`contentResourceId` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`tagId` varchar(255) NOT NULL,
	`position` double NOT NULL DEFAULT 0,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `TCOUI_ContentResourceTag_contentResourceId_tagId_pk` PRIMARY KEY(`contentResourceId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_ContentResourceVersion` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`resourceId` varchar(255) NOT NULL,
	`parentVersionId` varchar(255),
	`versionNumber` int NOT NULL,
	`fields` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`createdById` varchar(255) NOT NULL,
	CONSTRAINT `TCOUI_ContentResourceVersion_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_resource_version_number` UNIQUE(`resourceId`,`versionNumber`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_ContributionType` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`slug` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_ContributionType_id` PRIMARY KEY(`id`),
	CONSTRAINT `TCOUI_ContributionType_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_Coupon` (
	`id` varchar(191) NOT NULL,
	`organizationId` varchar(191),
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
CREATE TABLE `TCOUI_DeviceAccessToken` (
	`token` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`organizationMembershipId` varchar(191),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `TCOUI_DeviceAccessToken_token_pk` PRIMARY KEY(`token`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_DeviceVerification` (
	`verifiedByUserId` varchar(255),
	`deviceCode` varchar(191) NOT NULL,
	`userCode` text NOT NULL,
	`expires` timestamp(3) NOT NULL,
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`verifiedAt` timestamp(3),
	CONSTRAINT `TCOUI_DeviceVerification_deviceCode_pk` PRIMARY KEY(`deviceCode`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_EntitlementType` (
	`id` varchar(191) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	CONSTRAINT `TCOUI_EntitlementType_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_name_idx` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_Entitlement` (
	`id` varchar(191) NOT NULL,
	`entitlementType` varchar(255) NOT NULL,
	`userId` varchar(191),
	`organizationId` varchar(191),
	`organizationMembershipId` varchar(191),
	`sourceType` varchar(255) NOT NULL,
	`sourceId` varchar(191) NOT NULL,
	`metadata` json DEFAULT ('{}'),
	`expiresAt` timestamp(3),
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_Entitlement_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_MerchantAccount` (
	`id` varchar(191) NOT NULL,
	`organizationId` varchar(191),
	`status` int NOT NULL DEFAULT 0,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`label` varchar(191),
	`identifier` varchar(191),
	CONSTRAINT `MerchantAccount_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_MerchantCharge` (
	`id` varchar(191) NOT NULL,
	`organizationId` varchar(191),
	`status` int NOT NULL DEFAULT 0,
	`identifier` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	`merchantProductId` varchar(191) NOT NULL,
	`merchantSubscriptionId` varchar(191),
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`merchantCustomerId` varchar(191) NOT NULL,
	CONSTRAINT `MerchantCharge_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantCharge_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_MerchantCoupon` (
	`id` varchar(191) NOT NULL,
	`identifier` varchar(191),
	`organizationId` varchar(191),
	`status` int NOT NULL DEFAULT 0,
	`merchantAccountId` varchar(191) NOT NULL,
	`percentageDiscount` decimal(3,2) NOT NULL,
	`type` varchar(191),
	CONSTRAINT `MerchantCoupon_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantCoupon_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_MerchantCustomer` (
	`id` varchar(191) NOT NULL,
	`organizationId` varchar(191),
	`userId` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	`identifier` varchar(191) NOT NULL,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`status` int DEFAULT 0,
	CONSTRAINT `MerchantCustomer_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantCustomer_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_MerchantPrice` (
	`id` varchar(191) NOT NULL,
	`organizationId` varchar(191),
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
CREATE TABLE `TCOUI_MerchantProduct` (
	`id` varchar(191) NOT NULL,
	`organizationId` varchar(191),
	`merchantAccountId` varchar(191) NOT NULL,
	`productId` varchar(191) NOT NULL,
	`status` int NOT NULL DEFAULT 0,
	`identifier` varchar(191),
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `MerchantProduct_id` PRIMARY KEY(`id`),
	CONSTRAINT `MerchantProduct_identifier_key` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_MerchantSession` (
	`id` varchar(191) NOT NULL,
	`organizationId` varchar(191),
	`identifier` varchar(191) NOT NULL,
	`merchantAccountId` varchar(191) NOT NULL,
	CONSTRAINT `MerchantSession_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_MerchantSubscription` (
	`id` varchar(191) NOT NULL,
	`organizationId` varchar(191),
	`merchantAccountId` varchar(191) NOT NULL,
	`status` int NOT NULL DEFAULT 0,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`label` varchar(191),
	`identifier` varchar(191),
	`merchantCustomerId` varchar(191) NOT NULL,
	`merchantProductId` varchar(191) NOT NULL,
	CONSTRAINT `MerchantSubscription_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_Organization` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255),
	`fields` json DEFAULT ('{}'),
	`image` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `TCOUI_Organization_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_OrganizationMembershipRole` (
	`organizationMembershipId` varchar(255) NOT NULL,
	`roleId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`organizationId` varchar(191),
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `pk` PRIMARY KEY(`organizationMembershipId`,`roleId`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_OrganizationMembership` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`role` varchar(191) NOT NULL DEFAULT 'user',
	`invitedById` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `TCOUI_OrganizationMembership_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_Permission` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_Permission_id` PRIMARY KEY(`id`),
	CONSTRAINT `TCOUI_Permission_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_Price` (
	`id` varchar(191) NOT NULL,
	`productId` varchar(191),
	`organizationId` varchar(191),
	`nickname` varchar(191),
	`status` int NOT NULL DEFAULT 0,
	`unitAmount` decimal(10,2) NOT NULL,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`fields` json DEFAULT ('{}'),
	CONSTRAINT `Price_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_Product` (
	`id` varchar(191) NOT NULL,
	`organizationId` varchar(191),
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
CREATE TABLE `TCOUI_Profile` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `TCOUI_Profile_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_user_type_idx` UNIQUE(`userId`,`type`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_PurchaseUserTransfer` (
	`id` varchar(191) NOT NULL,
	`transferState` enum('AVAILABLE','INITIATED','VERIFIED','CANCELED','EXPIRED','CONFIRMED','COMPLETED') NOT NULL DEFAULT 'AVAILABLE',
	`purchaseId` varchar(191) NOT NULL,
	`organizationId` varchar(191),
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
CREATE TABLE `TCOUI_Purchase` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191),
	`organizationMembershipId` varchar(191),
	`organizationId` varchar(191),
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
CREATE TABLE `TCOUI_ResourceProgress` (
	`userId` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`organizationMembershipId` varchar(191),
	`resourceId` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`completedAt` datetime(3),
	`updatedAt` datetime(3),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `TCOUI_ResourceProgress_userId_resourceId_pk` PRIMARY KEY(`userId`,`resourceId`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_RolePermission` (
	`roleId` varchar(255) NOT NULL,
	`permissionId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_RolePermission_roleId_permissionId_pk` PRIMARY KEY(`roleId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_Role` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_Role_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_name_per_org` UNIQUE(`organizationId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_Session` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `TCOUI_Session_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_Subscription` (
	`id` varchar(191) NOT NULL,
	`organizationId` varchar(191),
	`productId` varchar(191) NOT NULL,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`merchantSubscriptionId` varchar(191) NOT NULL,
	`status` varchar(191) NOT NULL DEFAULT 'active',
	`fields` json DEFAULT ('{}'),
	CONSTRAINT `Subscription_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_Tag` (
	`id` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`type` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_Tag_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_TagTag` (
	`parentTagId` varchar(255) NOT NULL,
	`childTagId` varchar(255) NOT NULL,
	`position` double NOT NULL DEFAULT 0,
	`metadata` json DEFAULT ('{}'),
	`organizationId` varchar(191),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_TagTag_parentTagId_childTagId_pk` PRIMARY KEY(`parentTagId`,`childTagId`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_UpgradableProducts` (
	`upgradableToId` varchar(255) NOT NULL,
	`upgradableFrom` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`position` double NOT NULL DEFAULT 0,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_UpgradableProducts_upgradableToId_upgradableFrom_pk` PRIMARY KEY(`upgradableToId`,`upgradableFrom`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_UserPermission` (
	`userId` varchar(255) NOT NULL,
	`organizationId` varchar(191),
	`permissionId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_UserPermission_userId_permissionId_pk` PRIMARY KEY(`userId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_UserPrefs` (
	`id` varchar(191) NOT NULL,
	`organizationId` varchar(191),
	`type` varchar(191) NOT NULL DEFAULT 'Global',
	`userId` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_UserPrefs_id_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_UserRole` (
	`userId` varchar(255) NOT NULL,
	`roleId` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`organizationId` varchar(191),
	`createdAt` timestamp(3) DEFAULT (now()),
	`updatedAt` timestamp(3) DEFAULT (now()),
	`deletedAt` timestamp(3),
	CONSTRAINT `TCOUI_UserRole_userId_roleId_pk` PRIMARY KEY(`userId`,`roleId`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_User` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255),
	`role` varchar(191) NOT NULL DEFAULT 'user',
	`email` varchar(255) NOT NULL,
	`fields` json DEFAULT ('{}'),
	`emailVerified` timestamp(3),
	`image` varchar(255),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `TCOUI_User_id` PRIMARY KEY(`id`),
	CONSTRAINT `TCOUI_User_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `TCOUI_VerificationToken` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	`createdAt` timestamp(3) DEFAULT (now()),
	CONSTRAINT `TCOUI_VerificationToken_identifier_token_pk` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `TCOUI_Account` (`userId`);--> statement-breakpoint
CREATE INDEX `crr_userIdId_idx` ON `TCOUI_Comment` (`userId`);--> statement-breakpoint
CREATE INDEX `organizationMembershipId_idx` ON `TCOUI_Comment` (`organizationMembershipId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `TCOUI_CommunicationChannel` (`name`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_CommunicationChannel` (`organizationId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `TCOUI_CommunicationPreference` (`userId`);--> statement-breakpoint
CREATE INDEX `preferenceTypeId_idx` ON `TCOUI_CommunicationPreference` (`preferenceTypeId`);--> statement-breakpoint
CREATE INDEX `channelId_idx` ON `TCOUI_CommunicationPreference` (`channelId`);--> statement-breakpoint
CREATE INDEX `organizationMembershipId_idx` ON `TCOUI_CommunicationPreference` (`organizationMembershipId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `TCOUI_ContentContribution` (`userId`);--> statement-breakpoint
CREATE INDEX `contentId_idx` ON `TCOUI_ContentContribution` (`contentId`);--> statement-breakpoint
CREATE INDEX `contributionTypeId_idx` ON `TCOUI_ContentContribution` (`contributionTypeId`);--> statement-breakpoint
CREATE INDEX `organizationMembershipId_idx` ON `TCOUI_ContentContribution` (`organizationMembershipId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `TCOUI_ContentResource` (`type`);--> statement-breakpoint
CREATE INDEX `createdById_idx` ON `TCOUI_ContentResource` (`createdById`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `TCOUI_ContentResource` (`createdAt`);--> statement-breakpoint
CREATE INDEX `currentVersionId_idx` ON `TCOUI_ContentResource` (`currentVersionId`);--> statement-breakpoint
CREATE INDEX `createdByOrganizationMembershipId_idx` ON `TCOUI_ContentResource` (`createdByOrganizationMembershipId`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `TCOUI_ContentResourceProduct` (`productId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `TCOUI_ContentResourceProduct` (`resourceId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_ContentResourceProduct` (`organizationId`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `TCOUI_ContentResourceResource` (`resourceOfId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `TCOUI_ContentResourceResource` (`resourceId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_ContentResourceResource` (`organizationId`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `TCOUI_ContentResourceTag` (`contentResourceId`);--> statement-breakpoint
CREATE INDEX `tagId_idx` ON `TCOUI_ContentResourceTag` (`tagId`);--> statement-breakpoint
CREATE INDEX `position_idx` ON `TCOUI_ContentResourceTag` (`position`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_ContentResourceTag` (`organizationId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `TCOUI_ContentResourceVersion` (`resourceId`);--> statement-breakpoint
CREATE INDEX `parentVersionId_idx` ON `TCOUI_ContentResourceVersion` (`parentVersionId`);--> statement-breakpoint
CREATE INDEX `resourceId_versionNumber_idx` ON `TCOUI_ContentResourceVersion` (`resourceId`,`versionNumber`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_ContentResourceVersion` (`organizationId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `TCOUI_ContributionType` (`name`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `TCOUI_ContributionType` (`slug`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_ContributionType` (`organizationId`);--> statement-breakpoint
CREATE INDEX `Coupon_id_code_index` ON `TCOUI_Coupon` (`id`,`code`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_Coupon` (`organizationId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `TCOUI_DeviceAccessToken` (`userId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `TCOUI_Entitlement` (`userId`);--> statement-breakpoint
CREATE INDEX `orgId_idx` ON `TCOUI_Entitlement` (`organizationId`);--> statement-breakpoint
CREATE INDEX `source_idx` ON `TCOUI_Entitlement` (`sourceType`,`sourceId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `TCOUI_Entitlement` (`entitlementType`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_MerchantAccount` (`organizationId`);--> statement-breakpoint
CREATE INDEX `merchantSubscriptionId_idx` ON `TCOUI_MerchantCharge` (`merchantSubscriptionId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_MerchantCharge` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_MerchantCoupon` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_MerchantCustomer_on_userId` ON `TCOUI_MerchantCustomer` (`userId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_MerchantCustomer` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_MerchantPrice` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_MerchantProduct` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_MerchantSession` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_MerchantSubscription` (`organizationId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `TCOUI_Organization` (`createdAt`);--> statement-breakpoint
CREATE INDEX `orgMemberId_idx` ON `TCOUI_OrganizationMembershipRole` (`organizationMembershipId`);--> statement-breakpoint
CREATE INDEX `roleId_idx` ON `TCOUI_OrganizationMembershipRole` (`roleId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_OrganizationMembershipRole` (`organizationId`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `TCOUI_OrganizationMembership` (`role`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `TCOUI_OrganizationMembership` (`createdAt`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_OrganizationMembership` (`organizationId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `TCOUI_Permission` (`name`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_Price` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_Product` (`organizationId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `TCOUI_Profile` (`userId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_PurchaseUserTransfer` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_Purchase_on_merchantChargeId` ON `TCOUI_Purchase` (`merchantChargeId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_Purchase` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationMembershipId_idx` ON `TCOUI_Purchase` (`organizationMembershipId`);--> statement-breakpoint
CREATE INDEX `crp_userId_contentResourceId_idx` ON `TCOUI_ResourceProgress` (`userId`,`resourceId`);--> statement-breakpoint
CREATE INDEX `contentResourceId_idx` ON `TCOUI_ResourceProgress` (`resourceId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `TCOUI_ResourceProgress` (`userId`);--> statement-breakpoint
CREATE INDEX `organizationMembershipId_idx` ON `TCOUI_ResourceProgress` (`organizationMembershipId`);--> statement-breakpoint
CREATE INDEX `roleId_idx` ON `TCOUI_RolePermission` (`roleId`);--> statement-breakpoint
CREATE INDEX `permissionId_idx` ON `TCOUI_RolePermission` (`permissionId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `TCOUI_Role` (`name`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_Role` (`organizationId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `TCOUI_Session` (`userId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_Subscription` (`organizationId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `TCOUI_Tag` (`type`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_Tag` (`organizationId`);--> statement-breakpoint
CREATE INDEX `parentTagId_idx` ON `TCOUI_TagTag` (`parentTagId`);--> statement-breakpoint
CREATE INDEX `childTagId_idx` ON `TCOUI_TagTag` (`childTagId`);--> statement-breakpoint
CREATE INDEX `position_idx` ON `TCOUI_TagTag` (`position`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_TagTag` (`organizationId`);--> statement-breakpoint
CREATE INDEX `upgradableFromId_idx` ON `TCOUI_UpgradableProducts` (`upgradableToId`);--> statement-breakpoint
CREATE INDEX `upgradableToId_idx` ON `TCOUI_UpgradableProducts` (`upgradableFrom`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_UpgradableProducts` (`organizationId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `TCOUI_UserPermission` (`userId`);--> statement-breakpoint
CREATE INDEX `permissionId_idx` ON `TCOUI_UserPermission` (`permissionId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_UserPermission` (`organizationId`);--> statement-breakpoint
CREATE INDEX `crr_userIdId_idx` ON `TCOUI_UserPrefs` (`userId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_UserPrefs` (`organizationId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `TCOUI_UserRole` (`userId`);--> statement-breakpoint
CREATE INDEX `roleId_idx` ON `TCOUI_UserRole` (`roleId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `TCOUI_UserRole` (`organizationId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `TCOUI_User` (`email`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `TCOUI_User` (`role`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `TCOUI_User` (`createdAt`);