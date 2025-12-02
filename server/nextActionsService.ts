import { storage } from "./storage";
import { type NextAction, type VantisPhase, type NextActionUrgency, type NextActionSeverity, type NextActionLinkedType } from "@shared/schema";
import { randomUUID } from "crypto";

function mapProjectPhaseToVantis(phase: string): VantisPhase {
  const phaseMap: Record<string, VantisPhase> = {
    discovery: "DISCOVER",
    design: "MAP",
    development: "PROTOTYPE",
    deployment: "UNLOCK",
    maintenance: "UNLOCK",
  };
  return phaseMap[phase.toLowerCase()] || "DISCOVER";
}

function formatDueDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

function createAction(
  title: string,
  description: string,
  phase: VantisPhase,
  urgency: NextActionUrgency,
  severity: NextActionSeverity,
  category: NextAction["category"],
  linkedType: NextActionLinkedType = "OTHER",
  linkedId: string | null = null,
  suggestedDueDays: number | null = null
): NextAction {
  return {
    id: randomUUID(),
    title,
    description,
    suggestedDueDate: suggestedDueDays !== null ? formatDueDate(suggestedDueDays) : null,
    linkedType,
    linkedId,
    phase,
    urgency,
    severity,
    category,
  };
}

export async function computeNextActionsForProject(projectId: string): Promise<NextAction[]> {
  const project = await storage.getProject(projectId);
  if (!project) {
    return [];
  }

  const currentPhase = mapProjectPhaseToVantis(project.phase);
  const actions: NextAction[] = [];
  const now = new Date();

  const [useCases, tasks, risks, events, stakeholders, engagementInsights] = await Promise.all([
    storage.getUseCases(projectId),
    storage.getTasks(projectId),
    storage.getRisks(projectId),
    storage.getEvents(projectId),
    storage.getStakeholders(projectId),
    storage.getEngagementInsights(projectId),
  ]);

  let deliverables: any[] = [];
  let allActivities: any[] = [];
  try {
    deliverables = await storage.getDeliverables(projectId);
    for (const deliverable of deliverables) {
      const milestones = await storage.getMilestones(deliverable.id);
      for (const milestone of milestones) {
        const activities = await storage.getActivities(milestone.id);
        allActivities.push(...activities.map(a => ({
          ...a,
          deliverableId: deliverable.id,
          deliverableName: deliverable.name,
          milestoneName: milestone.name,
        })));
      }
    }
  } catch (e) {
  }

  const useCaseIds = useCases.map(uc => uc.id);
  const allReadinessScores = await Promise.all(
    useCaseIds.map(ucId => storage.getReadinessScores(ucId))
  );
  const readinessScores = allReadinessScores.flat();

  if (currentPhase === "DISCOVER") {
    if (stakeholders.length === 0) {
      actions.push(createAction(
        "Identify key stakeholders",
        "No stakeholders have been added to this project. Identify and add key decision-makers, champions, and blockers.",
        currentPhase,
        "NOW",
        "critical",
        "stakeholders",
        "OTHER",
        null,
        2
      ));
    }

    const hasKickoffEvent = events.some(e => 
      e.title.toLowerCase().includes("kickoff") || 
      e.title.toLowerCase().includes("kick-off") ||
      e.description?.toLowerCase().includes("kickoff")
    );
    if (!hasKickoffEvent && events.length < 2) {
      actions.push(createAction(
        "Schedule stakeholder kickoff meeting",
        "No kickoff meeting has been logged. Schedule an initial meeting with key stakeholders to align on project goals.",
        currentPhase,
        "NOW",
        "high",
        "engagement",
        "OTHER",
        null,
        3
      ));
    }

    if (useCases.length === 0) {
      actions.push(createAction(
        "Discover and document use cases",
        "No use cases have been defined. Work with stakeholders to identify the primary workflows and pain points.",
        currentPhase,
        "NOW",
        "high",
        "readiness",
        "OTHER",
        null,
        5
      ));
    }

    const hasSowTask = tasks.some(t => 
      t.title.toLowerCase().includes("sow") || 
      t.title.toLowerCase().includes("statement of work") ||
      t.title.toLowerCase().includes("scope")
    );
    if (!hasSowTask) {
      actions.push(createAction(
        "Confirm Statement of Work",
        "Ensure the Statement of Work (SoW) is finalized and approved by all parties before proceeding.",
        currentPhase,
        "SOON",
        "medium",
        "tasks",
        "OTHER",
        null,
        7
      ));
    }
  }

  if (currentPhase === "MAP") {
    const useCasesWithoutScores = useCases.filter(uc => 
      !readinessScores.some(rs => rs.useCaseId === uc.id)
    );
    for (const useCase of useCasesWithoutScores) {
      actions.push(createAction(
        `Complete readiness assessment for "${useCase.name}"`,
        `Use case "${useCase.name}" needs a readiness assessment to identify gaps and dependencies.`,
        currentPhase,
        "NOW",
        "high",
        "readiness",
        "OTHER",
        useCase.id,
        3
      ));
    }

    const hasDataGovernanceRisk = risks.some(r => 
      r.category === "compliance" || 
      r.category === "security" ||
      r.title.toLowerCase().includes("data") ||
      r.title.toLowerCase().includes("governance")
    );
    if (!hasDataGovernanceRisk && useCases.length > 0) {
      actions.push(createAction(
        "Clarify data governance requirements",
        "No data governance risks or considerations have been documented. Review data access, privacy, and compliance requirements.",
        currentPhase,
        "SOON",
        "medium",
        "risks",
        "OTHER",
        null,
        5
      ));
    }

    const lowScores = readinessScores.filter(rs => rs.score < 3);
    if (lowScores.length > 0) {
      const affectedUCs = useCases.filter(uc => 
        lowScores.some(rs => rs.useCaseId === uc.id)
      );
      if (affectedUCs.length > 0) {
        actions.push(createAction(
          "Address low readiness scores",
          `${affectedUCs.length} use case(s) have readiness gaps that need attention before prototyping.`,
          currentPhase,
          "NOW",
          "high",
          "readiness",
          "OTHER",
          null,
          5
        ));
      }
    }
  }

  if (currentPhase === "PROTOTYPE") {
    const sprintTasks = tasks.filter(t => 
      t.title.toLowerCase().includes("sprint") ||
      t.title.toLowerCase().includes("prototype") ||
      t.title.toLowerCase().includes("build")
    );
    if (sprintTasks.length === 0 && useCases.length > 0) {
      actions.push(createAction(
        "Create sprint plan for prototyping",
        "No sprint or prototype tasks have been created. Define the build scope and timeline.",
        currentPhase,
        "NOW",
        "high",
        "tasks",
        "OTHER",
        null,
        2
      ));
    }

    const feedbackEvents = events.filter(e => 
      e.title.toLowerCase().includes("review") ||
      e.title.toLowerCase().includes("demo") ||
      e.title.toLowerCase().includes("feedback")
    );
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentFeedback = feedbackEvents.filter(e => new Date(e.occurredAt) >= sevenDaysAgo);
    
    if (sprintTasks.length > 0 && recentFeedback.length === 0) {
      actions.push(createAction(
        "Schedule prototype review session",
        "No recent prototype review or demo has been logged. Schedule a feedback session with stakeholders.",
        currentPhase,
        "SOON",
        "medium",
        "engagement",
        "OTHER",
        null,
        3
      ));
    }

    const prototypeRisks = risks.filter(r => 
      r.status === "identified" || r.status === "analyzing"
    ).filter(r => 
      r.category === "technical" || r.category === "operational"
    );
    if (prototypeRisks.length > 0) {
      for (const risk of prototypeRisks.slice(0, 2)) {
        actions.push(createAction(
          `Address prototype risk: ${risk.title}`,
          risk.mitigation || "This risk could impact prototype delivery. Review and mitigate.",
          currentPhase,
          "NOW",
          risk.likelihood * risk.impact >= 12 ? "critical" : "high",
          "risks",
          "RISK",
          risk.id,
          3
        ));
      }
    }
  }

  if (currentPhase === "UNLOCK") {
    const hasImpactStory = engagementInsights.some(ei => 
      ei.type === "meeting_summary" && 
      (ei.summary?.toLowerCase().includes("impact") || ei.summary?.toLowerCase().includes("value"))
    );
    if (!hasImpactStory) {
      actions.push(createAction(
        "Generate impact story for executives",
        "Prepare a compelling narrative showcasing the value delivered and ROI for executive stakeholders.",
        currentPhase,
        "NOW",
        "high",
        "engagement",
        "OTHER",
        null,
        5
      ));
    }

    const hasRoadmapTask = tasks.some(t => 
      t.title.toLowerCase().includes("roadmap") ||
      t.title.toLowerCase().includes("scale") ||
      t.title.toLowerCase().includes("expansion")
    );
    if (!hasRoadmapTask) {
      actions.push(createAction(
        "Define scale and expansion roadmap",
        "Create a roadmap for scaling the solution across the organization.",
        currentPhase,
        "SOON",
        "high",
        "tasks",
        "OTHER",
        null,
        7
      ));
    }

    const champions = stakeholders.filter(s => 
      s.supportLevel === "champion" || s.influence === "high"
    );
    if (champions.length === 0) {
      actions.push(createAction(
        "Identify executive champions",
        "No executive champions have been identified. Find advocates who can sponsor the scale-up.",
        currentPhase,
        "SOON",
        "medium",
        "stakeholders",
        "OTHER",
        null,
        5
      ));
    }
  }

  const overdueTasks = tasks.filter(task => {
    if (task.status === "done") return false;
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < now;
  });

  for (const task of overdueTasks.slice(0, 5)) {
    const daysOverdue = Math.floor((now.getTime() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24));
    actions.push(createAction(
      `Overdue: ${task.title}`,
      `This task is ${daysOverdue} day(s) overdue. ${task.description || "Review and update status."}`,
      currentPhase,
      "NOW",
      daysOverdue > 7 ? "critical" : daysOverdue > 3 ? "high" : "medium",
      "tasks",
      "TASK",
      task.id,
      0
    ));
  }

  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  const upcomingTasks = tasks.filter(task => {
    if (task.status === "done") return false;
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= now && dueDate <= threeDaysFromNow;
  });

  for (const task of upcomingTasks.slice(0, 3)) {
    actions.push(createAction(
      `Due soon: ${task.title}`,
      task.description || "This task is due within the next 3 days.",
      currentPhase,
      "SOON",
      task.priority === "critical" ? "high" : "medium",
      "tasks",
      "TASK",
      task.id,
      null
    ));
  }

  const highRisks = risks.filter(risk => {
    const score = risk.likelihood * risk.impact;
    const isOpen = risk.status !== "resolved" && risk.status !== "accepted";
    return score >= 12 && isOpen;
  });

  for (const risk of highRisks.slice(0, 3)) {
    if (!actions.some(a => a.linkedId === risk.id)) {
      actions.push(createAction(
        `Mitigate: ${risk.title}`,
        risk.mitigation 
          ? `Mitigation in progress: ${risk.mitigation}` 
          : "This high-risk item needs a mitigation plan.",
        currentPhase,
        risk.likelihood * risk.impact >= 16 ? "NOW" : "SOON",
        risk.likelihood * risk.impact >= 16 ? "critical" : "high",
        "risks",
        "RISK",
        risk.id,
        5
      ));
    }
  }

  const risksWithoutOwners = risks.filter(risk => {
    const isOpen = risk.status === "identified" || risk.status === "analyzing";
    return isOpen && (!risk.owner || risk.owner.trim() === "");
  });

  if (risksWithoutOwners.length > 0) {
    actions.push(createAction(
      `Assign owners to ${risksWithoutOwners.length} risk(s)`,
      `Risks without owners: ${risksWithoutOwners.slice(0, 3).map(r => r.title).join(", ")}`,
      currentPhase,
      "SOON",
      risksWithoutOwners.length >= 3 ? "high" : "medium",
      "risks",
      "OTHER",
      null,
      3
    ));
  }

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const recentEvents = events.filter(e => new Date(e.occurredAt) >= fourteenDaysAgo);

  if (recentEvents.length === 0) {
    actions.push(createAction(
      "Schedule stakeholder checkpoint",
      "No client activity has been logged in 14+ days. Schedule a sync to maintain momentum.",
      currentPhase,
      "NOW",
      "high",
      "engagement",
      "OTHER",
      null,
      2
    ));
  }

  const pendingActivities = allActivities.filter(a => 
    a.status === "not_started" || a.status === "in_progress"
  );

  for (const activity of pendingActivities.slice(0, 3)) {
    const urgency: NextActionUrgency = activity.status === "in_progress" ? "NOW" : "SOON";
    actions.push(createAction(
      `${activity.status === "in_progress" ? "Complete" : "Start"}: ${activity.name}`,
      `Part of ${activity.deliverableName} > ${activity.milestoneName}. ${activity.description || ""}`,
      currentPhase,
      urgency,
      "medium",
      "activities",
      "ACTIVITY",
      activity.id,
      activity.status === "in_progress" ? 2 : 5
    ));
  }

  const workshopActivities = allActivities.filter(a => 
    a.name.toLowerCase().includes("workshop") && 
    (a.status === "not_started" || a.status === "in_progress")
  );

  for (const workshop of workshopActivities.slice(0, 2)) {
    if (!actions.some(a => a.linkedId === workshop.id)) {
      actions.push(createAction(
        `Schedule workshop: ${workshop.name}`,
        workshop.description || "This workshop needs to be scheduled with stakeholders.",
        currentPhase,
        "SOON",
        "medium",
        "activities",
        "WORKSHOP",
        workshop.id,
        7
      ));
    }
  }

  const uniqueActions = actions.reduce((acc, action) => {
    const key = action.linkedId ? `${action.linkedType}-${action.linkedId}` : action.title;
    if (!acc.has(key)) {
      acc.set(key, action);
    }
    return acc;
  }, new Map<string, NextAction>());

  const sortedActions = Array.from(uniqueActions.values()).sort((a, b) => {
    const urgencyOrder: Record<NextActionUrgency, number> = { NOW: 0, SOON: 1, LATER: 2 };
    const severityOrder: Record<NextActionSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return sortedActions;
}

export { computeNextActionsForProject as computeNextActions };
