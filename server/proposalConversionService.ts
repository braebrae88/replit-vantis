import { db } from "./db";
import { eq } from "drizzle-orm";
import { storage } from "./storage";
import { projects, deliverables, milestones, activities, artifacts, artifactSections, proposals } from "@shared/schema";
import type { InsertProject, InsertDeliverable, InsertMilestone, InsertActivity, InsertArtifact, InsertArtifactSection, Project, Deliverable, Activity } from "@shared/schema";
import { DELIVERABLE_TEMPLATES, type DeliverableTemplate } from "./deliverableTemplates";
import { ARTIFACT_TEMPLATES } from "./artifactService";
import { computeNextActions } from "./nextActionsService";
import { callLLM, parseJSONResponse } from "./ai/client";
import { KICKOFF_GENERATION_SYSTEM_PROMPT, buildKickoffPrompt, type KickoffContent } from "./ai/kickoffPrompt";

const STANDARD_DELIVERABLE_TYPES = [
  "activation_map",
  "safe_prototypes", 
  "ms_funding_nav",
  "exec_framing",
] as const;

export interface ConversionResult {
  success: boolean;
  projectId: string;
  projectName: string;
  deliverablesCreated: number;
  artifactsCreated: number;
  kickoffActivityId: string | null;
  kickoffContent: KickoffContent | null;
  nextActionsSeeded: number;
  error?: string;
}

export async function convertProposalToProject(proposalId: string): Promise<ConversionResult> {
  const proposal = await storage.getProposal(proposalId);
  
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.status !== "SIGNED") {
    throw new Error("Proposal must be signed before conversion");
  }

  const kickoffContent = await generateKickoffContent(
    proposal.clientName,
    proposal.title,
    proposal.rawText,
    proposal.estimatedStart,
    proposal.estimatedEnd,
    proposal.rateInfo
  );

  if (!kickoffContent) {
    throw new Error("Failed to generate kickoff content - cannot proceed with conversion");
  }

  let projectId: string;
  let projectName: string;
  let deliverablesCreated = 0;
  let artifactsCreated = 0;
  let kickoffActivityId: string | null = null;
  let activationMapMilestoneId: string | null = null;

  await db.transaction(async (tx) => {
    const projectData: InsertProject = {
      name: proposal.title,
      clientName: proposal.clientName,
      description: `Converted from proposal: ${proposal.title}`,
      phase: "discovery",
      startDate: proposal.estimatedStart,
      endDate: proposal.estimatedEnd,
    };

    const [project] = await tx.insert(projects).values(projectData).returning();
    projectId = project.id;
    projectName = project.name;

    for (const templateType of STANDARD_DELIVERABLE_TYPES) {
      const template = DELIVERABLE_TEMPLATES[templateType];
      if (!template) {
        throw new Error(`Template not found for type: ${templateType}`);
      }

      const deliverableData: InsertDeliverable = {
        projectId: projectId!,
        useCaseId: null,
        name: template.name,
        type: templateType,
        description: template.description,
        status: "not_started",
        estimatedHours: template.estimatedHours,
        orderIndex: deliverablesCreated,
      };

      const [deliverable] = await tx.insert(deliverables).values(deliverableData).returning();
      deliverablesCreated++;

      for (let mi = 0; mi < template.milestones.length; mi++) {
        const milestoneTpl = template.milestones[mi];
        const milestoneData: InsertMilestone = {
          deliverableId: deliverable.id,
          name: milestoneTpl.name,
          description: milestoneTpl.description,
          status: "not_started",
          orderIndex: mi,
          estimatedHours: milestoneTpl.estimatedHours,
        };

        const [milestone] = await tx.insert(milestones).values(milestoneData).returning();

        if (templateType === "activation_map" && mi === 0) {
          activationMapMilestoneId = milestone.id;
        }

        for (let ai = 0; ai < milestoneTpl.activities.length; ai++) {
          const activityTpl = milestoneTpl.activities[ai];
          const activityData: InsertActivity = {
            milestoneId: milestone.id,
            name: activityTpl.name,
            description: activityTpl.description,
            status: "not_started",
            orderIndex: ai,
            estimatedHours: activityTpl.estimatedHours,
            requiresInput: activityTpl.requiresInput ?? false,
            requiredInputs: activityTpl.requiredInputs ?? [],
          };

          await tx.insert(activities).values(activityData);
        }
      }

      const artifactTemplate = ARTIFACT_TEMPLATES[templateType];
      if (artifactTemplate) {
        const artifactData: InsertArtifact = {
          projectId: projectId!,
          deliverableId: deliverable.id,
          type: artifactTemplate.type,
          title: artifactTemplate.title,
          description: artifactTemplate.description,
          completionPct: 0,
        };

        const [artifact] = await tx.insert(artifacts).values(artifactData).returning();
        artifactsCreated++;

        for (let si = 0; si < artifactTemplate.sections.length; si++) {
          const sectionTpl = artifactTemplate.sections[si];
          const sectionData: InsertArtifactSection = {
            artifactId: artifact.id,
            key: sectionTpl.key,
            label: sectionTpl.label,
            status: "empty",
            orderIndex: sectionTpl.orderIndex,
          };

          await tx.insert(artifactSections).values(sectionData);
        }
      }
    }

    if (activationMapMilestoneId) {
      const activityData: InsertActivity = {
        milestoneId: activationMapMilestoneId,
        name: "Project Kickoff Meeting",
        description: kickoffContent.objective,
        status: "not_started",
        orderIndex: 0,
        requiresInput: true,
        requiredInputs: kickoffContent.prepChecklist,
        aiGeneratedGuidance: JSON.stringify({
          recommendedTitle: "Project Kickoff Meeting",
          objective: kickoffContent.objective,
          whenToSchedule: "Within first week of project start",
          recommendedDurationMinutes: kickoffContent.recommendedDurationMinutes,
          recommendedAttendees: kickoffContent.recommendedAttendees.map(a => a.role),
          agenda: kickoffContent.agenda,
          prepChecklist: kickoffContent.prepChecklist,
          outputChecklist: kickoffContent.outputChecklist,
          emailInviteDraft: kickoffContent.emailInviteDraft,
          prepContent: {
            summaryToReview: `Review the Statement of Work and project objectives for ${proposal.clientName}`,
            documentsToBring: [
              { label: "Statement of Work", artifactId: null, suggestedSource: "Proposal document" },
              { label: "Org Chart", artifactId: null, suggestedSource: "Client" },
              { label: "Project Timeline", artifactId: null, suggestedSource: "Planning documents" },
            ],
            dataOrScreenshotsToPrepare: ["Current workflow diagrams", "System landscape overview"],
          },
          projectId: projectId!,
        }),
      };

      const [activity] = await tx.insert(activities).values(activityData).returning();
      kickoffActivityId = activity.id;
    }

    await tx
      .update(proposals)
      .set({ 
        status: "CONVERTED",
        convertedProjectId: projectId!,
      })
      .where(eq(proposals.id, proposalId));
  });

  let nextActionsSeeded = 0;
  try {
    const nextActions = await computeNextActions(projectId!);
    nextActionsSeeded = nextActions.length;
  } catch (error) {
    console.error("Failed to seed next actions (non-critical, can be regenerated):", error);
  }

  return {
    success: true,
    projectId: projectId!,
    projectName: projectName!,
    deliverablesCreated,
    artifactsCreated,
    kickoffActivityId,
    kickoffContent,
    nextActionsSeeded,
  };
}

async function generateKickoffContent(
  clientName: string,
  projectTitle: string,
  rawText: string | null,
  startDate: Date | null,
  endDate: Date | null,
  rateInfo: string | null
): Promise<KickoffContent | null> {
  const userPrompt = buildKickoffPrompt(
    clientName,
    projectTitle,
    rawText,
    startDate,
    endDate,
    rateInfo
  );

  const llmResult = await callLLM({
    systemPrompt: KICKOFF_GENERATION_SYSTEM_PROMPT,
    userContent: userPrompt,
    temperature: 0.4,
    maxTokens: 2500,
  });

  if (!llmResult.success) {
    console.error("LLM call failed for kickoff content:", llmResult.error);
    return null;
  }

  const parsed = parseJSONResponse<KickoffContent>(llmResult.content);
  if (!parsed.success || !parsed.data) {
    console.error("Failed to parse kickoff content:", parsed.error);
    return null;
  }

  return parsed.data;
}
