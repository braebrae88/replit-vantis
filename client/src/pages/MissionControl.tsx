import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { api } from "@/lib/api";
import type { Task, UseCase, Risk, Project } from "@shared/schema";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
        </Tabs>
      </div>
    </MissionControlLayout>
  );
}
