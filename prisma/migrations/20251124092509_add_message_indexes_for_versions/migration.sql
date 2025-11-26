-- CreateIndex
CREATE INDEX "message_chatId_createdAt_idx" ON "public"."message"("chatId", "createdAt");
