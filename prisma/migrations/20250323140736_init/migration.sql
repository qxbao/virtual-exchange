-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_symbol_fkey` FOREIGN KEY (`symbol`) REFERENCES `market_data`(`symbol`) ON DELETE RESTRICT ON UPDATE CASCADE;
