"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  Calendar,
  MessageSquare,
  Settings,
  Users,
  Plus,
  Search,
  Bell,
  Moon,
  Sun,
  Shield,
  LogOut,
  User,
  Mail,
  RefreshCw,
  Menu,
  X,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  GripVertical,
  GraduationCap,
  BookOpen,
  UserCog,
  UserPlus,
  ClipboardList,
  FileText,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  color?: string;
  progress: number;
  _count?: { tickets: number; members: number };
}

interface Ticket {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  description?: string;
  assignee?: { name: string } | null;
  projectId: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeId?: string;
  qualification?: string;
  specialization?: string;
  joinDate?: string;
  isActive: boolean;
  classes?: { id: string; name: string; code?: string }[];
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  studentId?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive: boolean;
  enrollments?: { class: { id: string; name: string; code?: string } }[];
}

interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  _count?: { classes: number };
}

interface Class {
  id: string;
  name: string;
  code?: string;
  description?: string;
  capacity: number;
  room?: string;
  schedule?: string;
  teacher?: { id: string; firstName: string; lastName: string } | null;
  session?: { id: string; name: string } | null;
  _count?: { enrollments: number };
}

interface Grade {
  id: string;
  title: string;
  type: string;
  maxScore: number;
  score: number;
  percentage?: number;
  letterGrade?: string;
  date?: string;
  comments?: string;
  student: { id: string; firstName: string; lastName: string; studentId?: string };
  class: { id: string; name: string; code?: string };
  session: { id: string; name: string };
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  notes?: string;
  student: { id: string; firstName: string; lastName: string; studentId?: string };
  class: { id: string; name: string; code?: string };
  session: { id: string; name: string };
}

function DashboardContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [theme, setTheme] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");

  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Education states
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [activeEducationTab, setActiveEducationTab] = useState("teachers");

  // Dialog states
  const [projectDialog, setProjectDialog] = useState(false);
  const [ticketDialog, setTicketDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [teacherDialog, setTeacherDialog] = useState(false);
  const [studentDialog, setStudentDialog] = useState(false);
  const [sessionDialog, setSessionDialog] = useState(false);
  const [classDialog, setClassDialog] = useState(false);
  const [gradeDialog, setGradeDialog] = useState(false);
  const [attendanceDialog, setAttendanceDialog] = useState(false);

  // Form states
  const [projectForm, setProjectForm] = useState({ name: "", key: "", description: "", color: "#3B82F6" });
  const [ticketForm, setTicketForm] = useState({ title: "", description: "", priority: "MEDIUM", projectId: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  // Education form states
  const [teacherForm, setTeacherForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", employeeId: "",
    qualification: "", specialization: "", joinDate: ""
  });
  const [studentForm, setStudentForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", studentId: "",
    dateOfBirth: "", gender: "", address: "", enrollDate: ""
  });
  const [sessionForm, setSessionForm] = useState({
    name: "", startDate: "", endDate: "", isActive: false
  });
  const [classForm, setClassForm] = useState({
    name: "", code: "", description: "", sessionId: "", teacherId: "",
    capacity: 30, room: "", schedule: ""
  });
  const [gradeForm, setGradeForm] = useState({
    classId: "", studentId: "", sessionId: "", type: "ASSIGNMENT",
    title: "", description: "", maxScore: 100, score: 0, date: "", comments: ""
  });
  const [attendanceForm, setAttendanceForm] = useState({
    classId: "", studentId: "", sessionId: "", date: "", status: "PRESENT", notes: ""
  });

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

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);

      // Fetch projects
      const projectsRes = await fetch("/api/projects");
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
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  // Fetch education data
  const fetchEducationData = useCallback(async () => {
    if (!session?.user) return;

    try {
      const [teachersRes, studentsRes, sessionsRes, classesRes, gradesRes, attendanceRes] = await Promise.all([
        fetch("/api/education/teachers"),
        fetch("/api/education/students"),
        fetch("/api/education/sessions"),
        fetch("/api/education/classes"),
        fetch("/api/education/grades"),
        fetch("/api/education/attendance"),
      ]);

      if (teachersRes.ok) {
        const data = await teachersRes.json();
        setTeachers(data.teachers || []);
      }
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data.students || []);
      }
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }
      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.classes || []);
      }
      if (gradesRes.ok) {
        const data = await gradesRes.json();
        setGrades(data.grades || []);
      }
      if (attendanceRes.ok) {
        const data = await attendanceRes.json();
        setAttendance(data.attendance || []);
      }
    } catch (error) {
      console.error("Failed to fetch education data:", error);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
      fetchEducationData();
    }
  }, [session, fetchData, fetchEducationData]);

  // Create project
  const handleCreateProject = async () => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectForm),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Project created successfully" });
        setProjectDialog(false);
        setProjectForm({ name: "", key: "", description: "", color: "#3B82F6" });
        fetchData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to create project", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    }
  };

  // Create ticket
  const handleCreateTicket = async () => {
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketForm),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Ticket created successfully" });
        setTicketDialog(false);
        setTicketForm({ title: "", description: "", priority: "MEDIUM", projectId: "" });
        fetchData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to create ticket", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create ticket", variant: "destructive" });
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const endpoint = deleteTarget.type === "project"
        ? `/api/projects/${deleteTarget.id}`
        : deleteTarget.type === "ticket"
        ? `/api/tickets/${deleteTarget.id}`
        : deleteTarget.type === "teacher"
        ? `/api/education/teachers?id=${deleteTarget.id}`
        : deleteTarget.type === "student"
        ? `/api/education/students?id=${deleteTarget.id}`
        : deleteTarget.type === "session"
        ? `/api/education/sessions?id=${deleteTarget.id}`
        : deleteTarget.type === "class"
        ? `/api/education/classes?id=${deleteTarget.id}`
        : deleteTarget.type === "grade"
        ? `/api/education/grades?id=${deleteTarget.id}`
        : `/api/education/attendance?id=${deleteTarget.id}`;

      const res = await fetch(endpoint, { method: "DELETE" });

      if (res.ok) {
        toast({ title: "Success", description: `${deleteTarget.type} deleted successfully` });
        setDeleteDialog(false);
        setDeleteTarget(null);
        fetchData();
        fetchEducationData();
      } else {
        toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  // Education CRUD handlers
  const handleCreateTeacher = async () => {
    try {
      const res = await fetch("/api/education/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherForm),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Teacher created successfully" });
        setTeacherDialog(false);
        setTeacherForm({ firstName: "", lastName: "", email: "", phone: "", employeeId: "", qualification: "", specialization: "", joinDate: "" });
        fetchEducationData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to create teacher", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create teacher", variant: "destructive" });
    }
  };

  const handleCreateStudent = async () => {
    try {
      const res = await fetch("/api/education/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Student created successfully" });
        setStudentDialog(false);
        setStudentForm({ firstName: "", lastName: "", email: "", phone: "", studentId: "", dateOfBirth: "", gender: "", address: "", enrollDate: "" });
        fetchEducationData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to create student", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create student", variant: "destructive" });
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await fetch("/api/education/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionForm),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Session created successfully" });
        setSessionDialog(false);
        setSessionForm({ name: "", startDate: "", endDate: "", isActive: false });
        fetchEducationData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to create session", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create session", variant: "destructive" });
    }
  };

  const handleCreateClass = async () => {
    try {
      const res = await fetch("/api/education/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classForm),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Class created successfully" });
        setClassDialog(false);
        setClassForm({ name: "", code: "", description: "", sessionId: "", teacherId: "", capacity: 30, room: "", schedule: "" });
        fetchEducationData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to create class", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create class", variant: "destructive" });
    }
  };

  const handleCreateGrade = async () => {
    try {
      const res = await fetch("/api/education/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gradeForm),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Grade recorded successfully" });
        setGradeDialog(false);
        setGradeForm({ classId: "", studentId: "", sessionId: "", type: "ASSIGNMENT", title: "", description: "", maxScore: 100, score: 0, date: "", comments: "" });
        fetchEducationData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to record grade", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to record grade", variant: "destructive" });
    }
  };

  const handleCreateAttendance = async () => {
    try {
      const res = await fetch("/api/education/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceForm),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Attendance recorded successfully" });
        setAttendanceDialog(false);
        setAttendanceForm({ classId: "", studentId: "", sessionId: "", date: "", status: "PRESENT", notes: "" });
        fetchEducationData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to record attendance", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to record attendance", variant: "destructive" });
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "kanban", label: "Kanban Board", icon: Kanban },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "chat", label: "Team Chat", icon: MessageSquare },
  ];

  const adminNavItems = [
    { id: "admin", label: "Admin Panel", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  // Education Tab Content
  const renderEducationContent = () => (
    <Tabs value={activeEducationTab} onValueChange={setActiveEducationTab} className="w-full">
      <TabsList className="grid w-full grid-cols-6 mb-6">
        <TabsTrigger value="teachers" className="flex items-center gap-2">
          <UserCog className="h-4 w-4" />
          Teachers
        </TabsTrigger>
        <TabsTrigger value="students" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Students
        </TabsTrigger>
        <TabsTrigger value="sessions" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Sessions
        </TabsTrigger>
        <TabsTrigger value="classes" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Classes
        </TabsTrigger>
        <TabsTrigger value="grades" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Grades
        </TabsTrigger>
        <TabsTrigger value="attendance" className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Attendance
        </TabsTrigger>
      </TabsList>

      {/* Teachers Tab */}
      <TabsContent value="teachers">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Teachers</CardTitle>
                <CardDescription>Manage teaching staff</CardDescription>
              </div>
              <Button onClick={() => setTeacherDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Teacher
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No teachers yet. Add your first teacher to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.firstName} {teacher.lastName}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.phone || "-"}</TableCell>
                      <TableCell>{teacher.employeeId || "-"}</TableCell>
                      <TableCell>{teacher.specialization || "-"}</TableCell>
                      <TableCell>{teacher.classes?.length || 0}</TableCell>
                      <TableCell>
                        <Badge variant={teacher.isActive ? "default" : "secondary"}>
                          {teacher.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => { setDeleteTarget({ type: "teacher", id: teacher.id }); setDeleteDialog(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Students Tab */}
      <TabsContent value="students">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Students</CardTitle>
                <CardDescription>Manage student records</CardDescription>
              </div>
              <Button onClick={() => setStudentDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No students yet. Add your first student to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.studentId || "-"}</TableCell>
                      <TableCell>{student.email || "-"}</TableCell>
                      <TableCell>{student.phone || "-"}</TableCell>
                      <TableCell>{student.gender || "-"}</TableCell>
                      <TableCell>{student.enrollments?.length || 0}</TableCell>
                      <TableCell>
                        <Badge variant={student.isActive ? "default" : "secondary"}>
                          {student.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => { setDeleteTarget({ type: "student", id: student.id }); setDeleteDialog(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Sessions Tab */}
      <TabsContent value="sessions">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Academic Sessions</CardTitle>
                <CardDescription>Manage academic terms/semesters</CardDescription>
              </div>
              <Button onClick={() => setSessionDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Session
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sessions yet. Create your first academic session to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((sess) => (
                    <TableRow key={sess.id}>
                      <TableCell className="font-medium">{sess.name}</TableCell>
                      <TableCell>{new Date(sess.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(sess.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>{sess._count?.classes || 0}</TableCell>
                      <TableCell>
                        <Badge variant={sess.isActive ? "default" : "secondary"}>
                          {sess.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => { setDeleteTarget({ type: "session", id: sess.id }); setDeleteDialog(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Classes Tab */}
      <TabsContent value="classes">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Classes</CardTitle>
                <CardDescription>Manage class offerings</CardDescription>
              </div>
              <Button onClick={() => setClassDialog(true)} disabled={sessions.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </div>
            {sessions.length === 0 && (
              <p className="text-sm text-orange-500 mt-2">Please create an academic session first before adding classes.</p>
            )}
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No classes yet. Create your first class to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{cls.code || "-"}</TableCell>
                      <TableCell>
                        {cls.teacher ? `${cls.teacher.firstName} ${cls.teacher.lastName}` : "Unassigned"}
                      </TableCell>
                      <TableCell>{cls.session?.name || "-"}</TableCell>
                      <TableCell>{cls.room || "-"}</TableCell>
                      <TableCell>{cls._count?.enrollments || 0}/{cls.capacity}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => { setDeleteTarget({ type: "class", id: cls.id }); setDeleteDialog(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Grades Tab */}
      <TabsContent value="grades">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Grades</CardTitle>
                <CardDescription>Student grade records</CardDescription>
              </div>
              <Button onClick={() => setGradeDialog(true)} disabled={classes.length === 0 || students.length === 0 || sessions.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Add Grade
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No grades recorded yet. Add your first grade to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">
                        {grade.student.firstName} {grade.student.lastName}
                      </TableCell>
                      <TableCell>{grade.class.name}</TableCell>
                      <TableCell>{grade.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{grade.type}</Badge>
                      </TableCell>
                      <TableCell>{grade.score}/{grade.maxScore}</TableCell>
                      <TableCell>
                        <Badge variant={grade.letterGrade === "A" || grade.letterGrade === "B" ? "default" : grade.letterGrade === "C" ? "secondary" : "destructive"}>
                          {grade.letterGrade}
                        </Badge>
                      </TableCell>
                      <TableCell>{grade.date ? new Date(grade.date).toLocaleDateString() : "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => { setDeleteTarget({ type: "grade", id: grade.id }); setDeleteDialog(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Attendance Tab */}
      <TabsContent value="attendance">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Attendance</CardTitle>
                <CardDescription>Student attendance records</CardDescription>
              </div>
              <Button onClick={() => setAttendanceDialog(true)} disabled={classes.length === 0 || students.length === 0 || sessions.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Record Attendance
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No attendance records yet. Record your first attendance to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((att) => (
                    <TableRow key={att.id}>
                      <TableCell className="font-medium">
                        {att.student.firstName} {att.student.lastName}
                      </TableCell>
                      <TableCell>{att.class.name}</TableCell>
                      <TableCell>{new Date(att.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          att.status === "PRESENT" ? "default" :
                          att.status === "LATE" ? "secondary" :
                          att.status === "EXCUSED" ? "outline" : "destructive"
                        }>
                          {att.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{att.notes || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => { setDeleteTarget({ type: "attendance", id: att.id }); setDeleteDialog(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

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
                  onClick={() => setActiveView(item.id)}
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

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeView === "education" ? (
            <>
              <div className="flex gap-4 mb-6">
                <Button variant="ghost" onClick={() => { fetchData(); fetchEducationData(); }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
              {renderEducationContent()}
            </>
          ) : (
            <>
              {/* Action Buttons */}
              <div className="flex gap-4 mb-6">
                <Button onClick={() => setProjectDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
                <Button variant="outline" onClick={() => {
                  if (projects.length > 0) {
                    setTicketForm(prev => ({ ...prev, projectId: projects[0].id }));
                  }
                  setTicketDialog(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Ticket
                </Button>
                <Button variant="ghost" onClick={fetchData}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Projects</CardTitle>
                      <CardDescription>Manage your projects</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setProjectDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Project
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No projects yet. Create your first project to get started.</p>
                      <Button className="mt-4" onClick={() => setProjectDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Project
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {projects.map((project) => (
                        <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-3 w-3 rounded"
                                  style={{ backgroundColor: project.color || "#3B82F6" }}
                                />
                                <span className="font-medium">{project.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget({ type: "project", id: project.id });
                                  setDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{project.key}</p>
                            <Progress value={project.progress} className="h-2 mb-2" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{project.progress}% complete</span>
                              <span>{project._count?.tickets || 0} tickets</span>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Tickets</CardTitle>
                      <CardDescription>View and manage tickets</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => {
                      if (projects.length > 0) {
                        setTicketForm(prev => ({ ...prev, projectId: projects[0].id }));
                      }
                      setTicketDialog(true);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Ticket
                    </Button>
                  </div>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget({ type: "ticket", id: ticket.id });
                                  setDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
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

      {/* Create Project Dialog */}
      <Dialog open={projectDialog} onOpenChange={setProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add a new project to your workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                placeholder="My Project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectKey">Project Key</Label>
              <Input
                id="projectKey"
                value={projectForm.key}
                onChange={(e) => setProjectForm({ ...projectForm, key: e.target.value.toUpperCase().slice(0, 4) })}
                placeholder="MP"
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDescription">Description</Label>
              <Textarea
                id="projectDescription"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Project description..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectColor">Color</Label>
              <Input
                id="projectColor"
                type="color"
                value={projectForm.color}
                onChange={(e) => setProjectForm({ ...projectForm, color: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={!projectForm.name || !projectForm.key}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={ticketDialog} onOpenChange={setTicketDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>Add a new ticket to your project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ticketProject">Project</Label>
              <Select value={ticketForm.projectId} onValueChange={(v) => setTicketForm({ ...ticketForm, projectId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticketTitle">Title</Label>
              <Input
                id="ticketTitle"
                value={ticketForm.title}
                onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                placeholder="Ticket title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticketDescription">Description</Label>
              <Textarea
                id="ticketDescription"
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="Ticket description..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticketPriority">Priority</Label>
              <Select value={ticketForm.priority} onValueChange={(v) => setTicketForm({ ...ticketForm, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTicketDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTicket} disabled={!ticketForm.title || !ticketForm.projectId}>
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teacher Dialog */}
      <Dialog open={teacherDialog} onOpenChange={setTeacherDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>Add a new teacher to your organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={teacherForm.firstName} onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input value={teacherForm.lastName} onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input value={teacherForm.employeeId} onChange={(e) => setTeacherForm({ ...teacherForm, employeeId: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Qualification</Label>
                <Input value={teacherForm.qualification} onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Input value={teacherForm.specialization} onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Join Date</Label>
              <Input type="date" value={teacherForm.joinDate} onChange={(e) => setTeacherForm({ ...teacherForm, joinDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeacherDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTeacher} disabled={!teacherForm.firstName || !teacherForm.lastName || !teacherForm.email}>
              Add Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Dialog */}
      <Dialog open={studentDialog} onOpenChange={setStudentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Enroll a new student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={studentForm.firstName} onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input value={studentForm.lastName} onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input value={studentForm.studentId} onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={studentForm.gender} onValueChange={(v) => setStudentForm({ ...studentForm, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={studentForm.dateOfBirth} onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Enroll Date</Label>
                <Input type="date" value={studentForm.enrollDate} onChange={(e) => setStudentForm({ ...studentForm, enrollDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateStudent} disabled={!studentForm.firstName || !studentForm.lastName}>
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Dialog */}
      <Dialog open={sessionDialog} onOpenChange={setSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Academic Session</DialogTitle>
            <DialogDescription>Create a new academic term or semester</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Session Name *</Label>
              <Input placeholder="e.g., Fall 2024" value={sessionForm.name} onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={sessionForm.startDate} onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" value={sessionForm.endDate} onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={sessionForm.isActive} onChange={(e) => setSessionForm({ ...sessionForm, isActive: e.target.checked })} />
              <Label htmlFor="isActive">Set as Active Session</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateSession} disabled={!sessionForm.name || !sessionForm.startDate || !sessionForm.endDate}>
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Dialog */}
      <Dialog open={classDialog} onOpenChange={setClassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Class</DialogTitle>
            <DialogDescription>Add a new class offering</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class Name *</Label>
                <Input value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={classForm.code} onChange={(e) => setClassForm({ ...classForm, code: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={classForm.description} onChange={(e) => setClassForm({ ...classForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Session *</Label>
                <Select value={classForm.sessionId} onValueChange={(v) => setClassForm({ ...classForm, sessionId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select value={classForm.teacherId} onValueChange={(v) => setClassForm({ ...classForm, teacherId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={classForm.capacity} onChange={(e) => setClassForm({ ...classForm, capacity: parseInt(e.target.value) || 30 })} />
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Input value={classForm.room} onChange={(e) => setClassForm({ ...classForm, room: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Input placeholder="e.g., MWF 9AM" value={classForm.schedule} onChange={(e) => setClassForm({ ...classForm, schedule: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateClass} disabled={!classForm.name || !classForm.sessionId}>
              Create Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={gradeDialog} onOpenChange={setGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Grade</DialogTitle>
            <DialogDescription>Enter student grade</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={gradeForm.classId} onValueChange={(v) => setGradeForm({ ...gradeForm, classId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Student *</Label>
                <Select value={gradeForm.studentId} onValueChange={(v) => setGradeForm({ ...gradeForm, studentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Session *</Label>
                <Select value={gradeForm.sessionId} onValueChange={(v) => setGradeForm({ ...gradeForm, sessionId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={gradeForm.type} onValueChange={(v) => setGradeForm({ ...gradeForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                    <SelectItem value="MIDTERM">Midterm</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                    <SelectItem value="PROJECT">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={gradeForm.title} onChange={(e) => setGradeForm({ ...gradeForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Score *</Label>
                <Input type="number" value={gradeForm.maxScore} onChange={(e) => setGradeForm({ ...gradeForm, maxScore: parseFloat(e.target.value) || 100 })} />
              </div>
              <div className="space-y-2">
                <Label>Score *</Label>
                <Input type="number" value={gradeForm.score} onChange={(e) => setGradeForm({ ...gradeForm, score: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={gradeForm.date} onChange={(e) => setGradeForm({ ...gradeForm, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea value={gradeForm.comments} onChange={(e) => setGradeForm({ ...gradeForm, comments: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateGrade} disabled={!gradeForm.classId || !gradeForm.studentId || !gradeForm.sessionId || !gradeForm.title}>
              Record Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialog} onOpenChange={setAttendanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Attendance</DialogTitle>
            <DialogDescription>Mark student attendance</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={attendanceForm.classId} onValueChange={(v) => setAttendanceForm({ ...attendanceForm, classId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Student *</Label>
                <Select value={attendanceForm.studentId} onValueChange={(v) => setAttendanceForm({ ...attendanceForm, studentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Session *</Label>
                <Select value={attendanceForm.sessionId} onValueChange={(v) => setAttendanceForm({ ...attendanceForm, sessionId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={attendanceForm.status} onValueChange={(v) => setAttendanceForm({ ...attendanceForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="EXCUSED">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={attendanceForm.notes} onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateAttendance} disabled={!attendanceForm.classId || !attendanceForm.studentId || !attendanceForm.sessionId || !attendanceForm.date}>
              Record Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Home() {
  return <DashboardContent />;
}
