import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, pgEnum, real, boolean } from "drizzle-orm/pg-core";
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
export const deliverableTypeEnum = pgEnum("deliverable_type", ["activation_map", "safe_prototypes", "ms_funding_nav", "exec_framing", "custom"]);
export const deliverableStatusEnum = pgEnum("deliverable_status", ["not_started", "in_progress", "blocked", "done"]);
export const milestoneStatusEnum = pgEnum("milestone_status", ["not_started", "in_progress", "blocked", "done"]);
export const activityStatusEnum = pgEnum("activity_status", ["not_started", "in_progress", "blocked", "done"]);

// Stakeholder Enums
export const influenceLevelEnum = pgEnum("influence_level", ["low", "medium", "high"]);
export const supportLevelEnum = pgEnum("support_level_enum", ["opposed", "neutral", "supportive", "champion"]);

// Engagement Intelligence Enums
export const insightTypeEnum = pgEnum("insight_type", ["meeting_summary", "decision", "open_question", "risk", "opportunity_hint", "stakeholder_update"]);
export const sentimentEnum = pgEnum("sentiment", ["positive", "neutral", "negative"]);
export const importanceEnum = pgEnum("importance", ["low", "medium", "high"]);
export const opportunityStatusEnum = pgEnum("opportunity_status", ["idea", "qualified", "proposed", "won", "lost"]);

// Artifact Enums
export const artifactTypeEnum = pgEnum("artifact_type", ["activation_map_doc", "exec_brief", "funding_nav_pack", "safe_prototype_doc", "stakeholder_map", "value_scorecard_doc", "custom"]);
export const sectionStatusEnum = pgEnum("section_status", ["empty", "partial", "complete"]);

// Proposal Enums
export const proposalStatusEnum = pgEnum("proposal_status", ["DRAFT", "IN_REVIEW", "SIGNED", "CONVERTED"]);

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
  influence: influenceLevelEnum("influence"),
  supportLevel: supportLevelEnum("support_level"),
  lastContactAt: timestamp("last_contact_at"),
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

// Deliverables Table
export const deliverables = pgTable("deliverables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: deliverableTypeEnum("type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: deliverableStatusEnum("status").notNull().default("not_started"),
  progress: real("progress").notNull().default(0),
  totalHours: real("total_hours"),
  hoursRemaining: real("hours_remaining"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Milestones Table
export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deliverableId: varchar("deliverable_id").notNull().references(() => deliverables.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: milestoneStatusEnum("status").notNull().default("not_started"),
  orderIndex: integer("order_index").notNull(),
  expectedHours: real("expected_hours"),
  suggestedWorkshopKey: text("suggested_workshop_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Activities Table
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  milestoneId: varchar("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: activityStatusEnum("status").notNull().default("not_started"),
  orderIndex: integer("order_index").notNull(),
  requiresInput: boolean("requires_input").notNull().default(false),
  requiredInputs: text("required_inputs").array().notNull().default(sql`ARRAY[]::text[]`),
  createdTaskId: varchar("created_task_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Engagement Insights Table
export const engagementInsights = pgTable("engagement_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "set null" }),
  type: insightTypeEnum("type").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  sentiment: sentimentEnum("sentiment"),
  importance: importanceEnum("importance"),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdByAI: boolean("created_by_ai").notNull().default(true),
});

// Opportunity Seeds Table
export const opportunitySeeds = pgTable("opportunity_seeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  source: text("source").notNull(),
  status: opportunityStatusEnum("status").notNull().default("idea"),
  potentialValueEstimate: real("potential_value_estimate"),
  riskLevel: text("risk_level"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Metric Snapshots Table (Value Scorecard)
export const metricSnapshots = pgTable("metric_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit"),
  baseline: real("baseline"),
  currentValue: real("current_value"),
  targetValue: real("target_value"),
  capturedAt: timestamp("captured_at").notNull().defaultNow(),
});

// Artifacts Table
export const artifacts = pgTable("artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  deliverableId: varchar("deliverable_id").references(() => deliverables.id, { onDelete: "set null" }),
  type: artifactTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  completionPct: real("completion_pct").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Artifact Sections Table
export const artifactSections = pgTable("artifact_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  artifactId: varchar("artifact_id").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  label: text("label").notNull(),
  status: sectionStatusEnum("status").notNull().default("empty"),
  content: text("content"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Proposals Table
export const proposals = pgTable("proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientName: text("client_name").notNull(),
  title: text("title").notNull(),
  rawText: text("raw_text").notNull(),
  status: proposalStatusEnum("status").notNull().default("DRAFT"),
  estimatedStart: timestamp("estimated_start"),
  estimatedEnd: timestamp("estimated_end"),
  rateInfo: text("rate_info"),
  convertedProjectId: varchar("converted_project_id").references(() => projects.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// SOW Checklist Items Table
export const sowChecklistItems = pgTable("sow_checklist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  description: text("description"),
  isComplete: boolean("is_complete").notNull().default(false),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  useCases: many(useCases),
  workflowSegments: many(workflowSegments),
  risks: many(risks),
  tasks: many(tasks),
  stakeholders: many(stakeholders),
  events: many(events),
  deliverables: many(deliverables),
  engagementInsights: many(engagementInsights),
  opportunitySeeds: many(opportunitySeeds),
  metricSnapshots: many(metricSnapshots),
  artifacts: many(artifacts),
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

export const eventsRelations = relations(events, ({ one, many }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
  }),
  engagementInsights: many(engagementInsights),
}));

export const deliverablesRelations = relations(deliverables, ({ one, many }) => ({
  project: one(projects, {
    fields: [deliverables.projectId],
    references: [projects.id],
  }),
  milestones: many(milestones),
  artifacts: many(artifacts),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  deliverable: one(deliverables, {
    fields: [milestones.deliverableId],
    references: [deliverables.id],
  }),
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  milestone: one(milestones, {
    fields: [activities.milestoneId],
    references: [milestones.id],
  }),
}));

export const engagementInsightsRelations = relations(engagementInsights, ({ one }) => ({
  project: one(projects, {
    fields: [engagementInsights.projectId],
    references: [projects.id],
  }),
  event: one(events, {
    fields: [engagementInsights.eventId],
    references: [events.id],
  }),
}));

export const opportunitySeedsRelations = relations(opportunitySeeds, ({ one }) => ({
  project: one(projects, {
    fields: [opportunitySeeds.projectId],
    references: [projects.id],
  }),
}));

export const metricSnapshotsRelations = relations(metricSnapshots, ({ one }) => ({
  project: one(projects, {
    fields: [metricSnapshots.projectId],
    references: [projects.id],
  }),
}));

export const artifactsRelations = relations(artifacts, ({ one, many }) => ({
  project: one(projects, {
    fields: [artifacts.projectId],
    references: [projects.id],
  }),
  deliverable: one(deliverables, {
    fields: [artifacts.deliverableId],
    references: [deliverables.id],
  }),
  sections: many(artifactSections),
}));

export const artifactSectionsRelations = relations(artifactSections, ({ one }) => ({
  artifact: one(artifacts, {
    fields: [artifactSections.artifactId],
    references: [artifacts.id],
  }),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  convertedProject: one(projects, {
    fields: [proposals.convertedProjectId],
    references: [projects.id],
  }),
  checklistItems: many(sowChecklistItems),
}));

export const sowChecklistItemsRelations = relations(sowChecklistItems, ({ one }) => ({
  proposal: one(proposals, {
    fields: [sowChecklistItems.proposalId],
    references: [proposals.id],
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

export const insertDeliverableSchema = createInsertSchema(deliverables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectDeliverableSchema = createSelectSchema(deliverables);

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectMilestoneSchema = createSelectSchema(milestones);

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectActivitySchema = createSelectSchema(activities);

export const insertEngagementInsightSchema = createInsertSchema(engagementInsights).omit({
  id: true,
  createdAt: true,
});

export const selectEngagementInsightSchema = createSelectSchema(engagementInsights);

export const insertOpportunitySeedSchema = createInsertSchema(opportunitySeeds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateOpportunitySeedSchema = insertOpportunitySeedSchema.partial().extend({
  id: z.string().uuid("Invalid opportunity seed ID format"),
});

export const selectOpportunitySeedSchema = createSelectSchema(opportunitySeeds);

export const insertMetricSnapshotSchema = createInsertSchema(metricSnapshots).omit({
  id: true,
  capturedAt: true,
});

export const updateMetricSnapshotSchema = insertMetricSnapshotSchema.partial().extend({
  id: z.string().uuid("Invalid metric snapshot ID format"),
});

export const selectMetricSnapshotSchema = createSelectSchema(metricSnapshots);

export const insertArtifactSchema = createInsertSchema(artifacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateArtifactSchema = insertArtifactSchema.partial().extend({
  id: z.string().uuid("Invalid artifact ID format"),
});

export const selectArtifactSchema = createSelectSchema(artifacts);

export const insertArtifactSectionSchema = createInsertSchema(artifactSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateArtifactSectionSchema = insertArtifactSectionSchema.partial().extend({
  id: z.string().uuid("Invalid artifact section ID format"),
});

export const selectArtifactSectionSchema = createSelectSchema(artifactSections);

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProposalSchema = insertProposalSchema.partial().extend({
  id: z.string().uuid("Invalid proposal ID format"),
});

export const selectProposalSchema = createSelectSchema(proposals);

export const insertSowChecklistItemSchema = createInsertSchema(sowChecklistItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSowChecklistItemSchema = insertSowChecklistItemSchema.partial().extend({
  id: z.string().uuid("Invalid checklist item ID format"),
});

export const selectSowChecklistItemSchema = createSelectSchema(sowChecklistItems);

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

export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = z.infer<typeof insertDeliverableSchema>;

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type EngagementInsight = typeof engagementInsights.$inferSelect;
export type InsertEngagementInsight = z.infer<typeof insertEngagementInsightSchema>;

export type OpportunitySeed = typeof opportunitySeeds.$inferSelect;
export type InsertOpportunitySeed = z.infer<typeof insertOpportunitySeedSchema>;
export type UpdateOpportunitySeed = z.infer<typeof updateOpportunitySeedSchema>;

export type MetricSnapshot = typeof metricSnapshots.$inferSelect;
export type InsertMetricSnapshot = z.infer<typeof insertMetricSnapshotSchema>;
export type UpdateMetricSnapshot = z.infer<typeof updateMetricSnapshotSchema>;

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = z.infer<typeof insertArtifactSchema>;
export type UpdateArtifact = z.infer<typeof updateArtifactSchema>;

export type ArtifactSection = typeof artifactSections.$inferSelect;
export type InsertArtifactSection = z.infer<typeof insertArtifactSectionSchema>;
export type UpdateArtifactSection = z.infer<typeof updateArtifactSectionSchema>;

export type ArtifactWithSections = Artifact & { sections: ArtifactSection[] };

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type UpdateProposal = z.infer<typeof updateProposalSchema>;

export type SowChecklistItem = typeof sowChecklistItems.$inferSelect;
export type InsertSowChecklistItem = z.infer<typeof insertSowChecklistItemSchema>;
export type UpdateSowChecklistItem = z.infer<typeof updateSowChecklistItemSchema>;

export type ProposalWithChecklist = Proposal & { checklistItems: SowChecklistItem[] };

// Next Actions Types (not stored in DB, computed on-the-fly)
export const nextActionSeverityEnum = ["low", "medium", "high", "critical"] as const;
export type NextActionSeverity = (typeof nextActionSeverityEnum)[number];

export const nextActionUrgencyEnum = ["NOW", "SOON", "LATER"] as const;
export type NextActionUrgency = (typeof nextActionUrgencyEnum)[number];

export const nextActionLinkedTypeEnum = ["TASK", "ACTIVITY", "WORKSHOP", "RISK", "DELIVERABLE", "OTHER"] as const;
export type NextActionLinkedType = (typeof nextActionLinkedTypeEnum)[number];

export const vantisPhaseEnum = ["DISCOVER", "MAP", "PROTOTYPE", "UNLOCK"] as const;
export type VantisPhase = (typeof vantisPhaseEnum)[number];

export interface NextAction {
  id: string;
  title: string;
  description: string;
  suggestedDueDate: string | null;
  linkedType: NextActionLinkedType;
  linkedId: string | null;
  phase: VantisPhase;
  urgency: NextActionUrgency;
  severity: NextActionSeverity;
  category: "readiness" | "tasks" | "engagement" | "risks" | "deliverables" | "activities" | "stakeholders";
}

// AI Companion Types (not stored in DB, computed via AI)
export const companionRequestSchema = z.object({
  projectId: z.string().uuid("Invalid project ID format"),
  deliverableId: z.string().uuid("Invalid deliverable ID format").optional(),
  message: z.string().min(1, "Message is required"),
});

export interface SuggestedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
}

export interface CompanionResponse {
  responseText: string;
  assumptions?: string[];
  gaps?: string[];
  suggestedTasks?: SuggestedTask[];
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

// Deliverable Guidance Types (computed on-the-fly)
export interface WorkshopAgendaItem {
  time: string;
  topic: string;
}

export interface GuidanceWorkshop {
  key: string;
  title: string;
  objective: string;
  durationMinutes: number;
  recommendedAttendees: string[];
  agenda: WorkshopAgendaItem[];
}

export interface GuidanceStep {
  activityId: string;
  milestoneName: string;
  activityName: string;
  description: string;
  missingInputs: string[];
  suggestedTasks: string[];
  suggestedWorkshop: GuidanceWorkshop | null;
  riskIfIgnored: "Low" | "Medium" | "High";
}

export interface GuidanceScopeFlag {
  type: "schedule_risk" | "dependency_risk" | "resource_risk" | "scope_creep";
  severity: "warning" | "critical";
  message: string;
}

export interface GuidanceResponse {
  deliverableSummary: {
    id: string;
    type: string;
    name: string;
    status: string;
    progress: number;
  };
  nextBestSteps: GuidanceStep[];
  overallGaps: string[];
  scopeFlags: GuidanceScopeFlag[];
  notes: string;
}
