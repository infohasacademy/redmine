import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/education/students - Get all students
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
      return NextResponse.json({ students: [] });
    }

    const students = await prisma.student.findMany({
      where: { organizationId: membership.organizationId },
      include: {
        enrollments: {
          include: {
            class: { select: { id: true, name: true, code: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

// POST /api/education/students - Create a student
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
      firstName, lastName, email, phone, studentId,
      dateOfBirth, gender, address, enrollDate 
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }

    // Check if studentId already exists if provided
    if (studentId) {
      const existing = await prisma.student.findUnique({
        where: {
          student_organization_key: { organizationId: membership.organizationId, studentId }
        },
      });

      if (existing) {
        return NextResponse.json({ error: "A student with this ID already exists" }, { status: 400 });
      }
    }

    const student = await prisma.student.create({
      data: {
        organizationId: membership.organizationId,
        firstName,
        lastName,
        email,
        phone,
        studentId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        address,
        enrollDate: enrollDate ? new Date(enrollDate) : null,
      },
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}

// PUT /api/education/students - Update a student
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, organizationId: student.organizationId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        enrollDate: data.enrollDate ? new Date(data.enrollDate) : undefined,
      },
    });

    return NextResponse.json({ student: updatedStudent });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

// DELETE /api/education/students - Delete a student
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, organizationId: student.organizationId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.student.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
