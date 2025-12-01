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
} from "@shared/schema";

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
};
