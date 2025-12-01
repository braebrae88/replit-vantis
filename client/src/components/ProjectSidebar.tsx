import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { api } from "@/lib/api";
import { Folder, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CreateProjectDialog } from "./CreateProjectDialog";

export function ProjectSidebar() {
  const params = useParams();
  const selectedProjectId = params.id;

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: api.projects.list,
  });

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Projects</h2>
          <CreateProjectDialog />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-3 rounded-lg">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : projects && projects.length > 0 ? (
            projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <div
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all group",
                    selectedProjectId === project.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50 border border-transparent"
                  )}
                  data-testid={`sidebar-project-${project.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                      selectedProjectId === project.id ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Folder className={cn(
                        "w-4 h-4",
                        selectedProjectId === project.id ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm truncate",
                        selectedProjectId === project.id ? "text-primary" : "text-foreground"
                      )}>
                        {project.name}
                      </p>
                      {project.clientName && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{project.clientName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No projects yet.
              <br />
              Create your first project!
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
