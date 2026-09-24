ALTER TABLE `Merchant`
  ADD COLUMN `shopId` VARCHAR(191) NULL,
  ADD COLUMN `logoText` VARCHAR(191) NULL,
  ADD COLUMN `themeColor` VARCHAR(191) NULL DEFAULT 'blue',
  ADD COLUMN `introduction` TEXT NULL,
  ADD COLUMN `mainProductKeywords` JSON NULL,
  ADD COLUMN `companyType` VARCHAR(191) NULL,
  ADD COLUMN `businessStatus` VARCHAR(191) NULL DEFAULT 'active',
  ADD COLUMN `registeredCapitalCurrency` CHAR(3) NULL DEFAULT 'CNY',
  ADD COLUMN `establishedAt` DATE NULL,
  ADD COLUMN `businessTermStart` DATE NULL,
  ADD COLUMN `businessTermEnd` DATE NULL,
  ADD COLUMN `registrationAuthority` VARCHAR(191) NULL,
  ADD COLUMN `organizationCode` VARCHAR(191) NULL,
  ADD COLUMN `taxpayerId` VARCHAR(191) NULL,
  ADD COLUMN `registrationNumber` VARCHAR(191) NULL,
  ADD COLUMN `websiteUrl` VARCHAR(191) NULL,
  ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `viewCount` BIGINT NOT NULL DEFAULT 0;

UPDATE `Merchant` SET `shopId` = UUID() WHERE `shopId` IS NULL;
ALTER TABLE `Merchant`
  MODIFY COLUMN `shopId` VARCHAR(191) NOT NULL,
  MODIFY COLUMN `registeredCapital` DECIMAL(14,2) NULL,
  ADD UNIQUE INDEX `Merchant_shopId_key` (`shopId`),
  ADD UNIQUE INDEX `Merchant_unifiedSocialCreditCode_key` (`unifiedSocialCreditCode`);

CREATE TABLE `MerchantContact` (
  `id` VARCHAR(191) NOT NULL,
  `merchantId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `mobile` VARCHAR(191) NOT NULL,
  `telephone` VARCHAR(191) NULL,
  `email` VARCHAR(191) NULL,
  `position` VARCHAR(191) NULL,
  `isPrimary` BOOLEAN NOT NULL DEFAULT false,
  `visibleToBuyer` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `MerchantContact_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MerchantShippingAddress` (
  `id` VARCHAR(191) NOT NULL,
  `merchantId` VARCHAR(191) NOT NULL,
  `provinceCode` VARCHAR(191) NOT NULL,
  `cityCode` VARCHAR(191) NOT NULL,
  `districtCode` VARCHAR(191) NOT NULL,
  `addressDetail` VARCHAR(191) NOT NULL,
  `isDefaultShippingAddress` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `MerchantShippingAddress_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MerchantVerification` (
  `id` VARCHAR(191) NOT NULL,
  `merchantId` VARCHAR(191) NOT NULL,
  `verificationType` VARCHAR(191) NOT NULL,
  `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `verifiedAt` DATETIME(3) NULL,
  `expiresAt` DATETIME(3) NULL,
  `documentUrls` JSON NULL,
  `remark` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `MerchantVerification_merchantId_verificationType_idx` (`merchantId`, `verificationType`),
  CONSTRAINT `MerchantVerification_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Product`
  ADD COLUMN `spuCode` VARCHAR(191) NULL,
  ADD COLUMN `manufacturer` VARCHAR(191) NULL,
  ADD COLUMN `originPlace` VARCHAR(191) NULL,
  ADD COLUMN `imageUrls` JSON NULL,
  ADD COLUMN `videoUrls` JSON NULL,
  ADD COLUMN `marketingBadge` VARCHAR(191) NULL,
  ADD COLUMN `sellingPoints` JSON NULL,
  ADD COLUMN `supplyMethods` JSON NULL,
  ADD COLUMN `applicationScenarios` JSON NULL,
  ADD COLUMN `serviceGuarantees` JSON NULL,
  ADD COLUMN `afterSalesService` TEXT NULL,
  ADD COLUMN `technicalParameters` JSON NULL,
  ADD COLUMN `featureTags` JSON NULL,
  ADD COLUMN `customizationEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `inquiryEnabled` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `shipWithinHours` INTEGER NULL,
  ADD COLUMN `searchKeywords` JSON NULL,
  ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `salesCount` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `viewCount` BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN `publishedAt` DATETIME(3) NULL,
  ADD UNIQUE INDEX `Product_spuCode_key` (`spuCode`);

ALTER TABLE `ProductSku`
  ADD COLUMN `specValues` JSON NULL,
  ADD COLUMN `imageUrl` VARCHAR(191) NULL,
  ADD COLUMN `priceCurrency` CHAR(3) NOT NULL DEFAULT 'CNY',
  ADD COLUMN `priceUnit` VARCHAR(191) NOT NULL DEFAULT '件',
  ADD COLUMN `priceFrom` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `stockStatus` VARCHAR(191) NOT NULL DEFAULT 'in_stock';

CREATE TABLE `SkuTierPrice` (
  `id` VARCHAR(191) NOT NULL,
  `skuId` VARCHAR(191) NOT NULL,
  `minQuantity` DECIMAL(12,3) NOT NULL,
  `maxQuantity` DECIMAL(12,3) NULL,
  `unitPrice` DECIMAL(14,2) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'CNY',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `SkuTierPrice_skuId_minQuantity_idx` (`skuId`, `minQuantity`),
  CONSTRAINT `SkuTierPrice_skuId_fkey` FOREIGN KEY (`skuId`) REFERENCES `ProductSku`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
