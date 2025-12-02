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
  insertDeliverableSchema,
  insertMilestoneSchema,
  insertActivitySchema,
  companionRequestSchema,
  type NextAction,
  type CompanionResponse,
  type StatusReport,
  type TimesheetResponse,
  type TimesheetEntry,
  type TimesheetHours,
  type RoadmapResponse,
  type RoadmapWeek,
  type RoadmapTask,
  type GuidanceResponse,
  type GuidanceStep,
  type GuidanceWorkshop,
  type GuidanceScopeFlag,
  type Activity,
  type Milestone,
} from "@shared/schema";
import { fromError } from "zod-validation-error";
import { instantiateDeliverableFromTemplate, DELIVERABLE_TEMPLATES, type DeliverableTemplate } from "./deliverableTemplates";

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

  // ============= NEXT ACTIONS (Suggestion Engine) =============

  app.get("/api/projects/:id/next-actions", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const actions: NextAction[] = [];

      // Fetch all related data for analysis
      const [useCases, tasks, risks, events] = await Promise.all([
        storage.getUseCases(projectId),
        storage.getTasks(projectId),
        storage.getRisks(projectId),
        storage.getEvents(projectId),
      ]);

      // Get readiness scores only for this project's use cases
      const useCaseIds = useCases.map(uc => uc.id);
      const allReadinessScores = await Promise.all(
        useCaseIds.map(ucId => storage.getReadinessScores(ucId))
      );
      const readinessScores = allReadinessScores.flat();

      // 1. Check for UseCases without ReadinessScores
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

      // 2. Check for overdue tasks
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

      // 3. Check for no recent events (engagement gap)
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

      // 4. Check for open risks without owners
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

      // Sort actions by severity (critical > high > medium > low)
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const getSeverityOrder = (severity: string): number => severityOrder[severity] ?? 4;
      actions.sort((a, b) => getSeverityOrder(a.severity) - getSeverityOrder(b.severity));

      res.json(actions);
    } catch (error) {
      console.error("Failed to compute next actions:", error);
      res.status(500).json({ error: "Failed to compute next actions" });
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

  // ============= AI COMPANION =============

  app.post("/api/ai/companion", async (req, res) => {
    try {
      const result = companionRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }

      const { projectId, message } = result.data;

      // Verify project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // TODO: Replace with actual Google AI Studio integration
      // For now, return a structured dummy response
      const response: CompanionResponse = {
        responseText: `Thank you for your question about "${project.name}". This is a placeholder response from VANTIS Companion. Once integrated with Google AI Studio, I'll provide intelligent analysis and recommendations based on your project data and query: "${message}"`,
        assumptions: [
          "The project timeline follows standard enterprise implementation phases",
          "Key stakeholders have been identified and are available for consultation",
          "Technical infrastructure requirements are within standard parameters",
        ],
        gaps: [
          "Detailed risk assessment may need additional stakeholder input",
          "Integration requirements with existing systems need clarification",
          "Success metrics and KPIs should be defined more specifically",
        ],
        suggestedTasks: [
          {
            title: "Schedule stakeholder alignment meeting",
            description: "Organize a meeting with key stakeholders to validate assumptions and address identified gaps",
            priority: "high",
          },
          {
            title: "Document integration requirements",
            description: "Create a detailed specification of integration points with existing systems",
            priority: "medium",
          },
          {
            title: "Define success metrics",
            description: "Work with business owners to establish measurable KPIs for the project",
            priority: "medium",
          },
        ],
      };

      res.json(response);
    } catch (error) {
      console.error("Failed to process companion request:", error);
      res.status(500).json({ error: "Failed to process companion request" });
    }
  });

  // ============= WEEKLY STATUS REPORT =============

  app.get("/api/projects/:id/status-report", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch all related data
      const [tasks, risks, events] = await Promise.all([
        storage.getTasks(projectId),
        storage.getRisks(projectId),
        storage.getEvents(projectId),
      ]);

      // Tasks completed in the last 7 days
      const completedTasks = tasks
        .filter(
          (t) =>
            t.status === "done" &&
            t.updatedAt &&
            new Date(t.updatedAt) >= sevenDaysAgo
        )
        .map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          completedAt: t.updatedAt?.toISOString(),
        }));

      // New open tasks (created in last 7 days and not done)
      const newOpenTasks = tasks
        .filter(
          (t) =>
            t.status !== "done" &&
            t.createdAt &&
            new Date(t.createdAt) >= sevenDaysAgo
        )
        .map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
        }));

      // Events in the last 7 days
      const recentEvents = events
        .filter((e) => e.occurredAt && new Date(e.occurredAt) >= sevenDaysAgo)
        .map((e) => ({
          id: e.id,
          type: e.type,
          title: e.title,
          occurredAt: e.occurredAt.toISOString(),
        }));

      // New or updated risks in the last 7 days
      const recentRisks = risks
        .filter(
          (r) =>
            (r.createdAt && new Date(r.createdAt) >= sevenDaysAgo) ||
            (r.updatedAt && new Date(r.updatedAt) >= sevenDaysAgo)
        )
        .map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          status: r.status,
          likelihood: r.likelihood,
          impact: r.impact,
        }));

      // Generate highlights based on data
      const highlights: string[] = [];
      if (completedTasks.length > 0) {
        highlights.push(
          `Completed ${completedTasks.length} task${completedTasks.length > 1 ? "s" : ""} this week`
        );
      }
      if (recentEvents.length > 0) {
        const meetings = recentEvents.filter((e) => e.type === "meeting").length;
        const emails = recentEvents.filter((e) => e.type === "email").length;
        const files = recentEvents.filter((e) => e.type === "file").length;
        if (meetings > 0) highlights.push(`${meetings} meeting${meetings > 1 ? "s" : ""} held`);
        if (emails > 0) highlights.push(`${emails} email${emails > 1 ? "s" : ""} exchanged`);
        if (files > 0) highlights.push(`${files} document${files > 1 ? "s" : ""} shared`);
      }
      if (highlights.length === 0) {
        highlights.push("No significant activity recorded this week");
      }

      // Generate next week focus based on open tasks
      const nextWeekFocus: string[] = [];
      const highPriorityTasks = tasks.filter(
        (t) => t.status !== "done" && (t.priority === "high" || t.priority === "critical")
      );
      for (const task of highPriorityTasks.slice(0, 3)) {
        nextWeekFocus.push(`${task.title}${task.dueDate ? ` (due ${new Date(task.dueDate).toLocaleDateString()})` : ""}`);
      }
      if (nextWeekFocus.length === 0) {
        const openTasks = tasks.filter((t) => t.status !== "done").slice(0, 3);
        for (const task of openTasks) {
          nextWeekFocus.push(task.title);
        }
      }
      if (nextWeekFocus.length === 0) {
        nextWeekFocus.push("Continue with current activities");
      }

      // Generate open decisions based on unmitigated risks
      const openDecisions: string[] = [];
      const unresolvedRisks = risks.filter(
        (r) => r.status === "identified" || r.status === "analyzing"
      );
      for (const risk of unresolvedRisks.slice(0, 3)) {
        openDecisions.push(`Decide mitigation approach for: ${risk.title}`);
      }

      const report: StatusReport = {
        projectId: project.id,
        projectName: project.name,
        generatedAt: now.toISOString(),
        reportPeriod: {
          start: sevenDaysAgo.toISOString(),
          end: now.toISOString(),
        },
        highlights,
        completedTasks,
        newOpenTasks,
        recentEvents,
        risks: recentRisks,
        nextWeekFocus,
        openDecisions,
      };

      res.json(report);
    } catch (error) {
      console.error("Failed to generate status report:", error);
      res.status(500).json({ error: "Failed to generate status report" });
    }
  });

  // ============= TIMESHEET DRAFT =============

  app.get("/api/timesheet", async (req, res) => {
    try {
      const { from, to } = req.query;
      
      if (!from || !to || typeof from !== "string" || typeof to !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'from' and 'to' date parameters (YYYY-MM-DD)" });
      }

      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      if (fromDate > toDate) {
        return res.status(400).json({ error: "'from' date must be before 'to' date" });
      }

      const projects = await storage.getProjects();
      const entries: TimesheetEntry[] = [];

      const totalHours: TimesheetHours = {
        clientMeetings: 0,
        internalPlanning: 0,
        researchAndDrafting: 0,
        admin: 0,
      };

      for (const project of projects) {
        const [events, tasks] = await Promise.all([
          storage.getEvents(project.id),
          storage.getTasks(project.id),
        ]);

        const meetingsInRange = events.filter(
          (e) =>
            e.type === "meeting" &&
            e.occurredAt &&
            new Date(e.occurredAt) >= fromDate &&
            new Date(e.occurredAt) <= toDate
        );

        const filesInRange = events.filter(
          (e) =>
            e.type === "file" &&
            e.occurredAt &&
            new Date(e.occurredAt) >= fromDate &&
            new Date(e.occurredAt) <= toDate
        );

        const tasksInRange = tasks.filter(
          (t) =>
            (t.createdAt && new Date(t.createdAt) >= fromDate && new Date(t.createdAt) <= toDate) ||
            (t.updatedAt && new Date(t.updatedAt) >= fromDate && new Date(t.updatedAt) <= toDate)
        );

        let totalMeetingMinutes = 0;
        for (const meeting of meetingsInRange) {
          try {
            if (meeting.metadataJson) {
              const metadata = JSON.parse(meeting.metadataJson);
              if (metadata.startTime && metadata.endTime) {
                const start = new Date(metadata.startTime);
                const end = new Date(metadata.endTime);
                totalMeetingMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
              } else {
                totalMeetingMinutes += 60;
              }
            } else {
              totalMeetingMinutes += 60;
            }
          } catch {
            totalMeetingMinutes += 60;
          }
        }

        const clientMeetingsHours = Math.round((totalMeetingMinutes / 60) * 10) / 10;
        const internalPlanningHours = Math.round(tasksInRange.length * 0.25 * 10) / 10;
        const researchAndDraftingHours = Math.round(filesInRange.length * 0.5 * 10) / 10;
        const adminHours = Math.round((meetingsInRange.length * 0.25 + tasksInRange.length * 0.1) * 10) / 10;

        const hasActivity = clientMeetingsHours > 0 || internalPlanningHours > 0 || researchAndDraftingHours > 0 || adminHours > 0;

        if (hasActivity) {
          const entry: TimesheetEntry = {
            projectId: project.id,
            projectName: project.name,
            hours: {
              clientMeetings: clientMeetingsHours,
              internalPlanning: internalPlanningHours,
              researchAndDrafting: researchAndDraftingHours,
              admin: adminHours,
            },
            breakdown: {
              meetingCount: meetingsInRange.length,
              meetingMinutes: Math.round(totalMeetingMinutes),
              taskCount: tasksInRange.length,
              fileCount: filesInRange.length,
            },
          };

          entries.push(entry);

          totalHours.clientMeetings += clientMeetingsHours;
          totalHours.internalPlanning += internalPlanningHours;
          totalHours.researchAndDrafting += researchAndDraftingHours;
          totalHours.admin += adminHours;
        }
      }

      totalHours.clientMeetings = Math.round(totalHours.clientMeetings * 10) / 10;
      totalHours.internalPlanning = Math.round(totalHours.internalPlanning * 10) / 10;
      totalHours.researchAndDrafting = Math.round(totalHours.researchAndDrafting * 10) / 10;
      totalHours.admin = Math.round(totalHours.admin * 10) / 10;

      const response: TimesheetResponse = {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        entries,
        totalHours,
      };

      res.json(response);
    } catch (error) {
      console.error("Failed to generate timesheet:", error);
      res.status(500).json({ error: "Failed to generate timesheet" });
    }
  });

  // ============= ROADMAP =============

  app.get("/api/projects/:id/roadmap", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const [tasks, useCases] = await Promise.all([
        storage.getTasks(projectId),
        storage.getUseCases(projectId),
      ]);

      const useCaseMap = new Map(useCases.map((uc) => [uc.id, uc.name]));

      const mapToRoadmapTask = (task: typeof tasks[0]): RoadmapTask => ({
        id: task.id,
        title: task.title,
        description: task.description,
        owner: task.owner,
        status: task.status,
        priority: task.priority,
        startDate: task.startDate?.toISOString() || null,
        endDate: task.endDate?.toISOString() || null,
        dueDate: task.dueDate?.toISOString() || null,
        useCaseId: task.useCaseId,
        useCaseName: task.useCaseId ? useCaseMap.get(task.useCaseId) || null : null,
      });

      const scheduledTasks = tasks.filter((t) => t.startDate && t.endDate);
      const unscheduledTasks = tasks
        .filter((t) => !t.startDate || !t.endDate)
        .map(mapToRoadmapTask);

      if (scheduledTasks.length === 0) {
        const response: RoadmapResponse = {
          projectId,
          projectName: project.name,
          weeks: [],
          unscheduledTasks,
          dateRange: {
            start: new Date().toISOString(),
            end: new Date().toISOString(),
          },
        };
        return res.json(response);
      }

      const allDates = scheduledTasks.flatMap((t) => [
        new Date(t.startDate!),
        new Date(t.endDate!),
      ]);
      const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

      const getWeekStart = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
      };

      const getWeekEnd = (weekStart: Date): Date => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 6);
        d.setHours(23, 59, 59, 999);
        return d;
      };

      const formatWeekLabel = (start: Date, end: Date): string => {
        const startMonth = start.toLocaleString("en-US", { month: "short" });
        const endMonth = end.toLocaleString("en-US", { month: "short" });
        if (startMonth === endMonth) {
          return `${startMonth} ${start.getDate()}-${end.getDate()}`;
        }
        return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
      };

      const weeks: RoadmapWeek[] = [];
      let currentWeekStart = getWeekStart(minDate);

      while (currentWeekStart <= maxDate) {
        const weekEnd = getWeekEnd(currentWeekStart);

        const weekTasks = scheduledTasks
          .filter((t) => {
            const taskStart = new Date(t.startDate!);
            const taskEnd = new Date(t.endDate!);
            return taskStart <= weekEnd && taskEnd >= currentWeekStart;
          })
          .map(mapToRoadmapTask);

        weeks.push({
          weekStart: currentWeekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          weekLabel: formatWeekLabel(currentWeekStart, weekEnd),
          tasks: weekTasks,
        });

        currentWeekStart = new Date(currentWeekStart);
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }

      const response: RoadmapResponse = {
        projectId,
        projectName: project.name,
        weeks,
        unscheduledTasks,
        dateRange: {
          start: minDate.toISOString(),
          end: maxDate.toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Failed to generate roadmap:", error);
      res.status(500).json({ error: "Failed to generate roadmap" });
    }
  });

  // ============= DELIVERABLES =============

  app.get("/api/deliverable-templates", async (_req, res) => {
    try {
      const templates = DELIVERABLE_TEMPLATES.map(t => ({
        type: t.type,
        name: t.name,
        description: t.description,
        milestoneCount: t.milestones.length,
        activityCount: t.milestones.reduce((sum, m) => sum + m.activities.length, 0),
      }));
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deliverable templates" });
    }
  });

  app.get("/api/projects/:id/deliverables", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const deliverables = await storage.getDeliverables(req.params.id);
      res.json(deliverables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deliverables" });
    }
  });

  app.post("/api/projects/:id/deliverables", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const { type } = req.body;
      
      if (type && DELIVERABLE_TEMPLATES.some(t => t.type === type)) {
        const result = await instantiateDeliverableFromTemplate(req.params.id, type as DeliverableTemplate["type"]);
        const deliverable = await storage.getDeliverable(result.deliverableId);
        return res.status(201).json({
          deliverable,
          milestonesCreated: result.milestonesCreated,
          activitiesCreated: result.activitiesCreated,
        });
      }

      const result = insertDeliverableSchema.safeParse({
        ...req.body,
        projectId: req.params.id,
      });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const deliverable = await storage.createDeliverable(result.data);
      res.status(201).json(deliverable);
    } catch (error) {
      console.error("Failed to create deliverable:", error);
      res.status(500).json({ error: "Failed to create deliverable" });
    }
  });

  app.get("/api/deliverables", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      if (!projectId) {
        return res.status(400).json({ error: "projectId query parameter is required" });
      }
      const deliverables = await storage.getDeliverables(projectId);
      res.json(deliverables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deliverables" });
    }
  });

  app.get("/api/deliverables/:id", async (req, res) => {
    try {
      const deliverable = await storage.getDeliverable(req.params.id);
      if (!deliverable) {
        return res.status(404).json({ error: "Deliverable not found" });
      }
      res.json(deliverable);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deliverable" });
    }
  });

  // ============= DELIVERABLE GUIDANCE =============

  app.get("/api/deliverables/:id/guidance", async (req, res) => {
    try {
      const deliverable = await storage.getDeliverable(req.params.id);
      if (!deliverable) {
        return res.status(404).json({ error: "Deliverable not found" });
      }

      const project = await storage.getProject(deliverable.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
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

      const useCaseIds = projectUseCases.map(uc => uc.id);
      const allReadinessScores = await Promise.all(
        useCaseIds.map(ucId => storage.getReadinessScores(ucId))
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
          category: "stakeholder"
        },
        "Stakeholder feedback form": { 
          check: () => projectData.hasStakeholders, 
          gap: "No stakeholders identified for feedback collection",
          category: "stakeholder"
        },
        "Use case documentation": { 
          check: () => projectData.hasUseCases, 
          gap: "No use cases defined for this project",
          category: "use_case"
        },
        "Business requirements": { 
          check: () => projectData.hasUseCases, 
          gap: "No use cases with business requirements defined",
          category: "use_case"
        },
        "Readiness scores": { 
          check: () => projectData.hasReadinessScores, 
          gap: "No readiness scores recorded for use cases",
          category: "readiness"
        },
        "Process documentation": { 
          check: () => projectData.hasWorkflows, 
          gap: "No workflow segments or process documentation defined",
          category: "workflow"
        },
        "Workflow diagram": { 
          check: () => projectData.hasWorkflows, 
          gap: "No workflow diagrams defined for this project",
          category: "workflow"
        },
      };

      const externalInputGaps: Record<string, { gap: string; category: string; priority: "high" | "medium" | "low" }> = {
        "Calendar availability": { gap: "Calendar availability information needed for scheduling", category: "scheduling", priority: "medium" },
        "System access": { gap: "System access credentials or permissions required", category: "infrastructure", priority: "high" },
        "Workshop agenda": { gap: "Workshop agenda needs to be prepared", category: "planning", priority: "medium" },
        "Assessment rubric": { gap: "Assessment rubric template required", category: "planning", priority: "medium" },
        "Budget information": { gap: "Budget information needs to be gathered from finance", category: "finance", priority: "high" },
        "Funding program details": { gap: "Funding program details need to be researched", category: "finance", priority: "high" },
        "Presentation materials": { gap: "Presentation materials need to be created", category: "deliverable", priority: "medium" },
        "Data catalog": { gap: "Data catalog or data dictionary required", category: "data", priority: "high" },
        "Schema documentation": { gap: "Database schema documentation needed", category: "data", priority: "medium" },
        "Demo environment": { gap: "Demo environment needs to be set up", category: "infrastructure", priority: "high" },
        "Feedback form": { gap: "Feedback collection form needs to be created", category: "planning", priority: "low" },
        "Test users list": { gap: "Test user list needs to be compiled", category: "testing", priority: "medium" },
        "Testing scenarios": { gap: "Testing scenarios need to be defined", category: "testing", priority: "medium" },
        "Financial projections": { gap: "Financial projections required for business case", category: "finance", priority: "high" },
        "Benchmark data": { gap: "Industry benchmark data needed for comparison", category: "research", priority: "medium" },
        "Foundry program documentation": { gap: "Microsoft Foundry program documentation needed", category: "microsoft", priority: "high" },
        "Frontier program guidelines": { gap: "Microsoft Frontier program guidelines required", category: "microsoft", priority: "high" },
        "ECIF application form": { gap: "ECIF application form template needed", category: "microsoft", priority: "high" },
        "Supporting documentation": { gap: "Supporting documentation needs to be compiled", category: "deliverable", priority: "medium" },
        "Microsoft contact list": { gap: "Microsoft contact list needs to be obtained", category: "microsoft", priority: "high" },
        "Budget details": { gap: "Detailed budget breakdown required", category: "finance", priority: "high" },
        "Project timeline": { gap: "Project timeline needs to be defined", category: "planning", priority: "high" },
        "Team information": { gap: "Team structure and roles information needed", category: "planning", priority: "medium" },
        "Analytics reports": { gap: "Analytics reports need to be generated", category: "data", priority: "medium" },
        "Performance dashboards": { gap: "Performance dashboards need to be set up", category: "data", priority: "medium" },
        "Cost estimates": { gap: "Cost estimates need to be prepared", category: "finance", priority: "high" },
        "Benefit projections": { gap: "Benefit projections need to be calculated", category: "finance", priority: "high" },
        "Budget requirements": { gap: "Budget requirements need to be documented", category: "finance", priority: "high" },
        "Resource needs": { gap: "Resource requirements need to be identified", category: "planning", priority: "medium" },
        "Draft presentation": { gap: "Draft presentation needs to be prepared", category: "deliverable", priority: "medium" },
        "Supporting materials": { gap: "Supporting materials need to be gathered", category: "deliverable", priority: "low" },
        "Executive talking points": { gap: "Executive talking points need to be drafted", category: "executive", priority: "high" },
        "ROI analysis": { gap: "ROI analysis needs to be completed", category: "finance", priority: "high" },
        "Risk assessment": { gap: "Risk assessment needs to be conducted", category: "planning", priority: "high" },
        "Change management plan": { gap: "Change management plan needs to be developed", category: "planning", priority: "medium" },
        "Training materials": { gap: "Training materials need to be prepared", category: "deliverable", priority: "medium" },
        "User documentation": { gap: "User documentation needs to be created", category: "deliverable", priority: "low" },
        "Technical specifications": { gap: "Technical specifications need to be documented", category: "technical", priority: "high" },
        "Integration requirements": { gap: "Integration requirements need to be defined", category: "technical", priority: "high" },
        "Security requirements": { gap: "Security requirements need to be documented", category: "technical", priority: "high" },
        "Compliance checklist": { gap: "Compliance checklist needs to be completed", category: "compliance", priority: "high" },
        "Vendor evaluation": { gap: "Vendor evaluation needs to be conducted", category: "procurement", priority: "medium" },
        "Contract terms": { gap: "Contract terms need to be reviewed", category: "legal", priority: "high" },
      };

      const checkInputAvailability = (input: string): { available: boolean; gap: string | null; category: string | null } => {
        for (const [key, mapping] of Object.entries(inputMappings)) {
          if (input.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(input.toLowerCase())) {
            return { 
              available: mapping.check(), 
              gap: mapping.check() ? null : mapping.gap,
              category: mapping.category
            };
          }
        }
        for (const [key, info] of Object.entries(externalInputGaps)) {
          if (input.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(input.toLowerCase())) {
            return { 
              available: false, 
              gap: info.gap,
              category: info.category
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

        const workshopTemplates: Record<string, GuidanceWorkshop> = {
          activation_map: {
            type: "Readiness & Sequencing Session",
            objective: "Assess use case readiness and determine optimal activation sequence",
            agenda: [
              "Review identified use cases (15 min)",
              "Score each use case on readiness dimensions (30 min)",
              "Discuss interdependencies and sequencing (20 min)",
              "Prioritize activation order (15 min)",
            ],
            suggestedDuration: "90 minutes",
            participants: ["Product Owner", "Technical Lead", "Business Analyst", "Stakeholder Representative"],
          },
          safe_prototypes: {
            type: "Prototype Validation Review",
            objective: "Validate prototype design and gather clinical/domain feedback",
            agenda: [
              "Demo current prototype state (20 min)",
              "Collect validation feedback from domain experts (30 min)",
              "Identify gaps and required iterations (20 min)",
              "Define acceptance criteria (15 min)",
            ],
            suggestedDuration: "90 minutes",
            participants: ["Clinical/Domain Expert", "UX Designer", "Product Owner", "Technical Lead"],
          },
          ms_funding_nav: {
            type: "Funding Strategy Workshop",
            objective: "Align on Microsoft funding program strategy and application approach",
            agenda: [
              "Review available funding programs (Foundry, Frontier, ECIF) (20 min)",
              "Assess project fit for each program (25 min)",
              "Draft application narrative (20 min)",
              "Assign ownership and timeline (10 min)",
            ],
            suggestedDuration: "75 minutes",
            participants: ["Account Executive", "Project Lead", "Finance Representative", "Microsoft Relationship Manager"],
          },
          exec_framing: {
            type: "Executive Validation Meeting",
            objective: "Validate executive framing narrative and secure leadership alignment",
            agenda: [
              "Present draft executive narrative (15 min)",
              "Gather executive feedback and concerns (20 min)",
              "Refine messaging and positioning (15 min)",
              "Confirm next steps and sponsorship (10 min)",
            ],
            suggestedDuration: "60 minutes",
            participants: ["Executive Sponsor", "Project Lead", "Strategic Advisor"],
          },
          custom: {
            type: "Discovery Workshop",
            objective: "Clarify requirements and align on deliverable scope",
            agenda: [
              "Review current state and objectives (15 min)",
              "Identify key requirements and constraints (20 min)",
              "Define success criteria (15 min)",
              "Assign next steps and ownership (10 min)",
            ],
            suggestedDuration: "60 minutes",
            participants: ["Project Lead", "Subject Matter Expert", "Stakeholder"],
          },
        };

        let suggestedWorkshop: GuidanceWorkshop | null = null;
        if (missingInputs.length > 0 && milestone.orderIndex <= 1 && !milestonesWithWorkshop.has(milestone.id)) {
          suggestedWorkshop = workshopTemplates[deliverable.type] || workshopTemplates.custom;
          milestonesWithWorkshop.add(milestone.id);
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

      const activitiesWithMissingInputs = nextBestSteps.filter(s => s.missingInputs.length > 0);
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
      } else if (scopeFlags.some(f => f.severity === "critical")) {
        notes = "Critical risks detected. Immediate attention required to avoid project delays.";
      } else {
        notes = `${nextBestSteps.length} activities need attention. Focus on high-risk items first.`;
      }

      const response: GuidanceResponse = {
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

      res.json(response);
    } catch (error) {
      console.error("Failed to generate guidance:", error);
      res.status(500).json({ error: "Failed to generate guidance" });
    }
  });

  app.patch("/api/deliverables/:id", async (req, res) => {
    try {
      const result = insertDeliverableSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const deliverable = await storage.updateDeliverable(req.params.id, result.data);
      if (!deliverable) {
        return res.status(404).json({ error: "Deliverable not found" });
      }
      res.json(deliverable);
    } catch (error) {
      res.status(500).json({ error: "Failed to update deliverable" });
    }
  });

  app.delete("/api/deliverables/:id", async (req, res) => {
    try {
      const success = await storage.deleteDeliverable(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Deliverable not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deliverable" });
    }
  });

  // ============= MILESTONES =============

  app.get("/api/deliverables/:id/milestones", async (req, res) => {
    try {
      const deliverable = await storage.getDeliverable(req.params.id);
      if (!deliverable) {
        return res.status(404).json({ error: "Deliverable not found" });
      }
      const milestones = await storage.getMilestones(req.params.id);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  app.post("/api/deliverables/:id/milestones", async (req, res) => {
    try {
      const deliverable = await storage.getDeliverable(req.params.id);
      if (!deliverable) {
        return res.status(404).json({ error: "Deliverable not found" });
      }
      const result = insertMilestoneSchema.safeParse({
        ...req.body,
        deliverableId: req.params.id,
      });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const milestone = await storage.createMilestone(result.data);
      res.status(201).json(milestone);
    } catch (error) {
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });

  app.get("/api/milestones/:id", async (req, res) => {
    try {
      const milestone = await storage.getMilestone(req.params.id);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestone" });
    }
  });

  app.patch("/api/milestones/:id", async (req, res) => {
    try {
      const result = insertMilestoneSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const milestone = await storage.updateMilestone(req.params.id, result.data);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  app.delete("/api/milestones/:id", async (req, res) => {
    try {
      const success = await storage.deleteMilestone(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete milestone" });
    }
  });

  // ============= ACTIVITIES =============

  app.get("/api/milestones/:id/activities", async (req, res) => {
    try {
      const milestone = await storage.getMilestone(req.params.id);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      const activities = await storage.getActivities(req.params.id);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/milestones/:id/activities", async (req, res) => {
    try {
      const milestone = await storage.getMilestone(req.params.id);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      const result = insertActivitySchema.safeParse({
        ...req.body,
        milestoneId: req.params.id,
      });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const activity = await storage.createActivity(result.data);
      res.status(201).json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to create activity" });
    }
  });

  app.get("/api/activities/:id", async (req, res) => {
    try {
      const activity = await storage.getActivity(req.params.id);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  app.patch("/api/activities/:id", async (req, res) => {
    try {
      const result = insertActivitySchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }
      const activity = await storage.updateActivity(req.params.id, result.data);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to update activity" });
    }
  });

  app.delete("/api/activities/:id", async (req, res) => {
    try {
      const success = await storage.deleteActivity(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Activity not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  return httpServer;
}
