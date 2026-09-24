-- CreateTable
CREATE TABLE `Admin` (
    `id` VARCHAR(191) NOT NULL, `username` VARCHAR(191) NOT NULL, `passwordHash` VARCHAR(191) NOT NULL, `realName` VARCHAR(191) NULL, `phone` VARCHAR(191) NULL, `email` VARCHAR(191) NULL, `status` ENUM('ENABLED', 'DISABLED') NOT NULL DEFAULT 'ENABLED', `lastLoginAt` DATETIME(3) NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Admin_username_key`(`username`), UNIQUE INDEX `Admin_phone_key`(`phone`), UNIQUE INDEX `Admin_email_key`(`email`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL, `code` VARCHAR(191) NOT NULL, `name` VARCHAR(191) NOT NULL, `description` VARCHAR(191) NULL, `enabled` BOOLEAN NOT NULL DEFAULT true, `builtIn` BOOLEAN NOT NULL DEFAULT false, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Role_code_key`(`code`), UNIQUE INDEX `Role_name_key`(`name`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminRole` (`adminId` VARCHAR(191) NOT NULL, `roleId` VARCHAR(191) NOT NULL, PRIMARY KEY (`adminId`, `roleId`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Menu` (
    `id` VARCHAR(191) NOT NULL, `parentId` VARCHAR(191) NULL, `type` ENUM('CATALOG', 'MENU', 'BUTTON') NOT NULL, `name` VARCHAR(191) NOT NULL, `path` VARCHAR(191) NULL, `component` VARCHAR(191) NULL, `icon` VARCHAR(191) NULL, `permissionCode` VARCHAR(191) NULL, `sortOrder` INTEGER NOT NULL DEFAULT 0, `visible` BOOLEAN NOT NULL DEFAULT true, `enabled` BOOLEAN NOT NULL DEFAULT true, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Menu_permissionCode_key`(`permissionCode`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleMenu` (`roleId` VARCHAR(191) NOT NULL, `menuId` VARCHAR(191) NOT NULL, PRIMARY KEY (`roleId`, `menuId`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Merchant` (
    `id` VARCHAR(191) NOT NULL, `companyName` VARCHAR(191) NOT NULL, `shortName` VARCHAR(191) NULL, `logo` VARCHAR(191) NULL, `contactName` VARCHAR(191) NOT NULL, `contactPhone` VARCHAR(191) NOT NULL, `province` VARCHAR(191) NULL, `city` VARCHAR(191) NULL, `address` VARCHAR(191) NULL, `mainCategories` JSON NULL, `mainProducts` JSON NULL, `businessYears` INTEGER NULL, `responseRate` INTEGER NULL, `deliveryLocation` VARCHAR(191) NULL, `supportsCustomization` BOOLEAN NOT NULL DEFAULT false, `status` ENUM('ENABLED', 'DISABLED') NOT NULL DEFAULT 'ENABLED', `certificationStatus` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING', `certificationRemark` VARCHAR(191) NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Merchant_companyName_key`(`companyName`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MerchantQualification` (
    `id` VARCHAR(191) NOT NULL, `merchantId` VARCHAR(191) NOT NULL, `type` ENUM('BUSINESS_LICENSE', 'FACTORY_AUDIT', 'CERTIFICATE', 'OTHER') NOT NULL, `url` VARCHAR(191) NOT NULL, `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING', `remark` VARCHAR(191) NULL, `reviewedById` VARCHAR(191) NULL, `reviewedAt` DATETIME(3) NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL, `parentId` VARCHAR(191) NULL, `name` VARCHAR(191) NOT NULL, `icon` VARCHAR(191) NULL, `sortOrder` INTEGER NOT NULL DEFAULT 0, `level` INTEGER NOT NULL, `enabled` BOOLEAN NOT NULL DEFAULT true, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Category_parentId_name_key`(`parentId`, `name`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL, `merchantId` VARCHAR(191) NOT NULL, `categoryId` VARCHAR(191) NOT NULL, `name` VARCHAR(191) NOT NULL, `model` VARCHAR(191) NULL, `shortDescription` VARCHAR(191) NULL, `detailContent` VARCHAR(191) NULL, `mainImage` VARCHAR(191) NULL, `supplyType` ENUM('SPOT', 'CUSTOM', 'BOTH') NOT NULL DEFAULT 'SPOT', `deliveryDays` INTEGER NULL, `minOrderQuantity` INTEGER NOT NULL DEFAULT 1, `status` ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ON_SHELF', 'OFF_SHELF') NOT NULL DEFAULT 'DRAFT', `rejectionReason` VARCHAR(191) NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL, `deletedAt` DATETIME(3) NULL,
    INDEX `Product_status_categoryId_idx`(`status`, `categoryId`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductSku` (`id` VARCHAR(191) NOT NULL, `productId` VARCHAR(191) NOT NULL, `specName` VARCHAR(191) NOT NULL, `specValue` VARCHAR(191) NOT NULL, `skuCode` VARCHAR(191) NOT NULL, `priceCent` INTEGER NOT NULL, `minOrderQuantity` INTEGER NOT NULL DEFAULT 1, `stockQuantity` INTEGER NOT NULL DEFAULT 0, `enabled` BOOLEAN NOT NULL DEFAULT true, UNIQUE INDEX `ProductSku_skuCode_key`(`skuCode`), PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductImage` (`id` VARCHAR(191) NOT NULL, `productId` VARCHAR(191) NOT NULL, `url` VARCHAR(191) NOT NULL, `type` ENUM('MAIN', 'GALLERY', 'DETAIL') NOT NULL DEFAULT 'GALLERY', `sortOrder` INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseOrder` (
    `id` VARCHAR(191) NOT NULL, `orderNo` VARCHAR(191) NOT NULL, `buyerCompanyName` VARCHAR(191) NOT NULL, `buyerContactName` VARCHAR(191) NOT NULL, `buyerContactPhone` VARCHAR(191) NOT NULL, `merchantId` VARCHAR(191) NOT NULL, `totalAmountCent` INTEGER NOT NULL, `orderStatus` ENUM('PENDING_CONFIRM', 'PENDING_PAYMENT', 'PENDING_DELIVERY', 'SHIPPED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_CONFIRM', `paymentStatus` ENUM('UNPAID', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID', `deliveryStatus` ENUM('PENDING', 'SHIPPED', 'RECEIVED') NOT NULL DEFAULT 'PENDING', `receiverName` VARCHAR(191) NOT NULL, `receiverPhone` VARCHAR(191) NOT NULL, `receiverAddress` VARCHAR(191) NOT NULL, `remark` VARCHAR(191) NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `PurchaseOrder_orderNo_key`(`orderNo`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseOrderItem` (`id` VARCHAR(191) NOT NULL, `orderId` VARCHAR(191) NOT NULL, `productId` VARCHAR(191) NOT NULL, `skuId` VARCHAR(191) NULL, `productNameSnapshot` VARCHAR(191) NOT NULL, `productImageSnapshot` VARCHAR(191) NULL, `skuNameSnapshot` VARCHAR(191) NULL, `unitPriceCentSnapshot` INTEGER NOT NULL, `quantity` INTEGER NOT NULL, `subtotalCent` INTEGER NOT NULL, PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderStatusLog` (`id` VARCHAR(191) NOT NULL, `orderId` VARCHAR(191) NOT NULL, `fromStatus` ENUM('PENDING_CONFIRM', 'PENDING_PAYMENT', 'PENDING_DELIVERY', 'SHIPPED', 'COMPLETED', 'CANCELLED') NULL, `toStatus` ENUM('PENDING_CONFIRM', 'PENDING_PAYMENT', 'PENDING_DELIVERY', 'SHIPPED', 'COMPLETED', 'CANCELLED') NOT NULL, `operatorAdminId` VARCHAR(191) NULL, `remark` VARCHAR(191) NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (`id` VARCHAR(191) NOT NULL, `adminId` VARCHAR(191) NULL, `action` VARCHAR(191) NOT NULL, `resourceType` VARCHAR(191) NOT NULL, `resourceId` VARCHAR(191) NULL, `detail` JSON NULL, `ip` VARCHAR(191) NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), INDEX `AuditLog_resourceType_resourceId_idx`(`resourceType`, `resourceId`), PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdminRole` ADD CONSTRAINT `AdminRole_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AdminRole` ADD CONSTRAINT `AdminRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Menu` ADD CONSTRAINT `Menu_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Menu`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `RoleMenu` ADD CONSTRAINT `RoleMenu_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RoleMenu` ADD CONSTRAINT `RoleMenu_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `Menu`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MerchantQualification` ADD CONSTRAINT `MerchantQualification_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Product` ADD CONSTRAINT `Product_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ProductSku` ADD CONSTRAINT `ProductSku_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PurchaseOrder` ADD CONSTRAINT `PurchaseOrder_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `PurchaseOrderItem` ADD CONSTRAINT `PurchaseOrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `PurchaseOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PurchaseOrderItem` ADD CONSTRAINT `PurchaseOrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `PurchaseOrderItem` ADD CONSTRAINT `PurchaseOrderItem_skuId_fkey` FOREIGN KEY (`skuId`) REFERENCES `ProductSku`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `OrderStatusLog` ADD CONSTRAINT `OrderStatusLog_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `PurchaseOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `OrderStatusLog` ADD CONSTRAINT `OrderStatusLog_operatorAdminId_fkey` FOREIGN KEY (`operatorAdminId`) REFERENCES `Admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
