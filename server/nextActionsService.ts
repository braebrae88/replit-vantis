import { storage } from "./storage";
import { type NextAction } from "@shared/schema";

export async function computeNextActions(projectId: string): Promise<NextAction[]> {
  const project = await storage.getProject(projectId);
  if (!project) {
    return [];
  }

  const actions: NextAction[] = [];

  const [useCases, tasks, risks, events] = await Promise.all([
    storage.getUseCases(projectId),
    storage.getTasks(projectId),
    storage.getRisks(projectId),
    storage.getEvents(projectId),
  ]);

  const useCaseIds = useCases.map(uc => uc.id);
  const allReadinessScores = await Promise.all(
    useCaseIds.map(ucId => storage.getReadinessScores(ucId))
  );
  const readinessScores = allReadinessScores.flat();

  const useCaseIdsWithScores = new Set(readinessScores.map(rs => rs.useCaseId));
  const useCasesWithoutScores = useCases.filter(uc => !useCaseIdsWithScores.has(uc.id));
  
  for (const useCase of useCasesWithoutScores) {
    actions.push({
      title: `Run readiness assessment for "${useCase.name}"`,
      description: `Use case "${useCase.name}" has no readiness scores. Complete an assessment to track progress.`,
      severity: "medium",
      category: "readiness",
    });
  }

  const now = new Date();
  const overdueTasks = tasks.filter(task => {
    if (task.status === "done") return false;
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < now;
  });

  if (overdueTasks.length > 0) {
    const taskNames = overdueTasks.slice(0, 3).map(t => t.title).join(", ");
    const moreCount = overdueTasks.length > 3 ? ` and ${overdueTasks.length - 3} more` : "";
    actions.push({
      title: "Follow up on overdue tasks",
      description: `${overdueTasks.length} task(s) are past due: ${taskNames}${moreCount}. Review and update their status.`,
      severity: overdueTasks.length >= 5 ? "critical" : overdueTasks.length >= 3 ? "high" : "medium",
      category: "tasks",
    });
  }

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  const recentEvents = events.filter(e => new Date(e.occurredAt) >= fourteenDaysAgo);
  
  if (recentEvents.length === 0) {
    actions.push({
      title: "Schedule a client checkpoint meeting",
      description: "No activity has been logged for this project in the last 14 days. Consider scheduling a sync with stakeholders.",
      severity: "high",
      category: "engagement",
    });
  }

  const openRisksWithoutOwners = risks.filter(risk => {
    const isOpen = risk.status === "identified" || risk.status === "analyzing";
    const hasNoOwner = !risk.owner || risk.owner.trim() === "";
    return isOpen && hasNoOwner;
  });

  if (openRisksWithoutOwners.length > 0) {
    const riskTitles = openRisksWithoutOwners.slice(0, 3).map(r => r.title).join(", ");
    const moreCount = openRisksWithoutOwners.length > 3 ? ` and ${openRisksWithoutOwners.length - 3} more` : "";
    actions.push({
      title: "Assign owners to risks",
      description: `${openRisksWithoutOwners.length} open risk(s) have no assigned owner: ${riskTitles}${moreCount}.`,
      severity: openRisksWithoutOwners.length >= 3 ? "high" : "medium",
      category: "risks",
    });
  }

  const upcomingTasks = tasks.filter(task => {
    if (task.status === "done") return false;
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return dueDate >= now && dueDate <= threeDaysFromNow;
  });

  if (upcomingTasks.length > 0) {
    const taskNames = upcomingTasks.slice(0, 3).map(t => t.title).join(", ");
    const moreCount = upcomingTasks.length > 3 ? ` and ${upcomingTasks.length - 3} more` : "";
    actions.push({
      title: "Tasks due soon",
      description: `${upcomingTasks.length} task(s) are due within 3 days: ${taskNames}${moreCount}.`,
      severity: upcomingTasks.length >= 3 ? "high" : "medium",
      category: "tasks",
    });
  }

  const highRisksUnmitigated = risks.filter(risk => {
    const isHighRisk = (risk.likelihood * risk.impact) >= 16;
    const isUnmitigated = risk.status !== "resolved" && risk.status !== "accepted" && (!risk.mitigation || risk.mitigation.trim() === "");
    return isHighRisk && isUnmitigated;
  });

  if (highRisksUnmitigated.length > 0) {
    const riskTitles = highRisksUnmitigated.slice(0, 3).map(r => r.title).join(", ");
    actions.push({
      title: "Address high-priority risks",
      description: `${highRisksUnmitigated.length} high-risk item(s) require mitigation plans: ${riskTitles}.`,
      severity: "critical",
      category: "risks",
    });
  }

  return actions.sort((a, b) => {
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
  });
}
