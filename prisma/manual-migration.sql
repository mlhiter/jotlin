-- Manual migration for competitive analysis tables

-- Update ChatPhase enum
ALTER TYPE "ChatPhase" RENAME TO "ChatPhase_old";
CREATE TYPE "ChatPhase" AS ENUM ('DISCOVERY', 'FEATURE_BENCHMARK', 'MARKET_POSITIONING', 'RECOMMENDATION');
ALTER TABLE "chat" ALTER COLUMN "phase" TYPE "ChatPhase" USING "phase"::text::"ChatPhase";
DROP TYPE "ChatPhase_old";

-- Add productIdea column to Chat
ALTER TABLE "chat" ADD COLUMN IF NOT EXISTS "productIdea" TEXT;

-- Create Competitor table
CREATE TABLE IF NOT EXISTS "competitor" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "website" TEXT,
  "description" TEXT,
  "logo" TEXT,
  "foundedYear" INTEGER,
  "funding" TEXT,
  "teamSize" TEXT,
  "pricing" JSONB,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create CompetitorFeature table
CREATE TABLE IF NOT EXISTS "competitor_feature" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "competitorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "quality" TEXT,
  "description" TEXT,
  "isCore" BOOLEAN NOT NULL DEFAULT false,
  "isDifferentiator" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "competitor_feature_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create CompetitorAnalysis table
CREATE TABLE IF NOT EXISTS "competitor_analysis" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "chatId" TEXT NOT NULL,
  "competitorId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "reasoning" TEXT,
  "marketInsights" JSONB,
  "swotAnalysis" JSONB,
  "positioningMap" JSONB,
  "recommendations" JSONB,
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "competitor_analysis_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "competitor_analysis_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
