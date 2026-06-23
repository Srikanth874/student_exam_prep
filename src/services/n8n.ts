import type { GenerationRequest } from "@/types";

export interface N8nGenerationResponse {
  status: "queued" | "skipped" | "success" | "error";
  message: string;
  result?: string;
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

  console.log("Sending to n8n webhook:", webhookUrl);
  console.log("Payload being sent:", JSON.stringify(payload, null, 2));
  
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  console.log("n8n response status:", response.status);

  if (!response.ok) {
    const payloadText = await response.text();
    throw new Error(`n8n workflow request failed: ${response.status} ${response.statusText}. ${payloadText}`);
  }

  const data = await response.json();
  console.log("n8n response data:", data);

  return {
    status: "success",
    message: "Generation completed.",
    result: data.content?.parts?.[0]?.text ?? data.result ?? data.message ?? ""
  };
}

export async function prepareFutureN8nWorkflow(): Promise<N8nGenerationResponse> {
  return {
    status: "skipped",
    message: "Placeholder for future n8n workflow orchestration."
  };
}