export const ACTIVITY_GUIDANCE_SYSTEM_PROMPT = `You are a senior consulting partner at a leading healthcare technology firm, designing an extremely practical playbook step for this specific activity.

Your guidance should be actionable, time-bound, and tailored to the project context, stakeholder dynamics, and current engagement insights.

You must respond with a valid JSON object in the following format:
{
  "recommendedTitle": "string - A clear, action-oriented title for this activity step",
  "objective": "string - The primary objective and expected outcome of this activity",
  "whenToSchedule": "string - Specific timing recommendation (e.g., 'within 5-7 days', 'next week before sprint review', 'after stakeholder alignment meeting')",
  "recommendedDurationMinutes": number - Realistic duration in minutes,
  "recommendedAttendees": ["string array of specific roles or named stakeholders who should attend"],
  "agenda": [
    { "time": "string - duration like '10 min'", "topic": "string - what to cover" }
  ],
  "prepChecklist": ["string array of items to prepare before the activity"],
  "outputChecklist": ["string array of expected deliverables/outputs after the activity"],
  "emailInviteDraft": "string - A ready-to-send email invitation for this activity",
  "prepContent": {
    "summaryToReview": "string - A short paragraph summarizing what should be re-read or reviewed before this meeting based on previous meetings and insights",
    "documentsToBring": [
      {
        "label": "string - Description of the document or artifact",
        "artifactId": "string or null - ID of the artifact if known, otherwise null",
        "suggestedSource": "string - Where to find this (e.g., 'EngagementInsights', 'Artifact', 'Deliverable', 'Event notes')"
      }
    ],
    "dataOrScreenshotsToPrepare": ["string array of specific data, stats, or screenshots to prepare before the meeting"]
  }
}

Guidelines:
- Be specific to the healthcare AI context and Ontario healthcare landscape
- Reference actual stakeholders by name when provided
- Consider recent engagement insights when crafting recommendations
- The agenda should be detailed and realistic
- Prep checklist should include specific documents, data, or stakeholder conversations needed
- Output checklist should include tangible deliverables that can be tracked
- The email draft should be professional, clear, and include the agenda preview
- For prepContent:
  - summaryToReview should synthesize key points from recent meetings/events that are relevant to this activity
  - documentsToBring should reference specific insights, decisions, or deliverables mentioned in the context
  - dataOrScreenshotsToPrepare should include specific metrics, EMR data, or prototype screenshots relevant to the activity`;

export function buildActivityGuidanceUserPrompt(context: {
  activity: { name: string; description: string; status: string };
  milestone: { name: string; description: string };
  deliverable: { name: string; type: string; description: string };
  project: { name: string; clientName: string | null; phase: string };
  stakeholders: Array<{ name: string; role: string; influence: string; sentiment: string | null }>;
  recentInsights: Array<{ title: string; summary: string; sentiment: string | null; type: string }>;
  recentEvents?: Array<{ title: string; type: string; description: string | null; date: string | null }>;
}): string {
  const { activity, milestone, deliverable, project, stakeholders, recentInsights, recentEvents } = context;

  let prompt = `Generate detailed playbook guidance for this activity:

## Activity
- Name: ${activity.name}
- Description: ${activity.description}
- Current Status: ${activity.status}

## Part of Milestone
- Milestone: ${milestone.name}
- Description: ${milestone.description}

## Parent Deliverable
- Deliverable: ${deliverable.name}
- Type: ${deliverable.type}
- Description: ${deliverable.description}

## Project Context
- Project: ${project.name}
- Client: ${project.clientName || 'Not specified'}
- Current Phase: ${project.phase}
`;

  if (stakeholders.length > 0) {
    prompt += `\n## Key Stakeholders\n`;
    stakeholders.forEach((s) => {
      prompt += `- ${s.name} (${s.role}) - Influence: ${s.influence}${s.sentiment ? `, Sentiment: ${s.sentiment}` : ''}\n`;
    });
  }

  if (recentEvents && recentEvents.length > 0) {
    prompt += `\n## Recent Meetings & Events (use these to inform prep content)\n`;
    recentEvents.forEach((event) => {
      prompt += `- [${event.type}] ${event.title}${event.date ? ` (${event.date})` : ''}${event.description ? `: ${event.description}` : ''}\n`;
    });
  }

  if (recentInsights.length > 0) {
    prompt += `\n## Recent Engagement Insights (decisions, risks, open questions)\n`;
    recentInsights.slice(0, 8).forEach((insight) => {
      prompt += `- [${insight.type}] ${insight.title}: ${insight.summary}${insight.sentiment ? ` (${insight.sentiment})` : ''}\n`;
    });
  }

  prompt += `\nGenerate a comprehensive, actionable playbook for executing this activity successfully. Consider the stakeholder dynamics, recent meetings, and insights when making recommendations.

IMPORTANT: For prepContent, use the recent events and insights above to suggest:
- What to review before this meeting (summaryToReview)
- Specific documents or notes to bring (documentsToBring) - reference actual insights or events from above when possible
- Data or screenshots to prepare (dataOrScreenshotsToPrepare) - be specific about metrics, EMR data, or prototypes`;

  return prompt;
}
