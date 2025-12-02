import type {
  Project,
  InsertProject,
  UseCase,
  InsertUseCase,
  Task,
  InsertTask,
  Event,
  InsertEvent,
  Risk,
  InsertRisk,
  Stakeholder,
  InsertStakeholder,
  WorkflowSegment,
  InsertWorkflowSegment,
  ReadinessScore,
  InsertReadinessScore,
  NextAction,
  CompanionResponse,
  StatusReport,
  TimesheetResponse,
  RoadmapResponse,
  Deliverable,
  Milestone,
  Activity,
  GuidanceResponse,
  EngagementInsight,
  InsertEngagementInsight,
  OpportunitySeed,
  InsertOpportunitySeed,
  MetricSnapshot,
  InsertMetricSnapshot,
  Artifact,
  ArtifactSection,
  ArtifactWithSections,
  InsertArtifact,
} from "@shared/schema";

export interface ImpactStoryResponse {
  narrative: string;
  soundbites: string[];
  nextUnlockSuggestion: string;
}

export interface RuleBasedSuggestion {
  title: string;
  description: string;
  trigger: string;
}

export interface EngagementIdea {
  title: string;
  description: string;
  clientValue: string;
  sizeHint: string;
  triggerSummary: string;
  idealTiming: string;
}

export interface AccountGrowthResponse {
  ruleBasedSuggestions: RuleBasedSuggestion[];
  aiIdeas: EngagementIdea[];
  opportunitySeeds: OpportunitySeed[];
}

export interface PrepContentDocument {
  label: string;
  artifactId: string | null;
  suggestedSource: string;
}

export interface PrepContent {
  summaryToReview: string;
  documentsToBring: PrepContentDocument[];
  dataOrScreenshotsToPrepare: string[];
}

export interface ActivityGuidanceResponse {
  recommendedTitle: string;
  objective: string;
  whenToSchedule: string;
  recommendedDurationMinutes: number;
  recommendedAttendees: string[];
  agenda: Array<{ time: string; topic: string }>;
  prepChecklist: string[];
  outputChecklist: string[];
  emailInviteDraft: string;
  prepContent: PrepContent;
  deliverableId: string;
  deliverableName: string;
  projectId: string;
}

export interface SoWBootstrapResponse {
  success: boolean;
  summary: string;
  suggestedPhase: string;
  created: {
    useCases: number;
    deliverables: number;
    tasks: number;
    stakeholders: number;
    insights: number;
  };
  useCases: UseCase[];
  deliverables: Deliverable[];
  tasks: Task[];
  stakeholders: Stakeholder[];
  insights: EngagementInsight[];
  nextActions: NextAction[];
  timeline: {
    startDate: string | null;
    endDate: string | null;
    keyMilestones: string[];
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Projects
  projects: {
    list: async (): Promise<Project[]> => {
      const response = await fetch("/api/projects");
      return handleResponse(response);
    },
    get: async (id: string): Promise<Project> => {
      const response = await fetch(`/api/projects/${id}`);
      return handleResponse(response);
    },
    getNextActions: async (id: string): Promise<NextAction[]> => {
      const response = await fetch(`/api/projects/${id}/next-actions`);
      return handleResponse(response);
    },
    create: async (data: InsertProject): Promise<Project> => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: Partial<InsertProject>): Promise<Project> => {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete project");
      }
    },
  },

  // Use Cases
  useCases: {
    list: async (projectId?: string): Promise<UseCase[]> => {
      const url = projectId ? `/api/use-cases?projectId=${projectId}` : "/api/use-cases";
      const response = await fetch(url);
      return handleResponse(response);
    },
    get: async (id: string): Promise<UseCase> => {
      const response = await fetch(`/api/use-cases/${id}`);
      return handleResponse(response);
    },
    create: async (data: InsertUseCase): Promise<UseCase> => {
      const response = await fetch("/api/use-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: Partial<InsertUseCase>): Promise<UseCase> => {
      const response = await fetch(`/api/use-cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/use-cases/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete use case");
      }
    },
  },

  // Tasks
  tasks: {
    list: async (projectId?: string, useCaseId?: string): Promise<Task[]> => {
      let url = "/api/tasks?";
      if (projectId) url += `projectId=${projectId}&`;
      if (useCaseId) url += `useCaseId=${useCaseId}&`;
      const response = await fetch(url);
      return handleResponse(response);
    },
    get: async (id: string): Promise<Task> => {
      const response = await fetch(`/api/tasks/${id}`);
      return handleResponse(response);
    },
    create: async (data: InsertTask): Promise<Task> => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: Partial<InsertTask>): Promise<Task> => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
    },
  },

  // Events
  events: {
    list: async (projectId?: string): Promise<Event[]> => {
      const url = projectId ? `/api/events?projectId=${projectId}` : "/api/events";
      const response = await fetch(url);
      return handleResponse(response);
    },
    get: async (id: string): Promise<Event> => {
      const response = await fetch(`/api/events/${id}`);
      return handleResponse(response);
    },
    create: async (data: InsertEvent): Promise<Event> => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    createFile: async (data: {
      projectId: string;
      fileName: string;
      filePath: string;
      fileType: string;
      textSummary?: string;
    }): Promise<Event> => {
      const response = await fetch("/api/events/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    createEmail: async (data: {
      projectId: string;
      from: string;
      to: string;
      subject: string;
      bodySummary?: string;
      sentAt?: string;
    }): Promise<Event> => {
      const response = await fetch("/api/events/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    createMeeting: async (data: {
      projectId: string;
      title: string;
      attendees: string[];
      startTime: string;
      endTime: string;
      meetingNotesSummary?: string;
    }): Promise<Event> => {
      const response = await fetch("/api/events/meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete event");
      }
    },
  },

  // Risks
  risks: {
    list: async (projectId?: string, useCaseId?: string): Promise<Risk[]> => {
      let url = "/api/risks?";
      if (projectId) url += `projectId=${projectId}&`;
      if (useCaseId) url += `useCaseId=${useCaseId}&`;
      const response = await fetch(url);
      return handleResponse(response);
    },
    get: async (id: string): Promise<Risk> => {
      const response = await fetch(`/api/risks/${id}`);
      return handleResponse(response);
    },
    create: async (data: InsertRisk): Promise<Risk> => {
      const response = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: Partial<InsertRisk>): Promise<Risk> => {
      const response = await fetch(`/api/risks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/risks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete risk");
      }
    },
  },

  // Stakeholders
  stakeholders: {
    list: async (projectId?: string): Promise<Stakeholder[]> => {
      const url = projectId ? `/api/stakeholders?projectId=${projectId}` : "/api/stakeholders";
      const response = await fetch(url);
      return handleResponse(response);
    },
    get: async (id: string): Promise<Stakeholder> => {
      const response = await fetch(`/api/stakeholders/${id}`);
      return handleResponse(response);
    },
    create: async (data: InsertStakeholder): Promise<Stakeholder> => {
      const response = await fetch("/api/stakeholders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: Partial<InsertStakeholder>): Promise<Stakeholder> => {
      const response = await fetch(`/api/stakeholders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/stakeholders/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete stakeholder");
      }
    },
  },

  // Workflow Segments
  workflowSegments: {
    list: async (projectId?: string, useCaseId?: string): Promise<WorkflowSegment[]> => {
      let url = "/api/workflow-segments?";
      if (projectId) url += `projectId=${projectId}&`;
      if (useCaseId) url += `useCaseId=${useCaseId}&`;
      const response = await fetch(url);
      return handleResponse(response);
    },
    get: async (id: string): Promise<WorkflowSegment> => {
      const response = await fetch(`/api/workflow-segments/${id}`);
      return handleResponse(response);
    },
    create: async (data: InsertWorkflowSegment): Promise<WorkflowSegment> => {
      const response = await fetch("/api/workflow-segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: Partial<InsertWorkflowSegment>): Promise<WorkflowSegment> => {
      const response = await fetch(`/api/workflow-segments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/workflow-segments/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete workflow segment");
      }
    },
  },

  // Readiness Scores
  readinessScores: {
    list: async (useCaseId?: string): Promise<ReadinessScore[]> => {
      const url = useCaseId ? `/api/readiness-scores?useCaseId=${useCaseId}` : "/api/readiness-scores";
      const response = await fetch(url);
      return handleResponse(response);
    },
    get: async (id: string): Promise<ReadinessScore> => {
      const response = await fetch(`/api/readiness-scores/${id}`);
      return handleResponse(response);
    },
    create: async (data: InsertReadinessScore): Promise<ReadinessScore> => {
      const response = await fetch("/api/readiness-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: Partial<InsertReadinessScore>): Promise<ReadinessScore> => {
      const response = await fetch(`/api/readiness-scores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/readiness-scores/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete readiness score");
      }
    },
  },

  // AI Companion
  companion: {
    chat: async (projectId: string, message: string, deliverableId?: string): Promise<CompanionResponse> => {
      const response = await fetch("/api/ai/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message, deliverableId }),
      });
      return handleResponse(response);
    },
  },

  // Status Report
  statusReport: {
    generate: async (projectId: string): Promise<StatusReport> => {
      const response = await fetch(`/api/projects/${projectId}/status-report`);
      return handleResponse(response);
    },
  },

  // Timesheet
  timesheet: {
    generate: async (from: string, to: string): Promise<TimesheetResponse> => {
      const response = await fetch(`/api/timesheet?from=${from}&to=${to}`);
      return handleResponse(response);
    },
  },

  roadmap: {
    get: async (projectId: string): Promise<RoadmapResponse> => {
      const response = await fetch(`/api/projects/${projectId}/roadmap`);
      return handleResponse(response);
    },
  },

  deliverables: {
    list: async (projectId: string): Promise<Deliverable[]> => {
      const response = await fetch(`/api/deliverables?projectId=${projectId}`);
      return handleResponse(response);
    },
    get: async (id: string): Promise<Deliverable> => {
      const response = await fetch(`/api/deliverables/${id}`);
      return handleResponse(response);
    },
    create: async (projectId: string, type: string): Promise<Deliverable> => {
      const response = await fetch(`/api/projects/${projectId}/deliverables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: Partial<Deliverable>): Promise<Deliverable> => {
      const response = await fetch(`/api/deliverables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/deliverables/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete deliverable");
      }
    },
    getGuidance: async (id: string): Promise<GuidanceResponse> => {
      const response = await fetch(`/api/deliverables/${id}/guidance`);
      return handleResponse(response);
    },
    getMetrics: async (id: string): Promise<DeliverableMetrics> => {
      const response = await fetch(`/api/deliverables/${id}/metrics`);
      return handleResponse(response);
    },
    getWorkshopInvite: async (id: string, workshopKey: string): Promise<WorkshopInvite> => {
      const response = await fetch(`/api/deliverables/${id}/workshop-invite?key=${encodeURIComponent(workshopKey)}`);
      return handleResponse(response);
    },
    getMilestones: async (deliverableId: string): Promise<Milestone[]> => {
      const response = await fetch(`/api/deliverables/${deliverableId}/milestones`);
      return handleResponse(response);
    },
    getActivities: async (milestoneId: string): Promise<Activity[]> => {
      const response = await fetch(`/api/milestones/${milestoneId}/activities`);
      return handleResponse(response);
    },
  },

  activities: {
    getGuidance: async (activityId: string): Promise<ActivityGuidanceResponse> => {
      const response = await fetch(`/api/ai/activities/${activityId}/guidance`);
      return handleResponse(response);
    },
  },

  // Engagement Insights
  engagementInsights: {
    list: async (projectId: string): Promise<EngagementInsight[]> => {
      const response = await fetch(`/api/projects/${projectId}/engagement-insights`);
      return handleResponse(response);
    },
    create: async (projectId: string, data: Omit<InsertEngagementInsight, 'projectId'>): Promise<EngagementInsight> => {
      const response = await fetch(`/api/projects/${projectId}/engagement-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/engagement-insights/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete engagement insight");
      }
    },
  },

  // Event Analysis
  eventAnalysis: {
    analyse: async (eventId: string, rawText: string): Promise<{
      analysis: {
        summaryBullets: string[];
        decisions: string[];
        risks: string[];
        openQuestions: string[];
        opportunityHints: string[];
        sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
      };
      createdInsights: number;
      createdSeeds: number;
    }> => {
      const response = await fetch(`/api/ai/events/${eventId}/analyse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      return handleResponse(response);
    },
  },

  // Transcript Intake
  transcriptIntake: {
    process: async (projectId: string, data: {
      rawTranscript: string;
      eventType: "meeting" | "workshop" | "call";
      phase?: "DISCOVER" | "MAP" | "PROTOTYPE" | "UNLOCK";
    }): Promise<{
      eventId: string;
      insights: any[];
      tasks: any[];
      risks: any[];
      stakeholders: any[];
      nextActions: NextAction[];
      transcriptSuggestedActions: NextAction[];
      summary: string;
    }> => {
      const response = await fetch(`/api/ai/projects/${projectId}/transcript-intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
  },

  // SoW Bootstrap
  sowBootstrap: {
    bootstrap: async (projectId: string, statementOfWork: string): Promise<SoWBootstrapResponse> => {
      const response = await fetch(`/api/ai/projects/${projectId}/bootstrap-from-sow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementOfWork }),
      });
      return handleResponse(response);
    },
  },

  // Stakeholder Analysis
  stakeholderAnalysis: {
    analyse: async (projectId: string, stakeholderId: string, relatedText: string): Promise<{
      analysis: {
        influence: "LOW" | "MEDIUM" | "HIGH";
        supportLevel: "OPPOSED" | "NEUTRAL" | "SUPPORTIVE" | "CHAMPION";
        keyConcerns: string[];
      };
      stakeholder: any;
      insight: any;
    }> => {
      const response = await fetch(`/api/ai/projects/${projectId}/stakeholder-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stakeholderId, relatedText }),
      });
      return handleResponse(response);
    },
  },

  // Opportunity Seeds
  opportunitySeeds: {
    list: async (projectId: string): Promise<OpportunitySeed[]> => {
      const response = await fetch(`/api/projects/${projectId}/opportunity-seeds`);
      return handleResponse(response);
    },
    create: async (projectId: string, data: Omit<InsertOpportunitySeed, 'projectId'>): Promise<OpportunitySeed> => {
      const response = await fetch(`/api/projects/${projectId}/opportunity-seeds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: Partial<InsertOpportunitySeed>): Promise<OpportunitySeed> => {
      const response = await fetch(`/api/opportunity-seeds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/opportunity-seeds/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete opportunity seed");
      }
    },
  },

  // Metric Snapshots (Value Scorecard)
  metrics: {
    list: async (projectId: string): Promise<MetricSnapshot[]> => {
      const response = await fetch(`/api/projects/${projectId}/metrics`);
      return handleResponse(response);
    },
    create: async (projectId: string, data: Omit<InsertMetricSnapshot, 'projectId'>): Promise<MetricSnapshot> => {
      const response = await fetch(`/api/projects/${projectId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: Partial<InsertMetricSnapshot>): Promise<MetricSnapshot> => {
      const response = await fetch(`/api/metrics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/metrics/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete metric snapshot");
      }
    },
  },

  // Artifacts
  artifacts: {
    list: async (projectId: string): Promise<ArtifactWithSections[]> => {
      const response = await fetch(`/api/projects/${projectId}/artifacts`);
      return handleResponse(response);
    },
    get: async (id: string): Promise<ArtifactWithSections> => {
      const response = await fetch(`/api/artifacts/${id}`);
      return handleResponse(response);
    },
    create: async (projectId: string, data: Omit<InsertArtifact, 'projectId'>): Promise<Artifact> => {
      const response = await fetch(`/api/projects/${projectId}/artifacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: Partial<InsertArtifact>): Promise<Artifact> => {
      const response = await fetch(`/api/artifacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/artifacts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete artifact");
      }
    },
  },

  // Artifact Sections
  artifactSections: {
    list: async (artifactId: string): Promise<ArtifactSection[]> => {
      const response = await fetch(`/api/artifacts/${artifactId}/sections`);
      return handleResponse(response);
    },
    update: async (id: string, data: { status?: string; content?: string }): Promise<ArtifactSection> => {
      const response = await fetch(`/api/artifact-sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
  },

  // Impact Story
  impactStory: {
    generate: async (projectId: string): Promise<ImpactStoryResponse> => {
      const response = await fetch(`/api/ai/projects/${projectId}/impact-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return handleResponse(response);
    },
  },

  // Account Growth
  accountGrowth: {
    get: async (projectId: string): Promise<AccountGrowthResponse> => {
      const response = await fetch(`/api/projects/${projectId}/account-growth`);
      return handleResponse(response);
    },
  },
};

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

export interface WorkshopInvite {
  workshopKey: string;
  workshopTitle: string;
  emailSubject: string;
  emailBody: string;
}
