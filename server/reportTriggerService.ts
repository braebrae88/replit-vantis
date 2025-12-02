import { storage } from "./storage";
import type { Risk, Event, ReportSuggestion } from "@shared/schema";
import { addDays, isWithinInterval, startOfDay } from "date-fns";

export type TriggerReason = "HIGH_CRITICAL_RISK" | "RISK_ESCALATION" | "UPCOMING_SPONSOR_MEETING" | "WEEKLY_CADENCE";

interface TriggerResult {
  shouldSuggest: boolean;
  reason: TriggerReason | null;
  details: string | null;
}

function getRiskLevel(score: number | null): "critical" | "high" | "medium" | "low" {
  if (!score) return "low";
  if (score >= 20) return "critical";
  if (score >= 12) return "high";
  if (score >= 6) return "medium";
  return "low";
}

export async function evaluateTriggers(projectId: string): Promise<TriggerResult> {
  const risks = await storage.getRisks(projectId);
  const events = await storage.getEvents(projectId);
  
  const pendingSuggestions = await storage.getReportSuggestions(projectId, "PENDING");
  if (pendingSuggestions.length > 0) {
    return { shouldSuggest: false, reason: null, details: "A pending suggestion already exists" };
  }
  
  const criticalHighCheck = checkCriticalHighRisks(risks);
  if (criticalHighCheck.shouldSuggest) {
    return criticalHighCheck;
  }
  
  const upcomingMeetingCheck = checkUpcomingSponsorMeeting(events);
  if (upcomingMeetingCheck.shouldSuggest) {
    return upcomingMeetingCheck;
  }
  
  return { shouldSuggest: false, reason: null, details: null };
}

function checkCriticalHighRisks(risks: Risk[]): TriggerResult {
  const criticalRisks = risks.filter(r => getRiskLevel(r.score) === "critical" && r.status !== "resolved" && r.status !== "accepted");
  const highRisks = risks.filter(r => getRiskLevel(r.score) === "high" && r.status !== "resolved" && r.status !== "accepted");
  
  if (criticalRisks.length > 0) {
    const riskTitles = criticalRisks.slice(0, 3).map(r => r.title).join(", ");
    return {
      shouldSuggest: true,
      reason: "HIGH_CRITICAL_RISK",
      details: `${criticalRisks.length} critical risk(s) identified: ${riskTitles}`,
    };
  }
  
  if (highRisks.length >= 3) {
    return {
      shouldSuggest: true,
      reason: "HIGH_CRITICAL_RISK",
      details: `${highRisks.length} high-severity risks warrant sponsor communication`,
    };
  }
  
  return { shouldSuggest: false, reason: null, details: null };
}

function checkUpcomingSponsorMeeting(events: Event[]): TriggerResult {
  const now = new Date();
  const sevenDaysOut = addDays(now, 7);
  
  const upcomingMeetings = events.filter(e => {
    if (e.type !== "meeting") return false;
    const eventDate = new Date(e.occurredAt);
    const title = e.title.toLowerCase();
    const isSponsorMeeting = title.includes("sponsor") || 
                             title.includes("steerco") || 
                             title.includes("steering") || 
                             title.includes("executive") ||
                             title.includes("leadership");
    return isSponsorMeeting && isWithinInterval(eventDate, { start: startOfDay(now), end: sevenDaysOut });
  });
  
  if (upcomingMeetings.length > 0) {
    const nextMeeting = upcomingMeetings[0];
    return {
      shouldSuggest: true,
      reason: "UPCOMING_SPONSOR_MEETING",
      details: `Upcoming meeting: "${nextMeeting.title}" on ${new Date(nextMeeting.occurredAt).toLocaleDateString()}`,
    };
  }
  
  return { shouldSuggest: false, reason: null, details: null };
}

export async function createReportSuggestionIfNeeded(projectId: string): Promise<ReportSuggestion | null> {
  const triggerResult = await evaluateTriggers(projectId);
  
  if (!triggerResult.shouldSuggest || !triggerResult.reason) {
    return null;
  }
  
  const suggestion = await storage.createReportSuggestion({
    projectId,
    reason: triggerResult.reason,
    reasonDetails: triggerResult.details,
    status: "PENDING",
  });
  
  return suggestion;
}

export async function evaluateAllProjectsForTriggers(): Promise<{ projectId: string; suggestion: ReportSuggestion | null }[]> {
  const projects = await storage.getProjects();
  const results: { projectId: string; suggestion: ReportSuggestion | null }[] = [];
  
  for (const project of projects) {
    if (project.status !== "ACTIVE") continue;
    
    try {
      const suggestion = await createReportSuggestionIfNeeded(project.id);
      results.push({ projectId: project.id, suggestion });
    } catch (error) {
      console.error(`Failed to evaluate triggers for project ${project.id}:`, error);
      results.push({ projectId: project.id, suggestion: null });
    }
  }
  
  return results;
}
