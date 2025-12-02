import {
  projects,
  useCases,
  workflowSegments,
  readinessScores,
  risks,
  tasks,
  stakeholders,
  events,
  deliverables,
  milestones,
  activities,
  engagementInsights,
  opportunitySeeds,
  type Project,
  type InsertProject,
  type UseCase,
  type InsertUseCase,
  type WorkflowSegment,
  type InsertWorkflowSegment,
  type ReadinessScore,
  type InsertReadinessScore,
  type Risk,
  type InsertRisk,
  type Task,
  type InsertTask,
  type Stakeholder,
  type InsertStakeholder,
  type Event,
  type InsertEvent,
  type Deliverable,
  type InsertDeliverable,
  type Milestone,
  type InsertMilestone,
  type Activity,
  type InsertActivity,
  type EngagementInsight,
  type InsertEngagementInsight,
  type OpportunitySeed,
  type InsertOpportunitySeed,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Use Cases
  getUseCases(projectId?: string): Promise<UseCase[]>;
  getUseCase(id: string): Promise<UseCase | undefined>;
  createUseCase(useCase: InsertUseCase): Promise<UseCase>;
  updateUseCase(id: string, useCase: Partial<InsertUseCase>): Promise<UseCase | undefined>;
  deleteUseCase(id: string): Promise<boolean>;

  // Workflow Segments
  getWorkflowSegments(projectId?: string, useCaseId?: string): Promise<WorkflowSegment[]>;
  getWorkflowSegment(id: string): Promise<WorkflowSegment | undefined>;
  createWorkflowSegment(segment: InsertWorkflowSegment): Promise<WorkflowSegment>;
  updateWorkflowSegment(id: string, segment: Partial<InsertWorkflowSegment>): Promise<WorkflowSegment | undefined>;
  deleteWorkflowSegment(id: string): Promise<boolean>;

  // Readiness Scores
  getReadinessScores(useCaseId?: string): Promise<ReadinessScore[]>;
  getReadinessScore(id: string): Promise<ReadinessScore | undefined>;
  createReadinessScore(score: InsertReadinessScore): Promise<ReadinessScore>;
  updateReadinessScore(id: string, score: Partial<InsertReadinessScore>): Promise<ReadinessScore | undefined>;
  deleteReadinessScore(id: string): Promise<boolean>;

  // Risks
  getRisks(projectId?: string, useCaseId?: string): Promise<Risk[]>;
  getRisk(id: string): Promise<Risk | undefined>;
  createRisk(risk: InsertRisk): Promise<Risk>;
  updateRisk(id: string, risk: Partial<InsertRisk>): Promise<Risk | undefined>;
  deleteRisk(id: string): Promise<boolean>;

  // Tasks
  getTasks(projectId?: string, useCaseId?: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Stakeholders
  getStakeholders(projectId?: string): Promise<Stakeholder[]>;
  getStakeholder(id: string): Promise<Stakeholder | undefined>;
  createStakeholder(stakeholder: InsertStakeholder): Promise<Stakeholder>;
  updateStakeholder(id: string, stakeholder: Partial<InsertStakeholder>): Promise<Stakeholder | undefined>;
  deleteStakeholder(id: string): Promise<boolean>;

  // Events
  getEvents(projectId?: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  deleteEvent(id: string): Promise<boolean>;

  // Deliverables
  getDeliverables(projectId: string): Promise<Deliverable[]>;
  getDeliverable(id: string): Promise<Deliverable | undefined>;
  createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable>;
  updateDeliverable(id: string, deliverable: Partial<InsertDeliverable>): Promise<Deliverable | undefined>;
  deleteDeliverable(id: string): Promise<boolean>;

  // Milestones
  getMilestones(deliverableId: string): Promise<Milestone[]>;
  getMilestone(id: string): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: string): Promise<boolean>;

  // Activities
  getActivities(milestoneId: string): Promise<Activity[]>;
  getActivity(id: string): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<boolean>;

  // Engagement Insights
  getEngagementInsights(projectId: string): Promise<EngagementInsight[]>;
  getEngagementInsight(id: string): Promise<EngagementInsight | undefined>;
  createEngagementInsight(insight: InsertEngagementInsight): Promise<EngagementInsight>;
  deleteEngagementInsight(id: string): Promise<boolean>;

  // Opportunity Seeds
  getOpportunitySeeds(projectId: string): Promise<OpportunitySeed[]>;
  getOpportunitySeed(id: string): Promise<OpportunitySeed | undefined>;
  createOpportunitySeed(seed: InsertOpportunitySeed): Promise<OpportunitySeed>;
  updateOpportunitySeed(id: string, seed: Partial<InsertOpportunitySeed>): Promise<OpportunitySeed | undefined>;
  deleteOpportunitySeed(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(sql`${projects.createdAt} desc`);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Use Cases
  async getUseCases(projectId?: string): Promise<UseCase[]> {
    if (projectId) {
      return await db.select().from(useCases).where(eq(useCases.projectId, projectId));
    }
    return await db.select().from(useCases);
  }

  async getUseCase(id: string): Promise<UseCase | undefined> {
    const [useCase] = await db.select().from(useCases).where(eq(useCases.id, id));
    return useCase;
  }

  async createUseCase(useCase: InsertUseCase): Promise<UseCase> {
    const [newUseCase] = await db.insert(useCases).values(useCase).returning();
    return newUseCase;
  }

  async updateUseCase(id: string, useCase: Partial<InsertUseCase>): Promise<UseCase | undefined> {
    const [updated] = await db
      .update(useCases)
      .set({ ...useCase, updatedAt: new Date() })
      .where(eq(useCases.id, id))
      .returning();
    return updated;
  }

  async deleteUseCase(id: string): Promise<boolean> {
    const result = await db.delete(useCases).where(eq(useCases.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Workflow Segments
  async getWorkflowSegments(projectId?: string, useCaseId?: string): Promise<WorkflowSegment[]> {
    if (projectId && useCaseId) {
      return await db.select().from(workflowSegments).where(
        and(eq(workflowSegments.projectId, projectId), eq(workflowSegments.useCaseId, useCaseId))
      );
    } else if (projectId) {
      return await db.select().from(workflowSegments).where(eq(workflowSegments.projectId, projectId));
    } else if (useCaseId) {
      return await db.select().from(workflowSegments).where(eq(workflowSegments.useCaseId, useCaseId));
    }
    return await db.select().from(workflowSegments);
  }

  async getWorkflowSegment(id: string): Promise<WorkflowSegment | undefined> {
    const [segment] = await db.select().from(workflowSegments).where(eq(workflowSegments.id, id));
    return segment;
  }

  async createWorkflowSegment(segment: InsertWorkflowSegment): Promise<WorkflowSegment> {
    const [newSegment] = await db.insert(workflowSegments).values(segment).returning();
    return newSegment;
  }

  async updateWorkflowSegment(id: string, segment: Partial<InsertWorkflowSegment>): Promise<WorkflowSegment | undefined> {
    const [updated] = await db
      .update(workflowSegments)
      .set({ ...segment, updatedAt: new Date() })
      .where(eq(workflowSegments.id, id))
      .returning();
    return updated;
  }

  async deleteWorkflowSegment(id: string): Promise<boolean> {
    const result = await db.delete(workflowSegments).where(eq(workflowSegments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Readiness Scores
  async getReadinessScores(useCaseId?: string): Promise<ReadinessScore[]> {
    if (useCaseId) {
      return await db.select().from(readinessScores).where(eq(readinessScores.useCaseId, useCaseId));
    }
    return await db.select().from(readinessScores);
  }

  async getReadinessScore(id: string): Promise<ReadinessScore | undefined> {
    const [score] = await db.select().from(readinessScores).where(eq(readinessScores.id, id));
    return score;
  }

  async createReadinessScore(score: InsertReadinessScore): Promise<ReadinessScore> {
    const [newScore] = await db.insert(readinessScores).values(score).returning();
    return newScore;
  }

  async updateReadinessScore(id: string, score: Partial<InsertReadinessScore>): Promise<ReadinessScore | undefined> {
    const [updated] = await db
      .update(readinessScores)
      .set({ ...score, updatedAt: new Date() })
      .where(eq(readinessScores.id, id))
      .returning();
    return updated;
  }

  async deleteReadinessScore(id: string): Promise<boolean> {
    const result = await db.delete(readinessScores).where(eq(readinessScores.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Risks
  async getRisks(projectId?: string, useCaseId?: string): Promise<Risk[]> {
    if (projectId && useCaseId) {
      return await db.select().from(risks).where(
        and(eq(risks.projectId, projectId), eq(risks.useCaseId, useCaseId))
      );
    } else if (projectId) {
      return await db.select().from(risks).where(eq(risks.projectId, projectId));
    } else if (useCaseId) {
      return await db.select().from(risks).where(eq(risks.useCaseId, useCaseId));
    }
    return await db.select().from(risks);
  }

  async getRisk(id: string): Promise<Risk | undefined> {
    const [risk] = await db.select().from(risks).where(eq(risks.id, id));
    return risk;
  }

  async createRisk(risk: InsertRisk): Promise<Risk> {
    const [newRisk] = await db.insert(risks).values(risk).returning();
    return newRisk;
  }

  async updateRisk(id: string, risk: Partial<InsertRisk>): Promise<Risk | undefined> {
    const [updated] = await db
      .update(risks)
      .set({ ...risk, updatedAt: new Date() })
      .where(eq(risks.id, id))
      .returning();
    return updated;
  }

  async deleteRisk(id: string): Promise<boolean> {
    const result = await db.delete(risks).where(eq(risks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Tasks
  async getTasks(projectId?: string, useCaseId?: string): Promise<Task[]> {
    if (projectId && useCaseId) {
      return await db.select().from(tasks).where(
        and(eq(tasks.projectId, projectId), eq(tasks.useCaseId, useCaseId))
      );
    } else if (projectId) {
      return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
    } else if (useCaseId) {
      return await db.select().from(tasks).where(eq(tasks.useCaseId, useCaseId));
    }
    return await db.select().from(tasks);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db
      .update(tasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Stakeholders
  async getStakeholders(projectId?: string): Promise<Stakeholder[]> {
    if (projectId) {
      return await db.select().from(stakeholders).where(eq(stakeholders.projectId, projectId));
    }
    return await db.select().from(stakeholders);
  }

  async getStakeholder(id: string): Promise<Stakeholder | undefined> {
    const [stakeholder] = await db.select().from(stakeholders).where(eq(stakeholders.id, id));
    return stakeholder;
  }

  async createStakeholder(stakeholder: InsertStakeholder): Promise<Stakeholder> {
    const [newStakeholder] = await db.insert(stakeholders).values(stakeholder).returning();
    return newStakeholder;
  }

  async updateStakeholder(id: string, stakeholder: Partial<InsertStakeholder>): Promise<Stakeholder | undefined> {
    const [updated] = await db
      .update(stakeholders)
      .set({ ...stakeholder, updatedAt: new Date() })
      .where(eq(stakeholders.id, id))
      .returning();
    return updated;
  }

  async deleteStakeholder(id: string): Promise<boolean> {
    const result = await db.delete(stakeholders).where(eq(stakeholders.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Events
  async getEvents(projectId?: string): Promise<Event[]> {
    if (projectId) {
      return await db.select().from(events).where(eq(events.projectId, projectId)).orderBy(sql`${events.occurredAt} desc`);
    }
    return await db.select().from(events).orderBy(sql`${events.occurredAt} desc`);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Deliverables
  async getDeliverables(projectId: string): Promise<Deliverable[]> {
    return await db.select().from(deliverables).where(eq(deliverables.projectId, projectId)).orderBy(sql`${deliverables.createdAt} asc`);
  }

  async getDeliverable(id: string): Promise<Deliverable | undefined> {
    const [deliverable] = await db.select().from(deliverables).where(eq(deliverables.id, id));
    return deliverable;
  }

  async createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable> {
    const [newDeliverable] = await db.insert(deliverables).values(deliverable).returning();
    return newDeliverable;
  }

  async updateDeliverable(id: string, deliverable: Partial<InsertDeliverable>): Promise<Deliverable | undefined> {
    const [updated] = await db
      .update(deliverables)
      .set({ ...deliverable, updatedAt: new Date() })
      .where(eq(deliverables.id, id))
      .returning();
    return updated;
  }

  async deleteDeliverable(id: string): Promise<boolean> {
    const result = await db.delete(deliverables).where(eq(deliverables.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Milestones
  async getMilestones(deliverableId: string): Promise<Milestone[]> {
    return await db.select().from(milestones).where(eq(milestones.deliverableId, deliverableId)).orderBy(sql`${milestones.orderIndex} asc`);
  }

  async getMilestone(id: string): Promise<Milestone | undefined> {
    const [milestone] = await db.select().from(milestones).where(eq(milestones.id, id));
    return milestone;
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const [newMilestone] = await db.insert(milestones).values(milestone).returning();
    return newMilestone;
  }

  async updateMilestone(id: string, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const [updated] = await db
      .update(milestones)
      .set({ ...milestone, updatedAt: new Date() })
      .where(eq(milestones.id, id))
      .returning();
    return updated;
  }

  async deleteMilestone(id: string): Promise<boolean> {
    const result = await db.delete(milestones).where(eq(milestones.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Activities
  async getActivities(milestoneId: string): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.milestoneId, milestoneId)).orderBy(sql`${activities.orderIndex} asc`);
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [updated] = await db
      .update(activities)
      .set({ ...activity, updatedAt: new Date() })
      .where(eq(activities.id, id))
      .returning();
    return updated;
  }

  async deleteActivity(id: string): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Engagement Insights
  async getEngagementInsights(projectId: string): Promise<EngagementInsight[]> {
    return await db.select().from(engagementInsights).where(eq(engagementInsights.projectId, projectId)).orderBy(sql`${engagementInsights.createdAt} desc`);
  }

  async getEngagementInsight(id: string): Promise<EngagementInsight | undefined> {
    const [insight] = await db.select().from(engagementInsights).where(eq(engagementInsights.id, id));
    return insight;
  }

  async createEngagementInsight(insight: InsertEngagementInsight): Promise<EngagementInsight> {
    const [newInsight] = await db.insert(engagementInsights).values(insight).returning();
    return newInsight;
  }

  async deleteEngagementInsight(id: string): Promise<boolean> {
    const result = await db.delete(engagementInsights).where(eq(engagementInsights.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Opportunity Seeds
  async getOpportunitySeeds(projectId: string): Promise<OpportunitySeed[]> {
    return await db.select().from(opportunitySeeds).where(eq(opportunitySeeds.projectId, projectId)).orderBy(sql`${opportunitySeeds.createdAt} desc`);
  }

  async getOpportunitySeed(id: string): Promise<OpportunitySeed | undefined> {
    const [seed] = await db.select().from(opportunitySeeds).where(eq(opportunitySeeds.id, id));
    return seed;
  }

  async createOpportunitySeed(seed: InsertOpportunitySeed): Promise<OpportunitySeed> {
    const [newSeed] = await db.insert(opportunitySeeds).values(seed).returning();
    return newSeed;
  }

  async updateOpportunitySeed(id: string, seed: Partial<InsertOpportunitySeed>): Promise<OpportunitySeed | undefined> {
    const [updated] = await db
      .update(opportunitySeeds)
      .set({ ...seed, updatedAt: new Date() })
      .where(eq(opportunitySeeds.id, id))
      .returning();
    return updated;
  }

  async deleteOpportunitySeed(id: string): Promise<boolean> {
    const result = await db.delete(opportunitySeeds).where(eq(opportunitySeeds.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();
