ALTER TABLE `Product`
  MODIFY COLUMN `minOrderQuantity` DECIMAL(12,3) NOT NULL DEFAULT 1.000;

ALTER TABLE `ProductSku`
  MODIFY COLUMN `minOrderQuantity` DECIMAL(12,3) NOT NULL DEFAULT 1.000,
  MODIFY COLUMN `stockQuantity` DECIMAL(14,3) NOT NULL DEFAULT 0.000;

CREATE TABLE `Inquiry` (
  `id` VARCHAR(191) NOT NULL,
  `merchantId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NULL,
  `skuId` VARCHAR(191) NULL,
  `productNameSnapshot` VARCHAR(300) NOT NULL,
  `requirement` VARCHAR(300) NOT NULL,
  `expectedSpec` VARCHAR(500) NULL,
  `quantity` DECIMAL(12,3) NULL,
  `unit` VARCHAR(20) NULL,
  `expectedDeliveryAt` DATE NULL,
  `contactName` VARCHAR(80) NOT NULL,
  `contactPhone` VARCHAR(32) NOT NULL,
  `contactEmail` VARCHAR(120) NULL,
  `status` ENUM('SUBMITTED', 'ASSIGNED', 'CONTACTED', 'QUOTED', 'CLOSED', 'INVALID') NOT NULL DEFAULT 'SUBMITTED',
  `handlerId` VARCHAR(191) NULL,
  `handledAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Inquiry_merchantId_status_createdAt_idx` (`merchantId`, `status`, `createdAt`),
  INDEX `Inquiry_productId_idx` (`productId`),
  CONSTRAINT `Inquiry_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Inquiry_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Inquiry_skuId_fkey` FOREIGN KEY (`skuId`) REFERENCES `ProductSku`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
