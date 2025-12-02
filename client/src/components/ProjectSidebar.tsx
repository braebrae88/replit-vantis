import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { api, SidebarCurrentItem, SidebarProspectiveItem } from "@/lib/api";
import { Folder, Plus, Building2, ChevronDown, ChevronRight, FileText, Lightbulb } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

function QuickProposalDialog({ 
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
    mutationFn: (data: { title: string; clientName: string; rawText?: string }) => 
      api.proposals.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sidebar-items"] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      onOpenChange(false);
      setClientName("");
      setTitle("");
      toast({
        title: "Proposal Created",
        description: "New proposal has been added to your pipeline.",
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
      title: title,
      clientName: clientName,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Proposal</DialogTitle>
          <DialogDescription>
            Add a new proposal to track in your pipeline.
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
              data-testid="input-proposal-client"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Proposal Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AI Readiness Assessment"
              data-testid="input-proposal-title"
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
            data-testid="button-create-proposal"
          >
            {createMutation.isPending ? "Creating..." : "Create Proposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CurrentItem({ item, isSelected }: { item: SidebarCurrentItem; isSelected: boolean }) {
  return (
    <Link href={`/project/${item.id}`}>
      <div
        className={cn(
          "p-2.5 rounded-lg cursor-pointer transition-all group",
          isSelected
            ? "bg-primary/10 border border-primary/20"
            : "hover:bg-muted/50 border border-transparent"
        )}
        data-testid={`sidebar-project-${item.id}`}
      >
        <div className="flex items-start gap-2.5">
          <div className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
            isSelected ? "bg-primary/20" : "bg-muted"
          )}>
            <Folder className={cn(
              "w-3.5 h-3.5",
              isSelected ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-medium text-sm truncate leading-tight",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {item.title}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProspectiveItem({ item, isSelected }: { item: SidebarProspectiveItem; isSelected: boolean }) {
  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-500/10 text-gray-500",
    IN_REVIEW: "bg-yellow-500/10 text-yellow-600",
    SIGNED: "bg-green-500/10 text-green-600",
  };

  return (
    <Link href={`/proposals/${item.id}`}>
      <div
        className={cn(
          "p-2.5 rounded-lg cursor-pointer transition-all group",
          isSelected
            ? "bg-primary/10 border border-primary/20"
            : "hover:bg-muted/50 border border-transparent"
        )}
        data-testid={`sidebar-proposal-${item.id}`}
      >
        <div className="flex items-start gap-2.5">
          <div className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
            isSelected ? "bg-primary/20" : "bg-muted"
          )}>
            <FileText className={cn(
              "w-3.5 h-3.5",
              isSelected ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-medium text-sm truncate leading-tight",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {item.title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {item.clientName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{item.clientName}</span>
                </div>
              )}
              <Badge 
                variant="secondary" 
                className={cn("text-[10px] px-1 py-0 h-4", statusColors[item.status] || "")}
              >
                {item.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface CurrentSectionProps {
  items: SidebarCurrentItem[];
  selectedId?: string;
  defaultOpen?: boolean;
}

function CurrentSection({ items, selectedId, defaultOpen = true }: CurrentSectionProps) {
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
          Current
          <span className="text-[10px] font-normal ml-1">({items.length})</span>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="space-y-0.5 px-1">
          {items.length > 0 ? (
            items.map((item) => (
              <CurrentItem
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground px-2 py-2">
              No active projects
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface ProspectiveSectionProps {
  items: SidebarProspectiveItem[];
  selectedId?: string;
  defaultOpen?: boolean;
  onAddClick?: () => void;
}

function ProspectiveSection({ items, selectedId, defaultOpen = true, onAddClick }: ProspectiveSectionProps) {
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
          Prospective
          <span className="text-[10px] font-normal ml-1">({items.length})</span>
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
            data-testid="button-add-proposal"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      <CollapsibleContent>
        <div className="space-y-0.5 px-1">
          {items.length > 0 ? (
            items.map((item) => (
              <ProspectiveItem
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground px-2 py-2">
              No proposals yet
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProjectSidebar() {
  const params = useParams();
  const [location] = useLocation();
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const { data: sidebarData, isLoading } = useQuery({
    queryKey: ["sidebar-items"],
    queryFn: api.sidebar.getItems,
  });

  const { data: pendingSuggestions } = useQuery({
    queryKey: ["opportunity-suggestions", "PENDING"],
    queryFn: () => api.opportunitySuggestions.list("PENDING"),
  });

  const selectedProjectId = location.startsWith("/project/") ? params.id : undefined;
  const selectedProposalId = location.startsWith("/proposals/") ? params.id : undefined;
  const isSuggestionsPage = location === "/suggestions";
  const pendingCount = pendingSuggestions?.length ?? 0;

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
          <Link href="/suggestions">
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
                isSuggestionsPage
                  ? "bg-amber-500/10 border border-amber-500/20"
                  : "hover:bg-muted/50 border border-transparent"
              )}
              data-testid="sidebar-suggestions"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className={cn(
                  "w-4 h-4",
                  isSuggestionsPage ? "text-amber-600" : "text-amber-500"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  isSuggestionsPage ? "text-amber-700" : "text-foreground"
                )}>
                  Suggestions
                </span>
              </div>
              {pendingCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="bg-amber-500/20 text-amber-700 text-[10px] px-1.5 py-0 h-5"
                >
                  {pendingCount}
                </Badge>
              )}
            </div>
          </Link>

          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-3 rounded-lg">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : (
            <>
              <CurrentSection
                items={sidebarData?.current ?? []}
                selectedId={selectedProjectId}
                defaultOpen={true}
              />
              <ProspectiveSection
                items={sidebarData?.prospective ?? []}
                selectedId={selectedProposalId}
                defaultOpen={true}
                onAddClick={() => setShowQuickCreate(true)}
              />
            </>
          )}
        </div>
      </ScrollArea>

      <QuickProposalDialog 
        open={showQuickCreate} 
        onOpenChange={setShowQuickCreate} 
      />
    </div>
  );
}
