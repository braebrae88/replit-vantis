import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OpportunitySuggestion } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Lightbulb, Building2, FileText, Sparkles, Quote, Tag } from "lucide-react";
import { ProjectSidebar } from "@/components/ProjectSidebar";

const EVIDENCE_TAG_LABELS: Record<string, string> = {
  explicit_language: "Explicit expansion language",
  expansion_request: "Department expansion",
  funding_window: "Funding opportunity",
};

function SuggestionCard({ 
  suggestion,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: { 
  suggestion: OpportunitySuggestion;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const confidencePercent = Math.round((suggestion.confidence || 0.5) * 100);
  const supportingQuotes = suggestion.supportingQuotes || [];
  const evidenceTag = suggestion.evidenceTag;
  
  return (
    <Card className="border-l-4 border-l-amber-500" data-testid={`card-suggestion-${suggestion.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">{suggestion.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {evidenceTag && (
              <Badge variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {EVIDENCE_TAG_LABELS[evidenceTag] || evidenceTag}
              </Badge>
            )}
            <Badge variant="outline" className="shrink-0">
              {confidencePercent}% confidence
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>
        
        {supportingQuotes.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Quote className="h-3 w-3" />
              <span>Supporting evidence from transcript</span>
            </div>
            <ul className="space-y-1.5">
              {supportingQuotes.map((quote, index) => (
                <li key={index} className="text-sm italic text-foreground/80 border-l-2 border-amber-400 pl-2">
                  "{quote}"
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {suggestion.clientName && (
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span>{suggestion.clientName}</span>
            </div>
          )}
          {suggestion.projectId && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>From project</span>
            </div>
          )}
          {suggestion.sourceEventId && (
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>AI-generated</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={onApprove}
            disabled={isApproving || isRejecting}
            className="flex items-center gap-1"
            data-testid={`button-approve-${suggestion.id}`}
          >
            <CheckCircle className="h-4 w-4" />
            {isApproving ? "Adding..." : "Add to Prospective"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            disabled={isApproving || isRejecting}
            className="flex items-center gap-1"
            data-testid={`button-reject-${suggestion.id}`}
          >
            <XCircle className="h-4 w-4" />
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Suggestions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["opportunity-suggestions", "PENDING"],
    queryFn: () => api.opportunitySuggestions.list("PENDING"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.opportunitySuggestions.approve(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-items"] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast({
        title: "Suggestion Approved",
        description: `"${data.proposal.title}" has been added to your prospective pipeline.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve suggestion",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.opportunitySuggestions.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-suggestions"] });
      toast({
        title: "Suggestion Rejected",
        description: "The suggestion has been dismissed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject suggestion",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex h-screen bg-background">
      <ProjectSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Lightbulb className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Suggestions Inbox</h1>
              <p className="text-sm text-muted-foreground">
                AI-identified opportunities from your meetings and emails
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApprove={() => approveMutation.mutate(suggestion.id)}
                  onReject={() => rejectMutation.mutate(suggestion.id)}
                  isApproving={approveMutation.isPending && approveMutation.variables === suggestion.id}
                  isRejecting={rejectMutation.isPending && rejectMutation.variables === suggestion.id}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-3 bg-muted rounded-full mb-4">
                  <Lightbulb className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No pending suggestions</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  When VANTIS analyzes your meeting transcripts and emails, 
                  new opportunity suggestions will appear here for your review.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
