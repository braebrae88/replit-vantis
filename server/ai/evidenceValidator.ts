import { OpportunityHint } from "./eventAnalysisPrompt";

export type EvidenceTag = "explicit_language" | "expansion_request" | "funding_window";

export interface ValidatedOpportunityHint extends OpportunityHint {
  isValid: boolean;
  validationErrors: string[];
}

const TRIGGER_PHRASES = {
  explicit_language: [
    "next phase",
    "expand",
    "additional",
    "also need",
    "separately",
    "in addition",
    "furthermore",
    "moreover",
    "beyond this",
    "phase 2",
    "phase two",
    "follow-on",
    "follow on",
  ],
  expansion_request: [
    "other department",
    "another department",
    "other team",
    "another team",
    "similar capability",
    "same approach",
    "replicate",
    "roll out to",
    "extend to",
    "other units",
    "service line",
    "other areas",
  ],
  funding_window: [
    "funding",
    "grant",
    "budget cycle",
    "fiscal year",
    "RFP",
    "request for proposal",
    "application deadline",
    "program window",
    "allocation",
    "capital",
    "investment",
  ],
};

export function detectEvidenceInTranscript(rawTranscript: string): {
  hasEvidence: boolean;
  detectedTags: EvidenceTag[];
  matchedPhrases: { tag: EvidenceTag; phrase: string }[];
} {
  const normalizedTranscript = rawTranscript.toLowerCase();
  const matchedPhrases: { tag: EvidenceTag; phrase: string }[] = [];
  const detectedTags: Set<EvidenceTag> = new Set();

  for (const [tag, phrases] of Object.entries(TRIGGER_PHRASES) as [EvidenceTag, string[]][]) {
    for (const phrase of phrases) {
      if (normalizedTranscript.includes(phrase.toLowerCase())) {
        matchedPhrases.push({ tag, phrase });
        detectedTags.add(tag);
      }
    }
  }

  return {
    hasEvidence: detectedTags.size > 0,
    detectedTags: Array.from(detectedTags),
    matchedPhrases,
  };
}

export function validateQuoteInTranscript(
  quote: string,
  rawTranscript: string,
  fuzzyThreshold: number = 0.8
): boolean {
  const normalizedQuote = quote.toLowerCase().trim();
  const normalizedTranscript = rawTranscript.toLowerCase();

  if (normalizedTranscript.includes(normalizedQuote)) {
    return true;
  }

  const words = normalizedQuote.split(/\s+/);
  if (words.length >= 3) {
    const matchedWords = words.filter(word => 
      word.length > 2 && normalizedTranscript.includes(word)
    );
    const matchRatio = matchedWords.length / words.length;
    return matchRatio >= fuzzyThreshold;
  }

  return false;
}

export function validateOpportunityHint(
  hint: Partial<OpportunityHint>,
  rawTranscript: string
): ValidatedOpportunityHint {
  const validationErrors: string[] = [];

  if (!hint.title) {
    validationErrors.push("Missing title");
  }
  if (!hint.rationale) {
    validationErrors.push("Missing rationale");
  }

  if (!hint.supportingQuotes || hint.supportingQuotes.length === 0) {
    validationErrors.push("No supporting quotes provided");
  } else {
    const invalidQuotes: string[] = [];
    for (const quote of hint.supportingQuotes) {
      if (!validateQuoteInTranscript(quote, rawTranscript)) {
        invalidQuotes.push(quote);
      }
    }
    if (invalidQuotes.length > 0) {
      validationErrors.push(`Quotes not found in transcript: ${invalidQuotes.join("; ")}`);
    }
  }

  if (!hint.evidenceTag) {
    const detection = detectEvidenceInTranscript(rawTranscript);
    if (!detection.hasEvidence) {
      validationErrors.push("No qualifying evidence detected in transcript");
    }
  } else {
    const validTags: EvidenceTag[] = ["explicit_language", "expansion_request", "funding_window"];
    if (!validTags.includes(hint.evidenceTag)) {
      validationErrors.push(`Invalid evidence tag: ${hint.evidenceTag}`);
    }
  }

  return {
    title: hint.title || "",
    rationale: hint.rationale || "",
    clientName: hint.clientName || null,
    confidence: typeof hint.confidence === "number" ? hint.confidence : 0.5,
    supportingQuotes: hint.supportingQuotes || [],
    evidenceTag: hint.evidenceTag || "explicit_language",
    isValid: validationErrors.length === 0,
    validationErrors,
  };
}

export function filterValidOpportunityHints(
  hints: Array<Partial<OpportunityHint> | string>,
  rawTranscript: string
): OpportunityHint[] {
  if (!rawTranscript || rawTranscript.trim().length < 10) {
    console.log("[EvidenceValidator] Transcript missing or too short, filtering all hints");
    return [];
  }

  const evidence = detectEvidenceInTranscript(rawTranscript);
  
  if (!evidence.hasEvidence) {
    console.log("[EvidenceValidator] No qualifying evidence in transcript, filtering all hints");
    return [];
  }

  const validHints: OpportunityHint[] = [];

  for (const hint of hints) {
    if (typeof hint === "string") {
      console.log("[EvidenceValidator] Skipping legacy string hint:", hint.substring(0, 50));
      continue;
    }

    if (!hint || !hint.title || !hint.rationale) {
      console.log("[EvidenceValidator] Skipping malformed hint");
      continue;
    }

    const validated = validateOpportunityHint(hint, rawTranscript);
    
    if (validated.isValid) {
      validHints.push({
        title: validated.title,
        rationale: validated.rationale,
        clientName: validated.clientName,
        confidence: validated.confidence,
        supportingQuotes: validated.supportingQuotes,
        evidenceTag: validated.evidenceTag,
      });
    } else {
      console.log("[EvidenceValidator] Filtered out invalid hint:", validated.title);
      console.log("[EvidenceValidator] Validation errors:", validated.validationErrors);
    }
  }

  return validHints;
}

export function inferEvidenceTag(
  supportingQuotes: string[],
  rawTranscript: string
): EvidenceTag {
  const combinedText = supportingQuotes.join(" ").toLowerCase();
  
  for (const phrase of TRIGGER_PHRASES.funding_window) {
    if (combinedText.includes(phrase.toLowerCase())) {
      return "funding_window";
    }
  }

  for (const phrase of TRIGGER_PHRASES.expansion_request) {
    if (combinedText.includes(phrase.toLowerCase())) {
      return "expansion_request";
    }
  }

  return "explicit_language";
}
