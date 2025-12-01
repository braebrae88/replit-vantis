import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { api } from "@/lib/api";
import type { Task, UseCase, Risk, Project, Event, NextAction, CompanionResponse, SuggestedTask } from "@shared/schema";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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

function VantisCompanionPanel({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (message: string) => api.companion.chat(projectId, message),
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

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      case "high":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
    }
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
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          
                          {message.response && (
                            <div className="mt-4 space-y-3">
                              {message.response.assumptions.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                                    <CircleDot className="w-3 h-3" />
                                    Assumptions
                                  </div>
                                  <ul className="text-xs space-y-1 pl-4">
                                    {message.response.assumptions.map((a, i) => (
                                      <li key={i} className="list-disc">{a}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {message.response.gaps.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Gaps Identified
                                  </div>
                                  <ul className="text-xs space-y-1 pl-4">
                                    {message.response.gaps.map((g, i) => (
                                      <li key={i} className="list-disc">{g}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {message.response.suggestedTasks.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                                    <ListTodo className="w-3 h-3" />
                                    Suggested Tasks
                                  </div>
                                  <div className="space-y-2">
                                    {message.response.suggestedTasks.map((task, i) => (
                                      <div key={i} className="bg-muted/50 rounded p-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium">{task.title}</span>
                                          <Badge 
                                            variant="outline" 
                                            className={cn("text-[10px] capitalize", getPriorityBadgeColor(task.priority))}
                                          >
                                            {task.priority}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
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

export default function MissionControl() {
  const params = useParams();
  const projectId = params.id;

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
        <VantisCompanionPanel projectId={project.id} />
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
        </Tabs>
      </div>
    </MissionControlLayout>
  );
}
