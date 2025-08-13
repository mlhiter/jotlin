/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "imageUrl",
DROP COLUMN "username";

-- DropTable
DROP TABLE "Image";
