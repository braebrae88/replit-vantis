import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export interface LLMCallOptions {
  systemPrompt: string;
  userContent: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface LLMResponse {
  success: boolean;
  content: string;
  error?: string;
}

const USER_FRIENDLY_ERROR = "Unable to get AI response. Please try again in a moment.";

export async function callLLM(options: LLMCallOptions): Promise<LLMResponse> {
  const {
    systemPrompt,
    userContent,
    temperature = 0.7,
    maxTokens = 1500,
    jsonMode = false,
  } = options;

  try {
    const requestPayloadBytes = Buffer.byteLength(systemPrompt + userContent, 'utf8');
    console.log(`[AI Client] Calling LLM with ${requestPayloadBytes} bytes payload`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode && { response_format: { type: "json_object" as const } }),
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      console.error("[AI Client] Empty response from LLM - no message content");
      return {
        success: false,
        content: "",
        error: USER_FRIENDLY_ERROR,
      };
    }

    const responseBytes = Buffer.byteLength(responseText, 'utf8');
    console.log(`[AI Client] Received ${responseBytes} bytes response`);

    return {
      success: true,
      content: responseText,
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error(`[AI Client] OpenAI API Error: status=${error.status}, message=${error.message}`);

      if (error.status === 429) {
        return {
          success: false,
          content: "",
          error: "AI service is temporarily busy. Please try again in a moment.",
        };
      }

      if (error.status === 401 || error.status === 403) {
        console.error("[AI Client] Authentication/authorization error - check API key");
        return {
          success: false,
          content: "",
          error: "AI service configuration error. Please contact support.",
        };
      }

      if (error.status === 400) {
        return {
          success: false,
          content: "",
          error: "Invalid request to AI service. Please try a shorter message.",
        };
      }

      if (error.status === 500 || error.status === 503) {
        return {
          success: false,
          content: "",
          error: "AI service is temporarily unavailable. Please try again later.",
        };
      }
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[AI Client] LLM call failed:", errorMessage);

    return {
      success: false,
      content: "",
      error: USER_FRIENDLY_ERROR,
    };
  }
}

export function parseJSONResponse<T>(content: string): { success: boolean; data?: T; error?: string } {
  try {
    const data = JSON.parse(content) as T;
    return { success: true, data };
  } catch (parseError) {
    console.error("[AI Client] Failed to parse JSON response:", content.substring(0, 200));
    return {
      success: false,
      error: "Failed to process AI response. Please try again.",
    };
  }
}
