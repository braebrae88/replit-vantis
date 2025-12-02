import { z } from "zod";

export const kickoffContentSchema = z.object({
  objective: z.string(),
  recommendedAttendees: z.array(z.object({
    role: z.string(),
    rationale: z.string(),
  })),
  recommendedDurationMinutes: z.number(),
  agenda: z.array(z.object({
    time: z.string(),
    topic: z.string(),
    description: z.string().optional(),
  })),
  prepChecklist: z.array(z.string()),
  outputChecklist: z.array(z.string()),
  emailInviteDraft: z.string(),
});

export type KickoffContent = z.infer<typeof kickoffContentSchema>;

export const KICKOFF_GENERATION_SYSTEM_PROMPT = `You are VANTIS, an expert AI consultant specializing in healthcare AI activation projects. Your task is to generate comprehensive project kickoff meeting content based on the signed Statement of Work (SOW).

## Context
A proposal/SOW has been signed with a healthcare organization. You need to generate detailed kickoff meeting content that will set the project up for success.

## Output Requirements

Generate a JSON object with the following structure:

1. **objective**: A detailed 2-3 sentence objective for the kickoff meeting that references the specific project goals from the SOW.

2. **recommendedAttendees**: An array of recommended attendees with their roles and rationale for including them. Consider:
   - Executive Sponsor (decision-making authority)
   - Project Lead / PM (day-to-day coordination)
   - Clinical Leaders (if healthcare workflows involved)
   - IT/Technical Lead (system integrations)
   - Privacy/Security Officer (data handling)
   - Business Analyst (requirements)
   - Process Owners (workflow expertise)
   - Change Management Lead (adoption)

3. **recommendedDurationMinutes**: Suggested meeting duration (typically 60-120 minutes for kickoff).

4. **agenda**: Detailed agenda with time allocations and topics:
   - Introductions and project overview
   - Vision and objectives alignment
   - Scope confirmation
   - Timeline and milestone review
   - Team structure and RASCI
   - Communication and governance
   - Immediate next steps
   - Q&A

5. **prepChecklist**: Items to prepare before the kickoff meeting:
   - Documents to review
   - Materials to prepare
   - Stakeholders to brief
   - Technical items to verify

6. **outputChecklist**: Expected outputs from the kickoff meeting:
   - Decisions to capture
   - Action items to document
   - Artifacts to create
   - Follow-ups to schedule

7. **emailInviteDraft**: A professional email invitation draft that:
   - Has a clear subject line
   - Explains the meeting purpose
   - Lists key attendees
   - Includes a brief agenda
   - Requests confirmation
   - Uses professional healthcare industry tone

## Response Format
Respond with a JSON object matching the schema. Be specific and reference actual project details from the SOW.`;

export function buildKickoffPrompt(
  clientName: string,
  projectTitle: string,
  rawText: string | null,
  startDate: Date | null,
  endDate: Date | null,
  rateInfo: string | null
): string {
  const timeline = startDate && endDate 
    ? `Project Timeline: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
    : startDate 
      ? `Project Start: ${startDate.toISOString().split('T')[0]}`
      : 'Timeline: To be determined';

  return `## Client: ${clientName}
## Project: ${projectTitle}
## ${timeline}
${rateInfo ? `## Rate Information: ${rateInfo}` : ''}

## Statement of Work / Proposal Content:
${rawText || 'No detailed SOW content provided. Generate kickoff content based on the project title and client context for a healthcare AI activation project.'}

Please generate comprehensive kickoff meeting content for this project.`;
}
