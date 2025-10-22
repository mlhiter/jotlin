-- AlterTable
ALTER TABLE "public"."mvp"
  ALTER COLUMN "sandboxId" DROP NOT NULL,
  ALTER COLUMN "previewUrl" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "vercelDeploymentId" TEXT,
  ADD COLUMN IF NOT EXISTS "vercelUrl" TEXT;

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "mvp_vercelDeploymentId_key" ON "public"."mvp"("vercelDeploymentId");

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "mvp_vercelDeploymentId_idx" ON "public"."mvp"("vercelDeploymentId");
