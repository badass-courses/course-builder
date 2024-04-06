CREATE TABLE `pro-aws_upgradableProducts` (
	`upgradableToId` varchar(255) NOT NULL,
	`upgradableFrom` varchar(255) NOT NULL,
	`position` double NOT NULL DEFAULT 0,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`deletedAt` timestamp(3),
	CONSTRAINT `pro-aws_upgradableProducts_upgradableToId_upgradableFrom_pk` PRIMARY KEY(`upgradableToId`,`upgradableFrom`)
);
--> statement-breakpoint
ALTER TABLE `pro-aws_contentResourceResource` RENAME COLUMN `fields` TO `metadata`;--> statement-breakpoint
ALTER TABLE `pro-aws_coupons` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `pro-aws_coupons` MODIFY COLUMN `expires` timestamp(3);--> statement-breakpoint
ALTER TABLE `pro-aws_merchantAccounts` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `pro-aws_merchantCharges` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `pro-aws_merchantCustomers` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `pro-aws_merchantPrices` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `pro-aws_merchantProducts` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `pro-aws_prices` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `pro-aws_products` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `pro-aws_purchases` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `pro-aws_purchaseUserTransfers` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `pro-aws_purchaseUserTransfers` MODIFY COLUMN `expiresAt` timestamp(3);--> statement-breakpoint
ALTER TABLE `pro-aws_purchaseUserTransfers` MODIFY COLUMN `canceledAt` timestamp(3);--> statement-breakpoint
ALTER TABLE `pro-aws_purchaseUserTransfers` MODIFY COLUMN `confirmedAt` timestamp(3);--> statement-breakpoint
ALTER TABLE `pro-aws_purchaseUserTransfers` MODIFY COLUMN `completedAt` timestamp(3);--> statement-breakpoint
CREATE INDEX `upgradableFromId_idx` ON `pro-aws_upgradableProducts` (`upgradableToId`);--> statement-breakpoint
CREATE INDEX `upgradableToId_idx` ON `pro-aws_upgradableProducts` (`upgradableFrom`);