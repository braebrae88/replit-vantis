import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UseCase } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  problemStatement: z.string().optional(),
  valueHypothesis: z.string().optional(),
  status: z.enum(["draft", "approved", "implemented"]),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateUseCaseDialogProps {
  projectId: string;
  useCase?: UseCase;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateUseCaseDialog({ projectId, useCase, trigger, onSuccess }: CreateUseCaseDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!useCase;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: useCase?.name || "",
      problemStatement: useCase?.problemStatement || "",
      valueHypothesis: useCase?.valueHypothesis || "",
      status: useCase?.status || "draft",
    },
  });

  useEffect(() => {
    if (useCase) {
      form.reset({
        name: useCase.name,
        problemStatement: useCase.problemStatement || "",
        valueHypothesis: useCase.valueHypothesis || "",
        status: useCase.status,
      });
    }
  }, [useCase, form]);

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.useCases.create({ ...values, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["useCases", projectId] });
      setOpen(false);
      form.reset();
      toast({
        title: "Use Case created",
        description: "New use case has been added.",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create use case",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormValues> }) =>
      api.useCases.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["useCases", projectId] });
      setOpen(false);
      toast({
        title: "Use Case updated",
        description: "The use case has been updated.",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update use case",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: FormValues) {
    if (isEditMode && useCase) {
      updateMutation.mutate({ id: useCase.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-2" data-testid="button-add-usecase">
            <Plus className="w-4 h-4" /> Add Use Case
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Use Case" : "New Use Case"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update use case details." : "Define a new functional requirement."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Use Case Name</FormLabel>
                  <FormControl>
                    <Input placeholder="User Login Flow" {...field} data-testid="input-usecase-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="problemStatement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Statement (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What problem does this solve?"
                      className="resize-none"
                      rows={2}
                      {...field}
                      data-testid="input-usecase-problem"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valueHypothesis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value Hypothesis (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What value does this deliver?"
                      className="resize-none"
                      rows={2}
                      {...field}
                      data-testid="input-usecase-value"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-usecase-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="implemented">Implemented</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending} data-testid="button-submit-usecase">
                {isPending ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Use Case" : "Create Use Case")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
