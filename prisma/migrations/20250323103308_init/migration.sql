/*
  Warnings:

  - The primary key for the `market_data` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[symbol]` on the table `market_data` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `market_data_id_key` ON `market_data`;

-- AlterTable
ALTER TABLE `market_data` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE UNIQUE INDEX `market_data_symbol_key` ON `market_data`(`symbol`);
