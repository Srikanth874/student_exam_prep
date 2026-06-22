import type { GenerationRequest } from "@/types";

export interface N8nGenerationResponse {
  status: "queued" | "skipped";
  message: string;
}

export async function sendGenerationRequestToN8n(
  payload: GenerationRequest
): Promise<N8nGenerationResponse> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      status: "skipped",
      message: "N8N_WEBHOOK_URL is not configured yet."
    };
  }

  // Default behavior: send JSON payload containing signed URLs (recommended).
  // n8n will receive `fileUrls` and can download the files itself.
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const payloadText = await response.text();
    throw new Error(`n8n workflow request failed: ${response.status} ${response.statusText}. ${payloadText}`);
  }

  return {
    status: "queued",
    message: "Generation workflow queued successfully."
  };
}

export async function prepareFutureN8nWorkflow(): Promise<N8nGenerationResponse> {
  return {
    status: "skipped",
    message: "Placeholder for future n8n workflow orchestration."
  };
}
