import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateWithGemini } from "@/services/gemini";
import { sendGenerationRequestToN8n } from "@/services/n8n";
import type { GenerationRequest, UploadKind } from "@/types";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "study-materials";

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
}

async function createFileUrls(supabase: any, files: Partial<Record<UploadKind, string>>) {
  const fileUrls: Partial<Record<UploadKind, string>> = {};

  for (const [kind, path] of Object.entries(files) as Array<[UploadKind, string | undefined]>) {
    if (!path) continue;

    const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(path, 60);

    // supabase-js may return either `signedUrl` or `signedURL` depending on version.
    const signed = data?.signedUrl ?? data?.signedURL;

    if (error || !signed) {
      console.error("Failed to create signed URL for storage path:", path, error?.message ?? error, "response data:", data);
      continue;
    }

    fileUrls[kind] = signed;
  }

  return fileUrls;
}


export async function POST(request: Request) {
  // Read raw body once so we can both parse and log it on errors
  const rawBody = await request.text();

  try {
    let payload: GenerationRequest;
    try {
      payload = JSON.parse(rawBody) as GenerationRequest;
    } catch (parseErr) {
      return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
    }

    // Basic validation
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
    }

    const { marks, includeDiagrams, files } = payload as GenerationRequest;

    if (![5, 8, 10].includes(marks as number)) {
      return NextResponse.json({ message: "Invalid marks value." }, { status: 400 });
    }

    if (typeof includeDiagrams !== "boolean") {
      return NextResponse.json({ message: "includeDiagrams must be a boolean." }, { status: 400 });
    }

    const fileCount = Object.values(files ?? {}).filter(Boolean).length;
    if (!fileCount) {
      return NextResponse.json({ message: "At least one uploaded file is required." }, { status: 400 });
    }

    // Prefer fileUrls sent from the client (generated while user is authenticated).
    // Fall back to server-side generation only if the client didn't provide them.
    let fileUrls: Partial<Record<UploadKind, string>> = payload.fileUrls ?? {};
    const clientUrlCount = Object.values(fileUrls).filter(Boolean).length;

    if (clientUrlCount === 0) {
      console.log("No client-provided fileUrls, attempting server-side URL generation...");
      let supabase;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        supabase = createClient(supabaseUrl, serviceRoleKey);
      } else {
        supabase = await createRouteHandlerSupabaseClient();
      }
      fileUrls = await createFileUrls(supabase, files ?? {});
    } else {
      console.log("Using client-provided fileUrls:", Object.keys(fileUrls));
    }

    console.log("FILES RECEIVED:", files);
    console.log("FILE URLS GENERATED:", fileUrls);

    const payloadWithUrls: GenerationRequest = {
      ...payload,
      fileUrls,
      // pass through any provided original filenames
      fileNames: payload.fileNames ?? {}
    };

    // Diagnostic logs: helpful when debugging webhook payloads
    console.info("/api/generate: files:", files);
    console.info("/api/generate: fileUrls:", fileUrls);
    console.info("/api/generate: payloadWithUrls:", { marks, includeDiagrams, files, fileNames: payloadWithUrls.fileNames, fileUrls });

    console.log(
      "PAYLOAD TO N8N:",
      JSON.stringify(payloadWithUrls, null, 2)
    );

    let n8nResult;
    try {
      n8nResult = await sendGenerationRequestToN8n(payloadWithUrls);
    } catch (n8nError) {
      console.error("n8n webhook failed:", n8nError instanceof Error ? n8nError.message : n8nError);
      n8nResult = {
        status: "skipped",
        message: "n8n webhook failed; falling back to Gemini."
      };
    }

    if (n8nResult.status === "queued") {
      return NextResponse.json(n8nResult, { status: 200 });
    }

    const result = await generateWithGemini(payloadWithUrls);
    const message = n8nResult.status === "skipped" ? `${n8nResult.message} ${result.message}` : result.message;

    return NextResponse.json({ ...result, message }, { status: result.status === "error" ? 500 : 200 });
  } catch (err) {
    // Log error server-side for debugging using the already-read body
    console.error("/api/generate error:", err instanceof Error ? err.stack ?? err.message : err);
    console.error("Request body (truncated):", rawBody?.slice?.(0, 200));

    return NextResponse.json(
      { message: "Internal server error while generating content." },
      { status: 500 }
    );
  }
}