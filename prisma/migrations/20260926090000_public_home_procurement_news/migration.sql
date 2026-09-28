CREATE TABLE `ProcurementDemand` (
  `id` VARCHAR(191) NOT NULL,
  `categoryId` VARCHAR(191) NOT NULL,
  `description` VARCHAR(1000) NOT NULL,
  `quantity` DECIMAL(12, 3) NOT NULL,
  `unit` VARCHAR(20) NOT NULL,
  `contactName` VARCHAR(80) NOT NULL,
  `contactPhone` VARCHAR(32) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ProcurementDemand_categoryId_createdAt_idx`(`categoryId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NewsArticle` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `summary` VARCHAR(500) NOT NULL,
  `coverImage` VARCHAR(191) NULL,
  `content` LONGTEXT NOT NULL,
  `publishedAt` DATETIME(3) NULL,
  `viewCount` INTEGER NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `NewsArticle_status_publishedAt_idx`(`status`, `publishedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProcurementDemand` ADD CONSTRAINT `ProcurementDemand_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
