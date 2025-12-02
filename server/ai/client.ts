import OpenAI from "openai";

const openai = new OpenAI();

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

export async function callLLM(options: LLMCallOptions): Promise<LLMResponse> {
  const {
    systemPrompt,
    userContent,
    temperature = 0.7,
    maxTokens = 1500,
    jsonMode = false,
  } = options;

  try {
    console.log(`[AI Client] Calling LLM with ${userContent.length} chars of user content`);

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
      console.error("[AI Client] No response content from LLM");
      return {
        success: false,
        content: "",
        error: "No response from AI assistant. Please try again.",
      };
    }

    console.log(`[AI Client] Received ${responseText.length} chars response`);

    return {
      success: true,
      content: responseText,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[AI Client] LLM call failed:", errorMessage);

    if (errorMessage.includes("rate limit")) {
      return {
        success: false,
        content: "",
        error: "AI service is temporarily busy. Please try again in a moment.",
      };
    }

    if (errorMessage.includes("API key")) {
      return {
        success: false,
        content: "",
        error: "AI service configuration error. Please contact support.",
      };
    }

    return {
      success: false,
      content: "",
      error: "Failed to get AI response. Please try again.",
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
      error: "Failed to parse AI response. Please try again.",
    };
  }
}
