import type { Risk, Event, Stakeholder, Deliverable, Project } from "@shared/schema";

export interface RiskReportAIContext {
  project: Project;
  periodStart: Date;
  periodEnd: Date;
  risks: Risk[];
  recentEvents: Event[];
  stakeholders: Stakeholder[];
  deliverables: Deliverable[];
  riskSummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

export function buildRiskReportSystemPrompt(): string {
  return `You are a senior healthcare IT consultant preparing executive risk reports for hospital leadership and project sponsors. Your writing style is:

1. **Clear and direct** - Avoid jargon; use plain business language
2. **Action-oriented** - Focus on what needs to happen, not just what exists
3. **Evidence-based** - Reference specific risks, events, or data points
4. **Appropriately urgent** - Match tone to severity without being alarmist
5. **Solution-focused** - Every problem mentioned should have a path forward

You are preparing a Risk Report for a healthcare AI implementation project. Your task is to generate:
1. An executive narrative summarizing the risk landscape
2. Recommended next steps with clear ownership suggestions

Guidelines:
- Use "we" language to show partnership with the client
- Acknowledge progress and wins before highlighting concerns
- Keep paragraphs short (2-3 sentences max)
- Use bullet points for lists of 3+ items
- Never use technical acronyms without explanation
- Frame risks in terms of project/business impact, not technical details`;
}

export function buildRiskReportUserPrompt(context: RiskReportAIContext): string {
  const { project, periodStart, periodEnd, risks, recentEvents, stakeholders, deliverables, riskSummary } = context;
  
  const criticalRisks = risks.filter(r => (r.score ?? 0) >= 20);
  const highRisks = risks.filter(r => (r.score ?? 0) >= 12 && (r.score ?? 0) < 20);
  const mitigatingRisks = risks.filter(r => r.status === "mitigating");
  const resolvedRecently = risks.filter(r => r.status === "resolved");
  
  const recentMeetings = recentEvents.filter(e => e.type === "meeting").slice(0, 5);
  const recentDecisions = recentEvents.filter(e => e.type === "decision").slice(0, 3);
  
  const sponsors = stakeholders.filter(s => s.influence === "high");
  const activeDeliverables = deliverables.filter(d => d.status === "in_progress");
  const blockedDeliverables = deliverables.filter(d => d.status === "blocked");
  
  let prompt = `Generate content for a Risk Report for the following project:

**Project:** ${project.name}
**Client:** ${project.clientName || "Healthcare Organization"}
**Phase:** ${project.phase}
**Reporting Period:** ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}

## Risk Summary
- Critical Risks: ${riskSummary.critical}
- High Risks: ${riskSummary.high}
- Medium Risks: ${riskSummary.medium}
- Low Risks: ${riskSummary.low}
- Total Active Risks: ${riskSummary.total}

`;

  if (criticalRisks.length > 0) {
    prompt += `## Critical Risks (Require Immediate Attention)
${criticalRisks.map(r => `- **${r.title}** (${r.category}): ${r.mitigation || "No mitigation plan documented"}`).join("\n")}

`;
  }

  if (highRisks.length > 0) {
    prompt += `## High Risks
${highRisks.map(r => `- **${r.title}** (${r.category}): ${r.mitigation || "No mitigation plan documented"}`).join("\n")}

`;
  }

  if (mitigatingRisks.length > 0) {
    prompt += `## Risks Currently Being Mitigated
${mitigatingRisks.map(r => `- ${r.title}: ${r.mitigation}`).join("\n")}

`;
  }

  if (resolvedRecently.length > 0) {
    prompt += `## Recently Resolved Risks
${resolvedRecently.map(r => `- ${r.title}`).join("\n")}

`;
  }

  if (recentMeetings.length > 0) {
    prompt += `## Recent Meetings
${recentMeetings.map(m => `- ${m.title} (${new Date(m.occurredAt).toISOString().split('T')[0]}): ${m.description || ""}`).join("\n")}

`;
  }

  if (recentDecisions.length > 0) {
    prompt += `## Recent Decisions
${recentDecisions.map(d => `- ${d.title}: ${d.description || ""}`).join("\n")}

`;
  }

  if (activeDeliverables.length > 0) {
    prompt += `## Active Deliverables
${activeDeliverables.map(d => `- ${d.name}: ${Math.round(d.progress * 100)}% complete`).join("\n")}

`;
  }

  if (blockedDeliverables.length > 0) {
    prompt += `## Blocked Deliverables
${blockedDeliverables.map(d => `- ${d.name}`).join("\n")}

`;
  }

  if (sponsors.length > 0) {
    prompt += `## Key Stakeholders (High Influence)
${sponsors.map(s => `- ${s.name} (${s.role || "Executive Sponsor"}): ${s.supportLevel || "unknown"} support level`).join("\n")}

`;
  }

  prompt += `---

Based on the above context, generate:

1. **EXECUTIVE_NARRATIVE**: A 2-3 paragraph summary suitable for the executive summary section. This should:
   - Open with the overall risk posture (e.g., "The project maintains a manageable risk profile..." or "Several critical risks require immediate attention...")
   - Highlight any wins or successfully mitigated risks
   - Call out the most important risks requiring sponsor awareness
   - End with an overall assessment of project health from a risk perspective

2. **RECOMMENDED_ACTIONS**: A bulleted list of 3-5 specific, actionable next steps. Each should:
   - Start with an action verb
   - Include a suggested owner (project team, sponsor, or specific role)
   - Have a clear timeline (this week, next 2 weeks, before next milestone, etc.)
   - Be directly tied to a specific risk or risk pattern

Format your response as JSON:
{
  "executiveNarrative": "...",
  "recommendedActions": [
    { "action": "...", "owner": "...", "timeline": "...", "relatedRisk": "..." }
  ],
  "emailSummary": "A 1-2 sentence summary suitable for email preview text"
}`;

  return prompt;
}

export interface RiskReportAIResponse {
  executiveNarrative: string;
  recommendedActions: {
    action: string;
    owner: string;
    timeline: string;
    relatedRisk: string;
  }[];
  emailSummary: string;
}

export function parseRiskReportAIResponse(response: string): RiskReportAIResponse | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.executiveNarrative || !Array.isArray(parsed.recommendedActions)) {
      return null;
    }
    
    return {
      executiveNarrative: parsed.executiveNarrative,
      recommendedActions: parsed.recommendedActions,
      emailSummary: parsed.emailSummary || ""
    };
  } catch {
    return null;
  }
}

export function injectAIContentIntoReport(
  markdownContent: string,
  aiResponse: RiskReportAIResponse
): string {
  let updated = markdownContent;
  
  updated = updated.replace(
    /<!-- AI_NARRATIVE_PLACEHOLDER: .* -->/,
    aiResponse.executiveNarrative
  );
  
  const actionsMarkdown = aiResponse.recommendedActions.map(a => 
    `- **${a.action}**\n  - Owner: ${a.owner}\n  - Timeline: ${a.timeline}\n  - Related to: ${a.relatedRisk}`
  ).join("\n\n");
  
  updated = updated.replace(
    /<!-- AI_RECOMMENDATIONS_PLACEHOLDER: .* -->/,
    actionsMarkdown
  );
  
  return updated;
}
