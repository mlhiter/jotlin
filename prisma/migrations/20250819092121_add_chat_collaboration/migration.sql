-- CreateTable
CREATE TABLE "public"."chat_collaborator" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_collaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_invitation" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "collaboratorEmail" TEXT NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "isReplied" BOOLEAN NOT NULL DEFAULT false,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_collaborator_userEmail_idx" ON "public"."chat_collaborator"("userEmail");

-- CreateIndex
CREATE UNIQUE INDEX "chat_collaborator_chatId_userEmail_key" ON "public"."chat_collaborator"("chatId", "userEmail");

-- CreateIndex
CREATE INDEX "chat_invitation_chatId_idx" ON "public"."chat_invitation"("chatId");

-- CreateIndex
CREATE INDEX "chat_invitation_userEmail_idx" ON "public"."chat_invitation"("userEmail");

-- CreateIndex
CREATE INDEX "chat_invitation_collaboratorEmail_idx" ON "public"."chat_invitation"("collaboratorEmail");

-- AddForeignKey
ALTER TABLE "public"."chat_collaborator" ADD CONSTRAINT "chat_collaborator_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_invitation" ADD CONSTRAINT "chat_invitation_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_invitation" ADD CONSTRAINT "chat_invitation_collaboratorEmail_fkey" FOREIGN KEY ("collaboratorEmail") REFERENCES "public"."user"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_invitation" ADD CONSTRAINT "chat_invitation_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "public"."user"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
