import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Calendar, CheckCircle2, Clock, Folder } from "lucide-react";
import Layout from "@/components/Layout";
import { api } from "@/lib/mockApi";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: api.projects.list,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: api.events.list,
  });

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of all active missions and recent activity.
            </p>
          </div>
          <CreateProjectDialog />
        </div>

        {/* Projects Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Folder className="w-5 h-5 text-muted-foreground" />
              Active Projects
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="h-48">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              projects?.map((project) => (
                <Link key={project.id} href={`/project/${project.id}`}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-primary" />
                    </div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant={project.status === "active" ? "default" : "secondary"} className="mb-2 uppercase text-[10px] tracking-wider">
                          {project.status}
                        </Badge>
                      </div>
                      <CardTitle className="font-bold text-xl group-hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs text-muted-foreground">
                        {project.id}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Created {format(new Date(project.createdAt), "MMM d, yyyy")}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              Upcoming Events
            </h2>
            <Card>
              <CardContent className="p-0">
                {eventsLoading ? (
                   <div className="p-6 space-y-4">
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                   </div>
                ) : (
                  <div className="divide-y divide-border">
                    {events?.slice(0, 5).map((event) => (
                      <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                        <div className="w-12 h-12 rounded-lg bg-muted flex flex-col items-center justify-center text-xs font-medium border border-border">
                          <span className="uppercase text-[10px] text-muted-foreground">
                            {format(new Date(event.date), "MMM")}
                          </span>
                          <span className="text-lg font-bold">
                            {format(new Date(event.date), "d")}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{event.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase">
                              {event.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {event.id}
                            </span>
                          </div>
                        </div>
                        {event.projectId && (
                           <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] font-mono">
                             {projects?.find(p => p.id === event.projectId)?.name || event.projectId}
                           </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
              Quick Stats
            </h2>
            <div className="space-y-4">
               <Card>
                 <CardContent className="p-6">
                   <p className="text-sm text-muted-foreground font-medium">Total Projects</p>
                   <p className="text-3xl font-bold mt-2">{projects?.length || 0}</p>
                 </CardContent>
               </Card>
               <Card>
                 <CardContent className="p-6">
                   <p className="text-sm text-muted-foreground font-medium">Pending Events</p>
                   <p className="text-3xl font-bold mt-2">{events?.length || 0}</p>
                 </CardContent>
               </Card>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
