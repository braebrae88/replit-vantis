import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import {
  projects,
  useCases,
  deliverables,
  milestones,
  activities,
  tasks,
  risks,
  stakeholders,
  events,
  metricSnapshots,
  opportunitySeeds,
  engagementInsights,
} from "@shared/schema";
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
  insertEngagementInsightSchema,
  insertOpportunitySeedSchema,
  insertMetricSnapshotSchema,
  insertArtifactSchema,
  updateOpportunitySeedSchema,
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
import { z } from "zod";
import { instantiateDeliverableFromTemplate, DELIVERABLE_TEMPLATES, type DeliverableTemplate, type WorkshopTemplate } from "./deliverableTemplates";
import {
  getDeliverableMetrics,
  onMilestoneStatusChange,
  onActivityStatusChange,
  onMilestoneChange,
  onActivityChange,
  recalculateDeliverableMetrics,
} from "./deliverableMetrics";
import { getDeliverableGuidance } from "./guidanceService";
import { VANTIS_SYSTEM_PROMPT } from "./ai/systemPrompt";
import { EVENT_ANALYSIS_SYSTEM_PROMPT, EventAnalysisResult } from "./ai/eventAnalysisPrompt";
import { STAKEHOLDER_ANALYSIS_SYSTEM_PROMPT, StakeholderAnalysisResult } from "./ai/stakeholderPrompt";
import { IMPACT_STORY_SYSTEM_PROMPT, ImpactStoryResult } from "./ai/impactStoryPrompt";
import { ACCOUNT_GROWTH_SYSTEM_PROMPT, AccountGrowthResult, RuleBasedSuggestion, EngagementIdea } from "./ai/accountGrowthPrompt";
import { TRANSCRIPT_INTAKE_SYSTEM_PROMPT, buildTranscriptIntakePrompt, TranscriptAnalysisResult } from "./ai/transcriptIntakePrompt";
import { ACTIVITY_GUIDANCE_SYSTEM_PROMPT, buildActivityGuidanceUserPrompt } from "./ai/activityGuidancePrompt";
import { SOW_BOOTSTRAP_SYSTEM_PROMPT, buildSoWBootstrapPrompt, SoWBootstrapResult } from "./ai/sowBootstrapPrompt";
import { callLLM, parseJSONResponse } from "./ai/client";
import { computeNextActions } from "./nextActionsService";
import { populateArtifactsFromInsights, populateArtifactsFromTasks, populateArtifactsFromRisks } from "./artifactPopulationService";

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

      const actions = await computeNextActions(projectId);
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

  // ============= ENGAGEMENT INSIGHTS =============

  app.get("/api/projects/:id/engagement-insights", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const insights = await storage.getEngagementInsights(projectId);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch engagement insights" });
    }
  });

  app.post("/api/projects/:id/engagement-insights", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const result = insertEngagementInsightSchema.safeParse({ ...req.body, projectId });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }

      const insight = await storage.createEngagementInsight(result.data);
      res.status(201).json(insight);
    } catch (error) {
      console.error("Failed to create engagement insight:", error);
      res.status(500).json({ error: "Failed to create engagement insight" });
    }
  });

  app.delete("/api/engagement-insights/:id", async (req, res) => {
    try {
      const success = await storage.deleteEngagementInsight(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Engagement insight not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete engagement insight" });
    }
  });

  // ============= OPPORTUNITY SEEDS =============

  app.get("/api/projects/:id/opportunity-seeds", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const seeds = await storage.getOpportunitySeeds(projectId);
      res.json(seeds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch opportunity seeds" });
    }
  });

  app.post("/api/projects/:id/opportunity-seeds", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const result = insertOpportunitySeedSchema.safeParse({ ...req.body, projectId });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }

      const seed = await storage.createOpportunitySeed(result.data);
      res.status(201).json(seed);
    } catch (error) {
      console.error("Failed to create opportunity seed:", error);
      res.status(500).json({ error: "Failed to create opportunity seed" });
    }
  });

  app.patch("/api/opportunity-seeds/:id", async (req, res) => {
    try {
      const existingSeed = await storage.getOpportunitySeed(req.params.id);
      if (!existingSeed) {
        return res.status(404).json({ error: "Opportunity seed not found" });
      }

      const allowedFields = ["title", "description", "source", "status", "potentialValueEstimate", "riskLevel"];
      const filteredBody = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
      );

      if (Object.keys(filteredBody).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
      }

      const seed = await storage.updateOpportunitySeed(req.params.id, filteredBody);
      res.json(seed);
    } catch (error) {
      res.status(500).json({ error: "Failed to update opportunity seed" });
    }
  });

  app.delete("/api/opportunity-seeds/:id", async (req, res) => {
    try {
      const success = await storage.deleteOpportunitySeed(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Opportunity seed not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete opportunity seed" });
    }
  });

  // ============= METRIC SNAPSHOTS (VALUE SCORECARD) =============

  app.get("/api/projects/:id/metrics", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const metrics = await storage.getMetricSnapshots(projectId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.post("/api/projects/:id/metrics", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const result = insertMetricSnapshotSchema.safeParse({ ...req.body, projectId });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }

      const metric = await storage.createMetricSnapshot(result.data);
      res.status(201).json(metric);
    } catch (error) {
      console.error("Failed to create metric snapshot:", error);
      res.status(500).json({ error: "Failed to create metric snapshot" });
    }
  });

  app.patch("/api/metrics/:id", async (req, res) => {
    try {
      const existingMetric = await storage.getMetricSnapshot(req.params.id);
      if (!existingMetric) {
        return res.status(404).json({ error: "Metric snapshot not found" });
      }

      const allowedFields = ["name", "description", "unit", "baseline", "currentValue", "targetValue"];
      const filteredBody = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
      );

      if (Object.keys(filteredBody).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
      }

      const metric = await storage.updateMetricSnapshot(req.params.id, filteredBody);
      res.json(metric);
    } catch (error) {
      res.status(500).json({ error: "Failed to update metric snapshot" });
    }
  });

  app.delete("/api/metrics/:id", async (req, res) => {
    try {
      const success = await storage.deleteMetricSnapshot(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Metric snapshot not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete metric snapshot" });
    }
  });

  // ============= ARTIFACTS =============

  app.get("/api/projects/:id/artifacts", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const artifacts = await storage.getArtifacts(projectId);
      res.json(artifacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artifacts" });
    }
  });

  app.get("/api/artifacts/:id", async (req, res) => {
    try {
      const artifact = await storage.getArtifact(req.params.id);
      if (!artifact) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      res.json(artifact);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artifact" });
    }
  });

  app.post("/api/projects/:id/artifacts", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const result = insertArtifactSchema.safeParse({ ...req.body, projectId });
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }

      const artifact = await storage.createArtifact(result.data);
      res.status(201).json(artifact);
    } catch (error) {
      console.error("Failed to create artifact:", error);
      res.status(500).json({ error: "Failed to create artifact" });
    }
  });

  app.patch("/api/artifacts/:id", async (req, res) => {
    try {
      const existingArtifact = await storage.getArtifact(req.params.id);
      if (!existingArtifact) {
        return res.status(404).json({ error: "Artifact not found" });
      }

      const allowedFields = ["title", "description", "content", "completionPct"];
      const filteredBody = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
      );

      if (Object.keys(filteredBody).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
      }

      const artifact = await storage.updateArtifact(req.params.id, filteredBody);
      res.json(artifact);
    } catch (error) {
      res.status(500).json({ error: "Failed to update artifact" });
    }
  });

  app.delete("/api/artifacts/:id", async (req, res) => {
    try {
      const success = await storage.deleteArtifact(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete artifact" });
    }
  });

  // ============= ARTIFACT SECTIONS =============

  app.get("/api/artifacts/:id/sections", async (req, res) => {
    try {
      const artifact = await storage.getArtifact(req.params.id);
      if (!artifact) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      const sections = await storage.getArtifactSections(req.params.id);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artifact sections" });
    }
  });

  app.patch("/api/artifact-sections/:id", async (req, res) => {
    try {
      const existingSection = await storage.getArtifactSection(req.params.id);
      if (!existingSection) {
        return res.status(404).json({ error: "Artifact section not found" });
      }

      const allowedFields = ["status", "content"];
      const filteredBody = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
      );

      if (Object.keys(filteredBody).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
      }

      const section = await storage.updateArtifactSection(req.params.id, filteredBody);
      
      // Recompute artifact completion percentage
      const { updateArtifactCompletion } = await import("./artifactService");
      await updateArtifactCompletion(existingSection.artifactId);
      
      res.json(section);
    } catch (error) {
      res.status(500).json({ error: "Failed to update artifact section" });
    }
  });

  // ============= AI COMPANION =============

  app.post("/api/ai/companion", async (req, res) => {
    try {
      const result = companionRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }

      const { projectId, deliverableId, message } = result.data;

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const [useCases, tasks, risks] = await Promise.all([
        storage.getUseCases(projectId),
        storage.getTasks(projectId),
        storage.getRisks(projectId),
      ]);

      interface ContextPayload {
        project: {
          id: string;
          name: string;
          description: string | null;
          status: string;
          startDate: string | null;
          endDate: string | null;
        };
        useCases: { id: string; name: string; status: string }[];
        openTasks: { id: string; title: string; priority: string; status: string }[];
        activeRisks: { id: string; title: string; category: string; likelihood: number; impact: number }[];
        deliverable?: {
          id: string;
          type: string;
          name: string;
          status: string;
          progress: number;
        };
        guidance?: {
          nextBestSteps: Array<{
            activityName: string;
            milestoneName: string;
            missingInputs: string[];
            riskIfIgnored: string;
          }>;
          overallGaps: string[];
          scopeFlags: Array<{ type: string; severity: string; message: string }>;
          notes: string;
        };
      }

      const contextPayload: ContextPayload = {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.phase,
          startDate: project.startDate?.toISOString().split("T")[0] || null,
          endDate: project.endDate?.toISOString().split("T")[0] || null,
        },
        useCases: useCases.slice(0, 5).map((uc) => ({
          id: uc.id,
          name: uc.name,
          status: uc.status,
        })),
        openTasks: tasks
          .filter((t) => t.status !== "done")
          .slice(0, 5)
          .map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            status: t.status,
          })),
        activeRisks: risks
          .filter((r) => r.status !== "resolved" && r.status !== "accepted")
          .slice(0, 5)
          .map((r) => ({
            id: r.id,
            title: r.title,
            category: r.category,
            likelihood: r.likelihood,
            impact: r.impact,
          })),
      };

      if (deliverableId) {
        const guidanceResult = await getDeliverableGuidance(deliverableId);
        if (guidanceResult) {
          const { guidance } = guidanceResult;
          contextPayload.deliverable = guidance.deliverableSummary;
          contextPayload.guidance = {
            nextBestSteps: guidance.nextBestSteps.slice(0, 5).map((step) => ({
              activityName: step.activityName,
              milestoneName: step.milestoneName,
              missingInputs: step.missingInputs,
              riskIfIgnored: step.riskIfIgnored,
            })),
            overallGaps: guidance.overallGaps.slice(0, 5),
            scopeFlags: guidance.scopeFlags,
            notes: guidance.notes,
          };
        }
      }

      const userPrompt = `Current Project Context:
\`\`\`json
${JSON.stringify(contextPayload, null, 2)}
\`\`\`

User Question: ${message}`;

      const llmResult = await callLLM({
        systemPrompt: VANTIS_SYSTEM_PROMPT,
        userContent: userPrompt,
        temperature: 0.7,
        maxTokens: 1500,
      });

      if (!llmResult.success) {
        return res.status(500).json({ error: llmResult.error });
      }

      const response: CompanionResponse = {
        responseText: llmResult.content,
      };

      res.json(response);
    } catch (error) {
      console.error("Failed to process companion request:", error);
      res.status(500).json({ error: "Failed to process companion request" });
    }
  });

  // ============= EVENT ANALYSIS =============

  const eventAnalysisSchema = z.object({
    rawText: z.string().min(10, "Text must be at least 10 characters"),
  });

  app.post("/api/ai/events/:eventId/analyse", async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (!event.projectId) {
        return res.status(400).json({ error: "Event is not associated with a project" });
      }

      const eventProjectId = event.projectId;

      const result = eventAnalysisSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }

      const { rawText } = result.data;

      const llmResult = await callLLM({
        systemPrompt: EVENT_ANALYSIS_SYSTEM_PROMPT,
        userContent: `Analyse this meeting/email transcript:\n\n${rawText}`,
        temperature: 0.3,
        maxTokens: 2000,
        jsonMode: true,
      });

      if (!llmResult.success) {
        return res.status(500).json({ error: llmResult.error });
      }

      const parseResult = parseJSONResponse<EventAnalysisResult>(llmResult.content);
      if (!parseResult.success || !parseResult.data) {
        return res.status(500).json({ error: parseResult.error });
      }

      const analysis = parseResult.data;

      const createdInsights: any[] = [];
      const createdSeeds: any[] = [];

      const sentimentMap: Record<string, "positive" | "neutral" | "negative"> = {
        POSITIVE: "positive",
        NEUTRAL: "neutral",
        NEGATIVE: "negative",
      };
      const sentiment = sentimentMap[analysis.sentiment] || "neutral";

      if (analysis.summaryBullets && analysis.summaryBullets.length > 0) {
        const insight = await storage.createEngagementInsight({
          projectId: eventProjectId,
          eventId: event.id,
          type: "meeting_summary",
          title: `Summary: ${event.title}`,
          summary: analysis.summaryBullets.join("\n• "),
          sentiment,
          importance: "medium",
          tags: ["auto-generated"],
          createdByAI: true,
        });
        createdInsights.push(insight);
      }

      for (const decision of analysis.decisions || []) {
        const insight = await storage.createEngagementInsight({
          projectId: eventProjectId,
          eventId: event.id,
          type: "decision",
          title: decision.length > 100 ? decision.substring(0, 97) + "..." : decision,
          summary: decision,
          sentiment,
          importance: "high",
          tags: ["auto-generated", "decision"],
          createdByAI: true,
        });
        createdInsights.push(insight);
      }

      for (const risk of analysis.risks || []) {
        const insight = await storage.createEngagementInsight({
          projectId: eventProjectId,
          eventId: event.id,
          type: "risk",
          title: risk.length > 100 ? risk.substring(0, 97) + "..." : risk,
          summary: risk,
          sentiment: "negative",
          importance: "high",
          tags: ["auto-generated", "risk"],
          createdByAI: true,
        });
        createdInsights.push(insight);
      }

      for (const question of analysis.openQuestions || []) {
        const insight = await storage.createEngagementInsight({
          projectId: eventProjectId,
          eventId: event.id,
          type: "open_question",
          title: question.length > 100 ? question.substring(0, 97) + "..." : question,
          summary: question,
          sentiment: "neutral",
          importance: "medium",
          tags: ["auto-generated", "question"],
          createdByAI: true,
        });
        createdInsights.push(insight);
      }

      for (const hint of analysis.opportunityHints || []) {
        const seed = await storage.createOpportunitySeed({
          projectId: eventProjectId,
          title: hint.length > 100 ? hint.substring(0, 97) + "..." : hint,
          description: hint,
          source: "meeting",
          status: "idea",
        });
        createdSeeds.push(seed);
      }

      let artifactPopulation = { artifactsUpdated: 0, sectionsUpdated: 0 };
      try {
        const insightPopulation = await populateArtifactsFromInsights(eventProjectId, createdInsights);
        artifactPopulation = insightPopulation;
      } catch (err) {
        console.error("Error populating artifacts from event analysis:", err);
      }

      res.json({
        analysis,
        createdInsights: createdInsights.length,
        createdSeeds: createdSeeds.length,
        insights: createdInsights,
        seeds: createdSeeds,
        artifactPopulation,
      });
    } catch (error) {
      console.error("Failed to analyse event:", error);
      res.status(500).json({ error: "Failed to analyse event" });
    }
  });

  // ============= STAKEHOLDER INSIGHTS =============

  const stakeholderInsightsSchema = z.object({
    stakeholderId: z.string().min(1, "Stakeholder ID is required"),
    relatedText: z.string().min(10, "Text must be at least 10 characters"),
  });

  app.post("/api/ai/projects/:projectId/stakeholder-insights", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const result = stakeholderInsightsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).toString() });
      }

      const { stakeholderId, relatedText } = result.data;

      const stakeholder = await storage.getStakeholder(stakeholderId);
      if (!stakeholder) {
        return res.status(404).json({ error: "Stakeholder not found" });
      }

      if (stakeholder.projectId !== projectId) {
        return res.status(400).json({ error: "Stakeholder does not belong to this project" });
      }

      const llmResult = await callLLM({
        systemPrompt: STAKEHOLDER_ANALYSIS_SYSTEM_PROMPT,
        userContent: `Analyse this stakeholder information:\n\nStakeholder: ${stakeholder.name}\nRole: ${stakeholder.role || "Unknown"}\n\nNotes:\n${relatedText}`,
        temperature: 0.3,
        maxTokens: 1000,
        jsonMode: true,
      });

      if (!llmResult.success) {
        return res.status(500).json({ error: llmResult.error });
      }

      const parseResult = parseJSONResponse<StakeholderAnalysisResult>(llmResult.content);
      if (!parseResult.success || !parseResult.data) {
        return res.status(500).json({ error: parseResult.error });
      }

      const analysis = parseResult.data;

      const influenceMap: Record<string, "low" | "medium" | "high"> = {
        LOW: "low",
        MEDIUM: "medium",
        HIGH: "high",
      };
      const supportMap: Record<string, "opposed" | "neutral" | "supportive" | "champion"> = {
        OPPOSED: "opposed",
        NEUTRAL: "neutral",
        SUPPORTIVE: "supportive",
        CHAMPION: "champion",
      };

      const updatedStakeholder = await storage.updateStakeholder(stakeholderId, {
        influence: influenceMap[analysis.influence] || "medium",
        supportLevel: supportMap[analysis.supportLevel] || "neutral",
        lastContactAt: new Date(),
      });

      const insight = await storage.createEngagementInsight({
        projectId,
        type: "stakeholder_update",
        title: `Stakeholder Analysis: ${stakeholder.name}`,
        summary: `Influence: ${analysis.influence}, Support: ${analysis.supportLevel}\n\nKey Concerns:\n• ${analysis.keyConcerns.join("\n• ")}`,
        sentiment: analysis.supportLevel === "CHAMPION" || analysis.supportLevel === "SUPPORTIVE" ? "positive" 
                 : analysis.supportLevel === "OPPOSED" ? "negative" 
                 : "neutral",
        importance: analysis.influence === "HIGH" ? "high" : analysis.influence === "MEDIUM" ? "medium" : "low",
        tags: ["stakeholder", "auto-generated"],
        createdByAI: true,
      });

      res.json({
        analysis,
        stakeholder: updatedStakeholder,
        insight,
      });
    } catch (error) {
      console.error("Failed to analyse stakeholder:", error);
      res.status(500).json({ error: "Failed to analyse stakeholder" });
    }
  });

  // ============= IMPACT STORY =============

  app.post("/api/ai/projects/:id/impact-story", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const [metrics, deliverables] = await Promise.all([
        storage.getMetricSnapshots(projectId),
        storage.getDeliverables(projectId),
      ]);

      const metricsText = metrics.length > 0
        ? metrics.map(m => {
            const parts = [`• ${m.name}`];
            if (m.description) parts.push(`  Description: ${m.description}`);
            if (m.unit) parts.push(`  Unit: ${m.unit}`);
            if (m.baseline !== null) parts.push(`  Baseline: ${m.baseline}`);
            if (m.currentValue !== null) parts.push(`  Current: ${m.currentValue}`);
            if (m.targetValue !== null) parts.push(`  Target: ${m.targetValue}`);
            return parts.join("\n");
          }).join("\n\n")
        : "No metrics have been captured yet.";

      const deliverablesText = deliverables.length > 0
        ? deliverables.map(d => `• ${d.name}: ${d.description} (Status: ${d.status}, Progress: ${d.progress}%)`).join("\n")
        : "No deliverables defined.";

      const userPrompt = `Project: ${project.name}
Description: ${project.description || "Not specified"}
Client: ${project.clientName || "Not specified"}
Phase: ${project.phase}

Metrics:
${metricsText}

Key Deliverables:
${deliverablesText}

Please generate an impact story based on this information.`;

      const llmResult = await callLLM({
        systemPrompt: IMPACT_STORY_SYSTEM_PROMPT,
        userContent: userPrompt,
        temperature: 0.4,
        maxTokens: 1500,
        jsonMode: true,
      });

      if (!llmResult.success) {
        return res.status(500).json({ error: llmResult.error });
      }

      const parseResult = parseJSONResponse<ImpactStoryResult>(llmResult.content);
      if (!parseResult.success || !parseResult.data) {
        return res.status(500).json({ error: parseResult.error });
      }

      res.json(parseResult.data);
    } catch (error) {
      console.error("Failed to generate impact story:", error);
      res.status(500).json({ error: "Failed to generate impact story" });
    }
  });

  // ============= TRANSCRIPT INTAKE =============

  const transcriptIntakeSchema = z.object({
    rawTranscript: z.string().min(10, "Transcript must be at least 10 characters"),
    eventType: z.enum(["meeting", "workshop", "call"]),
    phase: z.enum(["DISCOVER", "MAP", "PROTOTYPE", "UNLOCK"]),
  });

  app.post("/api/ai/projects/:projectId/transcript-intake", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const parseResult = transcriptIntakeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: fromError(parseResult.error).toString() });
      }

      const { rawTranscript, eventType, phase } = parseResult.data;

      const eventDate = new Date();
      const eventTitle = `Transcript Intake – ${eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      const snippetLength = 200;
      const snippet = rawTranscript.length > snippetLength 
        ? rawTranscript.substring(0, snippetLength) + "..." 
        : rawTranscript;

      const createdEvent = await storage.createEvent({
        projectId,
        type: "meeting",
        title: eventTitle,
        description: snippet,
        occurredAt: eventDate,
        sourceSystem: "transcript-intake",
        metadataJson: JSON.stringify({ eventType, phase, transcriptLength: rawTranscript.length }),
      });

      const projectContext = `Project: ${project.name}\nClient: ${project.clientName || 'N/A'}\nDescription: ${project.description}`;
      const userPrompt = buildTranscriptIntakePrompt(rawTranscript, eventType, phase, projectContext);

      const llmResult = await callLLM({
        systemPrompt: TRANSCRIPT_INTAKE_SYSTEM_PROMPT,
        userContent: userPrompt,
        temperature: 0.3,
        maxTokens: 2000,
        jsonMode: true,
      });

      if (!llmResult.success) {
        return res.status(500).json({ error: llmResult.error });
      }

      const jsonResult = parseJSONResponse<TranscriptAnalysisResult>(llmResult.content);
      if (!jsonResult.success || !jsonResult.data) {
        return res.status(500).json({ error: jsonResult.error });
      }

      const analysis = jsonResult.data;
      const createdInsights: typeof engagementInsights.$inferSelect[] = [];
      const createdTasks: typeof tasks.$inferSelect[] = [];
      const createdRisks: typeof risks.$inferSelect[] = [];
      const updatedStakeholders: typeof stakeholders.$inferSelect[] = [];

      const insightsToCreate: Parameters<typeof storage.createManyEngagementInsights>[0] = [];

      if (analysis.summary) {
        insightsToCreate.push({
          projectId,
          eventId: createdEvent.id,
          type: "meeting_summary",
          title: eventTitle,
          summary: analysis.summary,
          importance: "medium",
          tags: [eventType, phase.toLowerCase()],
          createdByAI: true,
        });
      }

      for (const decision of analysis.decisions || []) {
        insightsToCreate.push({
          projectId,
          eventId: createdEvent.id,
          type: "decision",
          title: decision.description.substring(0, 100),
          summary: `${decision.description}${decision.madeBy ? ` (Decision by: ${decision.madeBy})` : ''}`,
          importance: "high",
          tags: ["decision", eventType],
          createdByAI: true,
        });
      }

      for (const question of analysis.openQuestions || []) {
        insightsToCreate.push({
          projectId,
          eventId: createdEvent.id,
          type: "open_question",
          title: question.question.substring(0, 100),
          summary: question.context ? `${question.question}\n\nContext: ${question.context}` : question.question,
          importance: "medium",
          tags: ["open-question", eventType],
          createdByAI: true,
        });
      }

      if (insightsToCreate.length > 0) {
        const created = await storage.createManyEngagementInsights(insightsToCreate);
        createdInsights.push(...created);
      }

      for (const action of analysis.actions || []) {
        const task = await storage.createTask({
          projectId,
          title: action.title,
          description: action.description,
          owner: action.owner || undefined,
          dueDate: action.dueDate ? new Date(action.dueDate) : undefined,
          status: "todo",
          priority: "medium",
        });
        createdTasks.push(task);
      }

      for (const riskItem of analysis.risks || []) {
        const risk = await storage.createRisk({
          projectId,
          title: riskItem.title,
          category: riskItem.category,
          likelihood: 3,
          impact: 3,
          mitigation: riskItem.description,
          status: "identified",
        });
        createdRisks.push(risk);
      }

      for (const stakeholderMention of analysis.stakeholders || []) {
        const existingStakeholder = await storage.findStakeholderByName(projectId, stakeholderMention.name);
        
        if (existingStakeholder) {
          const supportMap: Record<string, "opposed" | "neutral" | "supportive" | "champion"> = {
            positive: "supportive",
            neutral: "neutral",
            negative: "opposed",
          };
          
          const updates: Partial<typeof existingStakeholder> = {
            lastContactAt: new Date(),
          };
          
          if (stakeholderMention.role && !existingStakeholder.role) {
            updates.role = stakeholderMention.role;
          }
          
          if (stakeholderMention.sentiment) {
            updates.supportLevel = supportMap[stakeholderMention.sentiment] || "neutral";
          }
          
          const updated = await storage.updateStakeholder(existingStakeholder.id, updates);
          if (updated) updatedStakeholders.push(updated);
        } else {
          const supportMap: Record<string, "opposed" | "neutral" | "supportive" | "champion"> = {
            positive: "supportive",
            neutral: "neutral",
            negative: "opposed",
          };
          
          const newStakeholder = await storage.createStakeholder({
            projectId,
            name: stakeholderMention.name,
            role: stakeholderMention.role || undefined,
            supportLevel: stakeholderMention.sentiment ? supportMap[stakeholderMention.sentiment] : "neutral",
            lastContactAt: new Date(),
            notes: `First mentioned in transcript intake on ${eventDate.toLocaleDateString()}`,
          });
          updatedStakeholders.push(newStakeholder);
        }
      }

      const transcriptNextActions = analysis.nextActions || [];

      const recomputedNextActions = await computeNextActions(projectId);

      const allNextActions = [
        ...transcriptNextActions,
        ...recomputedNextActions,
      ].sort((a, b) => {
        const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
      });

      let artifactPopulation = { artifactsUpdated: 0, sectionsUpdated: 0 };
      try {
        const insightPopulation = await populateArtifactsFromInsights(projectId, createdInsights);
        const taskPopulation = await populateArtifactsFromTasks(
          projectId, 
          createdTasks.map(t => ({ title: t.title, description: t.description, dueDate: t.dueDate }))
        );
        const riskPopulation = await populateArtifactsFromRisks(
          projectId, 
          createdRisks.map(r => ({ title: r.title, category: r.category, mitigation: r.mitigation }))
        );
        
        artifactPopulation = {
          artifactsUpdated: insightPopulation.artifactsUpdated + taskPopulation.artifactsUpdated + riskPopulation.artifactsUpdated,
          sectionsUpdated: insightPopulation.sectionsUpdated + taskPopulation.sectionsUpdated + riskPopulation.sectionsUpdated,
        };
      } catch (err) {
        console.error("Error populating artifacts from transcript:", err);
      }

      res.json({
        eventId: createdEvent.id,
        insights: createdInsights,
        tasks: createdTasks,
        risks: createdRisks,
        stakeholders: updatedStakeholders,
        nextActions: allNextActions,
        transcriptSuggestedActions: transcriptNextActions,
        summary: analysis.summary,
        artifactPopulation,
      });
    } catch (error) {
      console.error("Failed to process transcript intake:", error);
      res.status(500).json({ error: "Failed to process transcript" });
    }
  });

  // ============= ACTIVITY GUIDANCE =============

  interface PrepContentDocument {
    label: string;
    artifactId: string | null;
    suggestedSource: string;
  }

  interface PrepContent {
    summaryToReview: string;
    documentsToBring: PrepContentDocument[];
    dataOrScreenshotsToPrepare: string[];
  }

  interface ActivityGuidanceResult {
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
  }

  app.get("/api/ai/activities/:activityId/guidance", async (req, res) => {
    try {
      const { activityId } = req.params;

      const context = await storage.getActivityWithContext(activityId);
      if (!context) {
        return res.status(404).json({ error: "Activity not found or missing context" });
      }

      const { activity, milestone, deliverable, project, stakeholders, recentInsights } = context;

      const allEvents = await storage.getEvents(project.id);
      const meetingEvents = allEvents
        .filter(e => ["meeting", "email", "milestone"].includes(e.type))
        .sort((a, b) => {
          const dateA = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
          const dateB = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);

      const userPrompt = buildActivityGuidanceUserPrompt({
        activity: {
          name: activity.name,
          description: activity.description,
          status: activity.status,
        },
        milestone: {
          name: milestone.name,
          description: milestone.description,
        },
        deliverable: {
          name: deliverable.name,
          type: deliverable.type,
          description: deliverable.description,
        },
        project: {
          name: project.name,
          clientName: project.clientName,
          phase: project.phase,
        },
        stakeholders: stakeholders.map((s) => ({
          name: s.name,
          role: s.role || "Unknown",
          influence: s.influence || "medium",
          sentiment: s.supportLevel,
        })),
        recentInsights: recentInsights.map((i) => ({
          title: i.title,
          summary: i.summary,
          sentiment: i.sentiment,
          type: i.type,
        })),
        recentEvents: meetingEvents.map((e) => ({
          title: e.title,
          type: e.type,
          description: e.description,
          date: e.occurredAt ? new Date(e.occurredAt).toISOString().split('T')[0] : null,
        })),
      });

      const llmResult = await callLLM({
        systemPrompt: ACTIVITY_GUIDANCE_SYSTEM_PROMPT,
        userContent: userPrompt,
        temperature: 0.5,
        maxTokens: 2500,
        jsonMode: true,
      });

      if (!llmResult.success) {
        return res.status(500).json({ error: llmResult.error });
      }

      const parseResult = parseJSONResponse<ActivityGuidanceResult>(llmResult.content);
      if (!parseResult.success || !parseResult.data) {
        return res.status(500).json({ error: parseResult.error });
      }

      const result = parseResult.data;
      if (!result.prepContent) {
        result.prepContent = {
          summaryToReview: "",
          documentsToBring: [],
          dataOrScreenshotsToPrepare: [],
        };
      }

      res.json(result);
    } catch (error) {
      console.error("Failed to generate activity guidance:", error);
      res.status(500).json({ error: "Failed to generate activity guidance" });
    }
  });

  // ============= SOW BOOTSTRAP =============

  const sowBootstrapSchema = z.object({
    statementOfWorkText: z.string().min(50, "Statement of Work must be at least 50 characters"),
  });

  app.post("/api/ai/projects/:projectId/bootstrap-from-sow", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const parseResult = sowBootstrapSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: fromError(parseResult.error).toString() });
      }

      const { statementOfWorkText } = parseResult.data;

      const userPrompt = buildSoWBootstrapPrompt(statementOfWorkText, {
        name: project.name,
        clientName: project.clientName || undefined,
      });

      const llmResult = await callLLM({
        systemPrompt: SOW_BOOTSTRAP_SYSTEM_PROMPT,
        userContent: userPrompt,
        temperature: 0.3,
        maxTokens: 3000,
        jsonMode: true,
      });

      if (!llmResult.success) {
        return res.status(500).json({ error: llmResult.error });
      }

      const jsonResult = parseJSONResponse<SoWBootstrapResult>(llmResult.content);
      if (!jsonResult.success || !jsonResult.data) {
        return res.status(500).json({ error: jsonResult.error });
      }

      const analysis = jsonResult.data;

      const createdUseCases: typeof useCases.$inferSelect[] = [];
      const createdDeliverables: typeof deliverables.$inferSelect[] = [];
      const createdTasks: typeof tasks.$inferSelect[] = [];
      const createdInsights: typeof engagementInsights.$inferSelect[] = [];
      const createdStakeholders: typeof stakeholders.$inferSelect[] = [];

      for (const uc of analysis.useCases) {
        const priorityMap: Record<string, "low" | "medium" | "high" | "critical"> = {
          high: "high",
          medium: "medium", 
          low: "low",
        };
        const useCase = await storage.createUseCase({
          projectId,
          name: uc.name,
          problemStatement: uc.description,
          valueHypothesis: uc.potentialImpact || null,
          status: "draft",
        });
        createdUseCases.push(useCase);
      }

      for (const deliverableType of analysis.deliverableTypes) {
        try {
          const result = await instantiateDeliverableFromTemplate(projectId, deliverableType);
          if (result.deliverableId) {
            const deliverable = await storage.getDeliverable(result.deliverableId);
            if (deliverable) {
              createdDeliverables.push(deliverable);
            }
          }
        } catch (err) {
          console.warn(`Failed to instantiate deliverable ${deliverableType}:`, err);
        }
      }

      for (const task of analysis.tasks) {
        const priorityMap: Record<string, "low" | "medium" | "high" | "critical"> = {
          critical: "critical",
          high: "high",
          medium: "medium",
          low: "low",
        };
        const createdTask = await storage.createTask({
          projectId,
          title: task.title,
          description: task.description,
          priority: priorityMap[task.priority] || "medium",
          status: "todo",
          owner: task.ownerRole || undefined,
        });
        createdTasks.push(createdTask);
      }

      for (const stakeholder of analysis.stakeholders) {
        const influenceMap: Record<string, "low" | "medium" | "high"> = {
          high: "high",
          medium: "medium",
          low: "low",
        };
        const roleWithOrg = stakeholder.organization 
          ? `${stakeholder.role || 'Unknown'} at ${stakeholder.organization}` 
          : stakeholder.role || undefined;
        const createdStakeholder = await storage.createStakeholder({
          projectId,
          name: stakeholder.name,
          role: roleWithOrg,
          influence: influenceMap[stakeholder.influence] || "medium",
          supportLevel: "neutral",
        });
        createdStakeholders.push(createdStakeholder);
      }

      const insightsToCreate: Parameters<typeof storage.createManyEngagementInsights>[0] = [];

      insightsToCreate.push({
        projectId,
        type: "meeting_summary",
        title: "SoW Bootstrap Summary",
        summary: analysis.projectSummary,
        importance: "high",
        tags: ["sow", "bootstrap", "initialization"],
        createdByAI: true,
      });

      for (const insight of analysis.insights) {
        const typeMap: Record<string, "meeting_summary" | "decision" | "open_question" | "risk" | "opportunity_hint" | "stakeholder_update"> = {
          constraint: "decision",
          opportunity: "opportunity_hint",
          risk: "risk",
          context: "meeting_summary",
        };
        const importanceMap: Record<string, "low" | "medium" | "high"> = {
          high: "high",
          medium: "medium",
          low: "low",
        };
        insightsToCreate.push({
          projectId,
          type: typeMap[insight.type] || "meeting_summary",
          title: insight.title,
          summary: insight.summary,
          importance: importanceMap[insight.importance] || "medium",
          tags: ["sow", insight.type],
          createdByAI: true,
        });
      }

      if (insightsToCreate.length > 0) {
        const created = await storage.createManyEngagementInsights(insightsToCreate);
        createdInsights.push(...created);
      }

      if (analysis.suggestedPhase) {
        const phaseToProjectPhase: Record<string, "discovery" | "design" | "development" | "deployment" | "maintenance"> = {
          DISCOVER: "discovery",
          MAP: "design",
          PROTOTYPE: "development",
          UNLOCK: "deployment",
        };
        const newPhase = phaseToProjectPhase[analysis.suggestedPhase];
        if (newPhase && newPhase !== project.phase) {
          await storage.updateProject(projectId, { phase: newPhase });
        }
      }

      if (analysis.timeline.startDate || analysis.timeline.endDate) {
        const updateData: Parameters<typeof storage.updateProject>[1] = {};
        if (analysis.timeline.startDate) {
          updateData.startDate = new Date(analysis.timeline.startDate);
        }
        if (analysis.timeline.endDate) {
          updateData.endDate = new Date(analysis.timeline.endDate);
        }
        if (Object.keys(updateData).length > 0) {
          await storage.updateProject(projectId, updateData);
        }
      }

      for (const na of analysis.nextActions) {
        const severityToPriority: Record<string, "low" | "medium" | "high" | "critical"> = {
          critical: "critical",
          high: "high",
          medium: "medium",
          low: "low",
        };
        const urgencyToDays: Record<string, number> = {
          NOW: 3,
          SOON: 7,
          LATER: 14,
        };
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (urgencyToDays[na.urgency] || 7));
        
        const actionTask = await storage.createTask({
          projectId,
          title: `[SoW] ${na.title}`,
          description: `${na.description}\n\n---\nCategory: ${na.category}\nSource: Statement of Work bootstrap`,
          priority: severityToPriority[na.severity] || "medium",
          status: "todo",
          dueDate,
        });
        createdTasks.push(actionTask);
      }

      const recomputedNextActions = await computeNextActions(projectId);

      res.json({
        success: true,
        summary: analysis.projectSummary,
        suggestedPhase: analysis.suggestedPhase,
        created: {
          useCases: createdUseCases.length,
          deliverables: createdDeliverables.length,
          tasks: createdTasks.length,
          stakeholders: createdStakeholders.length,
          insights: createdInsights.length,
        },
        useCases: createdUseCases,
        deliverables: createdDeliverables,
        tasks: createdTasks,
        stakeholders: createdStakeholders,
        insights: createdInsights,
        nextActions: recomputedNextActions,
        timeline: analysis.timeline,
      });
    } catch (error) {
      console.error("Failed to bootstrap from SoW:", error);
      res.status(500).json({ error: "Failed to bootstrap project from Statement of Work" });
    }
  });

  // ============= ACCOUNT GROWTH =============

  app.get("/api/projects/:id/account-growth", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const [
        useCases,
        deliverables,
        risks,
        opportunitySeeds,
        metrics,
        stakeholders,
        insights,
      ] = await Promise.all([
        storage.getUseCases(projectId),
        storage.getDeliverables(projectId),
        storage.getRisks(projectId),
        storage.getOpportunitySeeds(projectId),
        storage.getMetricSnapshots(projectId),
        storage.getStakeholders(projectId),
        storage.getEngagementInsights(projectId),
      ]);

      const ruleBasedSuggestions: RuleBasedSuggestion[] = [];

      const safePrototypes = deliverables.find(d => d.type === "safe_prototypes");
      const pilotUseCases = useCases.filter(uc => uc.status === "implemented");
      if (safePrototypes && safePrototypes.progress >= 75 && pilotUseCases.length > 0) {
        ruleBasedSuggestions.push({
          title: "Phase 2: Scale successful prototypes",
          description: "SAFE prototypes are near completion with implemented use cases ready for broader rollout.",
          trigger: `${safePrototypes.progress}% prototype completion, ${pilotUseCases.length} implemented use case(s)`,
        });
      }

      const dataGovRisks = risks.filter(
        r => r.category === "security" || r.category === "compliance" || 
             r.title.toLowerCase().includes("data") || r.title.toLowerCase().includes("governance")
      );
      if (dataGovRisks.length >= 2) {
        ruleBasedSuggestions.push({
          title: "Governance & Data Readiness sprint",
          description: "Multiple data and governance-related risks identified that may benefit from a focused sprint.",
          trigger: `${dataGovRisks.length} data/governance risks identified`,
        });
      }

      const seedsByTag: Record<string, typeof opportunitySeeds> = {};
      opportunitySeeds.forEach(seed => {
        const words = seed.title.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 4) {
            if (!seedsByTag[word]) seedsByTag[word] = [];
            seedsByTag[word].push(seed);
          }
        });
      });
      const groupedSeeds = Object.entries(seedsByTag).filter(([_, seeds]) => seeds.length >= 2);
      if (groupedSeeds.length > 0) {
        const topGroup = groupedSeeds.sort((a, b) => b[1].length - a[1].length)[0];
        ruleBasedSuggestions.push({
          title: `Opportunity cluster: ${topGroup[0]}`,
          description: `Multiple opportunity seeds share the theme "${topGroup[0]}" - consider a focused engagement.`,
          trigger: `${topGroup[1].length} opportunity seeds with similar theme`,
        });
      }

      const highInfluenceOpposed = stakeholders.filter(
        s => s.influence === "high" && s.supportLevel === "opposed"
      );
      if (highInfluenceOpposed.length > 0) {
        ruleBasedSuggestions.push({
          title: "Stakeholder alignment workshop",
          description: "High-influence stakeholders with opposition may benefit from dedicated alignment efforts.",
          trigger: `${highInfluenceOpposed.length} high-influence opposed stakeholder(s)`,
        });
      }

      const projectSummary = {
        project: {
          name: project.name,
          phase: project.phase,
          description: project.description,
        },
        useCases: useCases.map(uc => ({
          name: uc.name,
          status: uc.status,
          valueHypothesis: uc.valueHypothesis,
        })),
        deliverables: deliverables.map(d => ({
          name: d.name,
          type: d.type,
          status: d.status,
          progress: d.progress,
        })),
        risks: risks.map(r => ({
          title: r.title,
          category: r.category,
          status: r.status,
          severity: r.likelihood * r.impact,
        })),
        opportunitySeeds: opportunitySeeds.map(s => ({
          title: s.title,
          description: s.description,
          status: s.status,
          potentialValue: s.potentialValueEstimate,
        })),
        metrics: metrics.map(m => ({
          name: m.name,
          baseline: m.baseline,
          current: m.currentValue,
          target: m.targetValue,
          unit: m.unit,
        })),
        stakeholders: stakeholders.map(s => ({
          name: s.name,
          role: s.role,
          influence: s.influence,
          support: s.supportLevel,
        })),
        recentInsights: insights.slice(0, 5).map(i => ({
          type: i.type,
          title: i.title,
          sentiment: i.sentiment,
        })),
        ruleBasedSuggestions: ruleBasedSuggestions,
      };

      const userPrompt = `Here is the current state of the client's activation program:

${JSON.stringify(projectSummary, null, 2)}

Based on this information, propose 2–5 concrete follow-on engagements that would help this client. Consider:
- The maturity of current deliverables and use cases
- Unaddressed risks and opportunity seeds
- Stakeholder alignment needs
- Metrics that show room for improvement
- Any rule-based suggestions already identified

Return your response as JSON.`;

      const llmResult = await callLLM({
        systemPrompt: ACCOUNT_GROWTH_SYSTEM_PROMPT,
        userContent: userPrompt,
        temperature: 0.5,
        maxTokens: 2000,
        jsonMode: true,
      });

      if (!llmResult.success) {
        return res.status(500).json({ error: llmResult.error });
      }

      const parseResult = parseJSONResponse<AccountGrowthResult>(llmResult.content);
      if (!parseResult.success || !parseResult.data) {
        return res.status(500).json({ error: parseResult.error });
      }

      res.json({
        ruleBasedSuggestions,
        aiIdeas: parseResult.data.ideas || [],
        opportunitySeeds,
      });
    } catch (error) {
      console.error("Failed to generate account growth suggestions:", error);
      res.status(500).json({ error: "Failed to generate account growth suggestions" });
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
        await recalculateDeliverableMetrics(result.deliverableId);
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

        const template = DELIVERABLE_TEMPLATES.find(t => t.type === deliverable.type);
        
        let suggestedWorkshop: GuidanceWorkshop | null = null;
        if (missingInputs.length > 0 && milestone.orderIndex <= 1 && !milestonesWithWorkshop.has(milestone.id)) {
          const workshopKey = milestone.suggestedWorkshopKey;
          if (workshopKey && template?.workshopTemplates) {
            const workshopTemplate = template.workshopTemplates.find(w => w.key === workshopKey);
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

  // ============= DELIVERABLE METRICS =============

  app.get("/api/deliverables/:id/metrics", async (req, res) => {
    try {
      const deliverable = await storage.getDeliverable(req.params.id);
      if (!deliverable) {
        return res.status(404).json({ error: "Deliverable not found" });
      }

      const metrics = await getDeliverableMetrics(req.params.id);
      if (!metrics) {
        return res.status(500).json({ error: "Failed to calculate metrics" });
      }

      res.json(metrics);
    } catch (error) {
      console.error("Failed to get deliverable metrics:", error);
      res.status(500).json({ error: "Failed to get deliverable metrics" });
    }
  });

  app.get("/api/deliverables/:id/workshop-invite", async (req, res) => {
    try {
      const deliverable = await storage.getDeliverable(req.params.id);
      if (!deliverable) {
        return res.status(404).json({ error: "Deliverable not found" });
      }

      const workshopKey = req.query.key as string;
      if (!workshopKey) {
        return res.status(400).json({ error: "Workshop key is required" });
      }

      const template = DELIVERABLE_TEMPLATES.find(t => t.type === deliverable.type);
      if (!template || !template.workshopTemplates) {
        return res.status(404).json({ error: "No workshop templates found for this deliverable type" });
      }

      const workshopTemplate = template.workshopTemplates.find(w => w.key === workshopKey);
      if (!workshopTemplate) {
        return res.status(404).json({ error: "Workshop template not found" });
      }

      const project = await storage.getProject(deliverable.projectId);
      const projectName = project?.name || "the project";

      const agendaText = workshopTemplate.agenda
        .map(item => `  - ${item.time}: ${item.topic}`)
        .join("\n");

      const attendeesText = workshopTemplate.recommendedAttendees.join(", ");

      const durationText = workshopTemplate.durationMinutes >= 60
        ? `${Math.floor(workshopTemplate.durationMinutes / 60)} hour${workshopTemplate.durationMinutes >= 120 ? "s" : ""}${workshopTemplate.durationMinutes % 60 > 0 ? ` ${workshopTemplate.durationMinutes % 60} minutes` : ""}`
        : `${workshopTemplate.durationMinutes} minutes`;

      const emailBody = `Subject: ${workshopTemplate.title} - ${projectName}

Hi Team,

I would like to invite you to a ${workshopTemplate.title} as part of our work on ${projectName}.

Purpose:
${workshopTemplate.objective}

Duration: ${durationText}

Proposed Agenda:
${agendaText}

Recommended Attendees: ${attendeesText}

Please confirm your availability for this session. I will send a calendar invite once we have confirmed a suitable time.

Best regards`;

      res.json({
        workshopKey: workshopTemplate.key,
        workshopTitle: workshopTemplate.title,
        emailSubject: `${workshopTemplate.title} - ${projectName}`,
        emailBody,
      });
    } catch (error) {
      console.error("Failed to generate workshop invite:", error);
      res.status(500).json({ error: "Failed to generate workshop invite" });
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
      
      const oldMilestone = await storage.getMilestone(req.params.id);
      const milestone = await storage.updateMilestone(req.params.id, result.data);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      if (result.data.status && oldMilestone && result.data.status !== oldMilestone.status) {
        await onMilestoneStatusChange(req.params.id, result.data.status);
      } else if (oldMilestone) {
        await onMilestoneChange(req.params.id);
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
      
      const oldActivity = await storage.getActivity(req.params.id);
      const activity = await storage.updateActivity(req.params.id, result.data);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      if (result.data.status && oldActivity && result.data.status !== oldActivity.status) {
        await onActivityStatusChange(req.params.id, result.data.status);
      } else if (oldActivity) {
        await onActivityChange(req.params.id);
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

  // TEMP: test data reset endpoint
  app.delete("/admin/test-data", async (_req, res) => {
    try {
      await db.delete(engagementInsights);
      await db.delete(opportunitySeeds);
      await db.delete(events);
      await db.delete(metricSnapshots);
      await db.delete(stakeholders);
      await db.delete(tasks);
      await db.delete(activities);
      await db.delete(milestones);
      await db.delete(deliverables);
      await db.delete(useCases);
      await db.delete(projects);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to clear test data:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  return httpServer;
}
