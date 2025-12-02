import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { api } from "@/lib/api";
import { Folder, Plus, Building2, ChevronDown, ChevronRight, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CreateProjectDialog } from "./CreateProjectDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@shared/schema";

function QuickProspectiveDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { name: string; clientName: string; description: string; status: "ACTIVE" | "PROSPECTIVE" }) => 
      api.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
      setClientName("");
      setTitle("");
      toast({
        title: "Opportunity Created",
        description: "New prospective opportunity has been added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create opportunity",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!clientName.trim() || !title.trim()) {
      toast({
        title: "Validation Error",
        description: "Client name and title are required",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      name: title,
      clientName: clientName,
      description: `Prospective opportunity: ${title}`,
      status: "PROSPECTIVE",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Prospective Opportunity</DialogTitle>
          <DialogDescription>
            Add a new opportunity to track in your pipeline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., Ontario Health"
              data-testid="input-prospective-client"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Opportunity Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AI Readiness Assessment"
              data-testid="input-prospective-title"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createMutation.isPending}
            data-testid="button-create-prospective"
          >
            {createMutation.isPending ? "Creating..." : "Create Opportunity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ProjectItemProps {
  project: Project;
  isSelected: boolean;
  isProspective?: boolean;
}

function ProjectItem({ project, isSelected, isProspective }: ProjectItemProps) {
  const href = isProspective 
    ? `/projects/${project.id}` 
    : `/projects/${project.id}`;

  return (
    <Link href={href}>
      <div
        className={cn(
          "p-2.5 rounded-lg cursor-pointer transition-all group",
          isSelected
            ? "bg-primary/10 border border-primary/20"
            : "hover:bg-muted/50 border border-transparent"
        )}
        data-testid={`sidebar-project-${project.id}`}
      >
        <div className="flex items-start gap-2.5">
          <div className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
            isSelected ? "bg-primary/20" : "bg-muted"
          )}>
            {isProspective ? (
              <Briefcase className={cn(
                "w-3.5 h-3.5",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
            ) : (
              <Folder className={cn(
                "w-3.5 h-3.5",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-medium text-sm truncate leading-tight",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {project.name}
            </p>
            {project.clientName && (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{project.clientName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

interface SectionProps {
  title: string;
  projects: Project[];
  selectedProjectId?: string;
  defaultOpen?: boolean;
  isProspective?: boolean;
  onAddClick?: () => void;
}

function Section({ title, projects, selectedProjectId, defaultOpen = true, isProspective, onAddClick }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between px-2 py-1.5">
        <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          {title}
          <span className="text-[10px] font-normal ml-1">({projects.length})</span>
        </CollapsibleTrigger>
        {onAddClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onAddClick();
            }}
            data-testid="button-add-prospective"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      <CollapsibleContent>
        <div className="space-y-0.5 px-1">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                isSelected={selectedProjectId === project.id}
                isProspective={isProspective}
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground px-2 py-2">
              {isProspective ? "No opportunities yet" : "No active projects"}
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProjectSidebar() {
  const params = useParams();
  const selectedProjectId = params.id;
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: api.projects.list,
  });

  const activeProjects = projects?.filter(p => p.status === "ACTIVE" || !p.status) ?? [];
  const prospectiveProjects = projects?.filter(p => p.status === "PROSPECTIVE") ?? [];

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Projects</h2>
          <CreateProjectDialog />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-3 rounded-lg">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : (
            <>
              <Section
                title="Current"
                projects={activeProjects}
                selectedProjectId={selectedProjectId}
                defaultOpen={true}
              />
              <Section
                title="Prospective"
                projects={prospectiveProjects}
                selectedProjectId={selectedProjectId}
                defaultOpen={true}
                isProspective={true}
                onAddClick={() => setShowQuickCreate(true)}
              />
            </>
          )}
        </div>
      </ScrollArea>

      <QuickProspectiveDialog 
        open={showQuickCreate} 
        onOpenChange={setShowQuickCreate} 
      />
    </div>
  );
}
