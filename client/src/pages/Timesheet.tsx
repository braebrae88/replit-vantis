import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TimesheetResponse, TimesheetEntry, TimesheetHours } from "@shared/schema";
import { format, startOfWeek, endOfWeek, subWeeks, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  Copy,
  Check,
  Loader2,
  FileSpreadsheet,
  Users,
  Brain,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface EditableEntry extends TimesheetEntry {
  editedHours: TimesheetHours;
}

export default function Timesheet() {
  const [fromDate, setFromDate] = useState(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(start, "yyyy-MM-dd");
  });
  const [toDate, setToDate] = useState(() => {
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return format(end, "yyyy-MM-dd");
  });
  const [entries, setEntries] = useState<EditableEntry[]>([]);
  const [totalHours, setTotalHours] = useState<TimesheetHours | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: () => api.timesheet.generate(fromDate, toDate),
    onSuccess: (data: TimesheetResponse) => {
      const editableEntries = data.entries.map((entry) => ({
        ...entry,
        editedHours: { ...entry.hours },
      }));
      setEntries(editableEntries);
      setTotalHours(data.totalHours);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate timesheet",
        variant: "destructive",
      });
    },
  });

  const handleHoursChange = (projectId: string, category: keyof TimesheetHours, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEntries((prev) =>
      prev.map((entry) =>
        entry.projectId === projectId
          ? {
              ...entry,
              editedHours: {
                ...entry.editedHours,
                [category]: Math.max(0, numValue),
              },
            }
          : entry
      )
    );
  };

  const calculateEditedTotals = (): TimesheetHours => {
    return entries.reduce(
      (acc, entry) => ({
        clientMeetings: Math.round((acc.clientMeetings + entry.editedHours.clientMeetings) * 10) / 10,
        internalPlanning: Math.round((acc.internalPlanning + entry.editedHours.internalPlanning) * 10) / 10,
        researchAndDrafting: Math.round((acc.researchAndDrafting + entry.editedHours.researchAndDrafting) * 10) / 10,
        admin: Math.round((acc.admin + entry.editedHours.admin) * 10) / 10,
      }),
      { clientMeetings: 0, internalPlanning: 0, researchAndDrafting: 0, admin: 0 }
    );
  };

  const getGrandTotal = (hours: TimesheetHours) => {
    return Math.round((hours.clientMeetings + hours.internalPlanning + hours.researchAndDrafting + hours.admin) * 10) / 10;
  };

  const getEntryTotal = (hours: TimesheetHours) => {
    return Math.round((hours.clientMeetings + hours.internalPlanning + hours.researchAndDrafting + hours.admin) * 10) / 10;
  };

  const goToPreviousWeek = () => {
    const prevStart = subWeeks(new Date(fromDate), 1);
    const prevEnd = addDays(prevStart, 6);
    setFromDate(format(prevStart, "yyyy-MM-dd"));
    setToDate(format(prevEnd, "yyyy-MM-dd"));
  };

  const goToNextWeek = () => {
    const nextStart = addDays(new Date(fromDate), 7);
    const nextEnd = addDays(nextStart, 6);
    setFromDate(format(nextStart, "yyyy-MM-dd"));
    setToDate(format(nextEnd, "yyyy-MM-dd"));
  };

  const goToCurrentWeek = () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    setFromDate(format(start, "yyyy-MM-dd"));
    setToDate(format(end, "yyyy-MM-dd"));
  };

  const formatForExport = () => {
    const editedTotals = calculateEditedTotals();
    const lines = [
      `Timesheet: ${format(new Date(fromDate), "MMM d")} - ${format(new Date(toDate), "MMM d, yyyy")}`,
      "",
      "Project\tClient Meetings\tInternal Planning\tResearch & Drafting\tAdmin\tTotal",
      ...entries.map(
        (e) =>
          `${e.projectName}\t${e.editedHours.clientMeetings}\t${e.editedHours.internalPlanning}\t${e.editedHours.researchAndDrafting}\t${e.editedHours.admin}\t${getEntryTotal(e.editedHours)}`
      ),
      "",
      `TOTAL\t${editedTotals.clientMeetings}\t${editedTotals.internalPlanning}\t${editedTotals.researchAndDrafting}\t${editedTotals.admin}\t${getGrandTotal(editedTotals)}`,
    ];
    return lines.join("\n");
  };

  const copyToClipboard = async () => {
    if (entries.length === 0) {
      toast({
        title: "No data available",
        description: "Please generate a timesheet first",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = formatForExport();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Timesheet copied in tab-separated format for easy pasting",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please try selecting and copying manually.",
        variant: "destructive",
      });
    }
  };

  const editedTotals = entries.length > 0 ? calculateEditedTotals() : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold">Timesheet Draft</h1>
                <p className="text-sm text-muted-foreground">
                  Estimate hours based on project activity
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <a href="/" data-testid="link-back-dashboard">
                Back to Dashboard
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Select Date Range
            </CardTitle>
            <CardDescription>
              Choose the period for your timesheet draft
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousWeek}
                  data-testid="button-prev-week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-40"
                    data-testid="input-from-date"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-40"
                    data-testid="input-to-date"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextWeek}
                  data-testid="button-next-week"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={goToCurrentWeek} data-testid="button-current-week">
                This Week
              </Button>
              <div className="flex-1" />
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                data-testid="button-generate-timesheet"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Generate Draft
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {entries.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Timesheet
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(fromDate), "MMM d")} - {format(new Date(toDate), "MMM d, yyyy")}
                    <span className="ml-2 text-xs">
                      (Hours are editable - click to modify)
                    </span>
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  data-testid="button-copy-timesheet"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy for Export
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[250px]">Project</TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-xs">Client Meetings</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <span className="text-xs">Internal Planning</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-xs">Research & Drafting</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Settings className="w-4 h-4 text-orange-600" />
                          <span className="text-xs">Admin</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-semibold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.projectId} data-testid={`timesheet-row-${entry.projectId}`}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{entry.projectName}</span>
                            <div className="flex gap-2 mt-1">
                              {entry.breakdown.meetingCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {entry.breakdown.meetingCount} meetings
                                </Badge>
                              )}
                              {entry.breakdown.taskCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {entry.breakdown.taskCount} tasks
                                </Badge>
                              )}
                              {entry.breakdown.fileCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {entry.breakdown.fileCount} files
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={entry.editedHours.clientMeetings}
                            onChange={(e) =>
                              handleHoursChange(entry.projectId, "clientMeetings", e.target.value)
                            }
                            className="w-20 text-center mx-auto"
                            data-testid={`input-hours-clientMeetings-${entry.projectId}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={entry.editedHours.internalPlanning}
                            onChange={(e) =>
                              handleHoursChange(entry.projectId, "internalPlanning", e.target.value)
                            }
                            className="w-20 text-center mx-auto"
                            data-testid={`input-hours-internalPlanning-${entry.projectId}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={entry.editedHours.researchAndDrafting}
                            onChange={(e) =>
                              handleHoursChange(entry.projectId, "researchAndDrafting", e.target.value)
                            }
                            className="w-20 text-center mx-auto"
                            data-testid={`input-hours-researchAndDrafting-${entry.projectId}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={entry.editedHours.admin}
                            onChange={(e) =>
                              handleHoursChange(entry.projectId, "admin", e.target.value)
                            }
                            className="w-20 text-center mx-auto"
                            data-testid={`input-hours-admin-${entry.projectId}`}
                          />
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {getEntryTotal(entry.editedHours)}h
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {editedTotals && (
                    <TableFooter>
                      <TableRow className="bg-muted/70">
                        <TableCell className="font-semibold">TOTAL</TableCell>
                        <TableCell className="text-center font-medium">
                          {editedTotals.clientMeetings}h
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {editedTotals.internalPlanning}h
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {editedTotals.researchAndDrafting}h
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {editedTotals.admin}h
                        </TableCell>
                        <TableCell className="text-center font-bold text-primary">
                          {getGrandTotal(editedTotals)}h
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>

              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Estimation Logic</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-blue-600" />
                    <span>Meetings: Actual duration or 1h default</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-3 h-3 text-purple-600" />
                    <span>Planning: 15min per task</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-green-600" />
                    <span>Research: 30min per file</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-3 h-3 text-orange-600" />
                    <span>Admin: 15min/meeting + 6min/task</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {entries.length === 0 && !mutation.isPending && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Timesheet Generated</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Select a date range and click "Generate Draft" to create a timesheet estimate based on your project activity.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
