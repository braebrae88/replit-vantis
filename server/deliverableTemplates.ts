import { db } from "./db";
import { deliverables, milestones, activities, artifacts, artifactSections, type InsertDeliverable, type InsertMilestone, type InsertActivity, type InsertArtifact, type InsertArtifactSection } from "@shared/schema";

type ArtifactTemplateSection = {
  key: string;
  label: string;
  orderIndex: number;
};

type ArtifactTemplateConfig = {
  type: "activation_map_doc" | "exec_brief" | "funding_nav_pack" | "safe_prototype_doc" | "stakeholder_map" | "value_scorecard_doc" | "custom";
  title: string;
  description: string;
  sections: ArtifactTemplateSection[];
};

const ARTIFACT_TEMPLATES: Record<string, ArtifactTemplateConfig> = {
  activation_map: {
    type: "activation_map_doc",
    title: "Activation Map Document",
    description: "Comprehensive activation map showing workflows, readiness, and activation sequence",
    sections: [
      { key: "context", label: "Context", orderIndex: 0 },
      { key: "key_workflows", label: "Key Workflows", orderIndex: 1 },
      { key: "readiness_summary", label: "Readiness Summary", orderIndex: 2 },
      { key: "dependencies", label: "Dependencies", orderIndex: 3 },
      { key: "activation_sequence", label: "Activation Sequence", orderIndex: 4 },
      { key: "risks_mitigations", label: "Risks & Mitigations", orderIndex: 5 },
    ],
  },
  exec_framing: {
    type: "exec_brief",
    title: "Executive Framing Brief",
    description: "Executive-level framing document for stakeholder alignment",
    sections: [
      { key: "headline_story", label: "Headline Story", orderIndex: 0 },
      { key: "key_metrics", label: "Key Metrics", orderIndex: 1 },
      { key: "risks", label: "Risks", orderIndex: 2 },
      { key: "asks_decisions", label: "Asks & Decisions", orderIndex: 3 },
      { key: "next_90_days", label: "Next 90 Days", orderIndex: 4 },
    ],
  },
  ms_funding_nav: {
    type: "funding_nav_pack",
    title: "MS Funding Navigation Pack",
    description: "Documentation for Microsoft funding navigation and approvals",
    sections: [
      { key: "funding_overview", label: "Funding Overview", orderIndex: 0 },
      { key: "budget_breakdown", label: "Budget Breakdown", orderIndex: 1 },
      { key: "approval_path", label: "Approval Path", orderIndex: 2 },
      { key: "timeline", label: "Timeline", orderIndex: 3 },
      { key: "stakeholder_signoffs", label: "Stakeholder Sign-offs", orderIndex: 4 },
    ],
  },
  safe_prototypes: {
    type: "safe_prototype_doc",
    title: "SAFE Prototype Documentation",
    description: "Documentation for SAFE prototype development and validation",
    sections: [
      { key: "prototype_scope", label: "Prototype Scope", orderIndex: 0 },
      { key: "technical_approach", label: "Technical Approach", orderIndex: 1 },
      { key: "data_requirements", label: "Data Requirements", orderIndex: 2 },
      { key: "validation_criteria", label: "Validation Criteria", orderIndex: 3 },
      { key: "learnings", label: "Learnings & Next Steps", orderIndex: 4 },
    ],
  },
};

export type RASCIEntry = {
  role: string;
  responsibility: "R" | "A" | "S" | "C" | "I";
};

export type WorkshopAgendaItem = {
  time: string;
  topic: string;
};

export type WorkshopTemplate = {
  key: string;
  title: string;
  objective: string;
  durationMinutes: number;
  recommendedAttendees: string[];
  agenda: WorkshopAgendaItem[];
};

export type DeliverableTemplate = {
  type: "activation_map" | "safe_prototypes" | "ms_funding_nav" | "exec_framing";
  name: string;
  description: string;
  defaultRASCI?: RASCIEntry[];
  workshopTemplates?: WorkshopTemplate[];
  milestones: {
    name: string;
    description: string;
    expectedHours?: number;
    suggestedWorkshopKey?: string;
    activities: {
      name: string;
      description: string;
      requiresInput?: boolean;
      requiredInputs?: string[];
    }[];
  }[];
};

export const DELIVERABLE_TEMPLATES: DeliverableTemplate[] = [
  {
    type: "activation_map",
    name: "Activation Map",
    description: "Comprehensive workflow discovery and activation sequencing to identify where AI can be deployed effectively.",
    defaultRASCI: [
      { role: "Project Lead", responsibility: "A" },
      { role: "Solutions Architect", responsibility: "R" },
      { role: "Business Analyst", responsibility: "R" },
      { role: "Executive Sponsor", responsibility: "I" },
      { role: "Process Owner", responsibility: "C" },
      { role: "IT Lead", responsibility: "S" },
    ],
    workshopTemplates: [
      {
        key: "readiness_sequencing",
        title: "Readiness & Sequencing Session",
        objective: "Align stakeholders on workflow priorities, assess organizational readiness, and establish the optimal activation sequence for AI initiatives.",
        durationMinutes: 120,
        recommendedAttendees: ["Project Lead", "Solutions Architect", "Process Owners", "IT Lead", "Business Analyst"],
        agenda: [
          { time: "0-15 min", topic: "Welcome & objectives review" },
          { time: "15-35 min", topic: "Workflow priority ranking exercise" },
          { time: "35-55 min", topic: "Readiness assessment walkthrough" },
          { time: "55-60 min", topic: "Break" },
          { time: "60-85 min", topic: "Dependency mapping discussion" },
          { time: "85-105 min", topic: "Sequencing logic development" },
          { time: "105-120 min", topic: "Next steps & action items" },
        ],
      },
    ],
    milestones: [
      {
        name: "Workflow Discovery Completed",
        description: "Document all current workflows, systems, and pain points across the organization.",
        expectedHours: 8,
        activities: [
          {
            name: "Stakeholder Interview Scheduling",
            description: "Schedule and coordinate interviews with key process owners.",
            requiresInput: true,
            requiredInputs: ["Stakeholder list", "Calendar availability"],
          },
          {
            name: "Workflow Documentation Sessions",
            description: "Conduct hands-on sessions to map existing workflows step by step.",
            requiresInput: true,
            requiredInputs: ["Process documentation", "System access"],
          },
          {
            name: "Pain Point Inventory",
            description: "Catalog inefficiencies, bottlenecks, and areas for improvement.",
          },
          {
            name: "Workflow Diagram Creation",
            description: "Create visual workflow diagrams using standard notation.",
          },
        ],
      },
      {
        name: "Readiness Assessment Completed",
        description: "Evaluate organizational and technical readiness for AI adoption.",
        expectedHours: 6,
        suggestedWorkshopKey: "readiness_sequencing",
        activities: [
          {
            name: "Readiness Workshop Facilitation",
            description: "Run workshops to assess team capabilities and change readiness.",
            requiresInput: true,
            requiredInputs: ["Workshop agenda", "Assessment rubric"],
          },
          {
            name: "Technical Infrastructure Review",
            description: "Assess existing tech stack and integration capabilities.",
          },
          {
            name: "Data Availability Assessment",
            description: "Evaluate data quality, accessibility, and governance.",
          },
          {
            name: "Readiness Score Compilation",
            description: "Compile readiness scores across all dimensions.",
          },
        ],
      },
      {
        name: "Dependency Map Built",
        description: "Identify dependencies between workflows, systems, and teams.",
        expectedHours: 4,
        activities: [
          {
            name: "System Integration Mapping",
            description: "Document integration points between systems.",
          },
          {
            name: "Team Dependency Analysis",
            description: "Map cross-team dependencies and handoffs.",
          },
          {
            name: "Data Flow Documentation",
            description: "Document how data moves between systems and processes.",
          },
        ],
      },
      {
        name: "Sequencing Logic Finalized",
        description: "Determine the optimal order for AI activation across use cases.",
        expectedHours: 4,
        activities: [
          {
            name: "Priority Matrix Development",
            description: "Create priority matrix based on impact and feasibility.",
          },
          {
            name: "Dependency-Based Ordering",
            description: "Sequence use cases based on technical and organizational dependencies.",
          },
          {
            name: "Quick Win Identification",
            description: "Identify low-effort, high-impact opportunities for early wins.",
          },
        ],
      },
      {
        name: "Funding Alignment Check",
        description: "Verify alignment with available funding sources and requirements.",
        expectedHours: 3,
        activities: [
          {
            name: "Funding Source Mapping",
            description: "Map available funding sources to planned initiatives.",
            requiresInput: true,
            requiredInputs: ["Budget information", "Funding program details"],
          },
          {
            name: "ROI Projection Draft",
            description: "Draft preliminary ROI projections for funding justification.",
          },
        ],
      },
      {
        name: "Pre-Launch Checklist Drafted",
        description: "Create comprehensive checklist for activation readiness.",
        expectedHours: 2,
        activities: [
          {
            name: "Technical Prerequisites List",
            description: "Document all technical requirements for launch.",
          },
          {
            name: "Training Requirements Outline",
            description: "Outline training needs for affected teams.",
          },
          {
            name: "Success Metrics Definition",
            description: "Define measurable success criteria for each activation.",
          },
        ],
      },
      {
        name: "Activation Map Finalized & Reviewed",
        description: "Final review and sign-off on the complete activation map.",
        expectedHours: 4,
        activities: [
          {
            name: "Stakeholder Review Session",
            description: "Present activation map to stakeholders for feedback.",
            requiresInput: true,
            requiredInputs: ["Presentation materials", "Stakeholder feedback form"],
          },
          {
            name: "Final Revisions",
            description: "Incorporate feedback and finalize documentation.",
          },
          {
            name: "Executive Sign-Off",
            description: "Obtain formal approval from executive sponsors.",
          },
        ],
      },
    ],
  },
  {
    type: "safe_prototypes",
    name: "SAFE Prototypes",
    description: "Rapid prototyping sprints to validate AI feasibility and demonstrate value before full implementation.",
    defaultRASCI: [
      { role: "Project Lead", responsibility: "A" },
      { role: "Solutions Architect", responsibility: "R" },
      { role: "Data Engineer", responsibility: "R" },
      { role: "Product Owner", responsibility: "C" },
      { role: "End Users", responsibility: "C" },
      { role: "Executive Sponsor", responsibility: "I" },
    ],
    workshopTemplates: [
      {
        key: "prototype_validation",
        title: "Prototype Validation Review",
        objective: "Review prototype outcomes with stakeholders, gather user feedback, and determine go/no-go for production investment.",
        durationMinutes: 90,
        recommendedAttendees: ["Project Lead", "Solutions Architect", "Product Owner", "End Users", "Executive Sponsor"],
        agenda: [
          { time: "0-10 min", topic: "Welcome & prototype overview" },
          { time: "10-30 min", topic: "Live demonstration of prototype" },
          { time: "30-50 min", topic: "User feedback & Q&A session" },
          { time: "50-65 min", topic: "Technical feasibility discussion" },
          { time: "65-80 min", topic: "ROI and business case review" },
          { time: "80-90 min", topic: "Go/No-Go decision & next steps" },
        ],
      },
    ],
    milestones: [
      {
        name: "Prototype Brief",
        description: "Define scope, objectives, and success criteria for the prototype.",
        expectedHours: 4,
        activities: [
          {
            name: "Use Case Scoping",
            description: "Define specific use case boundaries for the prototype.",
            requiresInput: true,
            requiredInputs: ["Use case documentation", "Business requirements"],
          },
          {
            name: "Success Criteria Definition",
            description: "Establish measurable criteria for prototype success.",
          },
          {
            name: "Resource Allocation",
            description: "Identify team members and resources for prototype development.",
          },
          {
            name: "Timeline Planning",
            description: "Create sprint timeline with milestones and checkpoints.",
          },
        ],
      },
      {
        name: "Data Plan",
        description: "Define data requirements, sources, and handling procedures.",
        expectedHours: 6,
        activities: [
          {
            name: "Data Requirements Specification",
            description: "Document all data needed for the prototype.",
            requiresInput: true,
            requiredInputs: ["Data catalog", "Schema documentation"],
          },
          {
            name: "Data Access Setup",
            description: "Establish secure access to required data sources.",
          },
          {
            name: "Data Quality Assessment",
            description: "Evaluate data quality and identify cleanup needs.",
          },
          {
            name: "Privacy & Compliance Review",
            description: "Ensure data handling meets privacy requirements.",
          },
        ],
      },
      {
        name: "Sprint 1 Review",
        description: "First sprint review demonstrating initial prototype functionality.",
        expectedHours: 8,
        activities: [
          {
            name: "Core Functionality Development",
            description: "Build core AI/ML functionality for the use case.",
          },
          {
            name: "Initial Integration Setup",
            description: "Set up basic integration with existing systems.",
          },
          {
            name: "Sprint Demo Preparation",
            description: "Prepare demonstration of sprint 1 deliverables.",
          },
          {
            name: "Stakeholder Demo Session",
            description: "Present sprint 1 results to stakeholders.",
            requiresInput: true,
            requiredInputs: ["Demo environment", "Feedback form"],
          },
        ],
      },
      {
        name: "Sprint 2 Review",
        description: "Second sprint review with refined functionality and user testing.",
        expectedHours: 8,
        activities: [
          {
            name: "Feedback Incorporation",
            description: "Address feedback from sprint 1 review.",
          },
          {
            name: "Feature Enhancement",
            description: "Expand functionality based on initial results.",
          },
          {
            name: "User Testing Sessions",
            description: "Conduct hands-on testing with end users.",
            requiresInput: true,
            requiredInputs: ["Test users list", "Testing scenarios"],
          },
          {
            name: "Sprint 2 Demo",
            description: "Present enhanced prototype to stakeholders.",
          },
        ],
      },
      {
        name: "Feasibility Validation",
        description: "Formal assessment of prototype viability for production.",
        expectedHours: 4,
        suggestedWorkshopKey: "prototype_validation",
        activities: [
          {
            name: "Technical Feasibility Assessment",
            description: "Evaluate technical viability for production scale.",
          },
          {
            name: "Performance Benchmarking",
            description: "Measure prototype performance against requirements.",
          },
          {
            name: "Integration Complexity Analysis",
            description: "Assess effort required for full system integration.",
          },
        ],
      },
      {
        name: "Success Metrics Defined",
        description: "Establish production success metrics based on prototype learnings.",
        expectedHours: 3,
        activities: [
          {
            name: "KPI Definition",
            description: "Define key performance indicators for production.",
          },
          {
            name: "Baseline Establishment",
            description: "Establish current-state baselines for comparison.",
          },
          {
            name: "Monitoring Plan",
            description: "Create plan for ongoing performance monitoring.",
          },
        ],
      },
      {
        name: "Final Demo",
        description: "Comprehensive demonstration of prototype capabilities and recommendations.",
        expectedHours: 4,
        activities: [
          {
            name: "Executive Demo Preparation",
            description: "Prepare polished demonstration for executives.",
          },
          {
            name: "ROI Analysis Presentation",
            description: "Present business case with projected ROI.",
            requiresInput: true,
            requiredInputs: ["Financial projections", "Benchmark data"],
          },
          {
            name: "Go/No-Go Recommendation",
            description: "Provide formal recommendation for production investment.",
          },
        ],
      },
    ],
  },
  {
    type: "ms_funding_nav",
    name: "Microsoft Funding Navigator",
    description: "Navigate Microsoft funding programs (Foundry, Frontier, ECIF) to secure co-investment for AI initiatives.",
    defaultRASCI: [
      { role: "Project Lead", responsibility: "A" },
      { role: "Business Development", responsibility: "R" },
      { role: "Finance Lead", responsibility: "R" },
      { role: "Microsoft Account Team", responsibility: "C" },
      { role: "Executive Sponsor", responsibility: "S" },
      { role: "Legal", responsibility: "C" },
    ],
    workshopTemplates: [
      {
        key: "funding_strategy",
        title: "Funding Strategy Workshop",
        objective: "Develop comprehensive funding strategy across Microsoft programs, align internal stakeholders, and plan Microsoft engagement approach.",
        durationMinutes: 90,
        recommendedAttendees: ["Project Lead", "Business Development", "Finance Lead", "Executive Sponsor", "Microsoft Account Team"],
        agenda: [
          { time: "0-10 min", topic: "Welcome & funding landscape overview" },
          { time: "10-25 min", topic: "Foundry program fit assessment" },
          { time: "25-40 min", topic: "Frontier & ECIF eligibility review" },
          { time: "40-55 min", topic: "Internal narrative development" },
          { time: "55-75 min", topic: "Microsoft engagement strategy" },
          { time: "75-90 min", topic: "Action items & timeline" },
        ],
      },
    ],
    milestones: [
      {
        name: "Foundry Alignment Assessment",
        description: "Evaluate fit with Microsoft Foundry program requirements.",
        expectedHours: 4,
        activities: [
          {
            name: "Foundry Criteria Review",
            description: "Review current Foundry program eligibility criteria.",
            requiresInput: true,
            requiredInputs: ["Foundry program documentation"],
          },
          {
            name: "Project Fit Analysis",
            description: "Assess how project aligns with Foundry objectives.",
          },
          {
            name: "Gap Identification",
            description: "Identify gaps between project and program requirements.",
          },
          {
            name: "Foundry Contact Strategy",
            description: "Plan approach for engaging Foundry team.",
          },
        ],
      },
      {
        name: "Frontier Program Fit",
        description: "Assess alignment with Microsoft Frontier innovation program.",
        expectedHours: 4,
        activities: [
          {
            name: "Frontier Eligibility Check",
            description: "Verify eligibility for Frontier program participation.",
            requiresInput: true,
            requiredInputs: ["Frontier program guidelines"],
          },
          {
            name: "Innovation Narrative Development",
            description: "Craft compelling innovation story for Frontier.",
          },
          {
            name: "Technical Differentiation Analysis",
            description: "Document unique technical aspects of the solution.",
          },
        ],
      },
      {
        name: "ECIF Requirements Checklist",
        description: "Complete Enterprise Customer Investment Fund requirements.",
        expectedHours: 6,
        activities: [
          {
            name: "ECIF Documentation Gathering",
            description: "Collect all required ECIF application documents.",
            requiresInput: true,
            requiredInputs: ["ECIF application form", "Supporting documentation"],
          },
          {
            name: "Azure Consumption Projection",
            description: "Project Azure consumption for funding justification.",
          },
          {
            name: "Customer Success Story Draft",
            description: "Draft customer success narrative for application.",
          },
          {
            name: "Microsoft Account Team Alignment",
            description: "Coordinate with Microsoft account team on application.",
          },
        ],
      },
      {
        name: "Internal Narrative Developed",
        description: "Create compelling internal business case narrative.",
        expectedHours: 4,
        suggestedWorkshopKey: "funding_strategy",
        activities: [
          {
            name: "Executive Summary Draft",
            description: "Write executive summary of funding opportunity.",
          },
          {
            name: "Strategic Alignment Documentation",
            description: "Document alignment with company strategic priorities.",
          },
          {
            name: "Risk-Benefit Analysis",
            description: "Complete risk-benefit analysis for leadership.",
          },
        ],
      },
      {
        name: "Microsoft Touchpoints Planned",
        description: "Schedule and plan all Microsoft engagement touchpoints.",
        expectedHours: 3,
        activities: [
          {
            name: "Account Team Meeting Schedule",
            description: "Schedule meetings with Microsoft account team.",
            requiresInput: true,
            requiredInputs: ["Microsoft contact list", "Calendar availability"],
          },
          {
            name: "Technical Review Planning",
            description: "Plan technical review sessions with Microsoft architects.",
          },
          {
            name: "Executive Sponsorship Alignment",
            description: "Align Microsoft executive sponsors with initiative.",
          },
        ],
      },
      {
        name: "Co-funding Application Draft",
        description: "Complete draft of co-funding application for review.",
        expectedHours: 6,
        activities: [
          {
            name: "Application Form Completion",
            description: "Complete all sections of funding application.",
            requiresInput: true,
            requiredInputs: ["Budget details", "Project timeline", "Team information"],
          },
          {
            name: "Supporting Materials Assembly",
            description: "Compile all supporting documentation.",
          },
          {
            name: "Internal Review",
            description: "Conduct internal review before submission.",
          },
          {
            name: "Final Submission Preparation",
            description: "Prepare final application for submission.",
          },
        ],
      },
    ],
  },
  {
    type: "exec_framing",
    name: "Executive Framing",
    description: "Prepare executive-level briefing materials for strategic decision-making and investment approval.",
    defaultRASCI: [
      { role: "Project Lead", responsibility: "A" },
      { role: "Business Analyst", responsibility: "R" },
      { role: "Communications Lead", responsibility: "R" },
      { role: "Executive Sponsor", responsibility: "C" },
      { role: "Finance Lead", responsibility: "S" },
      { role: "C-Suite Executives", responsibility: "I" },
    ],
    workshopTemplates: [
      {
        key: "executive_validation",
        title: "Executive Validation Meeting",
        objective: "Present strategic initiative to executive leadership, validate business case, address concerns, and obtain investment approval.",
        durationMinutes: 60,
        recommendedAttendees: ["Project Lead", "Executive Sponsor", "C-Suite Executives", "Finance Lead"],
        agenda: [
          { time: "0-5 min", topic: "Executive sponsor introduction" },
          { time: "5-15 min", topic: "Strategic context & opportunity" },
          { time: "15-25 min", topic: "Business case & ROI presentation" },
          { time: "25-35 min", topic: "Risk assessment & mitigation" },
          { time: "35-50 min", topic: "Executive Q&A" },
          { time: "50-60 min", topic: "Decision & next steps" },
        ],
      },
    ],
    milestones: [
      {
        name: "KPI Baseline",
        description: "Establish current performance baselines for comparison.",
        expectedHours: 4,
        activities: [
          {
            name: "Current Metrics Collection",
            description: "Gather existing performance metrics.",
            requiresInput: true,
            requiredInputs: ["Analytics reports", "Performance dashboards"],
          },
          {
            name: "Baseline Documentation",
            description: "Document current-state performance baselines.",
          },
          {
            name: "Target Setting",
            description: "Establish improvement targets for each metric.",
          },
        ],
      },
      {
        name: "Value Story Draft",
        description: "Craft compelling narrative of business value and impact.",
        expectedHours: 4,
        activities: [
          {
            name: "Value Proposition Development",
            description: "Articulate clear value proposition for executives.",
          },
          {
            name: "ROI Calculation",
            description: "Calculate return on investment projections.",
            requiresInput: true,
            requiredInputs: ["Cost estimates", "Benefit projections"],
          },
          {
            name: "Competitive Analysis",
            description: "Analyze competitive landscape and differentiation.",
          },
          {
            name: "Customer Impact Story",
            description: "Develop customer-facing impact narrative.",
          },
        ],
      },
      {
        name: "Risk Summary",
        description: "Compile comprehensive risk assessment for executives.",
        expectedHours: 3,
        activities: [
          {
            name: "Risk Inventory Compilation",
            description: "Compile all identified risks from project work.",
          },
          {
            name: "Risk Prioritization",
            description: "Prioritize risks by likelihood and impact.",
          },
          {
            name: "Mitigation Strategy Summary",
            description: "Summarize mitigation strategies for key risks.",
          },
        ],
      },
      {
        name: "Readiness Overview",
        description: "Summarize organizational and technical readiness status.",
        expectedHours: 3,
        activities: [
          {
            name: "Readiness Score Summary",
            description: "Compile readiness scores across all dimensions.",
          },
          {
            name: "Gap Analysis Summary",
            description: "Summarize gaps and remediation plans.",
          },
          {
            name: "Timeline Alignment",
            description: "Align readiness activities with project timeline.",
          },
        ],
      },
      {
        name: "Asks / Decision Points",
        description: "Define specific asks and decisions required from executives.",
        expectedHours: 2,
        activities: [
          {
            name: "Investment Ask Definition",
            description: "Define specific investment requirements.",
            requiresInput: true,
            requiredInputs: ["Budget requirements", "Resource needs"],
          },
          {
            name: "Decision Point Documentation",
            description: "Document key decisions needed from leadership.",
          },
          {
            name: "Timeline Commitment Request",
            description: "Define timeline commitments needed.",
          },
        ],
      },
      {
        name: "Executive Brief Draft",
        description: "Complete first draft of executive briefing document.",
        expectedHours: 4,
        activities: [
          {
            name: "Brief Structure Development",
            description: "Create structure and outline for executive brief.",
          },
          {
            name: "Content Assembly",
            description: "Assemble all content into cohesive document.",
          },
          {
            name: "Visual Asset Creation",
            description: "Create charts, graphs, and visual aids.",
          },
          {
            name: "Peer Review",
            description: "Conduct peer review of draft materials.",
          },
        ],
      },
      {
        name: "Final Review",
        description: "Final review and preparation for executive presentation.",
        expectedHours: 4,
        suggestedWorkshopKey: "executive_validation",
        activities: [
          {
            name: "Executive Preview",
            description: "Preview with sponsoring executive for feedback.",
            requiresInput: true,
            requiredInputs: ["Draft presentation", "Supporting materials"],
          },
          {
            name: "Final Revisions",
            description: "Incorporate all feedback into final version.",
          },
          {
            name: "Presentation Rehearsal",
            description: "Rehearse presentation delivery.",
          },
          {
            name: "Materials Finalization",
            description: "Finalize all materials for distribution.",
          },
        ],
      },
    ],
  },
];

export async function instantiateDeliverableFromTemplate(
  projectId: string,
  templateType: DeliverableTemplate["type"]
): Promise<{ deliverableId: string; milestonesCreated: number; activitiesCreated: number; artifactCreated: boolean }> {
  const template = DELIVERABLE_TEMPLATES.find((t) => t.type === templateType);
  if (!template) {
    throw new Error(`Unknown template type: ${templateType}`);
  }

  return await db.transaction(async (tx) => {
    const deliverableData: InsertDeliverable = {
      projectId,
      type: template.type,
      name: template.name,
      description: template.description,
      status: "not_started",
      progress: 0,
    };

    const [deliverable] = await tx.insert(deliverables).values(deliverableData).returning();

    let milestonesCreated = 0;
    let activitiesCreated = 0;
    let artifactCreated = false;

    for (let mIndex = 0; mIndex < template.milestones.length; mIndex++) {
      const milestoneTemplate = template.milestones[mIndex];

      const milestoneData: InsertMilestone = {
        deliverableId: deliverable.id,
        name: milestoneTemplate.name,
        description: milestoneTemplate.description,
        status: "not_started",
        orderIndex: mIndex,
        expectedHours: milestoneTemplate.expectedHours ?? null,
        suggestedWorkshopKey: milestoneTemplate.suggestedWorkshopKey ?? null,
      };

      const [milestone] = await tx.insert(milestones).values(milestoneData).returning();
      milestonesCreated++;

      for (let aIndex = 0; aIndex < milestoneTemplate.activities.length; aIndex++) {
        const activityTemplate = milestoneTemplate.activities[aIndex];

        const activityData: InsertActivity = {
          milestoneId: milestone.id,
          name: activityTemplate.name,
          description: activityTemplate.description,
          status: "not_started",
          orderIndex: aIndex,
          requiresInput: activityTemplate.requiresInput ?? false,
          requiredInputs: activityTemplate.requiredInputs ?? [],
        };

        await tx.insert(activities).values(activityData);
        activitiesCreated++;
      }
    }

    // Create artifact from template if one exists for this deliverable type
    const artifactTemplate = ARTIFACT_TEMPLATES[templateType];
    if (artifactTemplate) {
      const artifactData: InsertArtifact = {
        projectId,
        deliverableId: deliverable.id,
        type: artifactTemplate.type,
        title: artifactTemplate.title,
        description: artifactTemplate.description,
        completionPct: 0,
      };

      const [artifact] = await tx.insert(artifacts).values(artifactData).returning();

      const sectionData: InsertArtifactSection[] = artifactTemplate.sections.map((s) => ({
        artifactId: artifact.id,
        key: s.key,
        label: s.label,
        status: "empty" as const,
        orderIndex: s.orderIndex,
      }));

      await tx.insert(artifactSections).values(sectionData);
      artifactCreated = true;
    }

    return {
      deliverableId: deliverable.id,
      milestonesCreated,
      activitiesCreated,
      artifactCreated,
    };
  });
}
