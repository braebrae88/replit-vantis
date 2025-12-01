import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Briefcase, 
  CheckSquare, 
  CalendarIcon
} from "lucide-react";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import type { Task } from "@shared/schema";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { CreateUseCaseDialog } from "@/components/CreateUseCaseDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ProjectView() {
  const params = useParams();
  const id = params.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.projects.get(id!),
    enabled: !!id,
  });

  const { data: useCases, isLoading: useCasesLoading } = useQuery({
    queryKey: ["useCases", id],
    queryFn: () => api.useCases.list(id!),
    enabled: !!id,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => api.tasks.list(id!),
    enabled: !!id,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string, data: Partial<Task> }) => 
      api.tasks.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  if (projectLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <h2 className="text-2xl font-bold">Project Not Found</h2>
          <p className="text-muted-foreground">The project you are looking for does not exist.</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-fit" 
            onClick={() => window.history.back()}
            data-testid="link-back"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-project-name">{project.name}</h1>
                <Badge variant="outline" className="font-mono text-xs" data-testid="badge-project-phase">
                  {project.phase}
                </Badge>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                {project.description}
              </p>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-mono">
                <span>ID: {project.id}</span>
                <span>•</span>
                <span>Created: {format(new Date(project.createdAt), "MMM d, yyyy")}</span>
                {project.clientName && (
                  <>
                    <span>•</span>
                    <span>Client: {project.clientName}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              <Button>
                Edit Project
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="use-cases" data-testid="tab-usecases">Use Cases</TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Use Cases</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-usecases-count">{useCases?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {useCases?.filter(u => u.status === 'implemented').length} implemented
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-tasks-count">{tasks?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {tasks?.filter(t => t.status === 'done').length} completed
                  </p>
                </CardContent>
              </Card>
              <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Timeline</CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">On Track</div>
                  <p className="text-xs text-muted-foreground">
                    No blockers reported
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="use-cases">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Use Cases</h3>
              <CreateUseCaseDialog projectId={project.id} />
            </div>
            <div className="grid gap-4">
              {useCases?.map((useCase) => (
                <Card key={useCase.id} data-testid={`card-usecase-${useCase.id}`}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{useCase.name}</span>
                        <Badge variant={
                          useCase.status === 'implemented' ? 'default' : 
                          useCase.status === 'approved' ? 'secondary' : 'outline'
                        } className="text-[10px] uppercase">
                          {useCase.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {useCase.id}
                      </div>
                      {useCase.problemStatement && (
                        <p className="text-sm text-muted-foreground mt-2">{useCase.problemStatement}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </CardContent>
                </Card>
              ))}
              {useCases?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  No use cases defined yet.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tasks">
             <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Tasks</h3>
              <CreateTaskDialog projectId={project.id} />
            </div>
            <div className="space-y-4">
              {tasks?.map((task) => (
                <Card key={task.id} className="flex items-center p-4 gap-4" data-testid={`card-task-${task.id}`}>
                  <div 
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors",
                      task.status === 'done' ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 hover:border-primary"
                    )}
                    onClick={() => updateTaskMutation.mutate({ 
                      taskId: task.id, 
                      data: { status: task.status === 'done' ? 'todo' : 'done' }
                    })}
                    data-testid={`checkbox-task-${task.id}`}
                  >
                    {task.status === 'done' && <CheckSquare className="w-3 h-3" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className={cn("font-medium text-sm", task.status === 'done' && "line-through text-muted-foreground")}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge variant="outline" className="text-[10px] h-5 px-1 font-mono text-muted-foreground">
                         {task.id}
                       </Badge>
                       <Badge variant="secondary" className="text-[10px] h-5 px-1">
                         {task.priority}
                       </Badge>
                       {task.owner && (
                         <span className="text-xs text-muted-foreground flex items-center gap-1">
                           <span className="w-4 h-4 bg-muted rounded-full flex items-center justify-center text-[8px]">
                             {task.owner[0]}
                           </span>
                           {task.owner}
                         </span>
                       )}
                       {task.useCaseId && (
                         <span className="text-xs text-muted-foreground ml-2">
                           Linked to {useCases?.find(u => u.id === task.useCaseId)?.name}
                         </span>
                       )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateTaskMutation.mutate({ taskId: task.id, data: { status: 'todo' } })}>
                        Mark To Do
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateTaskMutation.mutate({ taskId: task.id, data: { status: 'in-progress' } })}>
                        Mark In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateTaskMutation.mutate({ taskId: task.id, data: { status: 'review' } })}>
                        Mark Review
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateTaskMutation.mutate({ taskId: task.id, data: { status: 'done' } })}>
                        Mark Done
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              ))}
               {tasks?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  No tasks created yet.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
