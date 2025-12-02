export const RISK_SCORING_SYSTEM_PROMPT = `You are VANTIS Risk Intelligence, an expert at assessing project risks using the Likelihood × Impact (L×I) model.

You will analyze project risks and suggest appropriate Likelihood and Impact scores based on:
- Recent meeting transcripts and insights
- Project deliverables and their status
- Open tasks and blockers
- Overall project context

SCORING GUIDELINES:

Likelihood (1-5):
- 1 = Rare: Highly unlikely to occur
- 2 = Unlikely: Could happen but not expected
- 3 = Possible: Reasonable chance of occurring
- 4 = Likely: More likely to occur than not
- 5 = Almost Certain: Expected to occur

Impact (1-5):
- 1 = Negligible: Minimal effect on project
- 2 = Minor: Some delays or minor budget impact
- 3 = Moderate: Noticeable delays or moderate costs
- 4 = Major: Significant delays, costs, or scope changes
- 5 = Severe: Project failure, major financial loss, or critical harm

EVIDENCE REQUIREMENTS:
- Base your scores on concrete evidence from the provided context
- Reference specific insights, events, or deliverables that support your assessment
- Provide clear rationale explaining why you chose the scores
- Include evidence references (insight IDs or event IDs) when available

Return STRICT JSON with this structure:
{
  "riskScores": [
    {
      "riskId": "uuid of the risk",
      "suggestedLikelihood": 1-5,
      "suggestedImpact": 1-5,
      "rationale": "Brief explanation of why these scores are appropriate based on evidence",
      "evidenceRefs": ["insight_id_1", "event_id_2"]
    }
  ]
}

RULES:
- Score EVERY risk provided in the input
- Be objective and evidence-based
- Higher scores should only be given when clear evidence supports them
- If no relevant evidence exists for a risk, explain this in the rationale and provide conservative scores
- Do not include any text outside the JSON object`;

export interface RiskScoreSuggestion {
  riskId: string;
  suggestedLikelihood: number;
  suggestedImpact: number;
  rationale: string;
  evidenceRefs: string[];
}

export interface RiskScoringResult {
  riskScores: RiskScoreSuggestion[];
}

export function buildRiskScoringPrompt(
  risks: Array<{ id: string; title: string; category: string; likelihood: number; impact: number; mitigation?: string | null }>,
  context: {
    projectName: string;
    projectDescription?: string;
    recentInsights: Array<{ id: string; content: string; type: string; createdAt: Date }>;
    recentEvents: Array<{ id: string; title: string; description?: string | null; occurredAt: Date }>;
    deliverables: Array<{ id: string; title: string; status: string }>;
    openTasks: Array<{ id: string; title: string; status: string; priority: string }>;
  }
): string {
  const insightsContext = context.recentInsights.length > 0
    ? context.recentInsights.map(i => `- [${i.id}] (${i.type}): ${i.content}`).join('\n')
    : 'No recent insights available';

  const eventsContext = context.recentEvents.length > 0
    ? context.recentEvents.map(e => `- [${e.id}] ${e.title}: ${e.description || 'No description'}`).join('\n')
    : 'No recent events available';

  const deliverablesContext = context.deliverables.length > 0
    ? context.deliverables.map(d => `- ${d.title} (${d.status})`).join('\n')
    : 'No deliverables defined';

  const tasksContext = context.openTasks.length > 0
    ? context.openTasks.map(t => `- ${t.title} [${t.status}] priority: ${t.priority}`).join('\n')
    : 'No open tasks';

  const risksToScore = risks.map(r => 
    `- ID: ${r.id}
  Title: ${r.title}
  Category: ${r.category}
  Current Likelihood: ${r.likelihood}
  Current Impact: ${r.impact}
  Mitigation: ${r.mitigation || 'None defined'}`
  ).join('\n\n');

  return `# Project Context

**Project:** ${context.projectName}
${context.projectDescription ? `**Description:** ${context.projectDescription}` : ''}

## Recent Insights (reference these by ID in evidenceRefs)
${insightsContext}

## Recent Events (reference these by ID in evidenceRefs)
${eventsContext}

## Deliverables Status
${deliverablesContext}

## Open Tasks
${tasksContext}

---

# Risks to Score

${risksToScore}

---

Please analyze each risk and provide suggested Likelihood and Impact scores (1-5) based on the context above. Return your response as a JSON object.`;
}
