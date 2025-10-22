-- CreateEnum
CREATE TYPE "public"."ChatPhase" AS ENUM ('REQUIREMENT', 'ARCHITECTURE', 'DEVELOPMENT');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('DRAFT', 'COMPLETED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "public"."chat" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "phase" "public"."ChatPhase";

-- CreateTable
CREATE TABLE "public"."document" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "phase" "public"."ChatPhase" NOT NULL,
    "content" TEXT NOT NULL,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceChatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."chat" ADD CONSTRAINT "chat_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document" ADD CONSTRAINT "document_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
