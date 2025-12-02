import { storage } from "./storage";
import type { InsertArtifact, InsertArtifactSection } from "@shared/schema";

export async function updateArtifactCompletion(artifactId: string): Promise<number> {
  const sections = await storage.getArtifactSections(artifactId);
  
  if (sections.length === 0) {
    await storage.updateArtifact(artifactId, { completionPct: 0 });
    return 0;
  }

  const completeSections = sections.filter(s => s.status === "complete").length;
  const completionPct = Math.round((completeSections / sections.length) * 100);
  
  await storage.updateArtifact(artifactId, { completionPct });
  return completionPct;
}

interface ArtifactTemplateSection {
  key: string;
  label: string;
  orderIndex: number;
}

interface ArtifactTemplate {
  type: "activation_map_doc" | "exec_brief" | "funding_nav_pack" | "safe_prototype_doc" | "stakeholder_map" | "value_scorecard_doc" | "custom";
  title: string;
  description: string;
  sections: ArtifactTemplateSection[];
}

export const ARTIFACT_TEMPLATES: Record<string, ArtifactTemplate> = {
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

export async function createArtifactFromTemplate(
  projectId: string,
  deliverableId: string,
  deliverableType: string
): Promise<{ artifactId: string; sectionsCreated: number } | null> {
  const template = ARTIFACT_TEMPLATES[deliverableType];
  if (!template) {
    return null;
  }

  const artifactData: InsertArtifact = {
    projectId,
    deliverableId,
    type: template.type,
    title: template.title,
    description: template.description,
    completionPct: 0,
  };

  const artifact = await storage.createArtifact(artifactData);

  const sectionsData: InsertArtifactSection[] = template.sections.map((s) => ({
    artifactId: artifact.id,
    key: s.key,
    label: s.label,
    status: "empty" as const,
    orderIndex: s.orderIndex,
  }));

  const sections = await storage.createManyArtifactSections(sectionsData);

  return {
    artifactId: artifact.id,
    sectionsCreated: sections.length,
  };
}

export function getArtifactTemplateKeys(): string[] {
  return Object.keys(ARTIFACT_TEMPLATES);
}
