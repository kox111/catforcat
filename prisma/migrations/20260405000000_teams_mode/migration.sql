-- Teams Mode Migration (Fase 23)

-- New tables
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'azul',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stages" TEXT NOT NULL,
    "owner_id" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "segment_assignments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "range_start" INTEGER,
    "range_end" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "segment_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_presence" (
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_segment_position" INTEGER NOT NULL,
    "last_heartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_presence_pkey" PRIMARY KEY ("project_id","user_id")
);

-- New columns on projects
ALTER TABLE "projects" ADD COLUMN "team_id" TEXT;
ALTER TABLE "projects" ADD COLUMN "workflow_template_id" TEXT;
ALTER TABLE "projects" ADD COLUMN "pipeline_checkpoints" TEXT NOT NULL DEFAULT '[]';

-- New columns on segments
ALTER TABLE "segments" ADD COLUMN "workflow_stage" TEXT NOT NULL DEFAULT 'translating';
ALTER TABLE "segments" ADD COLUMN "confirmed_by" TEXT;
ALTER TABLE "segments" ADD COLUMN "confirmed_at" TIMESTAMP(3);
ALTER TABLE "segments" ADD COLUMN "needs_recheck" BOOLEAN NOT NULL DEFAULT false;

-- Unique constraints
CREATE UNIQUE INDEX "team_members_team_id_user_id_key" ON "team_members"("team_id", "user_id");
CREATE UNIQUE INDEX "team_members_team_id_color_key" ON "team_members"("team_id", "color");
CREATE UNIQUE INDEX "segment_assignments_project_id_user_id_key" ON "segment_assignments"("project_id", "user_id");

-- Foreign keys
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "segment_assignments" ADD CONSTRAINT "segment_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "segment_assignments" ADD CONSTRAINT "segment_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_presence" ADD CONSTRAINT "user_presence_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_presence" ADD CONSTRAINT "user_presence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default workflow templates
INSERT INTO "workflow_templates" ("id", "name", "stages", "is_default", "created_at") VALUES
    (gen_random_uuid(), 'Simple', '["translator","reviewer"]', true, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Standard', '["translator","reviewer","proofreader"]', true, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Full', '["translator","reviewer","proofreader","dtp"]', true, CURRENT_TIMESTAMP);
