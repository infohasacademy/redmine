import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/education/classes - Get all classes
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { joinedAt: "desc" },
    });

    if (!membership) {
      return NextResponse.json({ classes: [] });
    }

    const classes = await prisma.class.findMany({
      where: { organizationId: membership.organizationId },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        session: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}

// POST /api/education/classes - Create a class
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { joinedAt: "desc" },
    });

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, code, description, sessionId, teacherId,
      capacity, room, schedule 
    } = body;

    if (!name || !sessionId) {
      return NextResponse.json({ error: "Name and session are required" }, { status: 400 });
    }

    // Check if code already exists if provided
    if (code) {
      const existing = await prisma.class.findUnique({
        where: {
          class_code_key: { organizationId: membership.organizationId, code }
        },
      });

      if (existing) {
        return NextResponse.json({ error: "A class with this code already exists" }, { status: 400 });
      }
    }

    const newClass = await prisma.class.create({
      data: {
        organizationId: membership.organizationId,
        name,
        code,
        description,
        sessionId,
        teacherId,
        capacity: capacity || 30,
        room,
        schedule,
      },
      include: {
        teacher: true,
        session: true,
      },
    });

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}

// PUT /api/education/classes - Update a class
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    const existingClass = await prisma.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Verify access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, organizationId: existingClass.organizationId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data,
      include: {
        teacher: true,
        session: true,
      },
    });

    return NextResponse.json({ class: updatedClass });
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json({ error: "Failed to update class" }, { status: 500 });
  }
}

// DELETE /api/education/classes - Delete a class
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    const existingClass = await prisma.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Verify access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, organizationId: existingClass.organizationId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.class.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 });
  }
}
