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
  "emailInviteDraft": "string - A ready-to-send email invitation for this activity"
}

Guidelines:
- Be specific to the healthcare AI context and Ontario healthcare landscape
- Reference actual stakeholders by name when provided
- Consider recent engagement insights when crafting recommendations
- The agenda should be detailed and realistic
- Prep checklist should include specific documents, data, or stakeholder conversations needed
- Output checklist should include tangible deliverables that can be tracked
- The email draft should be professional, clear, and include the agenda preview`;

export function buildActivityGuidanceUserPrompt(context: {
  activity: { name: string; description: string; status: string };
  milestone: { name: string; description: string };
  deliverable: { name: string; type: string; description: string };
  project: { name: string; clientName: string | null; phase: string };
  stakeholders: Array<{ name: string; role: string; influence: string; sentiment: string | null }>;
  recentInsights: Array<{ title: string; summary: string; sentiment: string | null; type: string }>;
}): string {
  const { activity, milestone, deliverable, project, stakeholders, recentInsights } = context;

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

  if (recentInsights.length > 0) {
    prompt += `\n## Recent Engagement Insights\n`;
    recentInsights.slice(0, 5).forEach((insight) => {
      prompt += `- [${insight.type}] ${insight.title}: ${insight.summary}${insight.sentiment ? ` (${insight.sentiment})` : ''}\n`;
    });
  }

  prompt += `\nGenerate a comprehensive, actionable playbook for executing this activity successfully. Consider the stakeholder dynamics and recent insights when making recommendations.`;

  return prompt;
}
