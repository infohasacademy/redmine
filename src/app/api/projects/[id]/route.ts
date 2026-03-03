import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// GET /api/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: { where: { userId: user.id } },
        organization: {
          include: { members: { where: { userId: user.id } } }
        },
        _count: { select: { members: true, tickets: true } },
        kanbanColumns: { orderBy: { order: 'asc' } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check access
    const projectMember = project.members[0];
    const orgMember = project.organization.members[0];
    
    if (!projectMember && !orgMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      project: {
        ...project,
        userRole: projectMember?.role || orgMember?.role,
      },
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: { where: { userId: user.id } },
        organization: {
          include: { members: { where: { userId: user.id } } }
        }
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectMember = project.members[0];
    const orgMember = project.organization.members[0];

    const canUpdate = (projectMember && hasPermission(projectMember.role, "project.settings")) ||
                      (orgMember && hasPermission(orgMember.role, "project.settings"));

    if (!canUpdate) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: { where: { userId: user.id } },
        organization: {
          include: { members: { where: { userId: user.id } } }
        }
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectMember = project.members[0];
    const orgMember = project.organization.members[0];

    const canDelete = (projectMember && hasPermission(projectMember.role, "project.delete")) ||
                      (orgMember && hasPermission(orgMember.role, "project.delete"));

    if (!canDelete) {
      return NextResponse.json({ error: "Insufficient permissions to delete this project" }, { status: 403 });
    }

    // Soft delete
    await prisma.project.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
