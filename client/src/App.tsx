import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/protected-route";
import Dashboard from "@/pages/dashboard";
import Exercises from "@/pages/exercises";
import ExerciseDetail from "@/pages/exercise-detail";
import Tracking from "@/pages/tracking";
import Education from "@/pages/education";
import Profile from "@/pages/profile";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function AppContent() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Login} />

      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/exercises">
        <ProtectedRoute>
          <Exercises />
        </ProtectedRoute>
      </Route>
      <Route path="/exercise/:id">
        <ProtectedRoute>
          <ExerciseDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/tracking">
        <ProtectedRoute>
          <Tracking />
        </ProtectedRoute>
      </Route>
      <Route path="/education">
        <ProtectedRoute>
          <Education />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground font-roboto">
          <Toaster />
          <AppContent />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
