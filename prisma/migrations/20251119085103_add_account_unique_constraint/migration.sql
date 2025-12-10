/*
  Warnings:

  - You are about to drop the column `accessToken` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `accessTokenExpiresAt` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `accountId` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `idToken` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `refreshTokenExpiresAt` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `account` table. All the data in the column will be lost.
  - You are about to drop the `session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,provider]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `provider` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerAccountId` to the `account` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey (safe - only if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'session_userId_fkey'
               AND table_schema = 'public'
               AND table_name = 'session') THEN
        ALTER TABLE "public"."session" DROP CONSTRAINT "session_userId_fkey";
    END IF;
END $$;

-- AlterTable (safe - drop columns only if they exist)
DO $$
BEGIN
    -- Drop columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account' AND column_name = 'accessToken') THEN
        ALTER TABLE "public"."account" DROP COLUMN "accessToken";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account' AND column_name = 'accessTokenExpiresAt') THEN
        ALTER TABLE "public"."account" DROP COLUMN "accessTokenExpiresAt";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account' AND column_name = 'accountId') THEN
        ALTER TABLE "public"."account" DROP COLUMN "accountId";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account' AND column_name = 'idToken') THEN
        ALTER TABLE "public"."account" DROP COLUMN "idToken";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account' AND column_name = 'password') THEN
        ALTER TABLE "public"."account" DROP COLUMN "password";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account' AND column_name = 'providerId') THEN
        ALTER TABLE "public"."account" DROP COLUMN "providerId";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account' AND column_name = 'refreshToken') THEN
        ALTER TABLE "public"."account" DROP COLUMN "refreshToken";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account' AND column_name = 'refreshTokenExpiresAt') THEN
        ALTER TABLE "public"."account" DROP COLUMN "refreshTokenExpiresAt";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account' AND column_name = 'scope') THEN
        ALTER TABLE "public"."account" DROP COLUMN "scope";
    END IF;

    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account' AND column_name = 'provider') THEN
        ALTER TABLE "public"."account" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'github';
        ALTER TABLE "public"."account" ALTER COLUMN "provider" DROP DEFAULT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account' AND column_name = 'providerAccountId') THEN
        ALTER TABLE "public"."account" ADD COLUMN "providerAccountId" TEXT NOT NULL DEFAULT '';
        ALTER TABLE "public"."account" ALTER COLUMN "providerAccountId" DROP DEFAULT;
    END IF;
END $$;

-- AlterTable
ALTER TABLE "public"."user" ALTER COLUMN "emailVerified" SET DEFAULT true;

-- DropTable (safe - only if exists)
DROP TABLE IF EXISTS "public"."session";

-- DropTable (safe - only if exists)
DROP TABLE IF EXISTS "public"."verification";

-- CreateTable
CREATE TABLE "public"."competitor_research" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "phase" "public"."ChatPhase" NOT NULL DEFAULT 'REQUIREMENT',
    "query" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitor_research_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "competitor_research_chatId_idx" ON "public"."competitor_research"("chatId");

-- CreateIndex
CREATE INDEX "competitor_research_chatId_phase_idx" ON "public"."competitor_research"("chatId", "phase");

-- CreateIndex (safe - only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'account' AND indexname = 'account_userId_idx') THEN
        CREATE INDEX "account_userId_idx" ON "public"."account"("userId");
    END IF;
END $$;

-- CreateIndex (safe - only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'account' AND indexname = 'account_userId_provider_key') THEN
        CREATE UNIQUE INDEX "account_userId_provider_key" ON "public"."account"("userId", "provider");
    END IF;
END $$;

-- AddForeignKey
ALTER TABLE "public"."competitor_research" ADD CONSTRAINT "competitor_research_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
