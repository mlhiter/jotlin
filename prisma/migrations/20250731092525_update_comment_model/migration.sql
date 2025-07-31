/*
  Warnings:

  - You are about to drop the column `length` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Comment` table. All the data in the column will be lost.
  - Added the required column `blockId` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "length",
DROP COLUMN "position",
ADD COLUMN     "blockId" TEXT NOT NULL;
