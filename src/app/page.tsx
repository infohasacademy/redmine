"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import {
  DashboardStats,
  ProjectProgressCard,
  TicketSummaryCard,
  PriorityIssuesCard,
} from "@/components/dashboard/stats-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import {
  ProductivityChart,
  SprintBurndownChart,
  ProjectDistributionChart,
  TeamPerformanceChart,
} from "@/components/dashboard/charts";
import { KanbanBoard } from "@/components/tickets/kanban-board";
import { GanttChart } from "@/components/gantt/gantt-chart";
import { CalendarView } from "@/components/calendar/calendar-view";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ProjectList } from "@/components/projects/project-list";
import { useAppStore } from "@/store/app-store";

function DashboardView() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <DashboardStats />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6">
          <TicketSummaryCard />
          <PriorityIssuesCard />
          <ProjectDistributionChart />
        </div>

        {/* Center column */}
        <div className="lg:col-span-2 space-y-6">
          <ProductivityChart />
          <div className="grid gap-6 md:grid-cols-2">
            <ProjectProgressCard />
            <TeamPerformanceChart />
          </div>
        </div>
      </div>

      {/* Activity and Projects */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed />
        <ProjectList />
      </div>
    </div>
  );
}

function ProjectsView() {
  return (
    <div className="space-y-6">
      <ProjectList />
    </div>
  );
}

function KanbanView() {
  return <KanbanBoard />;
}

function GanttView() {
  return <GanttChart />;
}

function CalendarViewWrapper() {
  return <CalendarView />;
}

function ChatView() {
  return <ChatPanel />;
}

function SettingsView() {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Organization Settings</h2>
        <p className="text-muted-foreground">
          Configure your organization settings, manage team members, and customize your workspace.
        </p>
      </div>
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Billing & Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription plan, view invoices, and update payment methods.
        </p>
      </div>
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Integrations</h2>
        <p className="text-muted-foreground">
          Connect third-party services and configure webhooks for your organization.
        </p>
      </div>
    </div>
  );
}

function MainContent() {
  const { activeView } = useAppStore();

  switch (activeView) {
    case "dashboard":
      return <DashboardView />;
    case "projects":
      return <ProjectsView />;
    case "kanban":
      return <KanbanView />;
    case "gantt":
      return <GanttView />;
    case "calendar":
      return <CalendarViewWrapper />;
    case "chat":
      return <ChatView />;
    case "settings":
      return <SettingsView />;
    default:
      return <DashboardView />;
  }
}

export default function Home() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Header />
        <main
          className={cn(
            "pt-16 min-h-screen transition-all duration-300",
            "pl-64" // Default to sidebar open
          )}
          style={{
            paddingLeft: "var(--sidebar-width, 256px)",
          }}
        >
          <div className="p-6">
            <MainContent />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
