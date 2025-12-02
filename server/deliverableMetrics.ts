import { db } from "./db";
import { deliverables, milestones, activities, risks } from "@shared/schema";
import { eq, and, or, sql, lt } from "drizzle-orm";
import { storage } from "./storage";

export interface DeliverableMetrics {
  progress: number;
  totalHoursEstimate: number;
  hoursRemaining: number;
  openRiskCount: number;
  blockedActivityCount: number;
  blockedMilestoneCount: number;
  totalActivities: number;
  completedActivities: number;
}

const STALE_DAYS_THRESHOLD = 7;

export async function recalculateDeliverableMetrics(deliverableId: string): Promise<DeliverableMetrics | null> {
  const deliverable = await storage.getDeliverable(deliverableId);
  if (!deliverable) {
    return null;
  }

  const deliverableMilestones = await storage.getMilestones(deliverableId);
  
  let totalActivities = 0;
  let completedActivities = 0;
  let blockedActivityCount = 0;
  let blockedMilestoneCount = 0;
  let totalHoursEstimate = 0;
  let completedHours = 0;

  for (const milestone of deliverableMilestones) {
    if (milestone.status === "blocked") {
      blockedMilestoneCount++;
    }
    
    totalHoursEstimate += milestone.expectedHours || 0;
    
    const milestoneActivities = await storage.getActivities(milestone.id);
    const milestoneActivityCount = milestoneActivities.length;
    const milestoneDoneCount = milestoneActivities.filter(a => a.status === "done").length;
    
    totalActivities += milestoneActivityCount;
    completedActivities += milestoneDoneCount;
    
    for (const activity of milestoneActivities) {
      if (activity.status === "blocked") {
        blockedActivityCount++;
      }
    }

    if (milestoneActivityCount > 0 && milestone.expectedHours) {
      const milestoneProgressRatio = milestoneDoneCount / milestoneActivityCount;
      completedHours += milestone.expectedHours * milestoneProgressRatio;
    }
  }

  const progress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
  const hoursRemaining = Math.max(0, totalHoursEstimate - completedHours);

  const projectRisks = await storage.getRisks(deliverable.projectId);
  const openRiskCount = projectRisks.filter(r => 
    r.status === "identified" || r.status === "analyzing" || r.status === "mitigating"
  ).length;

  await db.update(deliverables)
    .set({
      progress,
      totalHours: totalHoursEstimate,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      status: determineDeliverableStatus(progress, blockedActivityCount, blockedMilestoneCount),
      updatedAt: new Date(),
    })
    .where(eq(deliverables.id, deliverableId));

  return {
    progress,
    totalHoursEstimate,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    openRiskCount,
    blockedActivityCount,
    blockedMilestoneCount,
    totalActivities,
    completedActivities,
  };
}

function determineDeliverableStatus(
  progress: number,
  blockedActivities: number,
  blockedMilestones: number
): "not_started" | "in_progress" | "blocked" | "done" {
  if (progress >= 100) {
    return "done";
  }
  if (blockedActivities > 0 || blockedMilestones > 0) {
    return "blocked";
  }
  if (progress > 0) {
    return "in_progress";
  }
  return "not_started";
}

export async function checkAndCreateBlockedRisks(
  deliverableId: string,
  entityType: "milestone" | "activity",
  entityId: string,
  entityName: string,
  milestoneName?: string
): Promise<void> {
  const deliverable = await storage.getDeliverable(deliverableId);
  if (!deliverable) {
    return;
  }

  const riskTitle = entityType === "milestone"
    ? `Deliverable "${deliverable.name}" is blocked at milestone "${entityName}"`
    : `Deliverable "${deliverable.name}" is blocked at activity "${entityName}" (${milestoneName || "unknown milestone"})`;

  const existingRisks = await storage.getRisks(deliverable.projectId);
  const existingRisk = existingRisks.find(r => 
    r.title === riskTitle && (r.status === "identified" || r.status === "analyzing" || r.status === "mitigating")
  );

  if (!existingRisk) {
    await storage.createRisk({
      projectId: deliverable.projectId,
      title: riskTitle,
      category: "operational",
      likelihood: 3,
      impact: 3,
      mitigation: `Review blocked ${entityType} and resolve dependencies or blockers.`,
      status: "identified",
    });
  }
}

export async function checkStaleInputsAndCreateRisks(deliverableId: string): Promise<void> {
  const deliverable = await storage.getDeliverable(deliverableId);
  if (!deliverable) {
    return;
  }

  const deliverableMilestones = await storage.getMilestones(deliverableId);
  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - STALE_DAYS_THRESHOLD);

  for (const milestone of deliverableMilestones) {
    const milestoneActivities = await storage.getActivities(milestone.id);

    for (const activity of milestoneActivities) {
      if (
        activity.requiresInput &&
        activity.requiredInputs.length > 0 &&
        activity.status !== "done" &&
        activity.createdAt &&
        new Date(activity.createdAt) < staleThreshold
      ) {
        const riskTitle = `Missing inputs for "${activity.name}" pending > ${STALE_DAYS_THRESHOLD} days`;
        
        const existingRisks = await storage.getRisks(deliverable.projectId);
        const existingRisk = existingRisks.find(r => 
          r.title === riskTitle && (r.status === "identified" || r.status === "analyzing" || r.status === "mitigating")
        );

        if (!existingRisk) {
          await storage.createRisk({
            projectId: deliverable.projectId,
            title: riskTitle,
            category: "operational",
            likelihood: 3,
            impact: 2,
            mitigation: `Escalate missing inputs: ${activity.requiredInputs.join(", ")}. Consider scheduling a workshop to unblock.`,
            status: "identified",
          });
        }
      }
    }
  }
}

export async function getDeliverableMetrics(deliverableId: string): Promise<DeliverableMetrics | null> {
  await checkStaleInputsAndCreateRisks(deliverableId);
  return recalculateDeliverableMetrics(deliverableId);
}

export async function onMilestoneStatusChange(
  milestoneId: string,
  newStatus: string
): Promise<void> {
  const milestone = await storage.getMilestone(milestoneId);
  if (!milestone) return;

  if (newStatus === "blocked") {
    await checkAndCreateBlockedRisks(
      milestone.deliverableId,
      "milestone",
      milestoneId,
      milestone.name
    );
  }

  await recalculateDeliverableMetrics(milestone.deliverableId);
}

export async function onActivityStatusChange(
  activityId: string,
  newStatus: string
): Promise<void> {
  const activity = await storage.getActivity(activityId);
  if (!activity) return;

  const milestone = await storage.getMilestone(activity.milestoneId);
  if (!milestone) return;

  if (newStatus === "blocked") {
    await checkAndCreateBlockedRisks(
      milestone.deliverableId,
      "activity",
      activityId,
      activity.name,
      milestone.name
    );
  }

  await recalculateDeliverableMetrics(milestone.deliverableId);
}

export async function onMilestoneChange(milestoneId: string): Promise<void> {
  const milestone = await storage.getMilestone(milestoneId);
  if (!milestone) return;
  await recalculateDeliverableMetrics(milestone.deliverableId);
}

export async function onActivityChange(activityId: string): Promise<void> {
  const activity = await storage.getActivity(activityId);
  if (!activity) return;
  
  const milestone = await storage.getMilestone(activity.milestoneId);
  if (!milestone) return;
  
  await recalculateDeliverableMetrics(milestone.deliverableId);
}
