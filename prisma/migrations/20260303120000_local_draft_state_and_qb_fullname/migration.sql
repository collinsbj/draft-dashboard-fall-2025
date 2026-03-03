-- Clear QBs table (no production data), then restructure to use fullName
DELETE FROM "Qb";

-- Drop old unique constraint and columns from Qb
ALTER TABLE "Qb" DROP CONSTRAINT IF EXISTS "Qb_firstName_lastName_key";
ALTER TABLE "Qb" DROP COLUMN IF EXISTS "firstName";
ALTER TABLE "Qb" DROP COLUMN IF EXISTS "lastName";
ALTER TABLE "Qb" DROP COLUMN IF EXISTS "drafted";
ALTER TABLE "Qb" DROP COLUMN IF EXISTS "selected";
ALTER TABLE "Qb" DROP COLUMN IF EXISTS "sortOrder";
ALTER TABLE "Qb" DROP COLUMN IF EXISTS "notes";

-- Add fullName column
ALTER TABLE "Qb" ADD COLUMN "fullName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Qb" ALTER COLUMN "fullName" DROP DEFAULT;
CREATE UNIQUE INDEX "Qb_fullName_key" ON "Qb"("fullName");

-- Remove per-user columns from ReturningPlayer
ALTER TABLE "ReturningPlayer" DROP COLUMN IF EXISTS "favorite";
ALTER TABLE "ReturningPlayer" DROP COLUMN IF EXISTS "selected";
ALTER TABLE "ReturningPlayer" DROP COLUMN IF EXISTS "drafted";
ALTER TABLE "ReturningPlayer" DROP COLUMN IF EXISTS "rejected";
ALTER TABLE "ReturningPlayer" DROP COLUMN IF EXISTS "notes";

-- Remove per-user columns from Rookie
ALTER TABLE "Rookie" DROP COLUMN IF EXISTS "favorite";
ALTER TABLE "Rookie" DROP COLUMN IF EXISTS "selected";
ALTER TABLE "Rookie" DROP COLUMN IF EXISTS "drafted";
ALTER TABLE "Rookie" DROP COLUMN IF EXISTS "rejected";
ALTER TABLE "Rookie" DROP COLUMN IF EXISTS "notes";
