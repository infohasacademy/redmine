import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { TicketStatus, TicketPriority, TicketType } from "@prisma/client";

// GET /api/tickets/[id] - Get single ticket
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

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        reporter: { select: { id: true, name: true, email: true, image: true } },
        project: {
          select: { id: true, name: true, key: true, color: true, organizationId: true },
          include: {
            members: { where: { userId: user.id } },
            organization: { include: { members: { where: { userId: user.id } } } }
          }
        },
        module: { select: { id: true, name: true, color: true } },
        milestone: { select: { id: true, name: true } },
        comments: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
        _count: { select: { comments: true, attachments: true, subtasks: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check access
    const projectMember = ticket.project.members[0];
    const orgMember = ticket.project.organization.members[0];
    
    if (!projectMember && !orgMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

// PUT /api/tickets/[id] - Update ticket
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

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: { where: { userId: user.id } },
            organization: { include: { members: { where: { userId: user.id } } } }
          }
        }
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const projectMember = ticket.project.members[0];
    const orgMember = ticket.project.organization.members[0];

    const canEdit = (projectMember && hasPermission(projectMember.role, "ticket.edit")) ||
                    (orgMember && hasPermission(orgMember.role, "ticket.edit"));

    if (!canEdit) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status) updateData.status = body.status as TicketStatus;
    if (body.priority) updateData.priority = body.priority as TicketPriority;
    if (body.type) updateData.type = body.type as TicketType;
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.estimatedHours !== undefined) updateData.estimatedHours = body.estimatedHours;
    if (body.storyPoints !== undefined) updateData.storyPoints = body.storyPoints;
    if (body.progress !== undefined) updateData.progress = body.progress;
    if (body.columnId !== undefined) updateData.columnId = body.columnId;

    // Handle status change
    if (body.status && body.status !== ticket.status) {
      if (body.status === "DONE") {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        reporter: { select: { id: true, name: true, email: true, image: true } },
        project: { select: { id: true, name: true, key: true, color: true } },
      },
    });

    // Create activity for status change
    if (body.status && body.status !== ticket.status) {
      await prisma.activity.create({
        data: {
          organizationId: ticket.project.organizationId,
          projectId: ticket.projectId,
          ticketId: ticket.id,
          userId: user.id,
          type: "STATUS_CHANGED",
          description: `changed status from ${ticket.status} to ${body.status}`,
          metadata: { from: ticket.status, to: body.status },
        },
      });
    }

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

// DELETE /api/tickets/[id] - Delete ticket
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

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: { where: { userId: user.id } },
            organization: { include: { members: { where: { userId: user.id } } } }
          }
        }
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const projectMember = ticket.project.members[0];
    const orgMember = ticket.project.organization.members[0];

    const canDelete = (projectMember && hasPermission(projectMember.role, "ticket.delete")) ||
                      (orgMember && hasPermission(orgMember.role, "ticket.delete"));

    if (!canDelete) {
      return NextResponse.json({ error: "Insufficient permissions to delete this ticket" }, { status: 403 });
    }

    await prisma.ticket.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
