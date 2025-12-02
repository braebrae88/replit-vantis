import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { api, ImpactStoryResponse, AccountGrowthResponse, RuleBasedSuggestion, EngagementIdea } from "@/lib/api";
import type { Task, UseCase, Risk, Project, Event, NextAction, CompanionResponse, SuggestedTask, StatusReport, RoadmapResponse, RoadmapTask, RoadmapWeek, EngagementInsight, OpportunitySeed, Stakeholder, MetricSnapshot } from "@shared/schema";
import { useState } from "react";
import MissionControlLayout from "@/components/MissionControlLayout";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { CreateUseCaseDialog } from "@/components/CreateUseCaseDialog";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { CreateRiskDialog } from "@/components/CreateRiskDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2,
  Calendar,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Briefcase,
  FileText,
  Target,
  Activity,
  Mail,
  File,
  Video,
  Lightbulb,
  ClipboardList,
  UserCheck,
  MessageSquare,
  Bot,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  CircleDot,
  ListTodo,
  FileBarChart,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  Map,
  BarChart3,
  Plus,
  Trash2,
} from "lucide-react";

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  try {
    return format(new Date(date), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-6">
          <Target className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to Mission Control</h2>
        <p className="text-muted-foreground mb-6">
          Select a project from the sidebar to view its details, or create a new project to get started.
        </p>
        <CreateProjectDialog
          trigger={
            <Button size="lg" data-testid="button-create-first-project">
              Create Your First Project
            </Button>
          }
        />
      </div>
    </div>
  );
}

function SummaryTab({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{project.name}</h2>
          {project.clientName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>{project.clientName}</span>
            </div>
          )}
        </div>
        <CreateProjectDialog
          project={project}
          trigger={
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-edit-project">
              <Pencil className="w-4 h-4" /> Edit
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Phase</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-sm capitalize" data-testid="text-project-phase">
              {project.phase}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Start Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span data-testid="text-start-date">{formatDate(project.startDate)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">End Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span data-testid="text-end-date">{formatDate(project.endDate)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground" data-testid="text-project-description">
            {project.description || "No description provided."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm">{formatDate(project.createdAt)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm">{formatDate(project.updatedAt)}</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UseCasesTab({ projectId, useCases }: { projectId: string; useCases: UseCase[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-muted-foreground" />
          Use Cases ({useCases.length})
        </h3>
        <CreateUseCaseDialog projectId={projectId} />
      </div>

      {useCases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No use cases defined yet. Add your first use case to get started.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Problem Statement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {useCases.map((useCase) => (
                <TableRow key={useCase.id} data-testid={`row-usecase-${useCase.id}`}>
                  <TableCell className="font-medium">{useCase.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate">
                    {useCase.problemStatement || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        useCase.status === "implemented"
                          ? "default"
                          : useCase.status === "approved"
                          ? "secondary"
                          : "outline"
                      }
                      className="capitalize"
                    >
                      {useCase.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <CreateUseCaseDialog
                      projectId={projectId}
                      useCase={useCase}
                      trigger={
                        <Button variant="ghost" size="sm" data-testid={`button-edit-usecase-${useCase.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function TasksTab({ projectId, tasks }: { projectId: string; tasks: Task[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) =>
      api.tasks.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const statusColors: Record<string, string> = {
    todo: "bg-gray-100 text-gray-800",
    "in-progress": "bg-blue-100 text-blue-800",
    review: "bg-yellow-100 text-yellow-800",
    done: "bg-green-100 text-green-800",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
          Tasks ({tasks.length})
        </h3>
        <CreateTaskDialog projectId={projectId} />
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tasks created yet. Add your first task to track work.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} data-testid={`row-task-${task.id}`}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    {task.owner ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {task.owner[0]}
                        </div>
                        <span className="text-sm">{task.owner}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {formatDate(task.dueDate)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", priorityColors[task.priority])}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", statusColors[task.status])}>
                      {task.status.replace("-", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function RisksTab({ projectId, risks }: { projectId: string; risks: Risk[] }) {
  const getRiskScore = (likelihood: number, impact: number) => likelihood * impact;

  const getRiskLevel = (score: number) => {
    if (score >= 16) return { label: "Critical", color: "bg-red-100 text-red-800" };
    if (score >= 9) return { label: "High", color: "bg-orange-100 text-orange-800" };
    if (score >= 4) return { label: "Medium", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Low", color: "bg-green-100 text-green-800" };
  };

  const statusColors: Record<string, string> = {
    identified: "bg-gray-100 text-gray-800",
    analyzing: "bg-blue-100 text-blue-800",
    mitigating: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    accepted: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          Risk Register ({risks.length})
        </h3>
        <CreateRiskDialog projectId={projectId} />
      </div>

      {risks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No risks registered yet. Add risks to track potential issues.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risk</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>L × I</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.map((risk) => {
                const score = getRiskScore(risk.likelihood, risk.impact);
                const level = getRiskLevel(score);
                return (
                  <TableRow key={risk.id} data-testid={`row-risk-${risk.id}`}>
                    <TableCell className="font-medium">{risk.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {risk.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {risk.likelihood} × {risk.impact} = {score}
                    </TableCell>
                    <TableCell>
                      <Badge className={level.color}>{level.label}</Badge>
                    </TableCell>
                    <TableCell>{risk.owner || "—"}</TableCell>
                    <TableCell>
                      <Badge className={cn("capitalize", statusColors[risk.status])}>
                        {risk.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function ActivityTab({ projectId, events }: { projectId: string; events: Event[] }) {
  const [analysingEventId, setAnalysingEventId] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedEvent = events.find(e => e.id === analysingEventId);

  const handleAnalyse = async () => {
    if (!analysingEventId || !analysisText.trim()) return;
    
    setIsAnalysing(true);
    try {
      const result = await api.eventAnalysis.analyse(analysingEventId, analysisText);
      toast({
        title: "Analysis Complete",
        description: `Created ${result.createdInsights} insights and ${result.createdSeeds} opportunity seeds.`,
      });
      queryClient.invalidateQueries({ queryKey: ["engagementInsights", projectId] });
      queryClient.invalidateQueries({ queryKey: ["opportunitySeeds", projectId] });
      setAnalysingEventId(null);
      setAnalysisText("");
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyse event",
        variant: "destructive",
      });
    } finally {
      setIsAnalysing(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "file":
        return <File className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "meeting":
        return <Video className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "file":
        return "bg-blue-100 text-blue-700";
      case "email":
        return "bg-green-100 text-green-700";
      case "meeting":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const parseMetadata = (metadataJson: string | null) => {
    if (!metadataJson) return null;
    try {
      return JSON.parse(metadataJson);
    } catch {
      return null;
    }
  };

  const formatEventTime = (date: Date | string) => {
    try {
      const d = new Date(date);
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-muted-foreground" />
          Activity ({events.length})
        </h3>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No activity recorded yet. Events from Finder and Outlook will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const metadata = parseMetadata(event.metadataJson);
            return (
              <Card key={event.id} data-testid={`card-event-${event.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      getEventTypeColor(event.type)
                    )}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize text-xs">
                          {event.type}
                        </Badge>
                        {event.sourceSystem && (
                          <span className="text-xs text-muted-foreground font-mono">
                            via {event.sourceSystem}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatEventTime(event.occurredAt)}
                        </span>
                      </div>
                      <p className="font-medium text-sm">{event.title}</p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      {metadata && event.type === "email" && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span>From: {metadata.from}</span>
                          <span className="mx-2">→</span>
                          <span>To: {metadata.to}</span>
                        </div>
                      )}
                      {metadata && event.type === "meeting" && metadata.attendees && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>
                            {Array.isArray(metadata.attendees) 
                              ? metadata.attendees.join(", ") 
                              : metadata.attendees}
                          </span>
                        </div>
                      )}
                      {metadata && event.type === "file" && (
                        <div className="mt-2 text-xs text-muted-foreground font-mono">
                          {metadata.filePath}
                        </div>
                      )}
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAnalysingEventId(event.id)}
                          data-testid={`button-analyse-event-${event.id}`}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Analyse with VANTIS
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!analysingEventId} onOpenChange={(open) => !open && setAnalysingEventId(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Analyse Event with VANTIS
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && (
                <>Analysing: <span className="font-medium">{selectedEvent.title}</span></>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Paste the meeting notes, email body, or transcript below:
              </label>
              <Textarea
                placeholder="Enter the raw text content to analyse..."
                value={analysisText}
                onChange={(e) => setAnalysisText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                data-testid="textarea-analysis-text"
              />
              <p className="text-xs text-muted-foreground">
                VANTIS will extract decisions, risks, open questions, and potential opportunities from this text.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAnalysingEventId(null);
                setAnalysisText("");
              }}
              disabled={isAnalysing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAnalyse}
              disabled={isAnalysing || analysisText.trim().length < 10}
              data-testid="button-run-analysis"
            >
              {isAnalysing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analysing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StakeholdersTab({ projectId }: { projectId: string }) {
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stakeholders = [], isLoading } = useQuery({
    queryKey: ["stakeholders", projectId],
    queryFn: () => api.stakeholders.list(projectId),
    staleTime: Infinity,
  });

  const handleAnalyse = async () => {
    if (!selectedStakeholder || !analysisText.trim()) return;
    
    setIsAnalysing(true);
    try {
      const result = await api.stakeholderAnalysis.analyse(
        projectId,
        selectedStakeholder.id,
        analysisText
      );
      toast({
        title: "Analysis Complete",
        description: `Updated ${selectedStakeholder.name}: ${result.analysis.influence} influence, ${result.analysis.supportLevel} support`,
      });
      queryClient.invalidateQueries({ queryKey: ["stakeholders", projectId] });
      queryClient.invalidateQueries({ queryKey: ["engagementInsights", projectId] });
      setSelectedStakeholder(null);
      setAnalysisText("");
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyse stakeholder",
        variant: "destructive",
      });
    } finally {
      setIsAnalysing(false);
    }
  };

  const getInfluenceColor = (influence: string | null) => {
    switch (influence) {
      case "high": return "bg-red-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-200 text-gray-600";
    }
  };

  const getSupportColor = (support: string | null) => {
    switch (support) {
      case "champion": return "bg-green-600 text-white";
      case "supportive": return "bg-green-400 text-white";
      case "neutral": return "bg-gray-400 text-white";
      case "opposed": return "bg-red-500 text-white";
      default: return "bg-gray-200 text-gray-600";
    }
  };

  const getSupportLabel = (support: string | null) => {
    if (!support) return "Unknown";
    return support.charAt(0).toUpperCase() + support.slice(1);
  };

  const getInfluenceLabel = (influence: string | null) => {
    if (!influence) return "Unknown";
    return influence.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          Stakeholder Heatmap ({stakeholders.length})
        </h3>
      </div>

      {stakeholders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No stakeholders added yet. Add stakeholders to track influence and support levels.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Influence</TableHead>
                <TableHead className="text-center">Support Level</TableHead>
                <TableHead className="text-center">Last Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stakeholders.map((stakeholder) => (
                <TableRow key={stakeholder.id} data-testid={`row-stakeholder-${stakeholder.id}`}>
                  <TableCell className="font-medium">{stakeholder.name}</TableCell>
                  <TableCell>{stakeholder.role || "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("min-w-16 justify-center", getInfluenceColor(stakeholder.influence))}>
                      {getInfluenceLabel(stakeholder.influence)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("min-w-20 justify-center", getSupportColor(stakeholder.supportLevel))}>
                      {getSupportLabel(stakeholder.supportLevel)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {stakeholder.lastContactAt 
                      ? formatDistanceToNow(new Date(stakeholder.lastContactAt), { addSuffix: true })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStakeholder(stakeholder)}
                      data-testid={`button-analyse-stakeholder-${stakeholder.id}`}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Analyse
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!selectedStakeholder} onOpenChange={(open) => !open && setSelectedStakeholder(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Analyse Stakeholder
            </DialogTitle>
            <DialogDescription>
              {selectedStakeholder && (
                <>Analysing: <span className="font-medium">{selectedStakeholder.name}</span> ({selectedStakeholder.role || "Unknown Role"})</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Paste meeting notes, email excerpts, or other text about this stakeholder:
              </label>
              <Textarea
                placeholder="Enter notes, observations, or meeting excerpts about this stakeholder..."
                value={analysisText}
                onChange={(e) => setAnalysisText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-stakeholder-analysis"
              />
              <p className="text-xs text-muted-foreground">
                VANTIS will classify their influence level, support level, and identify key concerns.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedStakeholder(null);
                setAnalysisText("");
              }}
              disabled={isAnalysing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAnalyse}
              disabled={isAnalysing || analysisText.trim().length < 10}
              data-testid="button-run-stakeholder-analysis"
            >
              {isAnalysing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analysing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ValueImpactTab({ projectId }: { projectId: string }) {
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [newMetric, setNewMetric] = useState({
    name: "",
    description: "",
    unit: "",
    baseline: "",
    currentValue: "",
    targetValue: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [impactStory, setImpactStory] = useState<ImpactStoryResponse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ["metrics", projectId],
    queryFn: () => api.metrics.list(projectId),
    staleTime: Infinity,
  });

  const createMetricMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; unit?: string; baseline?: number; currentValue?: number; targetValue?: number }) =>
      api.metrics.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics", projectId] });
      setShowAddMetric(false);
      setNewMetric({ name: "", description: "", unit: "", baseline: "", currentValue: "", targetValue: "" });
      toast({ title: "Metric Added", description: "New metric snapshot created successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to create metric", variant: "destructive" });
    },
  });

  const deleteMetricMutation = useMutation({
    mutationFn: (id: string) => api.metrics.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics", projectId] });
      toast({ title: "Metric Deleted", description: "Metric snapshot removed." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to delete metric", variant: "destructive" });
    },
  });

  const handleAddMetric = () => {
    if (!newMetric.name.trim()) return;
    createMetricMutation.mutate({
      name: newMetric.name.trim(),
      description: newMetric.description.trim() || undefined,
      unit: newMetric.unit.trim() || undefined,
      baseline: newMetric.baseline ? parseFloat(newMetric.baseline) : undefined,
      currentValue: newMetric.currentValue ? parseFloat(newMetric.currentValue) : undefined,
      targetValue: newMetric.targetValue ? parseFloat(newMetric.targetValue) : undefined,
    });
  };

  const handleGenerateImpactStory = async () => {
    setIsGenerating(true);
    try {
      const result = await api.impactStory.generate(projectId);
      setImpactStory(result);
      toast({ title: "Impact Story Generated", description: "Your impact narrative is ready!" });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate impact story",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
          Value Scorecard ({metrics.length} metrics)
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddMetric(true)}
          data-testid="button-add-metric"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Metric
        </Button>
      </div>

      {metrics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No metrics captured yet. Add metrics to track project value and impact.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Baseline</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((metric) => (
                <TableRow key={metric.id} data-testid={`row-metric-${metric.id}`}>
                  <TableCell className="font-medium">{metric.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{metric.description || "—"}</TableCell>
                  <TableCell className="text-right font-mono">
                    {metric.baseline !== null ? metric.baseline : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {metric.currentValue !== null ? metric.currentValue : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {metric.targetValue !== null ? metric.targetValue : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {metric.unit || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMetricMutation.mutate(metric.id)}
                      disabled={deleteMetricMutation.isPending}
                      data-testid={`button-delete-metric-${metric.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Impact Story
          </h3>
          <Button
            onClick={handleGenerateImpactStory}
            disabled={isGenerating}
            data-testid="button-generate-impact-story"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Impact Story
              </>
            )}
          </Button>
        </div>

        {impactStory ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Executive Narrative</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                {impactStory.narrative.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 text-muted-foreground">{paragraph}</p>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Key Soundbites</h4>
                <ul className="space-y-2">
                  {impactStory.soundbites.map((soundbite, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span className="italic text-muted-foreground">"{soundbite}"</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold text-sm mb-2">What This Unlocks</h4>
                <p className="text-sm text-muted-foreground">{impactStory.nextUnlockSuggestion}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Click "Generate Impact Story" to create an executive-ready narrative based on your metrics and deliverables.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAddMetric} onOpenChange={setShowAddMetric}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Metric Snapshot</DialogTitle>
            <DialogDescription>
              Track a key performance indicator or outcome metric for this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Metric Name *</label>
              <Input
                placeholder="e.g., ED Length of Stay"
                value={newMetric.name}
                onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                data-testid="input-metric-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="e.g., Average time from arrival to discharge"
                value={newMetric.description}
                onChange={(e) => setNewMetric({ ...newMetric, description: e.target.value })}
                data-testid="input-metric-description"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit</label>
              <Input
                placeholder="e.g., hours, %, minutes"
                value={newMetric.unit}
                onChange={(e) => setNewMetric({ ...newMetric, unit: e.target.value })}
                data-testid="input-metric-unit"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Baseline</label>
                <Input
                  type="number"
                  placeholder="e.g., 4.5"
                  value={newMetric.baseline}
                  onChange={(e) => setNewMetric({ ...newMetric, baseline: e.target.value })}
                  data-testid="input-metric-baseline"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Current</label>
                <Input
                  type="number"
                  placeholder="e.g., 3.8"
                  value={newMetric.currentValue}
                  onChange={(e) => setNewMetric({ ...newMetric, currentValue: e.target.value })}
                  data-testid="input-metric-current"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target</label>
                <Input
                  type="number"
                  placeholder="e.g., 3.0"
                  value={newMetric.targetValue}
                  onChange={(e) => setNewMetric({ ...newMetric, targetValue: e.target.value })}
                  data-testid="input-metric-target"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMetric(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMetric}
              disabled={!newMetric.name.trim() || createMetricMutation.isPending}
              data-testid="button-save-metric"
            >
              {createMetricMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Metric"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountGrowthTab({ projectId }: { projectId: string }) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["accountGrowth", projectId],
    queryFn: () => api.accountGrowth.get(projectId),
    staleTime: 60000,
    enabled: false,
  });

  const handleRefresh = () => {
    refetch();
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "qualified": return "bg-blue-100 text-blue-800";
      case "proposed": return "bg-purple-100 text-purple-800";
      case "won": return "bg-green-100 text-green-800";
      case "lost": return "bg-gray-100 text-gray-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
          Account Growth & Next Horizons
        </h3>
        <Button
          onClick={handleRefresh}
          disabled={isFetching}
          data-testid="button-refresh-growth"
        >
          {isFetching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analysing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Growth Ideas
            </>
          )}
        </Button>
      </div>

      {!data && !isLoading && !isFetching && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Click "Generate Growth Ideas" to analyse this project and discover follow-on engagement opportunities.
          </CardContent>
        </Card>
      )}

      {(isLoading || isFetching) && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {data && !isFetching && (
        <div className="space-y-6">
          {data.opportunitySeeds.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Opportunity Seeds ({data.opportunitySeeds.length})
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                {data.opportunitySeeds.map((seed) => (
                  <Card key={seed.id} data-testid={`card-seed-${seed.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h5 className="font-medium text-sm">{seed.title}</h5>
                        <Badge className={cn("text-xs", getStatusColor(seed.status))}>
                          {seed.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{seed.description}</p>
                      {seed.potentialValueEstimate && (
                        <p className="text-xs text-green-600 font-medium">
                          Est. Value: ${seed.potentialValueEstimate.toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {data.ruleBasedSuggestions.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Pattern-Based Signals
              </h4>
              <div className="space-y-2">
                {data.ruleBasedSuggestions.map((suggestion, idx) => (
                  <Card key={idx} className="border-l-4 border-l-orange-400" data-testid={`card-rule-${idx}`}>
                    <CardContent className="p-4">
                      <h5 className="font-medium text-sm mb-1">{suggestion.title}</h5>
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                      <p className="text-xs text-orange-600">Trigger: {suggestion.trigger}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {data.aiIdeas.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                AI-Suggested Engagements
              </h4>
              <div className="grid gap-4">
                {data.aiIdeas.map((idea, idx) => (
                  <Card key={idx} className="border-l-4 border-l-purple-400" data-testid={`card-idea-${idx}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h5 className="font-semibold">{idea.title}</h5>
                        <Badge variant="outline" className="shrink-0">
                          {idea.sizeHint}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{idea.description}</p>
                      
                      <div className="grid gap-3 sm:grid-cols-2 text-sm">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Client Value</p>
                          <p className="text-green-700">{idea.clientValue}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Ideal Timing</p>
                          <p>{idea.idealTiming}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Trigger: </span>
                          {idea.triggerSummary}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {data.aiIdeas.length === 0 && data.ruleBasedSuggestions.length === 0 && data.opportunitySeeds.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No growth opportunities identified yet. Add more project data (use cases, deliverables, risks) to enable analysis.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function NextActionsPanel({ projectId }: { projectId: string }) {
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["nextActions", projectId],
    queryFn: () => api.projects.getNextActions(projectId),
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <Card className="mb-6 border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-base">Next Actions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card className="mb-6 border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <CardTitle className="text-base">All Caught Up</CardTitle>
          </div>
          <CardDescription>No suggested actions at this time. Great work!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400";
      case "high":
        return "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400";
      case "medium":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "readiness":
        return <Target className="w-4 h-4" />;
      case "tasks":
        return <ClipboardList className="w-4 h-4" />;
      case "engagement":
        return <MessageSquare className="w-4 h-4" />;
      case "risks":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  return (
    <Card className="mb-6" data-testid="panel-next-actions">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <CardTitle className="text-base">Next Actions</CardTitle>
          <Badge variant="secondary" className="ml-auto" data-testid="badge-action-count">
            {actions.length}
          </Badge>
        </div>
        <CardDescription>Suggested actions based on project status</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {actions.map((action, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg border flex items-start gap-3",
                getSeverityStyles(action.severity)
              )}
              data-testid={`next-action-${index}`}
            >
              <div className="mt-0.5">
                {getCategoryIcon(action.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{action.title}</span>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs capitalize", getSeverityStyles(action.severity))}
                    data-testid={`severity-${action.severity}`}
                  >
                    {action.severity}
                  </Badge>
                </div>
                <p className="text-xs opacity-80">{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  response?: CompanionResponse;
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h3>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="font-bold text-sm mt-3 mb-1">{line.slice(3)}</h2>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="font-bold text-base mt-3 mb-1">{line.slice(2)}</h1>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      i--;
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-0.5 text-sm my-1">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      i--;
      elements.push(
        <ol key={i} className="list-decimal list-inside space-y-0.5 text-sm my-1">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm my-0.5">{renderInlineMarkdown(line)}</p>
      );
    }
    i++;
  }

  return <div className="space-y-0">{elements}</div>;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

interface VantisCompanionPanelProps {
  projectId: string;
  selectedDeliverableId?: string;
}

function VantisCompanionPanel({ projectId, selectedDeliverableId }: VantisCompanionPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (message: string) => api.companion.chat(projectId, message, selectedDeliverableId),
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.responseText,
          response,
        },
      ]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || mutation.isPending) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    mutation.mutate(userMessage);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Card className="border-primary/20" data-testid="panel-vantis-companion">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">VANTIS Companion</CardTitle>
                <Badge variant="outline" className="text-xs">AI</Badge>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <CardDescription>
              Ask questions about your project and get AI-powered insights
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="border rounded-lg bg-muted/20">
              <ScrollArea className="h-[300px] p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Bot className="w-10 h-10 mb-3 opacity-50" />
                    <p className="text-sm">Start a conversation with VANTIS Companion</p>
                    <p className="text-xs mt-1">Ask about project status, risks, or get recommendations</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex",
                          message.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-lg p-3",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background border"
                          )}
                          data-testid={`chat-message-${index}`}
                        >
                          {message.role === "user" ? (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            <MarkdownContent content={message.content} />
                          )}
                        </div>
                      </div>
                    ))}
                    {mutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-background border rounded-lg p-3">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              
              <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask VANTIS Companion..."
                  disabled={mutation.isPending}
                  className="flex-1"
                  data-testid="input-companion-message"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={mutation.isPending || !input.trim()}
                  data-testid="button-send-message"
                >
                  {mutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function StatusReportTab({ projectId }: { projectId: string }) {
  const [report, setReport] = useState<StatusReport | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: () => api.statusReport.generate(projectId),
    onSuccess: (data) => {
      setReport(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  const formatReportForEmail = () => {
    if (!report) return "";
    
    const lines = [
      `Weekly Status Report: ${report.projectName}`,
      `Generated: ${format(new Date(report.generatedAt), "MMMM d, yyyy")}`,
      `Report Period: ${format(new Date(report.reportPeriod.start), "MMM d")} - ${format(new Date(report.reportPeriod.end), "MMM d, yyyy")}`,
      "",
      "## HIGHLIGHTS",
      ...report.highlights.map((h) => `• ${h}`),
      "",
    ];

    if (report.completedTasks.length > 0) {
      lines.push("## COMPLETED TASKS");
      report.completedTasks.forEach((t) => {
        lines.push(`• ${t.title}`);
      });
      lines.push("");
    }

    if (report.newOpenTasks.length > 0) {
      lines.push("## NEW OPEN TASKS");
      report.newOpenTasks.forEach((t) => {
        lines.push(`• ${t.title} (${t.status})`);
      });
      lines.push("");
    }

    if (report.recentEvents.length > 0) {
      lines.push("## RECENT ACTIVITY");
      report.recentEvents.forEach((e) => {
        lines.push(`• [${e.type.toUpperCase()}] ${e.title}`);
      });
      lines.push("");
    }

    if (report.risks.length > 0) {
      lines.push("## RISKS & ISSUES");
      report.risks.forEach((r) => {
        lines.push(`• ${r.title} (${r.category}, ${r.status})`);
      });
      lines.push("");
    }

    if (report.nextWeekFocus.length > 0) {
      lines.push("## NEXT WEEK FOCUS");
      report.nextWeekFocus.forEach((f) => {
        lines.push(`• ${f}`);
      });
      lines.push("");
    }

    if (report.openDecisions.length > 0) {
      lines.push("## OPEN DECISIONS");
      report.openDecisions.forEach((d) => {
        lines.push(`• ${d}`);
      });
    }

    return lines.join("\n");
  };

  const copyToClipboard = async () => {
    if (!report) {
      toast({
        title: "No report available",
        description: "Please generate a report first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const text = formatReportForEmail();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Report copied and ready to paste into your email",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please try selecting and copying the text manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="w-5 h-5" />
                Weekly Status Report
              </CardTitle>
              <CardDescription>
                Generate a summary of the past 7 days to share with stakeholders
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {report && (
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  data-testid="button-copy-report"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy for Email
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                data-testid="button-generate-report"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {report && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{report.projectName}</CardTitle>
                <Badge variant="outline" className="font-mono text-xs">
                  {format(new Date(report.reportPeriod.start), "MMM d")} - {format(new Date(report.reportPeriod.end), "MMM d, yyyy")}
                </Badge>
              </div>
              <CardDescription>
                Generated {format(new Date(report.generatedAt), "MMMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card data-testid="section-highlights">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="section-risks">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  Risks & Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.risks.length > 0 ? (
                  <ul className="space-y-2">
                    {report.risks.map((r) => (
                      <li key={r.id} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium">{r.title}</span>
                          <div className="text-xs text-muted-foreground">
                            {r.category} • {r.status}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No new risks this week</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card data-testid="section-completed-tasks">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Completed Tasks ({report.completedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.completedTasks.length > 0 ? (
                  <ul className="space-y-2">
                    {report.completedTasks.map((t) => (
                      <li key={t.id} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <span>{t.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No tasks completed this week</p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="section-new-tasks">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-purple-600" />
                  New Open Tasks ({report.newOpenTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.newOpenTasks.length > 0 ? (
                  <ul className="space-y-2">
                    {report.newOpenTasks.map((t) => (
                      <li key={t.id} className="flex items-start gap-2 text-sm">
                        <Clock className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                        <div>
                          <span>{t.title}</span>
                          <Badge variant="outline" className="ml-2 text-xs capitalize">
                            {t.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No new tasks this week</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card data-testid="section-next-week">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  Next Week Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.nextWeekFocus.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Target className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="section-open-decisions">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  Open Decisions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.openDecisions.length > 0 ? (
                  <ul className="space-y-2">
                    {report.openDecisions.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No pending decisions</p>
                )}
              </CardContent>
            </Card>
          </div>

          {report.recentEvents.length > 0 && (
            <Card data-testid="section-recent-events">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-600" />
                  Recent Activity ({report.recentEvents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {report.recentEvents.map((e) => (
                    <div key={e.id} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/50">
                      {e.type === "meeting" && <Video className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />}
                      {e.type === "email" && <Mail className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />}
                      {e.type === "file" && <File className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />}
                      {!["meeting", "email", "file"].includes(e.type) && (
                        <Activity className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(e.occurredAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!report && !mutation.isPending && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileBarChart className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Report Generated</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Click the "Generate Report" button above to create a weekly status report summarizing your project's progress.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const DELIVERABLE_TYPES = [
  { value: "activation_map", label: "Activation Map", description: "Map use cases to workflows and readiness" },
  { value: "safe_prototypes", label: "SAFE Prototypes", description: "Build and validate proof-of-concept prototypes" },
  { value: "ms_funding_nav", label: "MS Funding Navigator", description: "Navigate Microsoft funding opportunities" },
  { value: "exec_framing", label: "Executive Framing", description: "Frame the initiative for executive stakeholders" },
] as const;

interface DeliverablesTabProps {
  projectId: string;
  selectedDeliverableId: string | null;
  onDeliverableSelect: (id: string | null) => void;
}

function DeliverablesTab({ projectId, selectedDeliverableId, onDeliverableSelect }: DeliverablesTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [expandedWorkshops, setExpandedWorkshops] = useState<Set<string>>(new Set());

  const toggleWorkshopExpanded = (workshopKey: string) => {
    setExpandedWorkshops((prev) => {
      const next = new Set(prev);
      if (next.has(workshopKey)) {
        next.delete(workshopKey);
      } else {
        next.add(workshopKey);
      }
      return next;
    });
  };

  const handleCopyWorkshopInvite = async (workshopKey: string) => {
    if (!selectedDeliverableId) return;
    try {
      const invite = await api.deliverables.getWorkshopInvite(selectedDeliverableId, workshopKey);
      await navigator.clipboard.writeText(invite.emailBody);
      toast({
        title: "Copied!",
        description: "Workshop invite email text copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy invite text",
        variant: "destructive",
      });
    }
  };

  const { data: deliverables = [], isLoading: deliverablesLoading } = useQuery({
    queryKey: ["deliverables", projectId],
    queryFn: () => api.deliverables.list(projectId),
  });

  const selectedDeliverable = deliverables.find((d) => d.id === selectedDeliverableId);

  const { data: guidance, isLoading: guidanceLoading } = useQuery({
    queryKey: ["guidance", selectedDeliverableId],
    queryFn: () => api.deliverables.getGuidance(selectedDeliverableId!),
    enabled: !!selectedDeliverableId,
  });

  const { data: metrics } = useQuery({
    queryKey: ["deliverable-metrics", selectedDeliverableId],
    queryFn: () => api.deliverables.getMetrics(selectedDeliverableId!),
    enabled: !!selectedDeliverableId,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["milestones", selectedDeliverableId],
    queryFn: () => api.deliverables.getMilestones(selectedDeliverableId!),
    enabled: !!selectedDeliverableId,
  });

  const createDeliverableMutation = useMutation({
    mutationFn: (type: string) => api.deliverables.create(projectId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] });
      toast({ title: "Deliverable created", description: "The deliverable has been added to your project." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create deliverable",
        variant: "destructive",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: { title: string; description: string; projectId: string }) =>
      api.tasks.create({ ...data, status: "todo", priority: "medium" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast({ title: "Task created", description: "The task has been added to your project." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const handleCreateTasks = (suggestedTasks: string[], activityName: string) => {
    suggestedTasks.forEach((taskTitle) => {
      createTaskMutation.mutate({
        title: taskTitle,
        description: `Task created from activity: ${activityName}`,
        projectId,
      });
    });
  };

  const toggleMilestone = (milestoneId: string) => {
    setExpandedMilestones((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(milestoneId)) {
        newSet.delete(milestoneId);
      } else {
        newSet.add(milestoneId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return <Badge variant="default" className="bg-green-500 text-white">Done</Badge>;
      case "in_progress":
        return <Badge variant="default" className="bg-blue-500 text-white">In Progress</Badge>;
      case "blocked":
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "blocked":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <CircleDot className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "High":
        return <Badge className="bg-red-100 text-red-800 border-red-200">High Risk</Badge>;
      case "Medium":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Risk</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 border-green-200">Low Risk</Badge>;
    }
  };

  if (deliverablesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" data-testid="text-deliverables-title">Deliverables</h2>
          <p className="text-sm text-muted-foreground">
            Manage templated deliverables and track guided orchestration progress
          </p>
        </div>
        <div className="relative">
          <select
            className="h-9 px-3 py-1 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer appearance-none pr-8"
            onChange={(e) => {
              if (e.target.value) {
                createDeliverableMutation.mutate(e.target.value);
                e.target.value = "";
              }
            }}
            defaultValue=""
            data-testid="select-add-deliverable"
            disabled={createDeliverableMutation.isPending}
          >
            <option value="" disabled>
              {createDeliverableMutation.isPending ? "Creating..." : "+ Add Deliverable"}
            </option>
            {DELIVERABLE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
      </div>

      {deliverables.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Deliverables Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Add a deliverable using the dropdown above to start tracking guided orchestration.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {deliverables.map((deliverable) => (
            <Card
              key={deliverable.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                selectedDeliverableId === deliverable.id && "border-primary ring-1 ring-primary"
              )}
              onClick={() => onDeliverableSelect(deliverable.id)}
              data-testid={`card-deliverable-${deliverable.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{deliverable.name}</CardTitle>
                  {getStatusBadge(deliverable.status)}
                </div>
                <CardDescription className="text-xs capitalize">
                  {deliverable.type.replace(/_/g, " ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${deliverable.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {Math.round(deliverable.progress)}%
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeliverableSelect(deliverable.id);
                  }}
                  data-testid={`button-view-guidance-${deliverable.id}`}
                >
                  <Lightbulb className="w-4 h-4" />
                  View Guidance
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedDeliverable && (
        <div className="space-y-4 mt-6">
          {metrics && (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5" data-testid="panel-metrics">
              <Card className="bg-muted/30">
                <CardContent className="pt-4 pb-3">
                  <div className="text-2xl font-bold text-primary">{metrics.progress}%</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-4 pb-3">
                  <div className="text-2xl font-bold font-mono">{metrics.totalHoursEstimate}h</div>
                  <div className="text-xs text-muted-foreground">Total Hours</div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-4 pb-3">
                  <div className="text-2xl font-bold font-mono">{metrics.hoursRemaining}h</div>
                  <div className="text-xs text-muted-foreground">Remaining</div>
                </CardContent>
              </Card>
              <Card className={cn("bg-muted/30", metrics.openRiskCount > 0 && "border-yellow-400")}>
                <CardContent className="pt-4 pb-3">
                  <div className={cn("text-2xl font-bold", metrics.openRiskCount > 0 ? "text-yellow-600" : "text-green-600")}>
                    {metrics.openRiskCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Open Risks</div>
                </CardContent>
              </Card>
              <Card className={cn("bg-muted/30", metrics.blockedActivityCount > 0 && "border-red-400")}>
                <CardContent className="pt-4 pb-3">
                  <div className={cn("text-2xl font-bold", metrics.blockedActivityCount > 0 ? "text-red-600" : "text-green-600")}>
                    {metrics.blockedActivityCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Blocked</div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2" data-testid="panel-milestones">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                Milestones & Activities
              </CardTitle>
              <CardDescription>
                {selectedDeliverable.name} - Progress Structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Loading milestones...</p>
                ) : (
                  <div className="space-y-2">
                    {milestones
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((milestone) => (
                        <MilestoneItem
                          key={milestone.id}
                          milestone={milestone}
                          isExpanded={expandedMilestones.has(milestone.id)}
                          onToggle={() => toggleMilestone(milestone.id)}
                          getStatusIcon={getStatusIcon}
                          getStatusBadge={getStatusBadge}
                        />
                      ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3" data-testid="panel-guidance">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Guided Steps
              </CardTitle>
              <CardDescription>
                Recommended next actions based on current progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {guidanceLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : guidance ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {guidance.scopeFlags.length > 0 && (
                      <div className="space-y-2">
                        {guidance.scopeFlags.map((flag, i) => (
                          <div
                            key={i}
                            className={cn(
                              "p-3 rounded-lg border flex items-start gap-2",
                              flag.severity === "critical"
                                ? "bg-red-50 border-red-200 text-red-800"
                                : "bg-yellow-50 border-yellow-200 text-yellow-800"
                            )}
                            data-testid={`alert-scope-flag-${i}`}
                          >
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span className="text-sm">{flag.message}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {guidance.nextBestSteps.slice(0, 3).map((step, index) => (
                      <Card key={step.activityId} className="bg-muted/30" data-testid={`card-guidance-step-${index}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-sm font-medium">{step.activityName}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                Milestone: {step.milestoneName}
                              </CardDescription>
                            </div>
                            {getRiskBadge(step.riskIfIgnored)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                          <p className="text-sm text-muted-foreground">{step.description}</p>

                          {step.missingInputs.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Missing Inputs:</p>
                              <div className="flex flex-wrap gap-1">
                                {step.missingInputs.map((input, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {input}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {step.suggestedTasks.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Tasks:</p>
                              <ul className="text-sm space-y-1">
                                {step.suggestedTasks.map((task, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3 h-3 mt-1 text-muted-foreground shrink-0" />
                                    <span>{task}</span>
                                  </li>
                                ))}
                              </ul>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 gap-1"
                                onClick={() => handleCreateTasks(step.suggestedTasks, step.activityName)}
                                disabled={createTaskMutation.isPending}
                                data-testid={`button-create-tasks-${step.activityId}`}
                              >
                                <ListTodo className="w-3 h-3" />
                                Create Tasks
                              </Button>
                            </div>
                          )}

                          {step.suggestedWorkshop && (
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                              <button
                                className="w-full text-left"
                                onClick={() => toggleWorkshopExpanded(step.suggestedWorkshop!.key)}
                                data-testid={`button-toggle-workshop-${step.suggestedWorkshop.key}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium">{step.suggestedWorkshop.title}</span>
                                  </div>
                                  <ChevronDown
                                    className={cn(
                                      "w-4 h-4 text-muted-foreground transition-transform",
                                      expandedWorkshops.has(step.suggestedWorkshop.key) && "rotate-180"
                                    )}
                                  />
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {step.suggestedWorkshop.durationMinutes} min
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {step.suggestedWorkshop.recommendedAttendees.length} attendees
                                  </span>
                                </div>
                              </button>

                              {expandedWorkshops.has(step.suggestedWorkshop.key) && (
                                <div className="mt-3 pt-3 border-t border-primary/10 space-y-3">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Objective:</p>
                                    <p className="text-sm">{step.suggestedWorkshop.objective}</p>
                                  </div>

                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Agenda:</p>
                                    <ul className="text-sm space-y-1">
                                      {step.suggestedWorkshop.agenda.map((item, i) => (
                                        <li key={i} className="flex gap-2">
                                          <span className="text-muted-foreground font-mono text-xs whitespace-nowrap">{item.time}</span>
                                          <span>{item.topic}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Recommended Attendees:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {step.suggestedWorkshop.recommendedAttendees.map((attendee, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                          {attendee}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 w-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyWorkshopInvite(step.suggestedWorkshop!.key);
                                    }}
                                    data-testid={`button-copy-workshop-invite-${step.suggestedWorkshop.key}`}
                                  >
                                    <Copy className="w-3 h-3" />
                                    Copy email invite text
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {guidance.nextBestSteps.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h3 className="font-medium mb-1">All Clear!</h3>
                        <p className="text-sm text-muted-foreground">{guidance.notes}</p>
                      </div>
                    )}

                    {guidance.overallGaps.length > 0 && (
                      <Card className="bg-muted/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            Overall Gaps ({guidance.overallGaps.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                            {guidance.overallGaps.slice(0, 5).map((gap, i) => (
                              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                <CircleDot className="w-3 h-3 mt-1 shrink-0" />
                                <span>{gap}</span>
                              </li>
                            ))}
                            {guidance.overallGaps.length > 5 && (
                              <li className="text-xs text-muted-foreground pl-5">
                                ...and {guidance.overallGaps.length - 5} more
                              </li>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select a deliverable to view guidance</p>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function MilestoneItem({
  milestone,
  isExpanded,
  onToggle,
  getStatusIcon,
  getStatusBadge,
}: {
  milestone: { id: string; name: string; status: string; description: string };
  isExpanded: boolean;
  onToggle: () => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  const { data: activities = [] } = useQuery({
    queryKey: ["activities", milestone.id],
    queryFn: () => api.deliverables.getActivities(milestone.id),
    enabled: isExpanded,
  });

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            {getStatusIcon(milestone.status)}
            <span className="text-sm font-medium text-left">{milestone.name}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 mt-1 space-y-1 border-l-2 border-muted pl-3">
          {activities
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded text-sm hover:bg-muted/30"
                data-testid={`activity-${activity.id}`}
              >
                {getStatusIcon(activity.status)}
                <span className="flex-1 truncate" title={activity.name}>
                  {activity.name}
                </span>
              </div>
            ))}
          {activities.length === 0 && (
            <p className="text-xs text-muted-foreground py-1.5 px-2">Loading activities...</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RoadmapTab({ projectId }: { projectId: string }) {
  const { data: roadmap, isLoading } = useQuery({
    queryKey: ["roadmap", projectId],
    queryFn: () => api.roadmap.get(projectId),
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-500";
      case "in-progress":
        return "bg-blue-500";
      case "review":
        return "bg-purple-500";
      default:
        return "bg-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Map className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Roadmap Data</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Unable to load roadmap data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasScheduledTasks = roadmap.weeks.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" data-testid="text-roadmap-title">Project Roadmap</h2>
          <p className="text-sm text-muted-foreground">
            {hasScheduledTasks
              ? `${format(new Date(roadmap.dateRange.start), "MMM d, yyyy")} - ${format(new Date(roadmap.dateRange.end), "MMM d, yyyy")}`
              : "No scheduled tasks yet"}
          </p>
        </div>
      </div>

      {hasScheduledTasks && (
        <Card data-testid="card-timeline">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline View
            </CardTitle>
            <CardDescription>
              Tasks are displayed across weeks based on their start and end dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">Task</TableHead>
                    {roadmap.weeks.map((week) => (
                      <TableHead
                        key={week.weekStart}
                        className="min-w-[120px] text-center"
                        data-testid={`header-week-${week.weekLabel}`}
                      >
                        <div className="text-xs font-medium">{week.weekLabel}</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(
                    new Set(roadmap.weeks.flatMap((w) => w.tasks.map((t) => t.id)))
                  ).map((taskId) => {
                    const task = roadmap.weeks
                      .flatMap((w) => w.tasks)
                      .find((t) => t.id === taskId);
                    if (!task) return null;

                    return (
                      <TableRow key={taskId} data-testid={`row-task-${taskId}`}>
                        <TableCell className="sticky left-0 bg-background z-10 min-w-[200px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", getStatusColor(task.status))} />
                              <span className="font-medium text-sm truncate max-w-[180px]" title={task.title}>
                                {task.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn("text-xs", getPriorityColor(task.priority))}
                              >
                                {task.priority}
                              </Badge>
                              {task.owner && (
                                <span className="text-xs text-muted-foreground truncate max-w-[100px]" title={task.owner}>
                                  {task.owner}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        {roadmap.weeks.map((week) => {
                          const isInWeek = week.tasks.some((t) => t.id === taskId);
                          return (
                            <TableCell
                              key={week.weekStart}
                              className="text-center"
                            >
                              {isInWeek && (
                                <div
                                  className={cn(
                                    "h-6 rounded mx-1",
                                    task.status === "done"
                                      ? "bg-green-200 border border-green-300"
                                      : task.status === "in-progress"
                                        ? "bg-blue-200 border border-blue-300"
                                        : task.status === "review"
                                          ? "bg-purple-200 border border-purple-300"
                                          : "bg-gray-200 border border-gray-300"
                                  )}
                                  title={`${task.title} (${task.status})`}
                                />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />
                <span>To Do</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-purple-200 border border-purple-300" />
                <span>Review</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-200 border border-green-300" />
                <span>Done</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {roadmap.unscheduledTasks.length > 0 && (
        <Card data-testid="card-unscheduled">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              Unscheduled Tasks ({roadmap.unscheduledTasks.length})
            </CardTitle>
            <CardDescription>
              Tasks without start and end dates. Add dates to include them in the timeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roadmap.unscheduledTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border bg-muted/30"
                  data-testid={`card-unscheduled-${task.id}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn("w-2 h-2 mt-1.5 rounded-full shrink-0", getStatusColor(task.status))} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate" title={task.title}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getPriorityColor(task.priority))}
                        >
                          {task.priority}
                        </Badge>
                        {task.owner && (
                          <span className="text-xs text-muted-foreground truncate" title={task.owner}>
                            {task.owner}
                          </span>
                        )}
                      </div>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!hasScheduledTasks && roadmap.unscheduledTasks.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Map className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tasks Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Create tasks and add start/end dates to see them on the roadmap timeline.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InsightsTab({ projectId }: { projectId: string }) {
  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ["engagementInsights", projectId],
    queryFn: () => api.engagementInsights.list(projectId),
  });

  const { data: seeds = [], isLoading: seedsLoading } = useQuery({
    queryKey: ["opportunitySeeds", projectId],
    queryFn: () => api.opportunitySeeds.list(projectId),
  });

  const groupedInsights = insights.reduce((acc, insight) => {
    const type = insight.type || "unknown";
    if (!acc[type]) acc[type] = [];
    acc[type].push(insight);
    return acc;
  }, {} as Record<string, EngagementInsight[]>);

  const insightTypeLabels: Record<string, string> = {
    meeting_summary: "Meeting Summaries",
    decision: "Decisions",
    open_question: "Open Questions",
    risk: "Risks Identified",
    opportunity_hint: "Opportunity Hints",
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case "meeting_summary": return <Video className="w-4 h-4" />;
      case "decision": return <CheckCircle2 className="w-4 h-4" />;
      case "open_question": return <MessageSquare className="w-4 h-4" />;
      case "risk": return <AlertTriangle className="w-4 h-4" />;
      case "opportunity_hint": return <Lightbulb className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getSentimentBadge = (sentiment: string | null) => {
    if (!sentiment) return null;
    const colors: Record<string, string> = {
      positive: "bg-green-100 text-green-700 border-green-200",
      neutral: "bg-gray-100 text-gray-700 border-gray-200",
      negative: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <Badge variant="outline" className={cn("text-xs", colors[sentiment] || colors.neutral)}>
        {sentiment}
      </Badge>
    );
  };

  const getImportanceBadge = (importance: string | null) => {
    if (!importance) return null;
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-700 border-red-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      low: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return (
      <Badge variant="outline" className={cn("text-xs", colors[importance] || colors.medium)}>
        {importance}
      </Badge>
    );
  };

  const getOpportunityStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      idea: "bg-gray-100 text-gray-700 border-gray-200",
      qualified: "bg-blue-100 text-blue-700 border-blue-200",
      proposed: "bg-purple-100 text-purple-700 border-purple-200",
      won: "bg-green-100 text-green-700 border-green-200",
      lost: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <Badge variant="outline" className={cn("text-xs uppercase", colors[status] || colors.idea)}>
        {status}
      </Badge>
    );
  };

  if (insightsLoading || seedsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const hasNoData = insights.length === 0 && seeds.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Engagement Intelligence
          </h2>
          <p className="text-sm text-muted-foreground">
            AI-generated insights from meetings, emails, and events
          </p>
        </div>
      </div>

      {hasNoData ? (
        <Card className="border-dashed" data-testid="card-no-insights">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Insights Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Insights will appear here as meetings, emails, and events are analyzed by AI.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {Object.entries(groupedInsights).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-medium">Insights by Type</h3>
              {Object.entries(groupedInsights).map(([type, typeInsights]) => (
                <Card key={type} data-testid={`card-insights-${type}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {getInsightTypeIcon(type)}
                      {insightTypeLabels[type] || type.replace(/_/g, " ")}
                      <Badge variant="secondary" className="ml-auto">
                        {typeInsights.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {typeInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className="p-3 rounded-lg border bg-muted/30"
                        data-testid={`insight-${insight.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{insight.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{insight.summary}</p>
                            {insight.tags && insight.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {insight.tags.map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {getSentimentBadge(insight.sentiment)}
                            {getImportanceBadge(insight.importance)}
                            {insight.createdByAI && (
                              <Badge variant="secondary" className="text-xs">
                                <Bot className="w-3 h-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {seeds.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Opportunity Seeds
              </h3>
              <Card data-testid="card-opportunity-seeds">
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Est. Value</TableHead>
                        <TableHead>Risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {seeds.map((seed) => (
                        <TableRow key={seed.id} data-testid={`seed-${seed.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{seed.title}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-xs">
                                {seed.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {seed.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getOpportunityStatusBadge(seed.status)}
                          </TableCell>
                          <TableCell>
                            {seed.potentialValueEstimate 
                              ? `$${seed.potentialValueEstimate.toLocaleString()}`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {seed.riskLevel ? (
                              <Badge variant="outline" className="text-xs">
                                {seed.riskLevel}
                              </Badge>
                            ) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MissionControl() {
  const params = useParams();
  const projectId = params.id;
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.projects.get(projectId!),
    enabled: !!projectId,
  });

  const { data: useCases = [] } = useQuery({
    queryKey: ["useCases", projectId],
    queryFn: () => api.useCases.list(projectId!),
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => api.tasks.list(projectId!),
    enabled: !!projectId,
  });

  const { data: risks = [] } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: () => api.risks.list(projectId!),
    enabled: !!projectId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events", projectId],
    queryFn: () => api.events.list(projectId!),
    enabled: !!projectId,
  });

  if (!projectId) {
    return (
      <MissionControlLayout>
        <WelcomeScreen />
      </MissionControlLayout>
    );
  }

  if (projectLoading) {
    return (
      <MissionControlLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MissionControlLayout>
    );
  }

  if (!project) {
    return (
      <MissionControlLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The project you're looking for doesn't exist or has been deleted.
            </p>
          </div>
        </div>
      </MissionControlLayout>
    );
  }

  return (
    <MissionControlLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <NextActionsPanel projectId={project.id} />
        <VantisCompanionPanel projectId={project.id} selectedDeliverableId={selectedDeliverableId || undefined} />
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="summary" data-testid="tab-summary">
              <FileText className="w-4 h-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="use-cases" data-testid="tab-usecases">
              <Briefcase className="w-4 h-4 mr-2" />
              Use Cases
            </TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="risks" data-testid="tab-risks">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Risks
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="status-report" data-testid="tab-status-report">
              <FileBarChart className="w-4 h-4 mr-2" />
              Status Report
            </TabsTrigger>
            <TabsTrigger value="roadmap" data-testid="tab-roadmap">
              <Map className="w-4 h-4 mr-2" />
              Roadmap
            </TabsTrigger>
            <TabsTrigger value="deliverables" data-testid="tab-deliverables">
              <Briefcase className="w-4 h-4 mr-2" />
              Deliverables
            </TabsTrigger>
            <TabsTrigger value="stakeholders" data-testid="tab-stakeholders">
              <Users className="w-4 h-4 mr-2" />
              Stakeholders
            </TabsTrigger>
            <TabsTrigger value="insights" data-testid="tab-insights">
              <Lightbulb className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="value-impact" data-testid="tab-value-impact">
              <BarChart3 className="w-4 h-4 mr-2" />
              Value & Impact
            </TabsTrigger>
            <TabsTrigger value="account-growth" data-testid="tab-account-growth">
              <TrendingUp className="w-4 h-4 mr-2" />
              Account Growth
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <SummaryTab project={project} />
          </TabsContent>

          <TabsContent value="use-cases">
            <UseCasesTab projectId={project.id} useCases={useCases} />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksTab projectId={project.id} tasks={tasks} />
          </TabsContent>

          <TabsContent value="risks">
            <RisksTab projectId={project.id} risks={risks} />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityTab projectId={project.id} events={events} />
          </TabsContent>

          <TabsContent value="status-report">
            <StatusReportTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="roadmap">
            <RoadmapTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="deliverables">
            <DeliverablesTab 
              projectId={project.id} 
              selectedDeliverableId={selectedDeliverableId}
              onDeliverableSelect={setSelectedDeliverableId}
            />
          </TabsContent>

          <TabsContent value="stakeholders">
            <StakeholdersTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="insights">
            <InsightsTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="value-impact">
            <ValueImpactTab projectId={project.id} />
          </TabsContent>

          <TabsContent value="account-growth">
            <AccountGrowthTab projectId={project.id} />
          </TabsContent>
        </Tabs>
      </div>
    </MissionControlLayout>
  );
}
