"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface GlossaryTerm {
  id: string;
  sourceTerm: string;
  targetTerm: string;
  srcLang: string;
  tgtLang: string;
  note: string;
  createdAt: string;
}

const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

const LANG_LABELS: Record<string, string> = {
  en: "EN", es: "ES", fr: "FR", de: "DE", pt: "PT",
  it: "IT", zh: "ZH", ja: "JA", ko: "KO",
};

export default function GlossaryPage() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newSourceTerm, setNewSourceTerm] = useState("");
  const [newTargetTerm, setNewTargetTerm] = useState("");
  const [newSrcLang, setNewSrcLang] = useState("en");
  const [newTgtLang, setNewTgtLang] = useState("es");
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  // G1: Import from project
  const [showProjectImport, setShowProjectImport] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string; srcLang: string; tgtLang: string }[]>([]);
  const [importingFromProject, setImportingFromProject] = useState(false);

  const handleImportCSV = async (file: File) => {
    setImportingCsv(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/glossary/import", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setImportResult(`Imported ${data.imported} terms (${data.skipped} duplicates skipped)`);
        fetchTerms();
      } else {
        setImportResult(`Error: ${data.error}`);
      }
    } catch {
      setImportResult("Import failed");
    } finally {
      setImportingCsv(false);
      if (csvFileInputRef.current) csvFileInputRef.current.value = "";
    }
  };

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    try {
      const url = searchQuery.trim()
        ? `/api/glossary?q=${encodeURIComponent(searchQuery.trim())}`
        : "/api/glossary";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTerms(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchTerms, 300);
    return () => clearTimeout(timer);
  }, [fetchTerms]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceTerm.trim() || !newTargetTerm.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTerm: newSourceTerm.trim(),
          targetTerm: newTargetTerm.trim(),
          srcLang: newSrcLang,
          tgtLang: newTgtLang,
          note: newNote.trim(),
        }),
      });
      if (res.ok) {
        setNewSourceTerm("");
        setNewTargetTerm("");
        setNewNote("");
        setShowAddForm(false);
        fetchTerms();
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleting) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/glossary?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTerms((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  // G1: Fetch projects for import selector
  useEffect(() => {
    if (showProjectImport && projects.length === 0) {
      fetch("/api/projects")
        .then((r) => r.ok ? r.json() : [])
        .then((data: { id: string; name: string; srcLang: string; tgtLang: string }[]) => setProjects(data))
        .catch(() => {});
    }
  }, [showProjectImport, projects.length]);

  const handleImportFromProject = async (projectId: string) => {
    setImportingFromProject(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/glossary/from-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(`Imported ${data.imported} terms from project (${data.skipped} duplicates skipped)`);
        setShowProjectImport(false);
        fetchTerms();
      } else {
        setImportResult(`Error: ${data.error}`);
      }
    } catch {
      setImportResult("Import from project failed");
    } finally {
      setImportingFromProject(false);
    }
  };

  const inputStyle = {
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Glossary
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {terms.length} {terms.length === 1 ? "term" : "terms"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* G1: Import from Project */}
          <button
            onClick={() => setShowProjectImport((v) => !v)}
            className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
            style={{
              background: showProjectImport ? "var(--accent)" : "var(--bg-card)",
              color: showProjectImport ? "#fff" : "var(--text-secondary)",
              border: showProjectImport ? "none" : "1px solid var(--border)",
            }}
          >
            {showProjectImport ? "Cancel" : "From Project"}
          </button>

          {/* Import CSV */}
          <input
            ref={csvFileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportCSV(file);
            }}
          />
          <button
            onClick={() => csvFileInputRef.current?.click()}
            disabled={importingCsv}
            className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              opacity: importingCsv ? 0.6 : 1,
            }}
          >
            {importingCsv ? "Importing..." : "Import CSV"}
          </button>

          {/* Export CSV */}
          {terms.length > 0 && (
            <button
              onClick={async () => {
                setExportingCsv(true);
                try {
                  const res = await fetch("/api/glossary/export");
                  if (res.ok) {
                    const blob = await res.blob();
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = "glossary.csv";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(a.href);
                  }
                } catch {
                  // silent
                } finally {
                  setExportingCsv(false);
                }
              }}
              disabled={exportingCsv}
              className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                opacity: exportingCsv ? 0.6 : 1,
              }}
            >
              {exportingCsv ? "Exporting..." : "Export CSV"}
            </button>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
            style={{
              background: showAddForm ? "var(--bg-card)" : "var(--accent)",
              color: showAddForm ? "var(--text-secondary)" : "#fff",
              border: showAddForm ? "1px solid var(--border)" : "none",
            }}
          >
            {showAddForm ? "Cancel" : "+ Add Term"}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          style={{
            marginBottom: "24px",
            padding: "16px",
            borderRadius: "6px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                Source Term
              </label>
              <input
                type="text"
                value={newSourceTerm}
                onChange={(e) => setNewSourceTerm(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-sm outline-none"
                style={inputStyle}
                placeholder="e.g. database"
                required
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                Target Term
              </label>
              <input
                type="text"
                value={newTargetTerm}
                onChange={(e) => setNewTargetTerm(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-sm outline-none"
                style={inputStyle}
                placeholder="e.g. base de datos"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                Source Language
              </label>
              <select
                value={newSrcLang}
                onChange={(e) => setNewSrcLang(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-sm outline-none"
                style={inputStyle}
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                Target Language
              </label>
              <select
                value={newTgtLang}
                onChange={(e) => setNewTgtLang(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-sm outline-none"
                style={inputStyle}
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                Note (optional)
              </label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-sm outline-none"
                style={inputStyle}
                placeholder="Usage context..."
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-1.5 rounded text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {submitting ? "Adding..." : "Add Term"}
          </button>
        </form>
      )}

      {/* Import result toast */}
      {importResult && (
        <div
          style={{
            marginBottom: "16px",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "8px",
            paddingBottom: "8px",
            borderRadius: "6px",
            fontSize: "12px",
            background: importResult.startsWith("Error") ? "var(--red, #ef4444)" : "var(--accent)",
            color: "#fff",
          }}
        >
          {importResult}
          <button onClick={() => setImportResult(null)} style={{ marginLeft: "8px", fontWeight: "bold" }}>×</button>
        </div>
      )}

      {/* G1: Project import selector */}
      {showProjectImport && (
        <div
          style={{
            marginBottom: "16px",
            padding: "16px",
            borderRadius: "6px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <h3 className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
            Select a project to extract terms from:
          </h3>
          {projects.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading projects...</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleImportFromProject(p.id)}
                  disabled={importingFromProject}
                  className="text-left px-3 py-2 rounded text-sm transition-colors"
                  style={{
                    background: "var(--bg-deep)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    opacity: importingFromProject ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  {p.name} <span style={{ color: "var(--text-muted)" }}>({p.srcLang}→{p.tgtLang})</span>
                </button>
              ))}
            </div>
          )}
          {importingFromProject && (
            <p className="text-xs mt-2" style={{ color: "var(--accent)" }}>Analyzing project...</p>
          )}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search glossary..."
          className="w-full px-3 py-2 rounded text-sm outline-none"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-focus)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Terms list */}
      {loading ? (
        <div className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          Loading...
        </div>
      ) : terms.length === 0 ? (
        <div className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          {searchQuery
            ? "No matching terms found"
            : "Your glossary is empty. Add terms to ensure consistent translations."}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {terms.map((term) => (
            <div
              key={term.id}
              className="rounded px-4 py-3 flex items-start justify-between gap-4"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: "var(--bg-deep)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {LANG_LABELS[term.srcLang] || term.srcLang} → {LANG_LABELS[term.tgtLang] || term.tgtLang}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {term.sourceTerm}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>→</span>
                  <span className="text-sm" style={{ color: "var(--accent)" }}>
                    {term.targetTerm}
                  </span>
                </div>
                {term.note && (
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {term.note}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(term.id)}
                disabled={deleting === term.id}
                className="text-xs px-2 py-1 rounded transition-colors shrink-0"
                style={{ color: "var(--text-muted)", border: "1px solid transparent" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--red, #ef4444)";
                  e.currentTarget.style.borderColor = "var(--red, #ef4444)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                {deleting === term.id ? "..." : "×"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
