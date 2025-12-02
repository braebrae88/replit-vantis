import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ProposalAnalysisResponse } from "@/lib/api";
import type { ProposalWithChecklist, InsertProposal } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Circle,
  Loader2,
  Brain,
  AlertCircle,
  Target,
  Lightbulb,
  HelpCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCheck,
  FileSignature,
} from "lucide-react";

type ViewMode = "list" | "new" | "detail";

interface FormData {
  clientName: string;
  title: string;
  rawText: string;
  estimatedStart: string;
  estimatedEnd: string;
  rateInfo: string;
}

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  IN_REVIEW: { label: "In Review", variant: "outline" },
  SIGNED: { label: "Signed", variant: "default" },
  CONVERTED: { label: "Converted", variant: "default" },
};

export default function Proposals() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    title: "",
    rawText: "",
    estimatedStart: "",
    estimatedEnd: "",
    rateInfo: "",
  });
  const [analysisResult, setAnalysisResult] = useState<ProposalAnalysisResponse | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => api.proposals.list(),
  });

  const { data: selectedProposal, isLoading: loadingProposal } = useQuery({
    queryKey: ["proposals", selectedProposalId],
    queryFn: () => api.proposals.get(selectedProposalId!),
    enabled: !!selectedProposalId && viewMode === "detail",
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertProposal) => api.proposals.create(data),
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      setShowNewDialog(false);
      setFormData({
        clientName: "",
        title: "",
        rawText: "",
        estimatedStart: "",
        estimatedEnd: "",
        rateInfo: "",
      });
      setSelectedProposalId(proposal.id);
      setViewMode("detail");
      toast({
        title: "Proposal Created",
        description: "Your proposal has been saved with the SOW checklist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create proposal",
        variant: "destructive",
      });
    },
  });

  const analyseMutation = useMutation({
    mutationFn: (id: string) => api.proposals.analyse(id),
    onSuccess: (result) => {
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete",
        description: "VANTIS has extracted insights from the proposal.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze proposal",
        variant: "destructive",
      });
    },
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: ({ id, isComplete }: { id: string; isComplete: boolean }) =>
      api.sowChecklistItems.toggle(id, isComplete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals", selectedProposalId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update checklist",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.proposals.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["proposals", selectedProposalId] });
      toast({
        title: "Status Updated",
        description: "SOW has been marked as signed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleCreateProposal = () => {
    if (!formData.clientName.trim() || !formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Client name and title are required",
        variant: "destructive",
      });
      return;
    }

    const insertData: InsertProposal = {
      clientName: formData.clientName,
      title: formData.title,
      rawText: formData.rawText || null,
      estimatedStart: formData.estimatedStart ? new Date(formData.estimatedStart) : null,
      estimatedEnd: formData.estimatedEnd ? new Date(formData.estimatedEnd) : null,
      rateInfo: formData.rateInfo || null,
    };

    createMutation.mutate(insertData);
  };

  const handleMarkSigned = () => {
    if (!selectedProposal) return;

    const allComplete = selectedProposal.checklistItems.every((item) => item.isComplete);
    if (!allComplete) {
      toast({
        title: "Cannot Mark as Signed",
        description: "Please complete all checklist items before marking the SOW as signed.",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({ id: selectedProposal.id, status: "SIGNED" });
  };

  const openProposalDetail = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setAnalysisResult(null);
    setViewMode("detail");
  };

  const backToList = () => {
    setViewMode("list");
    setSelectedProposalId(null);
    setAnalysisResult(null);
  };

  if (viewMode === "detail" && selectedProposal) {
    const completedCount = selectedProposal.checklistItems.filter((item) => item.isComplete).length;
    const totalCount = selectedProposal.checklistItems.length;
    const allComplete = completedCount === totalCount && totalCount > 0;
    const statusInfo = STATUS_BADGES[selectedProposal.status] || STATUS_BADGES.DRAFT;

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-black text-white px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={backToList}
              className="text-white hover:bg-white/10"
              data-testid="button-back-to-list"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Proposals
            </Button>
            <div className="h-6 w-px bg-white/30" />
            <h1 className="text-lg font-semibold">Proposal Detail</h1>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl" data-testid="text-proposal-title">
                    {selectedProposal.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Building2 className="h-4 w-4" />
                    <span data-testid="text-proposal-client">{selectedProposal.clientName}</span>
                  </CardDescription>
                </div>
                <Badge variant={statusInfo.variant} data-testid="badge-proposal-status">
                  {statusInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedProposal.estimatedStart && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>Start: {format(new Date(selectedProposal.estimatedStart), "MMM d, yyyy")}</span>
                  </div>
                )}
                {selectedProposal.estimatedEnd && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>End: {format(new Date(selectedProposal.estimatedEnd), "MMM d, yyyy")}</span>
                  </div>
                )}
                {selectedProposal.rateInfo && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <DollarSign className="h-4 w-4" />
                    <span>{selectedProposal.rateInfo}</span>
                  </div>
                )}
              </div>

              {selectedProposal.rawText && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Proposal Text</h4>
                  <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedProposal.rawText}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  VANTIS Analysis
                </CardTitle>
                <CardDescription>
                  AI-powered extraction of objectives, use cases, and open questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!analysisResult ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500 mb-4">
                      Analyze the proposal text to extract insights and identify open questions.
                    </p>
                    <Button
                      onClick={() => analyseMutation.mutate(selectedProposal.id)}
                      disabled={analyseMutation.isPending || !selectedProposal.rawText}
                      data-testid="button-analyse-vantis"
                    >
                      {analyseMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Analyse with VANTIS
                        </>
                      )}
                    </Button>
                    {!selectedProposal.rawText && (
                      <p className="text-xs text-slate-400 mt-2">
                        Add proposal text to enable analysis
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {analysisResult.objectives.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4 text-blue-600" />
                          Objectives
                        </h4>
                        <div className="space-y-2">
                          {analysisResult.objectives.map((obj, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                              data-testid={`objective-${idx}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{obj.title}</span>
                                <Badge
                                  variant={
                                    obj.priority === "high"
                                      ? "destructive"
                                      : obj.priority === "medium"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {obj.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600">{obj.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.useCases.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                          <Lightbulb className="h-4 w-4 text-yellow-600" />
                          Potential Use Cases
                        </h4>
                        <div className="space-y-2">
                          {analysisResult.useCases.map((uc, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                              data-testid={`usecase-${idx}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{uc.name}</span>
                                {uc.suggestedPhase && (
                                  <Badge variant="outline" className="text-xs">
                                    {uc.suggestedPhase}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-600">{uc.problemStatement}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.openQuestions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                          <HelpCircle className="h-4 w-4 text-orange-600" />
                          Open Questions
                        </h4>
                        <div className="space-y-2">
                          {analysisResult.openQuestions.map((q, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-orange-50 rounded-lg border border-orange-100"
                              data-testid={`question-${idx}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{q.question}</span>
                                <Badge
                                  variant={
                                    q.urgency === "must-answer-before-sow"
                                      ? "destructive"
                                      : q.urgency === "nice-to-clarify"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {q.urgency.replace(/-/g, " ")}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600">{q.context}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.riskFlags && analysisResult.riskFlags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          Risk Flags
                        </h4>
                        <div className="space-y-2">
                          {analysisResult.riskFlags.map((risk, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-red-50 rounded-lg border border-red-100"
                              data-testid={`risk-${idx}`}
                            >
                              <span className="font-medium text-sm">{risk.risk}</span>
                              {risk.mitigation && (
                                <p className="text-xs text-slate-600 mt-1">
                                  Mitigation: {risk.mitigation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  SOW Sign-Off Checklist
                </CardTitle>
                <CardDescription>
                  {completedCount} of {totalCount} items complete
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedProposal.checklistItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        item.isComplete
                          ? "bg-green-50 border-green-200"
                          : "bg-slate-50 border-slate-200"
                      }`}
                      data-testid={`checklist-item-${item.id}`}
                    >
                      <Checkbox
                        id={item.id}
                        checked={item.isComplete}
                        onCheckedChange={(checked) =>
                          toggleChecklistMutation.mutate({
                            id: item.id,
                            isComplete: checked === true,
                          })
                        }
                        disabled={toggleChecklistMutation.isPending}
                        data-testid={`checkbox-${item.id}`}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={item.id}
                          className={`text-sm font-medium cursor-pointer ${
                            item.isComplete ? "text-green-700 line-through" : "text-slate-700"
                          }`}
                        >
                          {item.label}
                        </label>
                        {item.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                        )}
                      </div>
                      {item.isComplete && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                  ))}
                </div>

                {selectedProposal.status !== "SIGNED" && selectedProposal.status !== "CONVERTED" && (
                  <div className="mt-6 pt-4 border-t">
                    <Button
                      onClick={handleMarkSigned}
                      disabled={!allComplete || updateStatusMutation.isPending}
                      className="w-full"
                      data-testid="button-mark-signed"
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <FileSignature className="h-4 w-4 mr-2" />
                          Mark SOW Signed
                        </>
                      )}
                    </Button>
                    {!allComplete && (
                      <p className="text-xs text-slate-500 text-center mt-2">
                        Complete all checklist items to enable signing
                      </p>
                    )}
                  </div>
                )}

                {selectedProposal.status === "SIGNED" && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCheck className="h-5 w-5" />
                      <span className="font-medium">SOW Signed</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-black text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                data-testid="link-mission-control"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Mission Control
              </Button>
            </Link>
            <div className="h-6 w-px bg-white/30" />
            <h1 className="text-lg font-semibold">Proposals</h1>
          </div>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                data-testid="button-new-proposal"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Proposal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Proposal</DialogTitle>
                <DialogDescription>
                  Enter the proposal details. A SOW sign-off checklist will be created automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="e.g., Ontario Health Agency"
                      data-testid="input-client-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Proposal Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., AI Workflow Automation"
                      data-testid="input-title"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rawText">Proposal / SOW Text</Label>
                  <Textarea
                    id="rawText"
                    value={formData.rawText}
                    onChange={(e) => setFormData({ ...formData, rawText: e.target.value })}
                    placeholder="Paste the proposal or SOW text here for AI analysis..."
                    rows={8}
                    data-testid="textarea-raw-text"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedStart">Estimated Start Date</Label>
                    <Input
                      id="estimatedStart"
                      type="date"
                      value={formData.estimatedStart}
                      onChange={(e) => setFormData({ ...formData, estimatedStart: e.target.value })}
                      data-testid="input-estimated-start"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedEnd">Estimated End Date</Label>
                    <Input
                      id="estimatedEnd"
                      type="date"
                      value={formData.estimatedEnd}
                      onChange={(e) => setFormData({ ...formData, estimatedEnd: e.target.value })}
                      data-testid="input-estimated-end"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rateInfo">Rate Information</Label>
                  <Input
                    id="rateInfo"
                    value={formData.rateInfo}
                    onChange={(e) => setFormData({ ...formData, rateInfo: e.target.value })}
                    placeholder="e.g., $200/hr, Fixed $50,000"
                    data-testid="input-rate-info"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProposal}
                  disabled={createMutation.isPending}
                  data-testid="button-save-proposal"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Proposal"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {loadingProposals ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : proposals.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">No Proposals Yet</h3>
              <p className="text-slate-500 mb-6">
                Create your first proposal to start the SOW sign-off process.
              </p>
              <Button onClick={() => setShowNewDialog(true)} data-testid="button-create-first">
                <Plus className="h-4 w-4 mr-2" />
                Create First Proposal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => {
              const completedCount = proposal.checklistItems.filter((item) => item.isComplete).length;
              const totalCount = proposal.checklistItems.length;
              const statusInfo = STATUS_BADGES[proposal.status] || STATUS_BADGES.DRAFT;

              return (
                <Card
                  key={proposal.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openProposalDetail(proposal.id)}
                  data-testid={`card-proposal-${proposal.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800">
                            {proposal.title}
                          </h3>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {proposal.clientName}
                          </span>
                          {proposal.estimatedStart && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(proposal.estimatedStart), "MMM d, yyyy")}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            {completedCount}/{totalCount} checklist
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
