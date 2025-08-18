/*
  Warnings:

  - You are about to drop the column `parentId` on the `Comment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropIndex
DROP INDEX "public"."Comment_parentId_idx";

-- AlterTable
ALTER TABLE "public"."Comment" DROP COLUMN "parentId",
ADD COLUMN     "replyOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "replyToCommentId" TEXT;

-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "documentTitle" TEXT,
ADD COLUMN     "invitationId" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "senderEmail" TEXT,
ADD COLUMN     "senderId" TEXT,
ADD COLUMN     "senderName" TEXT;

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "inboxLastViewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Comment_blockId_idx" ON "public"."Comment"("blockId");

-- CreateIndex
CREATE INDEX "Comment_replyToCommentId_idx" ON "public"."Comment"("replyToCommentId");

-- CreateIndex
CREATE INDEX "Comment_replyOrder_idx" ON "public"."Comment"("replyOrder");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "public"."Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_priority_idx" ON "public"."Notification"("priority");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_replyToCommentId_fkey" FOREIGN KEY ("replyToCommentId") REFERENCES "public"."Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
