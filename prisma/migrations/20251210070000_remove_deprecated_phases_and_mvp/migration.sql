/*
  Warnings:

  - You are about to drop the `mvp` table. If the table is not empty, all the data it contains will be lost.
  - The values [ARCHITECTURE,DEVELOPMENT] on the enum `ChatPhase` will be removed. If these variants are still used in the database, this will fail.

*/

-- Step 1: Update any existing records using deprecated phases to REQUIREMENT
UPDATE "public"."chat" SET "phase" = 'REQUIREMENT'
WHERE "phase" IN ('ARCHITECTURE', 'DEVELOPMENT');

UPDATE "public"."competitor_research" SET "phase" = 'REQUIREMENT'
WHERE "phase" IN ('ARCHITECTURE', 'DEVELOPMENT');

-- Step 2: Drop the mvp table
DROP TABLE IF EXISTS "public"."mvp";

-- Step 3: Create a new enum with only REQUIREMENT
CREATE TYPE "public"."ChatPhase_new" AS ENUM ('REQUIREMENT');

-- Step 4: Drop default values before type change
ALTER TABLE "public"."competitor_research"
  ALTER COLUMN "phase" DROP DEFAULT;

-- Step 5: Alter columns to use the new enum
ALTER TABLE "public"."chat"
  ALTER COLUMN "phase" TYPE "public"."ChatPhase_new"
  USING ("phase"::text::"public"."ChatPhase_new");

ALTER TABLE "public"."competitor_research"
  ALTER COLUMN "phase" TYPE "public"."ChatPhase_new"
  USING ("phase"::text::"public"."ChatPhase_new");

-- Step 6: Restore default values with new type
ALTER TABLE "public"."competitor_research"
  ALTER COLUMN "phase" SET DEFAULT 'REQUIREMENT'::"public"."ChatPhase_new";

-- Step 5: Drop the old enum
DROP TYPE "public"."ChatPhase";

-- Step 6: Rename the new enum to the original name
ALTER TYPE "public"."ChatPhase_new" RENAME TO "ChatPhase";
