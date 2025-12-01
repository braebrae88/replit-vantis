import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const projectPhaseEnum = pgEnum("project_phase", ["discovery", "design", "development", "deployment", "maintenance"]);
export const useCaseStatusEnum = pgEnum("use_case_status", ["draft", "approved", "implemented"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in-progress", "review", "done"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "critical"]);
export const riskCategoryEnum = pgEnum("risk_category", ["technical", "business", "operational", "security", "compliance"]);
export const riskStatusEnum = pgEnum("risk_status", ["identified", "analyzing", "mitigating", "resolved", "accepted"]);
export const eventTypeEnum = pgEnum("event_type", ["meeting", "email", "file", "milestone", "decision"]);

// Projects Table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  clientName: text("client_name"),
  description: text("description").notNull(),
  phase: projectPhaseEnum("phase").notNull().default("discovery"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Use Cases Table
export const useCases = pgTable("use_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  problemStatement: text("problem_statement"),
  valueHypothesis: text("value_hypothesis"),
  status: useCaseStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Workflow Segments Table
export const workflowSegments = pgTable("workflow_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  useCaseId: varchar("use_case_id").references(() => useCases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  systemName: text("system_name"),
  painPoints: text("pain_points"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Readiness Scores Table
export const readinessScores = pgTable("readiness_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  useCaseId: varchar("use_case_id").notNull().references(() => useCases.id, { onDelete: "cascade" }),
  dimension: text("dimension").notNull(),
  score: integer("score").notNull(),
  rationale: text("rationale"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Risks Table
export const risks = pgTable("risks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  useCaseId: varchar("use_case_id").references(() => useCases.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: riskCategoryEnum("category").notNull(),
  likelihood: integer("likelihood").notNull(),
  impact: integer("impact").notNull(),
  mitigation: text("mitigation"),
  owner: text("owner"),
  status: riskStatusEnum("status").notNull().default("identified"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tasks Table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  useCaseId: varchar("use_case_id").references(() => useCases.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  owner: text("owner"),
  dueDate: timestamp("due_date"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: taskStatusEnum("status").notNull().default("todo"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Stakeholders Table
export const stakeholders = pgTable("stakeholders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"),
  influence: integer("influence"),
  supportLevel: integer("support_level"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Events Table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  type: eventTypeEnum("type").notNull(),
  sourceSystem: text("source_system"),
  title: text("title").notNull(),
  description: text("description"),
  occurredAt: timestamp("occurred_at").notNull(),
  metadataJson: text("metadata_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  useCases: many(useCases),
  workflowSegments: many(workflowSegments),
  risks: many(risks),
  tasks: many(tasks),
  stakeholders: many(stakeholders),
  events: many(events),
}));

export const useCasesRelations = relations(useCases, ({ one, many }) => ({
  project: one(projects, {
    fields: [useCases.projectId],
    references: [projects.id],
  }),
  workflowSegments: many(workflowSegments),
  readinessScores: many(readinessScores),
  risks: many(risks),
  tasks: many(tasks),
}));

export const workflowSegmentsRelations = relations(workflowSegments, ({ one }) => ({
  project: one(projects, {
    fields: [workflowSegments.projectId],
    references: [projects.id],
  }),
  useCase: one(useCases, {
    fields: [workflowSegments.useCaseId],
    references: [useCases.id],
  }),
}));

export const readinessScoresRelations = relations(readinessScores, ({ one }) => ({
  useCase: one(useCases, {
    fields: [readinessScores.useCaseId],
    references: [useCases.id],
  }),
}));

export const risksRelations = relations(risks, ({ one }) => ({
  project: one(projects, {
    fields: [risks.projectId],
    references: [projects.id],
  }),
  useCase: one(useCases, {
    fields: [risks.useCaseId],
    references: [useCases.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  useCase: one(useCases, {
    fields: [tasks.useCaseId],
    references: [useCases.id],
  }),
}));

export const stakeholdersRelations = relations(stakeholders, ({ one }) => ({
  project: one(projects, {
    fields: [stakeholders.projectId],
    references: [projects.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
  }),
}));

// Zod Schemas for Insert/Select
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectProjectSchema = createSelectSchema(projects);

export const insertUseCaseSchema = createInsertSchema(useCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUseCaseSchema = createSelectSchema(useCases);

export const insertWorkflowSegmentSchema = createInsertSchema(workflowSegments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectWorkflowSegmentSchema = createSelectSchema(workflowSegments);

export const insertReadinessScoreSchema = createInsertSchema(readinessScores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectReadinessScoreSchema = createSelectSchema(readinessScores);

export const insertRiskSchema = createInsertSchema(risks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectRiskSchema = createSelectSchema(risks);

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectTaskSchema = createSelectSchema(tasks);

export const insertStakeholderSchema = createInsertSchema(stakeholders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectStakeholderSchema = createSelectSchema(stakeholders);

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const selectEventSchema = createSelectSchema(events);

export const insertFileEventSchema = z.object({
  projectId: z.string().uuid("Invalid project ID format"),
  fileName: z.string().min(1, "File name is required"),
  filePath: z.string().min(1, "File path is required"),
  fileType: z.string().min(1, "File type is required"),
  textSummary: z.string().optional(),
});

export const insertEmailEventSchema = z.object({
  projectId: z.string().uuid("Invalid project ID format"),
  from: z.string().email("Invalid sender email format"),
  to: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  bodySummary: z.string().optional(),
  sentAt: z.string().datetime({ offset: true }).optional(),
});

export const insertMeetingEventSchema = z.object({
  projectId: z.string().uuid("Invalid project ID format"),
  title: z.string().min(1, "Meeting title is required"),
  attendees: z.array(z.string()).min(1, "At least one attendee is required"),
  startTime: z.string().datetime({ offset: true, message: "Invalid start time format" }),
  endTime: z.string().datetime({ offset: true, message: "Invalid end time format" }),
  meetingNotesSummary: z.string().optional(),
});

export type InsertFileEvent = z.infer<typeof insertFileEventSchema>;
export type InsertEmailEvent = z.infer<typeof insertEmailEventSchema>;
export type InsertMeetingEvent = z.infer<typeof insertMeetingEventSchema>;

// TypeScript Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type UseCase = typeof useCases.$inferSelect;
export type InsertUseCase = z.infer<typeof insertUseCaseSchema>;

export type WorkflowSegment = typeof workflowSegments.$inferSelect;
export type InsertWorkflowSegment = z.infer<typeof insertWorkflowSegmentSchema>;

export type ReadinessScore = typeof readinessScores.$inferSelect;
export type InsertReadinessScore = z.infer<typeof insertReadinessScoreSchema>;

export type Risk = typeof risks.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Stakeholder = typeof stakeholders.$inferSelect;
export type InsertStakeholder = z.infer<typeof insertStakeholderSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Next Actions Types (not stored in DB, computed on-the-fly)
export const nextActionSeverityEnum = ["low", "medium", "high", "critical"] as const;
export type NextActionSeverity = (typeof nextActionSeverityEnum)[number];

export interface NextAction {
  title: string;
  description: string;
  severity: NextActionSeverity;
  category: "readiness" | "tasks" | "engagement" | "risks";
}

// AI Companion Types (not stored in DB, computed via AI)
export const companionRequestSchema = z.object({
  projectId: z.string().uuid("Invalid project ID format"),
  message: z.string().min(1, "Message is required"),
});

export interface SuggestedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
}

export interface CompanionResponse {
  responseText: string;
  assumptions: string[];
  gaps: string[];
  suggestedTasks: SuggestedTask[];
}

export type CompanionRequest = z.infer<typeof companionRequestSchema>;

// Weekly Status Report Types (not stored in DB, computed on-the-fly)
export interface StatusReportTask {
  id: string;
  title: string;
  status: string;
  completedAt?: string;
}

export interface StatusReportEvent {
  id: string;
  type: string;
  title: string;
  occurredAt: string;
}

export interface StatusReportRisk {
  id: string;
  title: string;
  category: string;
  status: string;
  likelihood: number;
  impact: number;
}

export interface StatusReport {
  projectId: string;
  projectName: string;
  generatedAt: string;
  reportPeriod: {
    start: string;
    end: string;
  };
  highlights: string[];
  completedTasks: StatusReportTask[];
  newOpenTasks: StatusReportTask[];
  recentEvents: StatusReportEvent[];
  risks: StatusReportRisk[];
  nextWeekFocus: string[];
  openDecisions: string[];
}

// Timesheet Draft Types (not stored in DB, computed on-the-fly)
export interface TimesheetHours {
  clientMeetings: number;
  internalPlanning: number;
  researchAndDrafting: number;
  admin: number;
}

export interface TimesheetEntry {
  projectId: string;
  projectName: string;
  hours: TimesheetHours;
  breakdown: {
    meetingCount: number;
    meetingMinutes: number;
    taskCount: number;
    fileCount: number;
  };
}

export interface TimesheetResponse {
  from: string;
  to: string;
  entries: TimesheetEntry[];
  totalHours: TimesheetHours;
}

// Roadmap Types (not stored in DB, computed on-the-fly)
export interface RoadmapTask {
  id: string;
  title: string;
  description: string | null;
  owner: string | null;
  status: (typeof taskStatusEnum.enumValues)[number];
  priority: (typeof taskPriorityEnum.enumValues)[number];
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  useCaseId: string | null;
  useCaseName: string | null;
}

export interface RoadmapWeek {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  tasks: RoadmapTask[];
}

export interface RoadmapResponse {
  projectId: string;
  projectName: string;
  weeks: RoadmapWeek[];
  unscheduledTasks: RoadmapTask[];
  dateRange: {
    start: string;
    end: string;
  };
}
