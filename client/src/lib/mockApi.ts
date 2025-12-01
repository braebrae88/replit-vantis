import { z } from "zod";

// --- Types ---

export type Project = {
  id: string;
  name: string;
  description: string;
  status: "active" | "planning" | "completed" | "archived";
  createdAt: string;
};

export type UseCase = {
  id: string;
  projectId: string;
  title: string;
  priority: "low" | "medium" | "high";
  status: "draft" | "approved" | "implemented";
};

export type Task = {
  id: string;
  useCaseId: string;
  projectId: string;
  title: string;
  status: "todo" | "in-progress" | "review" | "done";
  assignee?: string;
};

export type Event = {
  id: string;
  title: string;
  type: "meeting" | "email" | "doc" | "milestone";
  date: string;
  projectId?: string;
};

// --- Mock Data Store ---

let projects: Project[] = [
  {
    id: "PROJ-001",
    name: "Nebula Core Migration",
    description: "Migrating legacy core systems to the new Nebula architecture.",
    status: "active",
    createdAt: "2023-10-15T09:00:00Z",
  },
  {
    id: "PROJ-002",
    name: "Vantis UI Overhaul",
    description: "Complete redesign of the customer-facing dashboard.",
    status: "planning",
    createdAt: "2023-11-01T14:30:00Z",
  },
  {
    id: "PROJ-003",
    name: "Project Alpha",
    description: "Top secret internal initiative.",
    status: "completed",
    createdAt: "2023-08-20T10:00:00Z",
  }
];

let useCases: UseCase[] = [
  { id: "UC-101", projectId: "PROJ-001", title: "User Authentication Flow", priority: "high", status: "approved" },
  { id: "UC-102", projectId: "PROJ-001", title: "Data Migration Script", priority: "high", status: "implemented" },
  { id: "UC-201", projectId: "PROJ-002", title: "Dark Mode Toggle", priority: "low", status: "draft" },
];

let tasks: Task[] = [
  { id: "TSK-501", projectId: "PROJ-001", useCaseId: "UC-101", title: "Design Login Schema", status: "done", assignee: "Alice" },
  { id: "TSK-502", projectId: "PROJ-001", useCaseId: "UC-101", title: "Implement JWT Auth", status: "in-progress", assignee: "Bob" },
  { id: "TSK-503", projectId: "PROJ-002", useCaseId: "UC-201", title: "Select Color Palette", status: "todo" },
];

let events: Event[] = [
  { id: "EVT-001", title: "Kickoff Meeting", type: "meeting", date: "2023-10-15T10:00:00Z", projectId: "PROJ-001" },
  { id: "EVT-002", title: "Requirements Doc V1", type: "doc", date: "2023-10-20T16:00:00Z", projectId: "PROJ-001" },
  { id: "EVT-003", title: "Weekly Sync", type: "meeting", date: "2023-11-10T09:00:00Z", projectId: "PROJ-002" },
];

// --- Mock API ---

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  projects: {
    list: async () => { await delay(300); return [...projects]; },
    get: async (id: string) => { await delay(200); return projects.find(p => p.id === id); },
    create: async (data: Omit<Project, "id" | "createdAt">) => {
      await delay(400);
      const newProject: Project = {
        ...data,
        id: `PROJ-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString(),
      };
      projects = [newProject, ...projects];
      return newProject;
    },
  },
  useCases: {
    list: async (projectId?: string) => {
        await delay(300);
        if (projectId) return useCases.filter(uc => uc.projectId === projectId);
        return [...useCases];
    },
    create: async (data: Omit<UseCase, "id">) => {
        await delay(300);
        const newUseCase: UseCase = { ...data, id: `UC-${Math.floor(Math.random() * 1000)}` };
        useCases = [...useCases, newUseCase];
        return newUseCase;
    }
  },
  tasks: {
    list: async (projectId?: string) => {
        await delay(300);
        if (projectId) return tasks.filter(t => t.projectId === projectId);
        return [...tasks];
    },
    create: async (data: Omit<Task, "id">) => {
        await delay(300);
        const newTask: Task = { ...data, id: `TSK-${Math.floor(Math.random() * 1000)}` };
        tasks = [...tasks, newTask];
        return newTask;
    },
    updateStatus: async (id: string, status: Task['status']) => {
        await delay(200);
        tasks = tasks.map(t => t.id === id ? { ...t, status } : t);
        return tasks.find(t => t.id === id);
    }
  },
  events: {
    list: async () => { await delay(300); return [...events]; },
    create: async (data: Omit<Event, "id">) => {
        await delay(300);
        const newEvent: Event = { ...data, id: `EVT-${Math.floor(Math.random() * 1000)}` };
        events = [newEvent, ...events];
        return newEvent;
    }
  }
};
