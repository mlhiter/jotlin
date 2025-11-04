-- Refactor auth system: Remove unused tables and optimize Account structure
-- This migration was applied manually, this file serves as documentation

-- Note: The actual changes were already applied to the database via scripts/migrate-user-data.sql
-- This migration file is for record-keeping and future deployments

-- Summary of changes:
-- 1. Removed Session table (unused - using JWT instead)
-- 2. Removed Verification table (unused - OAuth flow only)
-- 3. Refactored Account table:
--    - Removed: accessToken, refreshToken, idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password
--    - Renamed: accountId -> providerAccountId, providerId -> provider
--    - Added: unique constraint on (userId, provider)
--    - Added: index on userId
-- 4. Updated User table:
--    - Changed id to use UUID with @default(uuid())
--    - Changed emailVerified default to true
-- 5. Migrated existing user data from OAuth ID to UUID
-- 6. Created Account records for existing users

-- This is a placeholder migration as changes were already applied
SELECT 1;
