"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  BrainCircuit, FileText, Loader2, UploadCloud,
  Sun, Moon, Menu, X, Clock, Trash2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { MarksOption, UploadKind } from "@/types";

const uploadFields: Array<{ id: UploadKind; title: string; description: string }> = [
  { id: "notes", title: "Notes", description: "Class notes or chapter PDFs" },
  { id: "questionBank", title: "Question Bank", description: "Practice sets and topic-wise questions" },
  { id: "previousYearQuestions", title: "Previous Year Questions", description: "Past papers for exam pattern" }
];

type HistoryEntry = {
  id: string;
  title: string;
  result: string;
  marks: number;
  includeDiagrams: boolean;
  createdAt: string;
};

interface DashboardFormProps {
  user?: User | null;
  onLogout?: () => void;
}

export function DashboardForm({ user, onLogout }: DashboardFormProps) {
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "study-materials";
  const [files, setFiles] = useState<Partial<Record<UploadKind, File>>>({});
  const [marks, setMarks] = useState<MarksOption>(5);
  // Diagrams are always included now — the toggle was removed, so this stays a constant
  // rather than a piece of UI state. Change to `false` here if you want them off by default.
  const includeDiagrams = true;
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const storageKey = user ? `eduforge_history_${user.id}` : null;
  const selectedCount = useMemo(() => Object.values(files).filter(Boolean).length, [files]);

  useEffect(() => {
    if (!storageKey) { setHistory([]); return; }
    try {
      const stored = window.localStorage.getItem(storageKey);
      setHistory(stored ? (JSON.parse(stored) as HistoryEntry[]) : []);
    } catch { setHistory([]); }
  }, [storageKey]);

  function handleFileChange(kind: UploadKind, event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    setFiles((current) => ({ ...current, [kind]: nextFile }));
    setError("");
  }

  function handleHistoryClick(entry: HistoryEntry) {
    setSelectedEntry(entry);
    setResult(entry.result);
    setStatus("");
    setError("");
  }

  function handleClearHistory() {
    setHistory([]);
    setSelectedEntry(null);
    if (storageKey) window.localStorage.removeItem(storageKey);
  }

  function handleNewChat() {
    setSelectedEntry(null);
    setResult("");
    setStatus("");
    setError("");
    setFiles({});
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setStatus(""); setResult(""); setSelectedEntry(null);
    if (selectedCount === 0) { setError("Upload at least one file to generate."); return; }
    setPending(true);

    try {
      const uploadedPaths: Partial<Record<UploadKind, string>> = {};
      for (const [kind, file] of Object.entries(files) as Array<[UploadKind, File | undefined]>) {
        if (!file) continue;
        const path = `${uuidv4()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName).upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        if (!uploadData) throw new Error(`Upload returned no data for ${kind}.`);
        const returnedPath = (uploadData as any)?.path ?? (uploadData as any)?.Key ?? path;
        uploadedPaths[kind] = returnedPath;
      }

      const fileNames: Partial<Record<UploadKind, string>> = {};
      for (const [kind, file] of Object.entries(files) as Array<[UploadKind, File | undefined]>) {
        if (!file) continue;
        fileNames[kind] = file.name;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks, includeDiagrams, files: uploadedPaths, fileNames })
      });

      const data = (await response.json()) as { message?: string; result?: string; status?: string };
      if (!response.ok) throw new Error(data.message ?? "Generation failed.");

      const outputText = data.result ?? data.message ?? "";
      const fileList = Object.values(files).filter(Boolean).map(f => f!.name).join(", ");
      const newEntry: HistoryEntry = {
        id: uuidv4(),
        title: fileList || `Generated ${marks}-mark paper`,
        result: outputText,
        marks,
        includeDiagrams,
        createdAt: new Date().toISOString()
      };

      const nextHistory = [newEntry, ...history].slice(0, 20);
      setHistory(nextHistory);
      if (storageKey) window.localStorage.setItem(storageKey, JSON.stringify(nextHistory));

      setStatus(data.message ?? "Generation completed.");
      setResult(outputText);
      setSelectedEntry(newEntry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setPending(false);
    }
  }

  const isDark = theme === "dark";

  return (
    <div className={`flex h-screen w-full overflow-hidden ${isDark ? "bg-[#0D1117] text-white" : "bg-gray-50 text-gray-900"}`}>

      {/* Sidebar */}
      <aside className={`flex flex-col transition-all duration-300 flex-shrink-0 ${sidebarOpen ? "w-64" : "w-0"} overflow-hidden ${isDark ? "bg-[#161B22] border-r border-white/10" : "bg-white border-r border-gray-200"}`}>
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
          <span className={`font-bold text-sm ${isDark ? "text-teal-400" : "text-teal-600"}`}>EduForge AI</span>
          <button onClick={() => setSidebarOpen(false)} className={`${isDark ? "text-slate-400 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleNewChat}
          className={`mx-3 mt-3 rounded-lg px-3 py-2 text-sm font-medium transition flex items-center gap-2 border ${isDark ? "bg-teal-400/10 text-teal-400 hover:bg-teal-400/20 border-teal-400/20" : "bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200"}`}
        >
          <BrainCircuit className="h-4 w-4" />
          New Generation
        </button>

        <div className="flex items-center justify-between px-3 pt-4 pb-1">
          <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-gray-400"}`}>History</span>
          {history.length > 0 && (
            <button onClick={handleClearHistory} className="text-slate-500 hover:text-red-400 transition">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {history.length === 0 ? (
            <p className={`px-2 py-3 text-xs ${isDark ? "text-slate-600" : "text-gray-400"}`}>No history yet.</p>
          ) : (
            history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleHistoryClick(entry)}
                className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition flex items-start gap-2 ${
                  selectedEntry?.id === entry.id
                    ? isDark ? "bg-white/10 text-white" : "bg-teal-50 text-teal-800"
                    : isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 opacity-50" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium">{entry.title}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-600" : "text-gray-400"}`}>
                    {entry.marks}m • {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {user && (
          <div className={`p-3 border-t space-y-2 ${isDark ? "border-white/10" : "border-gray-200"}`}>
            <p className={`text-xs truncate ${isDark ? "text-slate-500" : "text-gray-400"}`}>{user.email}</p>
            {onLogout && (
              <button
                onClick={onLogout}
                className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition ${isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-500 hover:bg-red-50"}`}
              >
                Logout
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Main Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top Bar */}
        <header className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0 ${isDark ? "border-white/10 bg-[#0D1117]" : "border-gray-200 bg-white"}`}>
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className={`${isDark ? "text-slate-400 hover:text-white" : "text-gray-500 hover:text-gray-900"} transition`}>
                <Menu className="h-5 w-5" />
              </button>
            )}
            <span className={`font-semibold text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}>
              {selectedEntry ? selectedEntry.title : "New Generation"}
            </span>
          </div>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`rounded-lg p-2 transition ${isDark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        {/* Output Area */}
        <div className="flex-1 overflow-y-auto">
          {result ? (
            <div className="max-w-3xl mx-auto px-6 py-8">
              <div className={`prose max-w-none ${isDark ? "prose-invert prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-li:text-slate-300 prose-code:text-teal-400 prose-code:bg-slate-900 prose-code:px-1 prose-code:rounded" : "prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700"}`}>
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
              <div className={`rounded-2xl p-4 ${isDark ? "bg-teal-400/10" : "bg-teal-50"}`}>
                <BrainCircuit className={`h-8 w-8 ${isDark ? "text-teal-400" : "text-teal-600"}`} />
              </div>
              <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>EduForge AI</h2>
              <p className={`text-sm text-center max-w-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                Upload your study materials below and generate VTU exam-ready answers instantly.
              </p>
            </div>
          )}
        </div>

        {/* Status / Error */}
        {(error || (status && !result)) && (
          <div className="px-4 py-2 max-w-3xl mx-auto w-full">
            {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>}
            {status && !error && <p className={`text-xs text-center ${isDark ? "text-slate-500" : "text-gray-400"}`}>{status}</p>}
          </div>
        )}

        {/* Input Form */}
        <div className={`border-t flex-shrink-0 ${isDark ? "border-white/10 bg-[#0D1117]" : "border-gray-200 bg-white"}`}>
          <form onSubmit={handleGenerate} className="max-w-3xl mx-auto px-4 py-4 space-y-3">

            {/* File Upload Row */}
            <div className="grid grid-cols-3 gap-2">
              {uploadFields.map((field) => (
                <label
                  key={field.id}
                  className={`cursor-pointer rounded-xl border p-3 transition hover:-translate-y-0.5 ${
                    files[field.id]
                      ? isDark ? "border-teal-400/50 bg-teal-400/5" : "border-teal-400 bg-teal-50"
                      : isDark ? "border-white/10 bg-white/[0.03] hover:border-white/20" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <input type="file" className="sr-only" onChange={(e) => handleFileChange(field.id, e)} accept=".pdf,.doc,.docx,.txt" />
                  <div className="flex items-center gap-2 mb-1">
                    <UploadCloud className={`h-3.5 w-3.5 flex-shrink-0 ${files[field.id] ? isDark ? "text-teal-400" : "text-teal-600" : "text-slate-500"}`} />
                    <span className={`text-xs font-medium truncate ${isDark ? "text-slate-300" : "text-gray-700"}`}>{field.title}</span>
                  </div>
                  <p className={`text-xs truncate ${files[field.id] ? isDark ? "text-teal-400" : "text-teal-600" : isDark ? "text-slate-600" : "text-gray-400"}`}>
                    {files[field.id]?.name ?? "Choose file"}
                  </p>
                </label>
              ))}
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <FileText className={`h-3.5 w-3.5 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
                <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>Marks:</span>
                <div className="flex gap-1">
                  {([5, 8, 10] as MarksOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMarks(option)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                        marks === option
                          ? isDark ? "bg-teal-400 text-slate-950" : "bg-teal-500 text-white"
                          : isDark ? "bg-white/5 text-slate-400 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={pending}
                className={`ml-auto flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition disabled:opacity-60 disabled:cursor-not-allowed ${
                  isDark ? "bg-teal-400 text-slate-950 hover:bg-teal-300" : "bg-teal-500 text-white hover:bg-teal-600"
                }`}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                {pending ? "Generating..." : "Generate"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
