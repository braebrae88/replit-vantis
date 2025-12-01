import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import {
  insertProjectSchema,
  insertUseCaseSchema,
  insertWorkflowSegmentSchema,
  insertReadinessScoreSchema,
  insertRiskSchema,
  insertTaskSchema,
  insertStakeholderSchema,
  insertEventSchema,
  insertFileEventSchema,
  insertEmailEventSchema,
  insertMeetingEventSchema,
} from "@shared/schema";
import { fromError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============= PROJECTS =============
  
  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const result = insertProjectSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const project = await storage.createProject(result.data);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // ============= USE CASES =============
  
  app.get("/api/use-cases", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const useCases = await storage.getUseCases(projectId);
      res.json(useCases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch use cases" });
    }
  });

  app.get("/api/use-cases/:id", async (req, res) => {
    try {
      const useCase = await storage.getUseCase(req.params.id);
      if (!useCase) {
        return res.status(404).json({ error: "Use case not found" });
      }
      res.json(useCase);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch use case" });
    }
  });

  app.post("/api/use-cases", async (req, res) => {
    try {
      const result = insertUseCaseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const useCase = await storage.createUseCase(result.data);
      res.status(201).json(useCase);
    } catch (error) {
      res.status(500).json({ error: "Failed to create use case" });
    }
  });

  app.patch("/api/use-cases/:id", async (req, res) => {
    try {
      const useCase = await storage.updateUseCase(req.params.id, req.body);
      if (!useCase) {
        return res.status(404).json({ error: "Use case not found" });
      }
      res.json(useCase);
    } catch (error) {
      res.status(500).json({ error: "Failed to update use case" });
    }
  });

  app.delete("/api/use-cases/:id", async (req, res) => {
    try {
      const success = await storage.deleteUseCase(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Use case not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete use case" });
    }
  });

  // ============= WORKFLOW SEGMENTS =============
  
  app.get("/api/workflow-segments", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const useCaseId = req.query.useCaseId as string | undefined;
      const segments = await storage.getWorkflowSegments(projectId, useCaseId);
      res.json(segments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflow segments" });
    }
  });

  app.get("/api/workflow-segments/:id", async (req, res) => {
    try {
      const segment = await storage.getWorkflowSegment(req.params.id);
      if (!segment) {
        return res.status(404).json({ error: "Workflow segment not found" });
      }
      res.json(segment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflow segment" });
    }
  });

  app.post("/api/workflow-segments", async (req, res) => {
    try {
      const result = insertWorkflowSegmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const segment = await storage.createWorkflowSegment(result.data);
      res.status(201).json(segment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create workflow segment" });
    }
  });

  app.patch("/api/workflow-segments/:id", async (req, res) => {
    try {
      const segment = await storage.updateWorkflowSegment(req.params.id, req.body);
      if (!segment) {
        return res.status(404).json({ error: "Workflow segment not found" });
      }
      res.json(segment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update workflow segment" });
    }
  });

  app.delete("/api/workflow-segments/:id", async (req, res) => {
    try {
      const success = await storage.deleteWorkflowSegment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Workflow segment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workflow segment" });
    }
  });

  // ============= READINESS SCORES =============
  
  app.get("/api/readiness-scores", async (req, res) => {
    try {
      const useCaseId = req.query.useCaseId as string | undefined;
      const scores = await storage.getReadinessScores(useCaseId);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch readiness scores" });
    }
  });

  app.get("/api/readiness-scores/:id", async (req, res) => {
    try {
      const score = await storage.getReadinessScore(req.params.id);
      if (!score) {
        return res.status(404).json({ error: "Readiness score not found" });
      }
      res.json(score);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch readiness score" });
    }
  });

  app.post("/api/readiness-scores", async (req, res) => {
    try {
      const result = insertReadinessScoreSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const score = await storage.createReadinessScore(result.data);
      res.status(201).json(score);
    } catch (error) {
      res.status(500).json({ error: "Failed to create readiness score" });
    }
  });

  app.patch("/api/readiness-scores/:id", async (req, res) => {
    try {
      const score = await storage.updateReadinessScore(req.params.id, req.body);
      if (!score) {
        return res.status(404).json({ error: "Readiness score not found" });
      }
      res.json(score);
    } catch (error) {
      res.status(500).json({ error: "Failed to update readiness score" });
    }
  });

  app.delete("/api/readiness-scores/:id", async (req, res) => {
    try {
      const success = await storage.deleteReadinessScore(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Readiness score not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete readiness score" });
    }
  });

  // ============= RISKS =============
  
  app.get("/api/risks", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const useCaseId = req.query.useCaseId as string | undefined;
      const risks = await storage.getRisks(projectId, useCaseId);
      res.json(risks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risks" });
    }
  });

  app.get("/api/risks/:id", async (req, res) => {
    try {
      const risk = await storage.getRisk(req.params.id);
      if (!risk) {
        return res.status(404).json({ error: "Risk not found" });
      }
      res.json(risk);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk" });
    }
  });

  app.post("/api/risks", async (req, res) => {
    try {
      const result = insertRiskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const risk = await storage.createRisk(result.data);
      res.status(201).json(risk);
    } catch (error) {
      res.status(500).json({ error: "Failed to create risk" });
    }
  });

  app.patch("/api/risks/:id", async (req, res) => {
    try {
      const risk = await storage.updateRisk(req.params.id, req.body);
      if (!risk) {
        return res.status(404).json({ error: "Risk not found" });
      }
      res.json(risk);
    } catch (error) {
      res.status(500).json({ error: "Failed to update risk" });
    }
  });

  app.delete("/api/risks/:id", async (req, res) => {
    try {
      const success = await storage.deleteRisk(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Risk not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete risk" });
    }
  });

  // ============= TASKS =============
  
  app.get("/api/tasks", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const useCaseId = req.query.useCaseId as string | undefined;
      const tasks = await storage.getTasks(projectId, useCaseId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const result = insertTaskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const task = await storage.createTask(result.data);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // ============= STAKEHOLDERS =============
  
  app.get("/api/stakeholders", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const stakeholders = await storage.getStakeholders(projectId);
      res.json(stakeholders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stakeholders" });
    }
  });

  app.get("/api/stakeholders/:id", async (req, res) => {
    try {
      const stakeholder = await storage.getStakeholder(req.params.id);
      if (!stakeholder) {
        return res.status(404).json({ error: "Stakeholder not found" });
      }
      res.json(stakeholder);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stakeholder" });
    }
  });

  app.post("/api/stakeholders", async (req, res) => {
    try {
      const result = insertStakeholderSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const stakeholder = await storage.createStakeholder(result.data);
      res.status(201).json(stakeholder);
    } catch (error) {
      res.status(500).json({ error: "Failed to create stakeholder" });
    }
  });

  app.patch("/api/stakeholders/:id", async (req, res) => {
    try {
      const stakeholder = await storage.updateStakeholder(req.params.id, req.body);
      if (!stakeholder) {
        return res.status(404).json({ error: "Stakeholder not found" });
      }
      res.json(stakeholder);
    } catch (error) {
      res.status(500).json({ error: "Failed to update stakeholder" });
    }
  });

  app.delete("/api/stakeholders/:id", async (req, res) => {
    try {
      const success = await storage.deleteStakeholder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Stakeholder not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stakeholder" });
    }
  });

  // ============= EVENTS =============
  
  app.get("/api/events", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const events = await storage.getEvents(projectId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const result = insertEventSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const event = await storage.createEvent(result.data);
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // ============= EVENT INGESTION ENDPOINTS =============

  app.post("/api/events/file", async (req, res) => {
    try {
      const result = insertFileEventSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }

      const { projectId, fileName, filePath, fileType, textSummary } = result.data;

      const metadata = {
        fileName,
        filePath,
        fileType,
        textSummary: textSummary || null,
      };

      const event = await storage.createEvent({
        projectId,
        type: "file",
        sourceSystem: "finder",
        title: `File: ${fileName}`,
        description: textSummary || `${fileType} file at ${filePath}`,
        occurredAt: new Date(),
        metadataJson: JSON.stringify(metadata),
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("Failed to create file event:", error);
      res.status(500).json({ error: "Failed to create file event" });
    }
  });

  app.post("/api/events/email", async (req, res) => {
    try {
      const result = insertEmailEventSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }

      const { projectId, from, to, subject, bodySummary, sentAt } = result.data;

      const metadata = {
        from,
        to,
        subject,
        bodySummary: bodySummary || null,
        sentAt: sentAt || new Date().toISOString(),
      };

      const event = await storage.createEvent({
        projectId,
        type: "email",
        sourceSystem: "outlook",
        title: `Email: ${subject}`,
        description: bodySummary || `From ${from} to ${to}`,
        occurredAt: sentAt ? new Date(sentAt) : new Date(),
        metadataJson: JSON.stringify(metadata),
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("Failed to create email event:", error);
      res.status(500).json({ error: "Failed to create email event" });
    }
  });

  app.post("/api/events/meeting", async (req, res) => {
    try {
      const result = insertMeetingEventSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }

      const { projectId, title, attendees, startTime, endTime, meetingNotesSummary } = result.data;

      const metadata = {
        title,
        attendees,
        startTime,
        endTime,
        meetingNotesSummary: meetingNotesSummary || null,
      };

      const event = await storage.createEvent({
        projectId,
        type: "meeting",
        sourceSystem: "outlook",
        title: `Meeting: ${title}`,
        description: meetingNotesSummary || `With ${attendees.join(", ")}`,
        occurredAt: new Date(startTime),
        metadataJson: JSON.stringify(metadata),
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("Failed to create meeting event:", error);
      res.status(500).json({ error: "Failed to create meeting event" });
    }
  });

  return httpServer;
}
