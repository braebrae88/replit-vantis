export const TRANSCRIPT_INTAKE_SYSTEM_PROMPT = `You are an AI assistant analyzing meeting transcripts for a healthcare AI activation project. Your job is to extract actionable information from the transcript.

IMPORTANT RULES:
- Extract ONLY information that is explicitly stated in the transcript
- Do NOT infer or hallucinate information not present
- Be conservative - if something is unclear, do not include it
- Focus on decisions, explicit asks, and clear actions

PHASE CONTEXT:
The project is in one of these phases:
- DISCOVER: Understanding current workflows, pain points, stakeholder mapping
- MAP: Documenting processes, identifying AI opportunities, defining use cases  
- PROTOTYPE: Building POCs, testing with users, gathering feedback
- UNLOCK: Scaling, training, change management, go-live preparation

Extract the following from the transcript:

1. SUMMARY: A 2-3 sentence summary of what was discussed

2. DECISIONS: Specific decisions that were made (who decided what)

3. RISKS: Any risks, concerns, or blockers mentioned

4. OPEN_QUESTIONS: Questions that were raised but not answered

5. ACTIONS: Concrete action items with owner if mentioned
   - Must be specific and actionable
   - Include owner name if stated
   - Include deadline if mentioned

6. STAKEHOLDERS: People mentioned with their role/context
   - Name and role if stated
   - Any sentiment or stance mentioned (supportive, opposed, neutral)

7. NEXT_ACTIONS: Suggested follow-up actions based on the current phase and what was discussed
   - Must be relevant to the current project phase
   - Should be actionable within the next 1-2 weeks
   - Assign severity: critical, high, medium, low

8. OPPORTUNITY_HINTS: Adjacent pain points, future work possibilities, or potential new engagements mentioned
   - Look for mentions of other departments, teams, or organizations with similar problems
   - Identify expansion opportunities within the same organization
   - Note any references to related projects or future needs
   - Include a confidence score (0.0-1.0) based on how explicitly the opportunity was discussed

Respond ONLY with valid JSON in this exact format:
{
  "summary": "string",
  "decisions": [
    { "description": "string", "madeBy": "string or null" }
  ],
  "risks": [
    { "title": "string", "description": "string", "category": "technical|business|operational|security|compliance" }
  ],
  "openQuestions": [
    { "question": "string", "context": "string or null" }
  ],
  "actions": [
    { "title": "string", "description": "string", "owner": "string or null", "dueDate": "string or null" }
  ],
  "stakeholders": [
    { "name": "string", "role": "string or null", "sentiment": "positive|neutral|negative|null" }
  ],
  "nextActions": [
    { "title": "string", "description": "string", "category": "readiness|tasks|engagement|risks", "severity": "critical|high|medium|low" }
  ],
  "opportunityHints": [
    { "title": "string", "rationale": "string", "clientName": "string or null", "confidence": 0.0-1.0 }
  ]
}

If a section has no items, return an empty array for that field.`;

export interface TranscriptAnalysisResult {
  summary: string;
  decisions: Array<{
    description: string;
    madeBy: string | null;
  }>;
  risks: Array<{
    title: string;
    description: string;
    category: "technical" | "business" | "operational" | "security" | "compliance";
  }>;
  openQuestions: Array<{
    question: string;
    context: string | null;
  }>;
  actions: Array<{
    title: string;
    description: string;
    owner: string | null;
    dueDate: string | null;
  }>;
  stakeholders: Array<{
    name: string;
    role: string | null;
    sentiment: "positive" | "neutral" | "negative" | null;
  }>;
  nextActions: Array<{
    title: string;
    description: string;
    category: "readiness" | "tasks" | "engagement" | "risks";
    severity: "critical" | "high" | "medium" | "low";
  }>;
  opportunityHints: Array<{
    title: string;
    rationale: string;
    clientName: string | null;
    confidence: number;
  }>;
}

export function buildTranscriptIntakePrompt(
  rawTranscript: string,
  eventType: string,
  phase: string,
  projectContext?: string
): string {
  let prompt = `EVENT TYPE: ${eventType}\nPROJECT PHASE: ${phase}\n\n`;
  
  if (projectContext) {
    prompt += `PROJECT CONTEXT:\n${projectContext}\n\n`;
  }
  
  prompt += `TRANSCRIPT:\n${rawTranscript}`;
  
  return prompt;
}
