-- Add missing columns to ab_tests table to match Prisma schema
ALTER TABLE "ab_tests" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "ab_tests" ADD COLUMN IF NOT EXISTS "meta_ad_set_id" TEXT;
ALTER TABLE "ab_tests" ADD COLUMN IF NOT EXISTS "budget" DOUBLE PRECISION;
ALTER TABLE "ab_tests" ADD COLUMN IF NOT EXISTS "objective" TEXT;
ALTER TABLE "ab_tests" ADD COLUMN IF NOT EXISTS "audience" JSONB;
ALTER TABLE "ab_tests" ADD COLUMN IF NOT EXISTS "duration_days" INTEGER;
ALTER TABLE "ab_tests" ADD COLUMN IF NOT EXISTS "winner_creative_id" TEXT;
ALTER TABLE "ab_tests" ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMP;
ALTER TABLE "ab_tests" ADD COLUMN IF NOT EXISTS "end_date" TIMESTAMP;
