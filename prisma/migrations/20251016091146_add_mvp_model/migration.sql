-- CreateTable
CREATE TABLE "public"."mvp" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "sandboxId" TEXT NOT NULL,
    "previewUrl" TEXT NOT NULL,
    "files" JSONB NOT NULL,
    "requirementSnapshot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mvp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mvp_chatId_key" ON "public"."mvp"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "mvp_sandboxId_key" ON "public"."mvp"("sandboxId");

-- CreateIndex
CREATE INDEX "mvp_chatId_idx" ON "public"."mvp"("chatId");

-- CreateIndex
CREATE INDEX "mvp_sandboxId_idx" ON "public"."mvp"("sandboxId");

-- AddForeignKey
ALTER TABLE "public"."mvp" ADD CONSTRAINT "mvp_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
