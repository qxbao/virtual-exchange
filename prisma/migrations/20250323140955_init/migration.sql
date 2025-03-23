-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_symbol_fkey`;

-- DropIndex
DROP INDEX `orders_symbol_fkey` ON `orders`;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_symbol_fkey` FOREIGN KEY (`symbol`) REFERENCES `market_data`(`symbol`) ON DELETE CASCADE ON UPDATE CASCADE;
