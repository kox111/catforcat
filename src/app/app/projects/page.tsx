"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import NewProjectModal from "@/components/NewProjectModal";
import TaskBoard from "@/components/TaskBoard";
import PrivacySelector, { PrivacyBadge } from "@/components/PrivacySelector";
import ProjectContextMenu from "@/components/ProjectContextMenu";
import type { PrivacyLevel } from "@/lib/privacy";

interface ProjectSummary {
  id: string;
  name: string;
  srcLang: string;
  tgtLang: string;
  sourceFile: string | null;
  fileFormat: string | null;
  status: string;
  privacyLevel: string;
  createdAt: string;
  totalSegments: number;
  confirmedSegments: number;
  progress: number;
}

const LANG_LABELS: Record<string, string> = {
  en: "English",
  "en-US": "English (US)",
  "en-GB": "English (UK)",
  "en-AU": "English (AU)",
  "en-CA": "English (CA)",
  es: "Español",
  "es-ES": "Español (ES)",
  "es-419": "Español (LATAM)",
  "es-MX": "Español (MX)",
  "es-PE": "Español (PE)",
  "es-AR": "Español (AR)",
  "es-CO": "Español (CO)",
  "es-CL": "Español (CL)",
  fr: "Français",
  "fr-FR": "Français (FR)",
  "fr-CA": "Français (CA)",
  "fr-BE": "Français (BE)",
  de: "Deutsch",
  "de-DE": "Deutsch (DE)",
  "de-AT": "Deutsch (AT)",
  "de-CH": "Deutsch (CH)",
  pt: "Português",
  "pt-BR": "Português (BR)",
  "pt-PT": "Português (PT)",
  it: "Italiano",
  "it-IT": "Italiano (IT)",
  "it-CH": "Italiano (CH)",
  zh: "中文",
  "zh-CN": "中文 (简体)",
  "zh-TW": "中文 (繁體)",
  ja: "日本語",
  "ja-JP": "日本語",
  ko: "한국어",
  "ko-KR": "한국어",
  "ar-EG": "العربية (EG)",
  "ar-SA": "العربية (SA)",
  "ru-RU": "Русский",
  "nl-NL": "Nederlands (NL)",
  "nl-BE": "Nederlands (BE)",
  "pl-PL": "Polski",
  "tr-TR": "Türkçe",
};

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          Loading projects...
        </div>
      }
    >
      <ProjectsContent />
    </Suspense>
  );
}

function ProjectsContent() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [privacyTarget, setPrivacyTarget] = useState<{
    id: string;
    level: PrivacyLevel;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    projectId: string;
    projectName: string;
    x: number;
    y: number;
  } | null>(null);
  const [myAssignments, setMyAssignments] = useState<Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    classroomName: string;
    submissions: Array<{
      id: string;
      projectId: string;
      status: string;
      progressPct: number;
      submittedAt: string | null;
      gradeValue: number | null;
      student: { name: string | null; username: string | null };
    }>;
  }>>([]);

  // Open new project modal from TopBar ?new=true link
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowNewProject(true);
      // Clean the URL
      router.replace("/app/projects", { scroll: false });
    }
  }, [searchParams, router]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyAssignments = useCallback(async () => {
    try {
      const res = await fetch("/api/my-assignments");
      if (res.ok) {
        const data = await res.json();
        setMyAssignments(data.assignments || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    } else if (authStatus === "authenticated") {
      fetchProjects();
      fetchMyAssignments();
    }
  }, [authStatus, router, fetchProjects, fetchMyAssignments]);

  if (authStatus === "loading" || loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          color: "var(--text-muted)",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: 24, flex: 1, minHeight: 0, overflowY: "auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          Projects
        </h1>
        <button
          onClick={() => setShowNewProject(true)}
          style={{
            padding: "8px 20px",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "var(--font-ui-family)",
            background: "var(--accent-soft)",
            color: "var(--text-primary)",
            border: "0.5px solid var(--border)",
            backdropFilter: "blur(4px)",
            cursor: "pointer",
            transition: "background 150ms, border-color 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--accent-soft)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
          data-tour="new-project"
        >
          + New Project
        </button>
      </div>

      {/* My Assignments (student kanban) */}
      {myAssignments.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 500,
              marginBottom: 12,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            My Assignments
          </h2>
          <TaskBoard
            assignments={myAssignments.map(a => ({
              id: a.id,
              title: `${a.title} · ${a.classroomName}`,
              status: a.status,
              dueDate: a.dueDate,
              submissions: a.submissions,
            }))}
            totalStudents={1}
          />
        </div>
      )}

      {/* Recent Projects Widget */}
      {projects.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 500,
              marginBottom: 8,
              color: "var(--text-muted)",
            }}
          >
            Recent
          </h2>
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {projects.slice(0, 3).map((p) => (
              <Link
                key={`recent-${p.id}`}
                href={`/app/projects/${p.id}`}
                style={{
                  flexShrink: 0,
                  borderRadius: 9999,
                  padding: "6px 14px",
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                  transition: "border-color 150ms, background 150ms",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  maxWidth: 260,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--bg-panel)";
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    flexShrink: 0,
                  }}
                >
                  {p.progress}%
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Welcome, {session?.user?.name || session?.user?.email}. No projects
          yet. Create your first project to start translating.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {projects.map((project, idx) => (
            <Link
              key={project.id}
              href={`/app/projects/${project.id}`}
              data-tour={idx === 0 ? "first-project" : undefined}
              className="glass-container"
              style={{
                display: "block",
                borderRadius: "var(--radius)",
                padding: 16,
                background: "var(--bg-card)",
                textDecoration: "none",
                transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({
                  projectId: project.id,
                  projectName: project.name,
                  x: e.clientX,
                  y: e.clientY,
                });
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--glass-active-shadow)";
                e.currentTarget.style.borderColor = "var(--glass-active-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--glass-container-shadow)";
                e.currentTarget.style.borderColor = "var(--glass-container-border)";
              }}
            >
              <h3
                style={{
                  fontWeight: 500,
                  marginBottom: 4,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 14,
                }}
              >
                {project.name}
              </h3>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  {LANG_LABELS[project.srcLang] || project.srcLang} →{" "}
                  {LANG_LABELS[project.tgtLang] || project.tgtLang}
                </p>
                <PrivacyBadge
                  level={(project.privacyLevel || "standard") as PrivacyLevel}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPrivacyTarget({
                      id: project.id,
                      level: (project.privacyLevel ||
                        "standard") as PrivacyLevel,
                    });
                  }}
                />
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    width: "100%",
                    height: 6,
                    borderRadius: 3,
                    background: "var(--bg-deep)",
                  }}
                >
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: `${project.progress}%`,
                      background:
                        project.progress === 100
                          ? "var(--green)"
                          : "var(--accent)",
                      transition: "width 300ms",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {project.confirmedSegments}/{project.totalSegments} segments
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  {project.progress}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {privacyTarget && (
        <PrivacySelector
          projectId={privacyTarget.id}
          currentLevel={privacyTarget.level}
          onClose={() => setPrivacyTarget(null)}
          onChanged={(newLevel) => {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === privacyTarget.id
                  ? { ...p, privacyLevel: newLevel }
                  : p,
              ),
            );
          }}
        />
      )}

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={(projectId) => {
            setShowNewProject(false);
            router.push(`/app/projects/${projectId}`);
          }}
        />
      )}

      {contextMenu && (
        <ProjectContextMenu
          projectId={contextMenu.projectId}
          projectName={contextMenu.projectName}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRename={(id, newName) => {
            setProjects((prev) =>
              prev.map((p) => (p.id === id ? { ...p, name: newName } : p)),
            );
          }}
          onDelete={(id) => {
            setProjects((prev) => prev.filter((p) => p.id !== id));
          }}
        />
      )}
    </div>
  );
}
