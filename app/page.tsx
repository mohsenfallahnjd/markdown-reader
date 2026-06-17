"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface FileEntry {
  url: string;
  name: string;
  uploadedAt: string;
  size: number;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [active, setActive] = useState<FileEntry | null>(null);
  const [content, setContent] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files", { signal: AbortSignal.timeout(8000) });
      if (res.ok) setFiles(await res.json());
    } catch {}
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const openFile = useCallback(async (file: FileEntry) => {
    setActive(file);
    setLoading(true);
    setContent("");
    try {
      const res = await fetch(`/api/content?url=${encodeURIComponent(file.url)}`);
      setContent(await res.text());
    } catch {
      setContent("Failed to load file.");
    } finally {
      setLoading(false);
    }
  }, []);

  const upload = useCallback((file: File) => {
    if (!file.name.endsWith(".md")) {
      setError("Only .md files supported.");
      return;
    }
    setError("");
    setUploading(true);
    setUploadProgress(0);

    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadProgress(100);
        const entry: FileEntry = JSON.parse(xhr.responseText);
        await fetchFiles();
        openFile(entry);
      } else {
        setError("Upload failed.");
      }
      setUploading(false);
      setUploadProgress(0);
    };

    xhr.onerror = () => {
      setError("Upload failed.");
      setUploading(false);
      setUploadProgress(0);
    };

    xhr.send(form);
  }, [fetchFiles, openFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 280,
        flexShrink: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}>
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>MD Reader</span>
          </div>

          {/* Upload zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={{
              border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 8,
              padding: "14px 10px",
              textAlign: "center",
              cursor: "pointer",
              background: dragging ? "rgba(124,106,247,0.07)" : "transparent",
              transition: "all 0.15s",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".md"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
            />
            {uploading ? (
              <div style={{ width: "100%" }}>
                <div style={{ color: "var(--muted)", fontSize: "0.75rem", marginBottom: 8 }}>
                  Uploading… {uploadProgress}%
                </div>
                <div style={{ background: "var(--border)", borderRadius: 4, height: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${uploadProgress}%`,
                    background: "var(--accent)",
                    borderRadius: 4,
                    transition: "width 0.15s ease",
                  }} />
                </div>
              </div>
            ) : (
              <>
                <div style={{ color: "var(--accent)", marginBottom: 4 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline" }}>
                    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                </div>
                <div style={{ color: "var(--muted)", fontSize: "0.75rem" }}>Drop .md file or click</div>
              </>
            )}
          </div>
          {error && <div style={{ color: "#f87171", fontSize: "0.75rem", marginTop: 8 }}>{error}</div>}
        </div>

        {/* History */}
        <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
          {files.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: "0.8rem", padding: "16px", textAlign: "center" }}>
              No files yet
            </div>
          ) : (
            files.map((f) => (
              <button
                key={f.url}
                onClick={() => openFile(f)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 16px",
                  background: active?.url === f.url ? "rgba(124,106,247,0.12)" : "transparent",
                  border: "none",
                  borderLeft: `3px solid ${active?.url === f.url ? "var(--accent)" : "transparent"}`,
                  cursor: "pointer",
                  transition: "background 0.1s",
                  color: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (active?.url !== f.url) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (active?.url !== f.url) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <div style={{ color: active?.url === f.url ? "var(--accent-hover)" : "#ddd", fontSize: "0.85rem", fontWeight: 500, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.name}
                </div>
                <div style={{ color: "var(--muted)", fontSize: "0.72rem", display: "flex", gap: 8 }}>
                  <span>{formatDate(f.uploadedAt)}</span>
                  <span>·</span>
                  <span>{formatSize(f.size)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {active ? (
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px" }}>
            <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h1 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", marginBottom: 4 }}>{active.name}</h1>
                <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{formatDate(active.uploadedAt)} · {formatSize(active.size)}</div>
              </div>
              <a
                href={`/api/content?url=${encodeURIComponent(active.url)}`}
                download={active.name}
                style={{ color: "var(--accent)", fontSize: "0.8rem", textDecoration: "none", flexShrink: 0, paddingTop: 4 }}
              >
                Download
              </a>
            </div>
            {loading ? (
              <div style={{ color: "var(--muted)", textAlign: "center", paddingTop: 80 }}>Loading…</div>
            ) : (
              <div className="prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 16 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Upload or select a file to read</p>
          </div>
        )}
      </main>
    </div>
  );
}
