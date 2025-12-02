import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ClientReport, ReportSuggestion } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, FileText, Plus, Eye, Download, Check, Trash2, X, Sparkles, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ReportsTabProps {
  projectId: string;
}

function ReportSuggestionBanner({ suggestion, onGenerate, onDismiss, isGenerating }: {
  suggestion: ReportSuggestion;
  onGenerate: () => void;
  onDismiss: () => void;
  isGenerating: boolean;
}) {
  const reasonLabels: Record<string, { label: string; icon: typeof AlertTriangle }> = {
    HIGH_CRITICAL_RISK: { label: "Critical/High Risks Detected", icon: AlertTriangle },
    RISK_ESCALATION: { label: "Risk Escalation", icon: AlertCircle },
    UPCOMING_SPONSOR_MEETING: { label: "Upcoming Sponsor Meeting", icon: Clock },
    WEEKLY_CADENCE: { label: "Weekly Report Due", icon: Clock },
  };

  const reasonInfo = reasonLabels[suggestion.reason] || { label: suggestion.reason, icon: FileText };
  const Icon = reasonInfo.icon;

  return (
    <Card className="border-amber-500/50 bg-amber-500/5 mb-4" data-testid="report-suggestion-banner">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Icon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                VANTIS suggests generating a Risk Report
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium">{reasonInfo.label}:</span> {suggestion.reasonDetails}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              disabled={isGenerating}
              data-testid="dismiss-suggestion-btn"
            >
              <X className="h-4 w-4 mr-1" />
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
              className="bg-teal-600 hover:bg-teal-700"
              data-testid="generate-from-suggestion-btn"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-1" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportCard({ report, onView, onApprove, onDelete }: {
  report: ClientReport;
  onView: () => void;
  onApprove: () => void;
  onDelete: () => void;
}) {
  const isApproved = !!report.approvedAt;

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`report-card-${report.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            <CardTitle className="text-base">{report.emailSubject || "Risk Report"}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isApproved ? (
              <Badge variant="default" className="bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            ) : (
              <Badge variant="secondary">Draft</Badge>
            )}
          </div>
        </div>
        <CardDescription>
          {format(new Date(report.periodStart), "MMM d")} - {format(new Date(report.periodEnd), "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {report.emailSummary || "Risk report for sponsor communication."}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Generated {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onView} data-testid={`view-report-${report.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            {!isApproved && (
              <Button variant="outline" size="sm" onClick={onApprove} data-testid={`approve-report-${report.id}`}>
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive" data-testid={`delete-report-${report.id}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportPreviewDialog({ report, open, onOpenChange }: {
  report: ClientReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!report) return null;

  const downloadHtml = () => {
    if (!report.contentHtml) return;
    const blob = new Blob([report.contentHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `risk-report-${format(new Date(report.periodEnd), "yyyy-MM-dd")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            {report.emailSubject || "Risk Report"}
          </DialogTitle>
          <DialogDescription>
            Period: {format(new Date(report.periodStart), "MMM d")} - {format(new Date(report.periodEnd), "MMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 border-b pb-3">
          <Button variant="outline" size="sm" onClick={downloadHtml} data-testid="download-report-btn">
            <Download className="h-4 w-4 mr-1" />
            Download HTML
          </Button>
        </div>
        <ScrollArea className="h-[60vh]">
          {report.contentHtml ? (
            <div 
              className="prose prose-sm max-w-none p-4" 
              dangerouslySetInnerHTML={{ __html: report.contentHtml }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm p-4">{report.contentMarkdown}</pre>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function ReportsTab({ projectId }: ReportsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<ClientReport | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["reports", projectId],
    queryFn: () => api.reports.list(projectId),
  });

  const { data: pendingSuggestions } = useQuery({
    queryKey: ["reportSuggestions", projectId, "PENDING"],
    queryFn: () => api.reportSuggestions.list(projectId, "PENDING"),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.reports.generate(projectId, { periodDays: 14, useAI: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", projectId] });
      toast({ title: "Report generated", description: "Your risk report has been created." });
    },
    onError: () => {
      toast({ title: "Failed to generate report", variant: "destructive" });
    },
  });

  const generateFromSuggestionMutation = useMutation({
    mutationFn: (suggestionId: string) => api.reportSuggestions.generate(suggestionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", projectId] });
      queryClient.invalidateQueries({ queryKey: ["reportSuggestions", projectId] });
      toast({ title: "Report generated", description: "Your risk report has been created from the suggestion." });
    },
    onError: () => {
      toast({ title: "Failed to generate report", variant: "destructive" });
    },
  });

  const dismissSuggestionMutation = useMutation({
    mutationFn: (suggestionId: string) => api.reportSuggestions.dismiss(suggestionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportSuggestions", projectId] });
      toast({ title: "Suggestion dismissed" });
    },
    onError: () => {
      toast({ title: "Failed to dismiss suggestion", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (reportId: string) => api.reports.update(reportId, { approvedBy: "User" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", projectId] });
      toast({ title: "Report approved", description: "The report has been marked as approved." });
    },
    onError: () => {
      toast({ title: "Failed to approve report", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (reportId: string) => api.reports.delete(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", projectId] });
      toast({ title: "Report deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete report", variant: "destructive" });
    },
  });

  const handleViewReport = (report: ClientReport) => {
    setSelectedReport(report);
    setPreviewOpen(true);
  };

  if (reportsLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {pendingSuggestions && pendingSuggestions.length > 0 && (
        <ReportSuggestionBanner
          suggestion={pendingSuggestions[0]}
          onGenerate={() => generateFromSuggestionMutation.mutate(pendingSuggestions[0].id)}
          onDismiss={() => dismissSuggestionMutation.mutate(pendingSuggestions[0].id)}
          isGenerating={generateFromSuggestionMutation.isPending}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Risk Reports</h3>
          <p className="text-sm text-muted-foreground">
            Generate sponsor-ready risk reports for stakeholder communication
          </p>
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="bg-teal-600 hover:bg-teal-700"
          data-testid="generate-report-btn"
        >
          {generateMutation.isPending ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Generate Report
            </>
          )}
        </Button>
      </div>

      {reports && reports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onView={() => handleViewReport(report)}
              onApprove={() => approveMutation.mutate(report.id)}
              onDelete={() => deleteMutation.mutate(report.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">No reports yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Generate your first risk report to share with project sponsors and stakeholders.
            </p>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              data-testid="generate-first-report-btn"
            >
              <Plus className="h-4 w-4 mr-1" />
              Generate First Report
            </Button>
          </CardContent>
        </Card>
      )}

      <ReportPreviewDialog
        report={selectedReport}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
