-- AlterTable
ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "privacy_level" TEXT NOT NULL DEFAULT 'standard';

-- AlterTable
ALTER TABLE "segments" ADD COLUMN "previous_target_text" TEXT NOT NULL DEFAULT '';
ALTER TABLE "segments" ADD COLUMN "review_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "segments" ADD COLUMN "reviewed_by" TEXT;
ALTER TABLE "segments" ADD COLUMN "reviewed_at" TIMESTAMP(3);
ALTER TABLE "segments" ADD COLUMN "ai_score" INTEGER;
ALTER TABLE "segments" ADD COLUMN "ai_score_reason" TEXT;
ALTER TABLE "segments" ADD COLUMN "ai_scored_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "qa_rules" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "wrong" TEXT NOT NULL,
    "correct" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qa_rules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "qa_rules" ADD CONSTRAINT "qa_rules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
