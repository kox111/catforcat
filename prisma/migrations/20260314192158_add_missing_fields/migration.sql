-- AlterTable
ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;

-- CreateTable
CREATE TABLE "qa_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "wrong" TEXT NOT NULL,
    "correct" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qa_rules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "src_lang" TEXT NOT NULL,
    "tgt_lang" TEXT NOT NULL,
    "source_file" TEXT,
    "file_format" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "privacy_level" TEXT NOT NULL DEFAULT 'standard',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_projects" ("created_at", "file_format", "id", "name", "source_file", "src_lang", "status", "tgt_lang", "updated_at", "user_id") SELECT "created_at", "file_format", "id", "name", "source_file", "src_lang", "status", "tgt_lang", "updated_at", "user_id" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
CREATE TABLE "new_segments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "source_text" TEXT NOT NULL,
    "target_text" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'empty',
    "tm_match_pct" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "previous_target_text" TEXT NOT NULL DEFAULT '',
    "review_status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" DATETIME,
    "ai_score" INTEGER,
    "ai_score_reason" TEXT,
    "ai_scored_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "segments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_segments" ("created_at", "id", "metadata", "position", "project_id", "source_text", "status", "target_text", "tm_match_pct", "updated_at") SELECT "created_at", "id", "metadata", "position", "project_id", "source_text", "status", "target_text", "tm_match_pct", "updated_at" FROM "segments";
DROP TABLE "segments";
ALTER TABLE "new_segments" RENAME TO "segments";
CREATE UNIQUE INDEX "segments_project_id_position_key" ON "segments"("project_id", "position");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
