import { ENV } from "./_core/env";

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterError {
  error: {
    message: string;
    code: number;
  };
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const TIMEOUT_MS = 30000; // 30 second timeout

export async function callOpenRouterAPI(
  request: OpenRouterRequest,
  appUrl: string,
  appName: string
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": appUrl,
        "X-Title": appName,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = (await response.json()) as OpenRouterError;
      const errorMessage = errorData?.error?.message || "Unknown error";
      const errorCode = response.status;

      if (errorCode === 401) {
        throw new Error("Invalid or expired OpenRouter API key");
      } else if (errorCode === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (errorCode === 500) {
        throw new Error("OpenRouter API server error. Please try again later.");
      } else if (errorCode === 418) {
        throw new Error("I'm a teapot! (OpenRouter is having fun)");
      } else {
        throw new Error(`OpenRouter API error (${errorCode}): ${errorMessage}`);
      }
    }

    const data = (await response.json()) as OpenRouterResponse;
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout. The API took too long to respond.");
      }
      throw error;
    }
    throw new Error("Unknown error occurred while calling OpenRouter API");
  } finally {
    clearTimeout(timeoutId);
  }
}
