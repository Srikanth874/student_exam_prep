"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { BrainCircuit, FileText, Loader2, Shapes, UploadCloud } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { MarksOption, UploadKind } from "@/types";

const uploadFields: Array<{
  id: UploadKind;
  title: string;
  description: string;
}> = [
    {
      id: "notes",
      title: "Upload Notes",
      description: "Class notes, summaries, or chapter PDFs"
    },
    {
      id: "questionBank",
      title: "Upload Question Bank",
      description: "Practice sets and topic-wise questions"
    },
    {
      id: "previousYearQuestions",
      title: "Previous Year Questions",
      description: "Past papers for exam pattern matching"
    }
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
}

export function DashboardForm({ user }: DashboardFormProps) {
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "study-materials";
  const [files, setFiles] = useState<Partial<Record<UploadKind, File>>>({});
  const [marks, setMarks] = useState<MarksOption>(5);
  const [includeDiagrams, setIncludeDiagrams] = useState(true);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const storageKey = user ? `eduforge_history_${user.id}` : null;

  const selectedCount = useMemo(() => Object.values(files).filter(Boolean).length, [files]);

  useEffect(() => {
    if (!storageKey) {
      setHistory([]);
      return;
    }

    try {
      const stored = window.localStorage.getItem(storageKey);
      setHistory(stored ? (JSON.parse(stored) as HistoryEntry[]) : []);
    } catch {
      setHistory([]);
    }
  }, [storageKey]);

  function handleFileChange(kind: UploadKind, event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    setFiles((current) => ({ ...current, [kind]: nextFile }));
    setError("");
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setResult("");

    if (selectedCount === 0) {
      setError("Upload at least one file to generate a paper.");
      return;
    }

    setPending(true);

    try {
      const uploadedPaths: Partial<Record<UploadKind, string>> = {};

      for (const [kind, file] of Object.entries(files) as Array<[UploadKind, File | undefined]>) {
        if (!file) continue;
        const path = `${uuidv4()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false
          });

        if (uploadError) {
          if (uploadError.message?.includes("Bucket not found")) {
            throw new Error(
              `Upload failed: Supabase storage bucket '${bucketName}' does not exist. Create this bucket or set NEXT_PUBLIC_SUPABASE_BUCKET to a valid name.`
            );
          }
          throw uploadError;
        }
        // Prefer the storage response path if available (keeps consistency)
        // Use returned `uploadData.path` when available to ensure exact path
        const returnedPath = (uploadData as any)?.path ?? path;
        uploadedPaths[kind] = returnedPath;
        console.info("Uploaded file to Supabase storage:", { kind, path: returnedPath });
      }

      // Generate signed URLs on the client side (user is authenticated here)
      // This avoids the server needing to re-authenticate against Supabase storage
      const fileUrls: Partial<Record<UploadKind, string>> = {};
      for (const [kind, storagePath] of Object.entries(uploadedPaths) as Array<[UploadKind, string | undefined]>) {
        if (!storagePath) continue;
        const { data: signedData, error: signedError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(storagePath, 3600); // 1 hour expiry
        const signedUrl = (signedData as any)?.signedUrl ?? (signedData as any)?.signedURL;
        if (signedError || !signedUrl) {
          console.error("Failed to create signed URL for:", storagePath, signedError?.message ?? signedError);
        } else {
          fileUrls[kind] = signedUrl;
          console.info("Created signed URL for:", kind, signedUrl.slice(0, 80) + "...");
        }
      }

      // include original filenames so server/n8n can preserve names
      const fileNames: Partial<Record<UploadKind, string>> = {};
      for (const [kind, file] of Object.entries(files) as Array<[UploadKind, File | undefined]>) {
        if (!file) continue;
        fileNames[kind] = file.name;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          marks,
          includeDiagrams,
          files: uploadedPaths,
          fileUrls,
          fileNames
        })
      });

      const result = (await response.json()) as {
        message?: string;
        result?: string;
        status?: string;
      };

      if (!response.ok) {
        throw new Error(result.message ?? "Generation request failed.");
      }

      const outputText = result.result ?? "";
      const newHistoryItem: HistoryEntry = {
        id: uuidv4(),
        title: `Generated ${marks}-mark ${includeDiagrams ? "paper" : "text"}`,
        result: outputText,
        marks,
        includeDiagrams,
        createdAt: new Date().toISOString()
      };

      const nextHistory = [newHistoryItem, ...history].slice(0, 12);
      setHistory(nextHistory);

      if (storageKey) {
        window.localStorage.setItem(storageKey, JSON.stringify(nextHistory));
      }

      setStatus(result.message ?? "Gemini generation completed.");
      setResult(outputText);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Generation failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleGenerate}>
      <div className="grid gap-4 lg:grid-cols-3">
        {uploadFields.map((field) => (
          <label
            key={field.id}
            className="group relative min-h-44 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-1 hover:border-aurora/50 hover:bg-white/[0.07]"
          >
            <input
              type="file"
              className="sr-only"
              onChange={(event) => handleFileChange(field.id, event)}
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            />
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-aurora/15 text-aurora">
              <UploadCloud className="h-5 w-5" />
            </span>
            <span className="block text-lg font-semibold text-white">{field.title}</span>
            <span className="mt-2 block text-sm leading-6 text-slate-400">{field.description}</span>
            <span className="mt-5 block truncate rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
              {files[field.id]?.name ?? "Choose file"}
            </span>
          </label>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
        <section className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-solar" />
            <h2 className="font-semibold text-white">Marks</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([5, 8, 10] as MarksOption[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMarks(option)}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${marks === option
                    ? "border-aurora bg-aurora text-slate-950"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25"
                  }`}
              >
                {option} marks
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
          <div className="mb-4 flex items-center gap-3">
            <Shapes className="h-5 w-5 text-violet" />
            <h2 className="font-semibold text-white">Diagrams</h2>
          </div>
          <button
            type="button"
            onClick={() => setIncludeDiagrams((value) => !value)}
            className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 transition ${includeDiagrams
                ? "border-violet/60 bg-violet/20 text-white"
                : "border-white/10 bg-white/[0.04] text-slate-300"
              }`}
          >
            <span>{includeDiagrams ? "Include diagrams" : "Text only"}</span>
            <span
              className={`h-6 w-11 rounded-full p-1 transition ${includeDiagrams ? "bg-aurora" : "bg-slate-700"
                }`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-slate-950 transition ${includeDiagrams ? "translate-x-5" : "translate-x-0"
                  }`}
              />
            </span>
          </button>
        </section>

        <button
          type="submit"
          disabled={pending}
          className="group flex min-h-32 items-center justify-center gap-3 rounded-xl bg-white px-6 py-5 text-base font-bold text-slate-950 shadow-glow transition hover:-translate-y-1 hover:bg-aurora disabled:cursor-not-allowed disabled:opacity-70 lg:min-w-56"
        >
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
          Generate
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="rounded-lg border border-aurora/30 bg-aurora/10 px-4 py-3 text-sm text-teal-50">
          {status}
        </p>
      ) : null}
      {result ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-sm leading-6 text-slate-100">
          <h3 className="mb-3 text-lg font-semibold text-white">Gemini output</h3>
          <pre className="whitespace-pre-wrap break-words text-slate-200">{result}</pre>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-sm leading-6 text-slate-100">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Output history</h3>
            <p className="text-sm text-slate-400">Your latest Gemini-generated results are stored as chat-style history.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-5 text-slate-400">
            No previous outputs yet. Generate one and the result will appear here like a chat history.
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-sm"
              >
                <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{entry.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.createdAt).toLocaleString()} • {entry.marks} marks •{' '}
                      {entry.includeDiagrams ? "with diagrams" : "text only"}
                    </p>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap break-words text-sm text-slate-200">{entry.result}</pre>
              </article>
            ))}
          </div>
        )}
      </section>
    </form>
  );
}
