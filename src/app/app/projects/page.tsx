"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import NewProjectModal from "@/components/NewProjectModal";

interface ProjectSummary {
  id: string;
  name: string;
  srcLang: string;
  tgtLang: string;
  sourceFile: string | null;
  fileFormat: string | null;
  status: string;
  createdAt: string;
  totalSegments: number;
  confirmedSegments: number;
  progress: number;
}

const LANG_LABELS: Record<string, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  it: "Italiano",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
};

export default function ProjectsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);

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

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    } else if (authStatus === "authenticated") {
      fetchProjects();
    }
  }, [authStatus, router, fetchProjects]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ color: "var(--text-muted)" }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Projects
        </h1>
        <button
          onClick={() => setShowNewProject(true)}
          className="px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          + New Project
        </button>
      </div>

      {/* F7: Recent Projects Widget */}
      {projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
            Recent
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {projects.slice(0, 3).map((p) => (
              <Link
                key={`recent-${p.id}`}
                href={`/app/projects/${p.id}`}
                className="shrink-0 rounded-lg px-4 py-3 transition-colors"
                style={{
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border)",
                  minWidth: "200px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {p.name}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {p.progress}% — {LANG_LABELS[p.srcLang]?.slice(0, 2) || p.srcLang}→{LANG_LABELS[p.tgtLang]?.slice(0, 2) || p.tgtLang}
                </div>
                <div className="w-full h-1 rounded-full mt-2" style={{ background: "var(--bg-deep)" }}>
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${p.progress}%`,
                      background: p.progress === 100 ? "var(--green)" : "var(--accent)",
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Welcome, {session?.user?.name || session?.user?.email}. No projects yet. Create your first project to start translating.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/app/projects/${project.id}`}
              className="block rounded-lg p-4 transition-colors"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-focus)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <h3 className="font-medium mb-1 truncate" style={{ color: "var(--text-primary)" }}>
                {project.name}
              </h3>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                {LANG_LABELS[project.srcLang] || project.srcLang} → {LANG_LABELS[project.tgtLang] || project.tgtLang}
              </p>

              {/* Progress bar */}
              <div className="mb-2">
                <div
                  className="w-full h-1.5 rounded-full"
                  style={{ background: "var(--bg-deep)" }}
                >
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${project.progress}%`,
                      background: project.progress === 100 ? "var(--green)" : "var(--accent)",
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {project.confirmedSegments}/{project.totalSegments} segments
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {project.progress}%
                </span>
              </div>
            </Link>
          ))}
        </div>
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
    </div>
  );
}
