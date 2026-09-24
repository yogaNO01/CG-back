ALTER TABLE `Merchant`
  ADD COLUMN `unifiedSocialCreditCode` VARCHAR(191) NULL,
  ADD COLUMN `legalRepresentative` VARCHAR(191) NULL,
  ADD COLUMN `registeredCapital` VARCHAR(191) NULL,
  ADD COLUMN `establishmentDate` VARCHAR(191) NULL,
  ADD COLUMN `employeeCount` INTEGER NULL,
  ADD COLUMN `factoryArea` VARCHAR(191) NULL,
  ADD COLUMN `website` VARCHAR(191) NULL,
  ADD COLUMN `businessScope` TEXT NULL;

ALTER TABLE `Product`
  ADD COLUMN `brand` VARCHAR(191) NULL,
  ADD COLUMN `origin` VARCHAR(191) NULL,
  ADD COLUMN `material` VARCHAR(191) NULL,
  ADD COLUMN `processingMethod` VARCHAR(191) NULL,
  ADD COLUMN `qualityStandard` VARCHAR(191) NULL,
  ADD COLUMN `unit` VARCHAR(191) NULL,
  ADD COLUMN `packaging` VARCHAR(191) NULL,
  ADD COLUMN `supplyCapacity` VARCHAR(191) NULL,
  ADD COLUMN `detailAttributes` JSON NULL,
  ADD COLUMN `tradeInfo` JSON NULL;
