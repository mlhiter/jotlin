/*
  Warnings:

  - You are about to drop the `chat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `competitor_research` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ChatType" AS ENUM ('PROJECT', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "public"."MemberRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- DropForeignKey
ALTER TABLE "public"."chat" DROP CONSTRAINT "chat_parentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chat" DROP CONSTRAINT "chat_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."competitor_research" DROP CONSTRAINT "competitor_research_chatId_fkey";

-- DropForeignKey
ALTER TABLE "public"."message" DROP CONSTRAINT "message_chatId_fkey";

-- DropTable
DROP TABLE "public"."chat";

-- DropTable
DROP TABLE "public"."competitor_research";

-- DropTable
DROP TABLE "public"."message";

-- DropEnum
DROP TYPE "public"."ChatPhase";

-- CreateTable
CREATE TABLE "public"."workspace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'My Workspace',
    "icon" TEXT DEFAULT '💼',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT DEFAULT '📁',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "shareConfig" JSONB,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "documentType" TEXT NOT NULL DEFAULT 'Custom',
    "icon" TEXT DEFAULT '📄',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastEditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
    "sourceMessageId" TEXT,
    "generationPrompt" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "shareConfig" JSONB,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_version" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_thread" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "documentId" TEXT,
    "title" TEXT DEFAULT 'New Conversation',
    "type" "public"."ChatType" NOT NULL DEFAULT 'PROJECT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chat_thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_message" (
    "id" TEXT NOT NULL,
    "chatThreadId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "metadata" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#808080',
    "icon" TEXT,
    "isPreset" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_member" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."MemberRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspace_userId_isDeleted_idx" ON "public"."workspace"("userId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "project_shareToken_key" ON "public"."project"("shareToken");

-- CreateIndex
CREATE INDEX "project_workspaceId_isDeleted_idx" ON "public"."project"("workspaceId", "isDeleted");

-- CreateIndex
CREATE INDEX "project_shareToken_idx" ON "public"."project"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "document_shareToken_key" ON "public"."document"("shareToken");

-- CreateIndex
CREATE INDEX "document_projectId_isDeleted_idx" ON "public"."document"("projectId", "isDeleted");

-- CreateIndex
CREATE INDEX "document_workspaceId_isDeleted_idx" ON "public"."document"("workspaceId", "isDeleted");

-- CreateIndex
CREATE INDEX "document_shareToken_idx" ON "public"."document"("shareToken");

-- CreateIndex
CREATE INDEX "document_isAIGenerated_idx" ON "public"."document"("isAIGenerated");

-- CreateIndex
CREATE INDEX "document_version_documentId_versionNumber_idx" ON "public"."document_version"("documentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "document_version_documentId_versionNumber_key" ON "public"."document_version"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX "chat_thread_projectId_isDeleted_idx" ON "public"."chat_thread"("projectId", "isDeleted");

-- CreateIndex
CREATE INDEX "chat_thread_documentId_isDeleted_idx" ON "public"."chat_thread"("documentId", "isDeleted");

-- CreateIndex
CREATE INDEX "chat_message_chatThreadId_order_idx" ON "public"."chat_message"("chatThreadId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "document_tag_name_key" ON "public"."document_tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_member_workspaceId_userId_key" ON "public"."workspace_member"("workspaceId", "userId");

-- AddForeignKey
ALTER TABLE "public"."workspace" ADD CONSTRAINT "workspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project" ADD CONSTRAINT "project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document" ADD CONSTRAINT "document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document" ADD CONSTRAINT "document_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_version" ADD CONSTRAINT "document_version_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_thread" ADD CONSTRAINT "chat_thread_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_thread" ADD CONSTRAINT "chat_thread_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_message" ADD CONSTRAINT "chat_message_chatThreadId_fkey" FOREIGN KEY ("chatThreadId") REFERENCES "public"."chat_thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_member" ADD CONSTRAINT "workspace_member_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_member" ADD CONSTRAINT "workspace_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
