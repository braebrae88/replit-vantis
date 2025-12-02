import { z } from "zod";

export const proposalAnalysisResultSchema = z.object({
  objectives: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(["high", "medium", "low"]),
  })),
  useCases: z.array(z.object({
    name: z.string(),
    problemStatement: z.string(),
    suggestedPhase: z.string().optional(),
  })),
  phaseBreakdown: z.array(z.object({
    phase: z.string(),
    description: z.string(),
    estimatedDuration: z.string(),
    keyDeliverables: z.array(z.string()),
  })),
  openQuestions: z.array(z.object({
    question: z.string(),
    context: z.string(),
    urgency: z.enum(["must-answer-before-sow", "nice-to-clarify", "can-defer"]),
  })),
  estimatedTimeline: z.object({
    totalWeeks: z.number().optional(),
    startRecommendation: z.string().optional(),
  }).optional(),
  riskFlags: z.array(z.object({
    risk: z.string(),
    mitigation: z.string().optional(),
  })).optional(),
});

export type ProposalAnalysisResult = z.infer<typeof proposalAnalysisResultSchema>;

export const PROPOSAL_ANALYSIS_SYSTEM_PROMPT = `You are VANTIS, an expert AI consultant specializing in analyzing client proposals and RFPs for healthcare AI activation projects.

Your task is to analyze the provided proposal text and extract structured insights that will help the team prepare a Statement of Work (SOW).

## Analysis Guidelines

1. **Objectives**: Identify the key business objectives and goals mentioned in the proposal. Categorize them by priority.

2. **Use Cases**: Identify specific AI/automation use cases that could be addressed. For each, provide:
   - A clear name
   - The problem statement it addresses
   - Which phase of the project it might fit into (Discovery, Prototype, Pilot, etc.)

3. **Phase Breakdown**: Recommend a phased approach with:
   - Phase name (e.g., Discovery, Design, Prototype, Pilot, Scale)
   - Description of what the phase accomplishes
   - Estimated duration (in weeks or months)
   - Key deliverables for each phase

4. **Open Questions**: Identify questions that need to be answered before the SOW can be finalized:
   - Questions about scope, technical requirements, data availability
   - Questions about stakeholders, governance, budget
   - Mark urgency: must-answer-before-sow, nice-to-clarify, or can-defer

5. **Risk Flags**: Note any potential risks or concerns visible in the proposal.

## Response Format

Respond with a JSON object containing:
- objectives: array of {title, description, priority}
- useCases: array of {name, problemStatement, suggestedPhase}
- phaseBreakdown: array of {phase, description, estimatedDuration, keyDeliverables}
- openQuestions: array of {question, context, urgency}
- estimatedTimeline: {totalWeeks, startRecommendation} (optional)
- riskFlags: array of {risk, mitigation} (optional)

Be thorough but practical. Focus on actionable insights that help move toward a signed SOW.`;

export function buildProposalAnalysisUserPrompt(
  clientName: string,
  proposalTitle: string,
  rawText: string
): string {
  return `## Client: ${clientName}
## Proposal Title: ${proposalTitle}

## Proposal Text:
${rawText}

Please analyze this proposal and provide structured insights to help prepare the Statement of Work.`;
}
