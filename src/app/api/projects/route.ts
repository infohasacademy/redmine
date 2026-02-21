import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// GET /api/projects - Get projects
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    // Check membership
    const membership = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const projects = await prisma.project.findMany({
      where: { organizationId, isActive: true },
      include: {
        _count: { select: { members: true, tickets: true } },
        members: { where: { userId: user.id } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedProjects = projects.map((p) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      description: p.description,
      color: p.color,
      icon: p.icon,
      visibility: p.visibility,
      progress: p.progress,
      startDate: p.startDate,
      endDate: p.endDate,
      memberCount: p._count.members,
      ticketCount: p._count.tickets,
      userRole: p.members[0]?.role || membership.role,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({ projects: formattedProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { organizationId, name, key, description, color, visibility, parentId } = body;

    // Check membership and permission
    const membership = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, isActive: true },
    });

    if (!membership || !hasPermission(membership.role, "project.create")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Check if key exists in organization
    const existing = await prisma.project.findFirst({
      where: { organizationId, key },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Project key already exists" },
        { status: 400 }
      );
    }

    // Create project with default Kanban columns
    const project = await prisma.project.create({
      data: {
        organizationId,
        name,
        key: key.toUpperCase(),
        description,
        color,
        visibility: visibility || "PUBLIC",
        parentId,
        members: {
          create: { userId: user.id, role: "MANAGER" },
        },
      },
      include: {
        _count: { select: { members: true, tickets: true } },
      },
    });

    // Create default Kanban columns
    await prisma.kanbanColumn.createMany({
      data: [
        { projectId: project.id, name: "Backlog", color: "#6B7280", order: 0 },
        { projectId: project.id, name: "To Do", color: "#3B82F6", order: 1 },
        { projectId: project.id, name: "In Progress", color: "#F59E0B", order: 2 },
        { projectId: project.id, name: "In Review", color: "#8B5CF6", order: 3 },
        { projectId: project.id, name: "Done", color: "#10B981", order: 4 },
      ],
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects - Update project
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { id, ...data } = body;

    const projectMember = await prisma.projectMember.findFirst({
      where: { projectId: id, userId: user.id },
    });

    if (!projectMember || !hasPermission(projectMember.role, "project.settings")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects - Delete project
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: { where: { userId: user.id } } },
    });

    if (!project || !project.members[0] || !hasPermission(project.members[0].role, "project.delete")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await prisma.project.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
