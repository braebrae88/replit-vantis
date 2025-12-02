import { storage } from "./storage";
import { updateArtifactCompletion } from "./artifactService";
import type { EngagementInsight, ArtifactWithSections, ArtifactSection } from "@shared/schema";

type SectionMapping = {
  sectionKeys: string[];
  formatContent: (insight: EngagementInsight) => string;
};

const INSIGHT_TO_SECTION_MAP: Record<string, SectionMapping> = {
  risk: {
    sectionKeys: ["risks_mitigations", "risks"],
    formatContent: (insight) => `• ${insight.title}: ${insight.summary}`,
  },
  decision: {
    sectionKeys: ["context", "headline_story", "asks_decisions"],
    formatContent: (insight) => `• [Decision] ${insight.title}: ${insight.summary}`,
  },
  open_question: {
    sectionKeys: ["context", "asks_decisions"],
    formatContent: (insight) => `• [Open Question] ${insight.title}: ${insight.summary}`,
  },
  meeting_summary: {
    sectionKeys: ["context", "headline_story"],
    formatContent: (insight) => `• [Summary] ${insight.summary}`,
  },
  opportunity_hint: {
    sectionKeys: ["next_90_days", "activation_sequence"],
    formatContent: (insight) => `• [Opportunity] ${insight.title}: ${insight.summary}`,
  },
  stakeholder_update: {
    sectionKeys: ["stakeholder_signoffs", "context"],
    formatContent: (insight) => `• [Stakeholder] ${insight.title}: ${insight.summary}`,
  },
};

const DEFAULT_SECTION_MAPPING: SectionMapping = {
  sectionKeys: ["context"],
  formatContent: (insight) => `• ${insight.title}: ${insight.summary}`,
};

const ACTION_KEYWORDS = ["next step", "plan", "action", "schedule", "timeline", "milestone", "will do", "follow up", "to do"];
const SCOPE_KEYWORDS = ["scope", "objective", "goal", "purpose", "target", "aim", "focus"];

function detectContentType(insight: EngagementInsight): string[] {
  const text = `${insight.title} ${insight.summary}`.toLowerCase();
  const additionalMappings: string[] = [];
  
  if (ACTION_KEYWORDS.some(kw => text.includes(kw))) {
    additionalMappings.push("activation_sequence", "next_90_days");
  }
  
  if (SCOPE_KEYWORDS.some(kw => text.includes(kw))) {
    additionalMappings.push("context", "headline_story", "prototype_scope");
  }
  
  return additionalMappings;
}

function simpleHash(str: string): string {
  let hash = 0;
  const normalized = str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function deduplicateContent(existingContent: string, newBullet: string): string {
  if (!existingContent) {
    return newBullet;
  }
  
  const newHash = simpleHash(newBullet);
  const existingLines = existingContent.split('\n').filter(line => line.trim());
  
  for (const line of existingLines) {
    const existingHash = simpleHash(line);
    if (existingHash === newHash) {
      return existingContent;
    }
  }
  
  return `${existingContent}\n${newBullet}`;
}

export async function populateArtifactsFromInsights(
  projectId: string,
  insights: EngagementInsight[]
): Promise<{ artifactsUpdated: number; sectionsUpdated: number }> {
  if (!insights || insights.length === 0) {
    return { artifactsUpdated: 0, sectionsUpdated: 0 };
  }

  const artifacts = await storage.getArtifacts(projectId);
  if (artifacts.length === 0) {
    return { artifactsUpdated: 0, sectionsUpdated: 0 };
  }

  const artifactSet = new Set<string>();
  let sectionsUpdated = 0;

  for (const insight of insights) {
    const insightType = insight.type;
    let mapping = INSIGHT_TO_SECTION_MAP[insightType];
    
    if (!mapping) {
      console.log(`[ArtifactPopulation] Using default mapping for unknown insight type: ${insightType}`);
      mapping = DEFAULT_SECTION_MAPPING;
    }

    const targetSectionKeys = [...mapping.sectionKeys, ...detectContentType(insight)];
    const formattedContent = mapping.formatContent(insight);

    for (const artifact of artifacts) {
      const matchingSections = artifact.sections.filter(
        (s) => targetSectionKeys.includes(s.key)
      );

      for (const section of matchingSections) {
        const existingContent = section.content || "";
        const updatedContent = deduplicateContent(existingContent, formattedContent);

        if (updatedContent !== existingContent) {
          const newStatus = section.status === "complete" ? "complete" : "partial";
          
          await storage.updateArtifactSection(section.id, {
            content: updatedContent,
            status: newStatus,
          });
          
          sectionsUpdated++;
          artifactSet.add(artifact.id);
        }
      }
    }
  }

  const artifactIds = Array.from(artifactSet);
  for (const artifactId of artifactIds) {
    await updateArtifactCompletion(artifactId);
  }

  return {
    artifactsUpdated: artifactIds.length,
    sectionsUpdated,
  };
}

function formatDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
}

export async function populateArtifactsFromTasks(
  projectId: string,
  tasks: Array<{ title: string; description?: string | null; dueDate?: Date | string | null }>
): Promise<{ artifactsUpdated: number; sectionsUpdated: number }> {
  if (!tasks || tasks.length === 0) {
    return { artifactsUpdated: 0, sectionsUpdated: 0 };
  }

  const artifacts = await storage.getArtifacts(projectId);
  if (artifacts.length === 0) {
    return { artifactsUpdated: 0, sectionsUpdated: 0 };
  }

  const artifactSet = new Set<string>();
  let sectionsUpdated = 0;

  const targetSectionKeys = ["activation_sequence", "next_90_days", "timeline"];

  for (const task of tasks) {
    const formattedDate = formatDate(task.dueDate);
    const formattedContent = formattedDate 
      ? `• [Task] ${task.title} (Due: ${formattedDate})`
      : `• [Task] ${task.title}`;

    for (const artifact of artifacts) {
      const matchingSections = artifact.sections.filter(
        (s) => targetSectionKeys.includes(s.key)
      );

      for (const section of matchingSections) {
        const existingContent = section.content || "";
        const updatedContent = deduplicateContent(existingContent, formattedContent);

        if (updatedContent !== existingContent) {
          const newStatus = section.status === "complete" ? "complete" : "partial";
          
          await storage.updateArtifactSection(section.id, {
            content: updatedContent,
            status: newStatus,
          });
          
          sectionsUpdated++;
          artifactSet.add(artifact.id);
        }
      }
    }
  }

  const artifactIds = Array.from(artifactSet);
  for (const artifactId of artifactIds) {
    await updateArtifactCompletion(artifactId);
  }

  return {
    artifactsUpdated: artifactIds.length,
    sectionsUpdated,
  };
}

export async function populateArtifactsFromRisks(
  projectId: string,
  newRisks: Array<{ title: string; category?: string; mitigation?: string | null }>
): Promise<{ artifactsUpdated: number; sectionsUpdated: number }> {
  if (!newRisks || newRisks.length === 0) {
    return { artifactsUpdated: 0, sectionsUpdated: 0 };
  }

  const artifacts = await storage.getArtifacts(projectId);
  if (artifacts.length === 0) {
    return { artifactsUpdated: 0, sectionsUpdated: 0 };
  }

  const artifactSet = new Set<string>();
  let sectionsUpdated = 0;

  const targetSectionKeys = ["risks_mitigations", "risks"];

  for (const risk of newRisks) {
    const mitigationNote = risk.mitigation ? ` | Mitigation: ${risk.mitigation}` : "";
    const categoryNote = risk.category ? ` [${risk.category}]` : "";
    const formattedContent = `• ${risk.title}${categoryNote}${mitigationNote}`;

    for (const artifact of artifacts) {
      const matchingSections = artifact.sections.filter(
        (s) => targetSectionKeys.includes(s.key)
      );

      for (const section of matchingSections) {
        const existingContent = section.content || "";
        const updatedContent = deduplicateContent(existingContent, formattedContent);

        if (updatedContent !== existingContent) {
          const newStatus = section.status === "complete" ? "complete" : "partial";
          
          await storage.updateArtifactSection(section.id, {
            content: updatedContent,
            status: newStatus,
          });
          
          sectionsUpdated++;
          artifactSet.add(artifact.id);
        }
      }
    }
  }

  const artifactIds = Array.from(artifactSet);
  for (const artifactId of artifactIds) {
    await updateArtifactCompletion(artifactId);
  }

  return {
    artifactsUpdated: artifactIds.length,
    sectionsUpdated,
  };
}
