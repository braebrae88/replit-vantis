import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import MissionControl from "@/pages/MissionControl";
import Timesheet from "@/pages/Timesheet";
import Proposals from "@/pages/Proposals";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MissionControl} />
      <Route path="/mission-control" component={MissionControl} />
      <Route path="/project/:id" component={MissionControl} />
      <Route path="/timesheet" component={Timesheet} />
      <Route path="/proposals" component={Proposals} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
