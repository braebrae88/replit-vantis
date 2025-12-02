import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import {
  projects,
  useCases,
  tasks,
  risks,
  stakeholders,
  events,
  deliverables,
  milestones,
  activities,
  engagementInsights,
  opportunitySeeds,
  metricSnapshots,
} from "../shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function seed() {
  console.log("Seeding test data...");

  const projectsData = [
    {
      name: "OntarioMD – Primary Care Handoff Activation",
      clientName: "OntarioMD",
      description: "AI-powered clinical handoff automation for primary care transitions. Reducing administrative burden and improving continuity of care across the referral network.",
      phase: "design" as const,
      startDate: new Date("2024-09-01"),
      endDate: new Date("2025-03-31"),
    },
    {
      name: "VHA – Home Health AI Activation",
      clientName: "VHA Home HealthCare",
      description: "Implementing AI assistants for home care coordinators to streamline scheduling, care plan generation, and family communication.",
      phase: "development" as const,
      startDate: new Date("2024-10-15"),
      endDate: new Date("2025-06-30"),
    },
    {
      name: "Oak Valley – ED Flow & Concierge",
      clientName: "Oak Valley Health",
      description: "Emergency department patient flow optimization using predictive AI and digital concierge services for improved wait times and patient experience.",
      phase: "discovery" as const,
      startDate: new Date("2024-11-01"),
      endDate: new Date("2025-04-30"),
    },
  ];

  const createdProjects = await db.insert(projects).values(projectsData).returning();
  console.log(`Created ${createdProjects.length} projects`);

  for (const project of createdProjects) {
    await seedUseCases(project.id, project.name);
    await seedTasks(project.id, project.name);
    await seedRisks(project.id);
    await seedStakeholders(project.id, project.name);
    await seedEvents(project.id, project.name);
    await seedDeliverables(project.id, project.name);
    await seedOpportunitySeeds(project.id, project.name);
    await seedMetricSnapshots(project.id, project.name);
  }

  console.log(`\nSeeded test data for ${createdProjects.length} projects.`);
  await pool.end();
}

async function seedUseCases(projectId: string, projectName: string) {
  const useCasesMap: Record<string, Array<{ name: string; problemStatement: string; valueHypothesis: string; status: "draft" | "approved" | "implemented" }>> = {
    "OntarioMD": [
      { name: "Referral Summary Generation", problemStatement: "Physicians spend 15+ minutes per referral manually summarizing patient history", valueHypothesis: "AI-generated summaries will reduce prep time to under 3 minutes", status: "implemented" },
      { name: "Specialist Matching", problemStatement: "PCPs often don't know which specialist has availability or expertise for specific conditions", valueHypothesis: "Smart routing will reduce inappropriate referrals by 40%", status: "approved" },
      { name: "Handoff Status Tracking", problemStatement: "No visibility into whether referrals were received, reviewed, or scheduled", valueHypothesis: "Real-time tracking will reduce follow-up calls by 60%", status: "approved" },
      { name: "Patient Portal Integration", problemStatement: "Patients call offices repeatedly asking about referral status", valueHypothesis: "Self-service status checks will reduce admin call volume by 30%", status: "draft" },
    ],
    "VHA": [
      { name: "Care Plan Generation", problemStatement: "Coordinators spend 45+ minutes creating initial care plans from assessment notes", valueHypothesis: "AI drafts will reduce creation time to 10 minutes with human review", status: "implemented" },
      { name: "Schedule Optimization", problemStatement: "Manual scheduling leads to 15% wasted travel time between visits", valueHypothesis: "Optimized routing will increase daily visit capacity by 20%", status: "approved" },
      { name: "Family Communication Hub", problemStatement: "Families feel disconnected from care updates and rely on sporadic phone calls", valueHypothesis: "Automated updates will improve family satisfaction scores by 25%", status: "draft" },
      { name: "Medication Reconciliation", problemStatement: "High-risk patients often have medication discrepancies between hospital discharge and home care", valueHypothesis: "AI-assisted reconciliation will catch 90% of discrepancies within 24 hours", status: "draft" },
      { name: "Visit Documentation", problemStatement: "PSWs spend 20 minutes after each visit on paperwork", valueHypothesis: "Voice-to-text documentation will reduce admin time by 70%", status: "approved" },
    ],
    "Oak Valley": [
      { name: "Wait Time Prediction", problemStatement: "Patients have no visibility into expected wait times, leading to frustration and LWBS", valueHypothesis: "Accurate predictions will reduce LWBS rate by 15%", status: "draft" },
      { name: "Triage Prioritization", problemStatement: "Surges create bottlenecks at triage, delaying critical assessments", valueHypothesis: "AI-assisted triage will reduce time-to-assessment by 25%", status: "draft" },
      { name: "Bed Management", problemStatement: "Manual bed tracking leads to delays in patient placement from ED to inpatient", valueHypothesis: "Predictive bed availability will reduce admission wait times by 35%", status: "draft" },
    ],
  };

  const key = projectName.includes("OntarioMD") ? "OntarioMD" : projectName.includes("VHA") ? "VHA" : "Oak Valley";
  const data = useCasesMap[key].map(uc => ({ ...uc, projectId }));
  
  const created = await db.insert(useCases).values(data).returning();
  console.log(`  Created ${created.length} use cases for ${key}`);
}

async function seedTasks(projectId: string, projectName: string) {
  const baseDate = new Date();
  const tasksData = [
    { title: "Stakeholder discovery interviews", description: "Conduct 6-8 interviews with key clinical and admin stakeholders", status: "done" as const, priority: "high" as const, owner: "Sarah Chen", dueDate: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000) },
    { title: "Current state workflow mapping", description: "Document existing processes and pain points", status: "done" as const, priority: "high" as const, owner: "Mike Rodriguez", dueDate: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000) },
    { title: "Technical architecture review", description: "Assess integration points with existing EMR systems", status: "in-progress" as const, priority: "critical" as const, owner: "David Kim", dueDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000) },
    { title: "Data governance assessment", description: "Review PHI handling requirements and consent workflows", status: "in-progress" as const, priority: "high" as const, owner: "Jennifer Patel", dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000) },
    { title: "Prototype user testing", description: "Run 3 testing sessions with end users", status: "todo" as const, priority: "medium" as const, owner: "Sarah Chen", dueDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000) },
    { title: "Executive briefing deck", description: "Prepare presentation for steering committee", status: "todo" as const, priority: "high" as const, owner: "Mike Rodriguez", dueDate: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000) },
    { title: "Integration API specifications", description: "Document API contracts for vendor integration", status: "review" as const, priority: "medium" as const, owner: "David Kim", dueDate: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000) },
    { title: "Training curriculum development", description: "Create training materials for clinical staff", status: "todo" as const, priority: "low" as const, owner: "Lisa Thompson", dueDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000) },
  ];

  const data = tasksData.map(t => ({ ...t, projectId }));
  const created = await db.insert(tasks).values(data).returning();
  console.log(`  Created ${created.length} tasks`);
}

async function seedRisks(projectId: string) {
  const risksData = [
    { title: "EMR Integration Complexity", category: "technical" as const, likelihood: 4, impact: 5, mitigation: "Early vendor engagement and API sandbox testing", owner: "David Kim", status: "mitigating" as const },
    { title: "Clinical Staff Adoption Resistance", category: "operational" as const, likelihood: 3, impact: 4, mitigation: "Champion program and incremental rollout with feedback loops", owner: "Sarah Chen", status: "identified" as const },
    { title: "PHI Data Breach", category: "security" as const, likelihood: 2, impact: 5, mitigation: "End-to-end encryption, access logging, and privacy impact assessment", owner: "Jennifer Patel", status: "mitigating" as const },
    { title: "Budget Overrun", category: "business" as const, likelihood: 3, impact: 3, mitigation: "Monthly burn rate tracking and scope management process", owner: "Mike Rodriguez", status: "analyzing" as const },
    { title: "Regulatory Compliance Gap", category: "compliance" as const, likelihood: 2, impact: 4, mitigation: "Legal review of AI-assisted clinical decision requirements", owner: "Jennifer Patel", status: "identified" as const },
  ];

  const data = risksData.map(r => ({ ...r, projectId }));
  const created = await db.insert(risks).values(data).returning();
  console.log(`  Created ${created.length} risks`);
}

async function seedStakeholders(projectId: string, projectName: string) {
  const stakeholdersMap: Record<string, Array<{ name: string; role: string; influence: "low" | "medium" | "high"; supportLevel: "opposed" | "neutral" | "supportive" | "champion"; notes: string }>> = {
    "OntarioMD": [
      { name: "Dr. Patricia Wong", role: "Chief Medical Officer", influence: "high", supportLevel: "champion", notes: "Strong advocate for digital transformation. Key sponsor." },
      { name: "Robert Chen", role: "Director of IT", influence: "high", supportLevel: "supportive", notes: "Concerned about integration timeline but committed to success." },
      { name: "Nancy Williams", role: "Practice Manager", influence: "medium", supportLevel: "neutral", notes: "Skeptical of AI but open to seeing demos." },
      { name: "Dr. James Morrison", role: "Family Physician Lead", influence: "medium", supportLevel: "supportive", notes: "Early adopter, willing to pilot new workflows." },
      { name: "Sandra Lee", role: "Privacy Officer", influence: "high", supportLevel: "neutral", notes: "Requires detailed privacy impact assessment before approval." },
    ],
    "VHA": [
      { name: "Margaret Thompson", role: "VP Clinical Services", influence: "high", supportLevel: "champion", notes: "Driving the innovation agenda. Executive sponsor." },
      { name: "Kevin O'Brien", role: "Director of Operations", influence: "high", supportLevel: "supportive", notes: "Focused on efficiency gains and cost reduction." },
      { name: "Nurse Coordinator Team", role: "End Users", influence: "medium", supportLevel: "neutral", notes: "Mixed feelings - excited about time savings but worried about job changes." },
      { name: "Dr. Anita Sharma", role: "Medical Director", influence: "high", supportLevel: "supportive", notes: "Interested in quality improvement metrics." },
      { name: "IT Security Team", role: "Technical Reviewers", influence: "medium", supportLevel: "opposed", notes: "Raised concerns about cloud vendor security posture." },
      { name: "Family Advisory Council", role: "Patient Representatives", influence: "low", supportLevel: "supportive", notes: "Enthusiastic about better communication features." },
    ],
    "Oak Valley": [
      { name: "Dr. Michael Chang", role: "ED Medical Director", influence: "high", supportLevel: "champion", notes: "Passionate about reducing patient wait times. Key champion." },
      { name: "Lisa Fernandez", role: "Nursing Director", influence: "high", supportLevel: "neutral", notes: "Needs to see workflow impact before full support." },
      { name: "Ahmed Hassan", role: "CIO", influence: "high", supportLevel: "supportive", notes: "Interested in AI capabilities but budget conscious." },
      { name: "Triage Nurses Team", role: "End Users", influence: "medium", supportLevel: "neutral", notes: "Concerned about AI overriding clinical judgment." },
    ],
  };

  const key = projectName.includes("OntarioMD") ? "OntarioMD" : projectName.includes("VHA") ? "VHA" : "Oak Valley";
  const baseDate = new Date();
  const data = stakeholdersMap[key].map(s => ({ 
    ...s, 
    projectId,
    lastContactAt: new Date(baseDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  }));
  
  const created = await db.insert(stakeholders).values(data).returning();
  console.log(`  Created ${created.length} stakeholders`);
}

async function seedEvents(projectId: string, projectName: string) {
  const baseDate = new Date();
  const eventsData = [
    { type: "meeting" as const, title: "Discovery Workshop Session 1", description: "Initial stakeholder alignment and problem scoping", occurredAt: new Date(baseDate.getTime() - 28 * 24 * 60 * 60 * 1000), metadataJson: JSON.stringify({ duration: 120, attendees: 8 }) },
    { type: "meeting" as const, title: "Technical Architecture Review", description: "Deep dive into EMR integration options and API availability", occurredAt: new Date(baseDate.getTime() - 21 * 24 * 60 * 60 * 1000), metadataJson: JSON.stringify({ duration: 90, attendees: 5 }) },
    { type: "email" as const, title: "RE: Data Governance Requirements", description: "Privacy officer outlined PHI handling requirements and consent workflow expectations", occurredAt: new Date(baseDate.getTime() - 18 * 24 * 60 * 60 * 1000), sourceSystem: "Outlook" },
    { type: "file" as const, title: "Current State Workflow Diagrams v2", description: "Updated workflow documentation based on stakeholder feedback", occurredAt: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000), sourceSystem: "SharePoint" },
    { type: "meeting" as const, title: "Executive Steering Committee Update", description: "Monthly progress update and budget review with leadership", occurredAt: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000), metadataJson: JSON.stringify({ duration: 60, attendees: 12 }) },
    { type: "email" as const, title: "Prototype Feedback Summary", description: "Consolidated user feedback from initial prototype demos", occurredAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000), sourceSystem: "Gmail" },
    { type: "decision" as const, title: "Approved: Pilot Launch Date", description: "Steering committee approved January 15 pilot launch for Phase 1 use cases", occurredAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000) },
    { type: "file" as const, title: "Risk Register Update Q4", description: "Quarterly risk assessment with new mitigations", occurredAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000), sourceSystem: "Confluence" },
  ];

  const data = eventsData.map(e => ({ ...e, projectId }));
  const created = await db.insert(events).values(data).returning();
  console.log(`  Created ${created.length} events`);

  await seedEngagementInsights(projectId, created);
}

async function seedEngagementInsights(projectId: string, createdEvents: any[]) {
  const insightsData = [
    { type: "decision" as const, title: "Pilot Scope Confirmed", summary: "Leadership approved focusing on referral summary generation as the first use case. Full workflow automation deferred to Phase 2.", sentiment: "positive" as const, importance: "high" as const, tags: ["scope", "decision", "phase-1"], eventId: createdEvents[6]?.id },
    { type: "risk" as const, title: "Integration Timeline Concern", summary: "Technical team flagged that EMR API access may take 6-8 weeks longer than planned due to vendor backlog.", sentiment: "negative" as const, importance: "high" as const, tags: ["risk", "timeline", "technical"], eventId: createdEvents[1]?.id },
    { type: "open_question" as const, title: "User Training Approach", summary: "Debate ongoing about whether to use train-the-trainer model or direct training. Need decision by end of month.", sentiment: "neutral" as const, importance: "medium" as const, tags: ["training", "open-question"], eventId: createdEvents[0]?.id },
    { type: "opportunity_hint" as const, title: "Adjacent Use Case Identified", summary: "During workshop, nursing team mentioned similar challenges in discharge planning. Could be Phase 2 opportunity.", sentiment: "positive" as const, importance: "medium" as const, tags: ["opportunity", "future-scope"], eventId: createdEvents[0]?.id },
    { type: "stakeholder_update" as const, title: "Privacy Officer Alignment", summary: "Sandra Lee moved from neutral to supportive after detailed walkthrough of encryption and audit logging approach.", sentiment: "positive" as const, importance: "high" as const, tags: ["stakeholder", "privacy"], eventId: createdEvents[2]?.id },
  ];

  const data = insightsData.map(i => ({ ...i, projectId, createdByAI: true }));
  const created = await db.insert(engagementInsights).values(data).returning();
  console.log(`  Created ${created.length} engagement insights`);
}

async function seedDeliverables(projectId: string, projectName: string) {
  const deliverablesData = [
    { type: "activation_map" as const, name: "AI Activation Map", description: "Comprehensive mapping of use cases, workflows, and readiness dimensions", status: "in_progress" as const, progress: 65, totalHours: 40, hoursRemaining: 14 },
    { type: "safe_prototypes" as const, name: "SAFE Prototypes", description: "Validated prototypes with user feedback for priority use cases", status: "in_progress" as const, progress: 40, totalHours: 80, hoursRemaining: 48 },
    { type: "ms_funding_nav" as const, name: "Funding Navigation Package", description: "Business case and funding pathway documentation for Microsoft partnership", status: "not_started" as const, progress: 0, totalHours: 24, hoursRemaining: 24 },
    { type: "exec_framing" as const, name: "Executive Framing Deck", description: "Board-level presentation on AI strategy and expected outcomes", status: "in_progress" as const, progress: 25, totalHours: 16, hoursRemaining: 12 },
  ];

  const data = deliverablesData.map(d => ({ ...d, projectId }));
  const created = await db.insert(deliverables).values(data).returning();
  console.log(`  Created ${created.length} deliverables`);

  for (const deliverable of created) {
    await seedMilestones(deliverable.id, deliverable.type);
  }
}

async function seedMilestones(deliverableId: string, deliverableType: string) {
  const milestonesMap: Record<string, Array<{ name: string; description: string; status: "not_started" | "in_progress" | "blocked" | "done"; expectedHours: number }>> = {
    "activation_map": [
      { name: "Stakeholder Discovery", description: "Complete stakeholder interviews and document findings", status: "done", expectedHours: 12 },
      { name: "Workflow Analysis", description: "Map current and future state workflows", status: "done", expectedHours: 10 },
      { name: "Readiness Assessment", description: "Score and document readiness across dimensions", status: "in_progress", expectedHours: 8 },
      { name: "Prioritization Matrix", description: "Create use case prioritization with stakeholder input", status: "not_started", expectedHours: 10 },
    ],
    "safe_prototypes": [
      { name: "Use Case Selection", description: "Finalize scope for prototype development", status: "done", expectedHours: 8 },
      { name: "Design Sprint", description: "Rapid design iteration with user feedback", status: "in_progress", expectedHours: 24 },
      { name: "Technical Build", description: "Implement functional prototype", status: "not_started", expectedHours: 32 },
      { name: "User Validation", description: "Test prototype with real users and iterate", status: "not_started", expectedHours: 16 },
    ],
    "ms_funding_nav": [
      { name: "Business Case Draft", description: "Document ROI and investment requirements", status: "not_started", expectedHours: 12 },
      { name: "Partnership Alignment", description: "Coordinate with Microsoft account team", status: "not_started", expectedHours: 8 },
      { name: "Submission Package", description: "Complete funding application materials", status: "not_started", expectedHours: 4 },
    ],
    "exec_framing": [
      { name: "Narrative Development", description: "Craft strategic narrative for executives", status: "done", expectedHours: 6 },
      { name: "Visual Design", description: "Create compelling visual presentation", status: "in_progress", expectedHours: 6 },
      { name: "Review Cycle", description: "Incorporate feedback from project sponsors", status: "not_started", expectedHours: 4 },
    ],
  };

  const milestoneData = (milestonesMap[deliverableType] || []).map((m, index) => ({
    ...m,
    deliverableId,
    orderIndex: index,
  }));

  if (milestoneData.length > 0) {
    const created = await db.insert(milestones).values(milestoneData).returning();
    
    for (const milestone of created) {
      await seedActivities(milestone.id);
    }
  }
}

async function seedActivities(milestoneId: string) {
  const activitiesData = [
    { name: "Schedule kickoff meeting", description: "Coordinate calendars and send invites", status: "done" as const, requiresInput: false, requiredInputs: [] },
    { name: "Document key findings", description: "Capture insights and decisions from sessions", status: "in_progress" as const, requiresInput: true, requiredInputs: ["Meeting notes", "Stakeholder feedback"] },
    { name: "Review with team lead", description: "Get sign-off on completed work", status: "not_started" as const, requiresInput: false, requiredInputs: [] },
  ];

  const data = activitiesData.map((a, index) => ({
    ...a,
    milestoneId,
    orderIndex: index,
  }));

  await db.insert(activities).values(data);
}

async function seedOpportunitySeeds(projectId: string, projectName: string) {
  const opportunitiesMap: Record<string, Array<{ title: string; description: string; source: string; status: "idea" | "qualified" | "proposed" | "won" | "lost"; potentialValueEstimate: number; riskLevel: string }>> = {
    "OntarioMD": [
      { title: "Specialist Network Expansion", description: "Extend referral automation to additional specialty clinics in the network", source: "Stakeholder interview", status: "qualified", potentialValueEstimate: 150000, riskLevel: "low" },
      { title: "Patient Self-Scheduling", description: "Add patient-facing scheduling capabilities to reduce admin burden", source: "User feedback", status: "idea", potentialValueEstimate: 80000, riskLevel: "medium" },
      { title: "Chronic Disease Management Module", description: "AI-assisted care coordination for chronic disease patients", source: "Executive meeting", status: "idea", potentialValueEstimate: 200000, riskLevel: "high" },
    ],
    "VHA": [
      { title: "Home Care Discharge Coordination", description: "Automate hospital-to-home transitions with real-time care plan updates", source: "Workshop discovery", status: "proposed", potentialValueEstimate: 175000, riskLevel: "medium" },
      { title: "Family Caregiver Portal", description: "Mobile app for family members to track care and communicate with team", source: "Family council feedback", status: "qualified", potentialValueEstimate: 90000, riskLevel: "low" },
      { title: "Predictive Care Escalation", description: "ML model to predict patient deterioration and trigger interventions", source: "Clinical director", status: "idea", potentialValueEstimate: 250000, riskLevel: "high" },
    ],
    "Oak Valley": [
      { title: "Urgent Care Overflow Management", description: "Route appropriate patients to urgent care to reduce ED volume", source: "ED workflow analysis", status: "idea", potentialValueEstimate: 120000, riskLevel: "medium" },
      { title: "Digital Wayfinding", description: "Indoor navigation app for patients and visitors", source: "Patient experience team", status: "idea", potentialValueEstimate: 50000, riskLevel: "low" },
    ],
  };

  const key = projectName.includes("OntarioMD") ? "OntarioMD" : projectName.includes("VHA") ? "VHA" : "Oak Valley";
  const data = opportunitiesMap[key].map(o => ({ ...o, projectId }));
  
  const created = await db.insert(opportunitySeeds).values(data).returning();
  console.log(`  Created ${created.length} opportunity seeds`);
}

async function seedMetricSnapshots(projectId: string, projectName: string) {
  const metricsMap: Record<string, Array<{ name: string; description: string; unit: string; baseline: number; currentValue: number; targetValue: number }>> = {
    "OntarioMD": [
      { name: "Referral Summary Time", description: "Time spent preparing referral documentation", unit: "minutes", baseline: 18, currentValue: 12, targetValue: 3 },
      { name: "Referral Completion Rate", description: "Percentage of referrals completed within 30 days", unit: "%", baseline: 62, currentValue: 68, targetValue: 85 },
      { name: "Admin Calls per Referral", description: "Average follow-up calls needed per referral", unit: "calls", baseline: 2.3, currentValue: 1.8, targetValue: 0.5 },
    ],
    "VHA": [
      { name: "Care Plan Creation Time", description: "Time to create initial care plan", unit: "minutes", baseline: 48, currentValue: 32, targetValue: 15 },
      { name: "Daily Visit Capacity", description: "Average visits per coordinator per day", unit: "visits", baseline: 6.2, currentValue: 6.8, targetValue: 8 },
      { name: "Family Satisfaction Score", description: "NPS score from family surveys", unit: "NPS", baseline: 42, currentValue: 48, targetValue: 65 },
      { name: "Medication Reconciliation Time", description: "Hours to complete medication review", unit: "hours", baseline: 4, currentValue: 3.5, targetValue: 1 },
    ],
    "Oak Valley": [
      { name: "Average Wait Time", description: "Average time from arrival to physician assessment", unit: "minutes", baseline: 127, currentValue: 127, targetValue: 75 },
      { name: "LWBS Rate", description: "Left Without Being Seen rate", unit: "%", baseline: 8.2, currentValue: 8.2, targetValue: 4 },
      { name: "Triage to Bed Time", description: "Time from triage completion to bed assignment", unit: "minutes", baseline: 45, currentValue: 45, targetValue: 25 },
    ],
  };

  const key = projectName.includes("OntarioMD") ? "OntarioMD" : projectName.includes("VHA") ? "VHA" : "Oak Valley";
  const data = metricsMap[key].map(m => ({ ...m, projectId, capturedAt: new Date() }));
  
  const created = await db.insert(metricSnapshots).values(data).returning();
  console.log(`  Created ${created.length} metric snapshots`);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
