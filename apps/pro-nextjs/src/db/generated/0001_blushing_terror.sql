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
ALTER TABLE `UpgradableProducts` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `UpgradableProducts` MODIFY COLUMN `updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `User` MODIFY COLUMN `role` enum('User','Admin') DEFAULT 'User';--> statement-breakpoint
ALTER TABLE `User` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `UserPermission` MODIFY COLUMN `active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `UserPrefs` MODIFY COLUMN `createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `UserPrefs` MODIFY COLUMN `updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `UserRole` MODIFY COLUMN `active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `Account` ADD PRIMARY KEY(`provider`,`providerAccountId`);--> statement-breakpoint
ALTER TABLE `Comment` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ContentResourceProduct` ADD PRIMARY KEY(`productId`,`resourceId`);--> statement-breakpoint
ALTER TABLE `ContentResourceResource` ADD PRIMARY KEY(`resourceOfId`,`resourceId`);--> statement-breakpoint
ALTER TABLE `ResourceProgress` ADD PRIMARY KEY(`userId`,`contentResourceId`);--> statement-breakpoint
ALTER TABLE `RolePermission` ADD PRIMARY KEY(`roleId`,`permissionId`);--> statement-breakpoint
ALTER TABLE `UpgradableProducts` ADD PRIMARY KEY(`upgradableToId`,`upgradableFrom`);--> statement-breakpoint
ALTER TABLE `UserPermission` ADD PRIMARY KEY(`userId`,`permissionId`);--> statement-breakpoint
ALTER TABLE `UserPrefs` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `UserRole` ADD PRIMARY KEY(`userId`,`roleId`);--> statement-breakpoint
ALTER TABLE `VerificationToken` ADD PRIMARY KEY(`identifier`,`token`);
