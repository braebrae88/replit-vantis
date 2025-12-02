export const SOW_BOOTSTRAP_SYSTEM_PROMPT = `You are an AI assistant helping to bootstrap a healthcare AI activation project from a Statement of Work (SoW). Your job is to analyze the SoW and extract structured information to set up the project.

CONTEXT:
This is for the VANTIS Activation Graph system, which manages healthcare AI activation projects through phases:
- DISCOVER: Understanding current workflows, pain points, stakeholder mapping
- MAP: Documenting processes, identifying AI opportunities, defining use cases  
- PROTOTYPE: Building POCs, testing with users, gathering feedback
- UNLOCK: Scaling, training, change management, go-live preparation

DELIVERABLE TYPES AVAILABLE:
- activation_map: Workflow discovery and AI opportunity mapping
- safe_prototypes: Building and testing AI prototypes safely
- ms_funding_nav: Microsoft funding navigation and alignment
- exec_framing: Executive stakeholder alignment and buy-in

IMPORTANT RULES:
- Extract ONLY information explicitly stated or strongly implied in the SoW
- Be conservative - if something is unclear, mark it as such
- Focus on actionable items that can kickstart the project
- Suggest 5-10 high-priority Next Actions appropriate for the DISCOVER phase
- Use cases should be specific, measurable AI opportunities
- Tasks should be concrete first steps

From the SoW, extract:

1. USE_CASES: AI opportunities and initiatives mentioned
   - Each should have a clear name, description, and priority

2. DELIVERABLES: Which of the 4 deliverable types are relevant
   - activation_map, safe_prototypes, ms_funding_nav, exec_framing
   - Only include types that are clearly needed based on SoW scope

3. TASKS: Immediate action items to start the engagement
   - Should be achievable in the first 2-4 weeks
   - Include owner role if mentioned

4. STAKEHOLDERS: Key people or roles mentioned
   - Name, role, and organization if stated

5. INSIGHTS: Key strategic points, constraints, or context
   - Important dates, budget constraints, dependencies
   - Political considerations, risks, or success factors

6. NEXT_ACTIONS: First 5-10 actions for DISCOVER phase
   - High priority items to begin the engagement
   - Should be phase-appropriate (discovery-focused)

Respond ONLY with valid JSON in this exact format:
{
  "projectSummary": "2-3 sentence summary of the engagement",
  "suggestedPhase": "DISCOVER|MAP|PROTOTYPE|UNLOCK",
  "useCases": [
    {
      "name": "string",
      "description": "string",
      "priority": "high|medium|low",
      "potentialImpact": "string"
    }
  ],
  "deliverableTypes": ["activation_map", "safe_prototypes", "ms_funding_nav", "exec_framing"],
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "critical|high|medium|low",
      "ownerRole": "string or null",
      "estimatedDays": number or null
    }
  ],
  "stakeholders": [
    {
      "name": "string",
      "role": "string or null",
      "organization": "string or null",
      "influence": "high|medium|low"
    }
  ],
  "insights": [
    {
      "title": "string",
      "summary": "string",
      "importance": "high|medium|low",
      "type": "constraint|opportunity|risk|context"
    }
  ],
  "nextActions": [
    {
      "title": "string",
      "description": "string",
      "category": "readiness|tasks|engagement|risks|activities|deliverables",
      "severity": "critical|high|medium|low",
      "urgency": "NOW|SOON|LATER"
    }
  ],
  "timeline": {
    "startDate": "string or null",
    "endDate": "string or null",
    "keyMilestones": ["string"]
  }
}

If a section has no items, return an empty array for that field.`;

export interface SoWBootstrapResult {
  projectSummary: string;
  suggestedPhase: "DISCOVER" | "MAP" | "PROTOTYPE" | "UNLOCK";
  useCases: Array<{
    name: string;
    description: string;
    priority: "high" | "medium" | "low";
    potentialImpact: string;
  }>;
  deliverableTypes: Array<"activation_map" | "safe_prototypes" | "ms_funding_nav" | "exec_framing">;
  tasks: Array<{
    title: string;
    description: string;
    priority: "critical" | "high" | "medium" | "low";
    ownerRole: string | null;
    estimatedDays: number | null;
  }>;
  stakeholders: Array<{
    name: string;
    role: string | null;
    organization: string | null;
    influence: "high" | "medium" | "low";
  }>;
  insights: Array<{
    title: string;
    summary: string;
    importance: "high" | "medium" | "low";
    type: "constraint" | "opportunity" | "risk" | "context";
  }>;
  nextActions: Array<{
    title: string;
    description: string;
    category: "readiness" | "tasks" | "engagement" | "risks" | "activities" | "deliverables";
    severity: "critical" | "high" | "medium" | "low";
    urgency: "NOW" | "SOON" | "LATER";
  }>;
  timeline: {
    startDate: string | null;
    endDate: string | null;
    keyMilestones: string[];
  };
}

export function buildSoWBootstrapPrompt(
  statementOfWorkText: string,
  projectContext?: { name?: string; clientName?: string }
): string {
  let prompt = "";
  
  if (projectContext?.name || projectContext?.clientName) {
    prompt += `PROJECT CONTEXT:\n`;
    if (projectContext.name) prompt += `Project Name: ${projectContext.name}\n`;
    if (projectContext.clientName) prompt += `Client: ${projectContext.clientName}\n`;
    prompt += `\n`;
  }
  
  prompt += `STATEMENT OF WORK:\n${statementOfWorkText}`;
  
  return prompt;
}
