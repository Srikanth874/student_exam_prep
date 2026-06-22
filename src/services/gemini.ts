import { createClient } from "@supabase/supabase-js";
import type { GenerationRequest } from "@/types";

export interface GeminiDraftResponse {
  status: "success" | "skipped" | "error";
  message: string;
  result?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "study-materials";
const googleApiKey = process.env.GOOGLE_API_KEY;
const modelName = process.env.GOOGLE_GEMINI_MODEL ?? "text-bison-001";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function isTextFile(fileName: string) {
  return /\.(txt|md|json|csv|html|xml|js|ts|jsx|tsx)$/i.test(fileName);
}

async function downloadFileText(path: string) {
  const { data, error } = await supabase.storage.from(bucketName).download(path);

  if (error || !data) {
    throw new Error(error?.message ?? `Unable to download file: ${path}`);
  }

  if (typeof (data as any).text === "function") {
    return await (data as any).text();
  }

  if (typeof (data as any).arrayBuffer === "function") {
    const buffer = await (data as any).arrayBuffer();
    return new TextDecoder("utf-8").decode(buffer);
  }

  throw new Error(`Unable to read file contents for ${path}.`);
}

function trimText(text: string, maxLength = 2500) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export async function generateWithGemini(
  request: GenerationRequest
): Promise<GeminiDraftResponse> {
  if (!googleApiKey) {
    return {
      status: "skipped",
      message:
        "Gemini API key is not configured. Set GOOGLE_API_KEY in your environment.",
      result: undefined
    };
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      status: "error",
      message:
        "Supabase environment variables are missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      result: undefined
    };
  }

  const fileEntries = Object.entries(request.files ?? {}).filter(([, value]) => !!value) as Array<[
    string,
    string
  ]>;

  const fileSummaries = await Promise.all(
    fileEntries.map(async ([kind, path]) => {
      if (!isTextFile(path)) {
        return `• ${kind}: ${path} (binary or unsupported file type; content preview not available)`;
      }

      try {
        const rawText = await downloadFileText(path);
        return `• ${kind}: ${path}\n${trimText(rawText)}`;
      } catch (error) {
        return `• ${kind}: ${path} (failed to preview text: ${error instanceof Error ? error.message : "unknown"})`;
      }
    })
  );

  const prompt = [
    "You are an AI assistant generating an exam-ready question paper and study guide.",
    `Marks: ${request.marks}`,
    `Include diagrams: ${request.includeDiagrams ? "Yes" : "No"}`,
    "Use the uploaded file summaries below as the source material.",
    "Create a concise exam paper outline with question sections, question prompts, and answer guidance.",
    "Keep the output clear and exam-focused.",
    "Uploaded file info:",
    fileSummaries.join("\n\n")
  ].join("\n\n");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta2/models/${encodeURIComponent(
    modelName
  )}:generateText?key=${googleApiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt: { text: prompt }, temperature: 0.2 })
  });

  if (!response.ok) {
    const payload = await response.text();
    return {
      status: "error",
      message: `Gemini request failed: ${response.status} ${response.statusText}. ${payload}`,
      result: undefined
    };
  }

  const result = await response.json();
  const output = result?.candidates?.[0]?.output ?? result?.content ?? "";

  return {
    status: "success",
    message: "Gemini generated a draft based on uploaded files.",
    result: output
  };
}
