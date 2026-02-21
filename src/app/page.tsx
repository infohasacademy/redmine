"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  GanttChart,
  Calendar,
  MessageSquare,
  Settings,
  Users,
  ChevronDown,
  Plus,
  Search,
  Bell,
  Moon,
  Sun,
  Shield,
  LogOut,
  User,
  Mail,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Menu,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/app-store";

interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  color?: string;
  progress: number;
  members: number;
  tickets: number;
}

interface Ticket {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  assignee?: { name: string } | null;
}

function DashboardContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { theme, setTheme, sidebarOpen, setSidebarOpen, activeView, setActiveView } = useAppStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTickets: 0,
    completedTickets: 0,
    pendingTickets: 0,
  });

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch real data
  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      // Fetch projects
      const projectsRes = await fetch("/api/projects?organizationId=default");
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }

      // Fetch tickets
      const ticketsRes = await fetch("/api/tickets");
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData.tickets || []);
        setStats((prev) => ({
          ...prev,
          totalTickets: ticketsData.tickets?.length || 0,
          completedTickets: ticketsData.tickets?.filter((t: Ticket) => t.status === "DONE").length || 0,
          pendingTickets: ticketsData.tickets?.filter((t: Ticket) => t.status !== "DONE").length || 0,
        }));
      }

      setStats((prev) => ({
        ...prev,
        totalProjects: projects.length,
      }));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "kanban", label: "Kanban Board", icon: Kanban },
    { id: "gantt", label: "Gantt Chart", icon: GanttChart },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "chat", label: "Team Chat", icon: MessageSquare },
    { id: "email", label: "Email", icon: Mail },
  ];

  const adminNavItems = [
    { id: "admin", label: "Admin Panel", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-card border-r transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">Synchro PM</span>
              </div>
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
                <FolderKanban className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as any)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                    activeView === item.id && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              ))}

              {isAdmin && (
                <>
                  <div className="my-4 border-t" />
                  {adminNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === "admin") {
                          router.push("/admin");
                        } else if (item.id === "settings") {
                          router.push("/profile");
                        }
                      }}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent"
                    >
                      <item.icon className="h-4 w-4" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </button>
                  ))}
                </>
              )}
            </nav>
          </ScrollArea>

          {/* Theme toggle */}
          <div className="border-t p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {sidebarOpen && <span className="ml-2">{theme === "dark" ? "Light" : "Dark"} Mode</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold capitalize">{activeView}</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {session.user.name?.split(" ")[0] || "User"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {session.user.role}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback>
                        {session.user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{session.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {session.user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => router.push("/admin")}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="text-red-500"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projects.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTickets}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completedTickets}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingTickets}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Projects Section */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No projects yet. Create your first project to get started.</p>
                      <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Project
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {projects.slice(0, 6).map((project) => (
                        <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="h-3 w-3 rounded"
                                style={{ backgroundColor: project.color || "#3B82F6" }}
                              />
                              <span className="font-medium">{project.name}</span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {project.key}
                              </span>
                            </div>
                            <Progress value={project.progress} className="h-2 mb-2" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{project.progress}% complete</span>
                              <span>{project.tickets} tickets</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Tickets */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  {tickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tickets yet. Create your first ticket to get started.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {tickets.slice(0, 10).map((ticket) => (
                          <div
                            key={ticket.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-muted-foreground">
                                {ticket.key}
                              </span>
                              <span className="font-medium">{ticket.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  ticket.priority === "HIGH"
                                    ? "border-red-500 text-red-500"
                                    : ticket.priority === "MEDIUM"
                                    ? "border-yellow-500 text-yellow-500"
                                    : "border-green-500 text-green-500"
                                }
                              >
                                {ticket.priority}
                              </Badge>
                              <Badge variant="secondary">{ticket.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DashboardContent />
    </ThemeProvider>
  );
}
