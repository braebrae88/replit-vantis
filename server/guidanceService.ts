import { storage } from "./storage";
import { DELIVERABLE_TEMPLATES } from "./deliverableTemplates";
import type {
  GuidanceResponse,
  GuidanceStep,
  GuidanceWorkshop,
  GuidanceScopeFlag,
  Activity,
  Milestone,
  Project,
  Deliverable,
} from "@shared/schema";

export interface GuidanceContext {
  project: Project;
  deliverable: Deliverable;
  milestones: Milestone[];
  activities: Array<{ activity: Activity; milestone: Milestone }>;
}

export async function getDeliverableGuidance(
  deliverableId: string
): Promise<{ guidance: GuidanceResponse; context: GuidanceContext } | null> {
  const deliverable = await storage.getDeliverable(deliverableId);
  if (!deliverable) {
    return null;
  }

  const project = await storage.getProject(deliverable.projectId);
  if (!project) {
    return null;
  }

  const deliverableMilestones = await storage.getMilestones(deliverable.id);

  const allActivities: Array<{
    activity: Activity;
    milestone: Milestone;
  }> = [];

  for (const milestone of deliverableMilestones) {
    const milestoneActivities = await storage.getActivities(milestone.id);
    for (const activity of milestoneActivities) {
      allActivities.push({ activity, milestone });
    }
  }

  const [projectWorkflows, projectStakeholders, projectUseCases] = await Promise.all([
    storage.getWorkflowSegments(deliverable.projectId),
    storage.getStakeholders(deliverable.projectId),
    storage.getUseCases(deliverable.projectId),
  ]);

  const useCaseIds = projectUseCases.map((uc) => uc.id);
  const allReadinessScores = await Promise.all(
    useCaseIds.map((ucId) => storage.getReadinessScores(ucId))
  );
  const projectReadinessScores = allReadinessScores.flat();

  const projectData = {
    hasWorkflows: projectWorkflows.length > 0,
    hasStakeholders: projectStakeholders.length > 0,
    hasReadinessScores: projectReadinessScores.length > 0,
    hasUseCases: projectUseCases.length > 0,
    workflowCount: projectWorkflows.length,
    stakeholderCount: projectStakeholders.length,
    readinessScoreCount: projectReadinessScores.length,
    useCaseCount: projectUseCases.length,
  };

  const inputMappings: Record<string, { check: () => boolean; gap: string; category: string }> = {
    "Stakeholder list": {
      check: () => projectData.hasStakeholders,
      gap: "No stakeholders identified for this project",
      category: "stakeholder",
    },
    "Stakeholder feedback form": {
      check: () => projectData.hasStakeholders,
      gap: "No stakeholders identified for feedback collection",
      category: "stakeholder",
    },
    "Use case documentation": {
      check: () => projectData.hasUseCases,
      gap: "No use cases defined for this project",
      category: "use_case",
    },
    "Business requirements": {
      check: () => projectData.hasUseCases,
      gap: "No use cases with business requirements defined",
      category: "use_case",
    },
    "Readiness scores": {
      check: () => projectData.hasReadinessScores,
      gap: "No readiness scores recorded for use cases",
      category: "readiness",
    },
    "Process documentation": {
      check: () => projectData.hasWorkflows,
      gap: "No workflow segments or process documentation defined",
      category: "workflow",
    },
    "Workflow diagram": {
      check: () => projectData.hasWorkflows,
      gap: "No workflow diagrams defined for this project",
      category: "workflow",
    },
  };

  const externalInputGaps: Record<
    string,
    { gap: string; category: string; priority: "high" | "medium" | "low" }
  > = {
    "Calendar availability": {
      gap: "Calendar availability information needed for scheduling",
      category: "scheduling",
      priority: "medium",
    },
    "System access": {
      gap: "System access credentials or permissions required",
      category: "infrastructure",
      priority: "high",
    },
    "Workshop agenda": { gap: "Workshop agenda needs to be prepared", category: "planning", priority: "medium" },
    "Assessment rubric": { gap: "Assessment rubric template required", category: "planning", priority: "medium" },
    "Budget information": {
      gap: "Budget information needs to be gathered from finance",
      category: "finance",
      priority: "high",
    },
    "Funding program details": {
      gap: "Funding program details need to be researched",
      category: "finance",
      priority: "high",
    },
    "Presentation materials": {
      gap: "Presentation materials need to be created",
      category: "deliverable",
      priority: "medium",
    },
    "Data catalog": { gap: "Data catalog or data dictionary required", category: "data", priority: "high" },
    "Schema documentation": { gap: "Database schema documentation needed", category: "data", priority: "medium" },
    "Demo environment": { gap: "Demo environment needs to be set up", category: "infrastructure", priority: "high" },
    "Feedback form": { gap: "Feedback collection form needs to be created", category: "planning", priority: "low" },
    "Test users list": { gap: "Test user list needs to be compiled", category: "testing", priority: "medium" },
    "Testing scenarios": { gap: "Testing scenarios need to be defined", category: "testing", priority: "medium" },
    "Financial projections": {
      gap: "Financial projections required for business case",
      category: "finance",
      priority: "high",
    },
    "Benchmark data": { gap: "Industry benchmark data needed for comparison", category: "research", priority: "medium" },
    "Foundry program documentation": {
      gap: "Microsoft Foundry program documentation needed",
      category: "microsoft",
      priority: "high",
    },
    "Frontier program guidelines": {
      gap: "Microsoft Frontier program guidelines required",
      category: "microsoft",
      priority: "high",
    },
    "ECIF application form": {
      gap: "ECIF application form template needed",
      category: "microsoft",
      priority: "high",
    },
    "Supporting documentation": {
      gap: "Supporting documentation needs to be compiled",
      category: "deliverable",
      priority: "medium",
    },
    "Microsoft contact list": {
      gap: "Microsoft contact list needs to be obtained",
      category: "microsoft",
      priority: "high",
    },
    "Budget details": { gap: "Detailed budget breakdown required", category: "finance", priority: "high" },
    "Project timeline": { gap: "Project timeline needs to be defined", category: "planning", priority: "high" },
    "Team information": { gap: "Team structure and roles information needed", category: "planning", priority: "medium" },
    "Analytics reports": { gap: "Analytics reports need to be generated", category: "data", priority: "medium" },
    "Performance dashboards": {
      gap: "Performance dashboards need to be set up",
      category: "data",
      priority: "medium",
    },
    "Cost estimates": { gap: "Cost estimates need to be prepared", category: "finance", priority: "high" },
    "Benefit projections": { gap: "Benefit projections need to be calculated", category: "finance", priority: "high" },
    "Budget requirements": { gap: "Budget requirements need to be documented", category: "finance", priority: "high" },
    "Resource needs": { gap: "Resource requirements need to be identified", category: "planning", priority: "medium" },
    "Draft presentation": { gap: "Draft presentation needs to be prepared", category: "deliverable", priority: "medium" },
    "Supporting materials": { gap: "Supporting materials need to be gathered", category: "deliverable", priority: "low" },
    "Executive talking points": {
      gap: "Executive talking points need to be drafted",
      category: "executive",
      priority: "high",
    },
    "ROI analysis": { gap: "ROI analysis needs to be completed", category: "finance", priority: "high" },
    "Risk assessment": { gap: "Risk assessment needs to be conducted", category: "planning", priority: "high" },
    "Change management plan": {
      gap: "Change management plan needs to be developed",
      category: "planning",
      priority: "medium",
    },
    "Training materials": { gap: "Training materials need to be prepared", category: "deliverable", priority: "medium" },
    "User documentation": { gap: "User documentation needs to be created", category: "deliverable", priority: "low" },
    "Technical specifications": {
      gap: "Technical specifications need to be documented",
      category: "technical",
      priority: "high",
    },
    "Integration requirements": {
      gap: "Integration requirements need to be defined",
      category: "technical",
      priority: "high",
    },
    "Security requirements": {
      gap: "Security requirements need to be documented",
      category: "technical",
      priority: "high",
    },
    "Compliance checklist": {
      gap: "Compliance checklist needs to be completed",
      category: "compliance",
      priority: "high",
    },
    "Vendor evaluation": { gap: "Vendor evaluation needs to be conducted", category: "procurement", priority: "medium" },
    "Contract terms": { gap: "Contract terms need to be reviewed", category: "legal", priority: "high" },
  };

  const checkInputAvailability = (
    input: string
  ): { available: boolean; gap: string | null; category: string | null } => {
    for (const [key, mapping] of Object.entries(inputMappings)) {
      if (input.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(input.toLowerCase())) {
        return {
          available: mapping.check(),
          gap: mapping.check() ? null : mapping.gap,
          category: mapping.category,
        };
      }
    }
    for (const [key, info] of Object.entries(externalInputGaps)) {
      if (input.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(input.toLowerCase())) {
        return {
          available: false,
          gap: info.gap,
          category: info.category,
        };
      }
    }
    return { available: false, gap: `"${input}" needs to be gathered`, category: "external" };
  };

  const openActivities = allActivities.filter(
    ({ activity }) => activity.status === "not_started" || activity.status === "blocked"
  );

  const nextBestSteps: GuidanceStep[] = [];
  const overallGaps: Set<string> = new Set();
  const milestonesWithWorkshop: Set<string> = new Set();

  for (const { activity, milestone } of openActivities) {
    const missingInputs: string[] = [];
    const suggestedTasks: string[] = [];
    const inputCategories: Set<string> = new Set();

    if (activity.requiresInput && activity.requiredInputs.length > 0) {
      for (const input of activity.requiredInputs) {
        const result = checkInputAvailability(input);
        if (!result.available) {
          missingInputs.push(input);
          if (result.gap) {
            overallGaps.add(result.gap);
          }
          if (result.category) {
            inputCategories.add(result.category);
          }
          suggestedTasks.push(`Gather required input: ${input}`);
        }
      }
    }

    let riskIfIgnored: "Low" | "Medium" | "High" = "Low";
    if (milestone.orderIndex === 0) {
      riskIfIgnored = "High";
    } else if (activity.status === "blocked") {
      riskIfIgnored = "High";
    } else if (missingInputs.length > 2) {
      riskIfIgnored = "Medium";
    } else if (missingInputs.length > 0) {
      riskIfIgnored = "Low";
    }

    const template = DELIVERABLE_TEMPLATES.find((t) => t.type === deliverable.type);

    let suggestedWorkshop: GuidanceWorkshop | null = null;
    if (missingInputs.length > 0 && milestone.orderIndex <= 1 && !milestonesWithWorkshop.has(milestone.id)) {
      const workshopKey = milestone.suggestedWorkshopKey;
      if (workshopKey && template?.workshopTemplates) {
        const workshopTemplate = template.workshopTemplates.find((w) => w.key === workshopKey);
        if (workshopTemplate) {
          suggestedWorkshop = {
            key: workshopTemplate.key,
            title: workshopTemplate.title,
            objective: workshopTemplate.objective,
            durationMinutes: workshopTemplate.durationMinutes,
            recommendedAttendees: workshopTemplate.recommendedAttendees,
            agenda: workshopTemplate.agenda,
          };
        }
      }
      if (suggestedWorkshop) {
        milestonesWithWorkshop.add(milestone.id);
      }
    }

    if (missingInputs.length > 0 || (activity.status === "not_started" && milestone.orderIndex === 0)) {
      nextBestSteps.push({
        activityId: activity.id,
        milestoneName: milestone.name,
        activityName: activity.name,
        description: activity.description,
        missingInputs,
        suggestedTasks,
        suggestedWorkshop,
        riskIfIgnored,
      });
    }
  }

  nextBestSteps.sort((a, b) => {
    const riskOrder = { High: 0, Medium: 1, Low: 2 };
    return riskOrder[a.riskIfIgnored] - riskOrder[b.riskIfIgnored];
  });

  const scopeFlags: GuidanceScopeFlag[] = [];

  if (project.endDate) {
    const daysUntilEnd = Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilEnd <= 14 && openActivities.length > 5) {
      scopeFlags.push({
        type: "schedule_risk",
        severity: "critical",
        message: `Project ends in ${daysUntilEnd} days but ${openActivities.length} activities remain open`,
      });
    } else if (daysUntilEnd <= 30 && openActivities.length > 10) {
      scopeFlags.push({
        type: "schedule_risk",
        severity: "warning",
        message: `Project ends in ${daysUntilEnd} days with ${openActivities.length} activities still pending`,
      });
    }
  }

  const activitiesWithMissingInputs = nextBestSteps.filter((s) => s.missingInputs.length > 0);
  if (activitiesWithMissingInputs.length >= 3) {
    scopeFlags.push({
      type: "dependency_risk",
      severity: activitiesWithMissingInputs.length >= 5 ? "critical" : "warning",
      message: `${activitiesWithMissingInputs.length} activities are blocked waiting for inputs that don't exist yet`,
    });
  }

  const totalActivities = allActivities.length;
  const completedActivities = allActivities.filter(({ activity }) => activity.status === "done").length;
  const progressPercent = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  let notes = "";
  if (openActivities.length === 0) {
    notes = "All activities are complete. This deliverable is ready for final review.";
  } else if (nextBestSteps.length === 0) {
    notes = "All open activities have their required inputs. Work can proceed.";
  } else if (scopeFlags.some((f) => f.severity === "critical")) {
    notes = "Critical risks detected. Immediate attention required to avoid project delays.";
  } else {
    notes = `${nextBestSteps.length} activities need attention. Focus on high-risk items first.`;
  }

  const guidance: GuidanceResponse = {
    deliverableSummary: {
      id: deliverable.id,
      type: deliverable.type,
      name: deliverable.name,
      status: deliverable.status,
      progress: progressPercent,
    },
    nextBestSteps: nextBestSteps.slice(0, 10),
    overallGaps: Array.from(overallGaps),
    scopeFlags,
    notes,
  };

  const context: GuidanceContext = {
    project,
    deliverable,
    milestones: deliverableMilestones,
    activities: allActivities,
  };

  return { guidance, context };
}
