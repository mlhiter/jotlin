-- AlterTable
ALTER TABLE "public"."feedback" DROP COLUMN "status";

-- Drop enum if not used elsewhere
DROP TYPE "public"."FeedbackStatus";
