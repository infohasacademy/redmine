import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AttendanceStatus } from "@prisma/client";

// GET /api/education/attendance - Get attendance records
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
      return NextResponse.json({ attendance: [] });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");
    const sessionId = searchParams.get("sessionId");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      class: { organizationId: membership.organizationId }
    };

    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (sessionId) where.sessionId = sessionId;
    if (date) where.date = new Date(date);
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        class: { select: { id: true, name: true, code: true } },
        session: { select: { id: true, name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// POST /api/education/attendance - Record attendance
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { classId, studentId, sessionId, date, status, notes } = body;

    if (!classId || !studentId || !sessionId || !date || !status) {
      return NextResponse.json({ error: "Class, student, session, date, and status are required" }, { status: 400 });
    }

    // Verify access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { joinedAt: "desc" },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if attendance already exists for this student/class/date
    const existing = await prisma.attendance.findUnique({
      where: {
        attendance_unique_key: {
          classId,
          studentId,
          date: new Date(date),
        },
      },
    });

    if (existing) {
      // Update existing attendance
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: status as AttendanceStatus,
          notes,
        },
      });
      return NextResponse.json({ attendance: updated });
    }

    // Create new attendance record
    const attendance = await prisma.attendance.create({
      data: {
        classId,
        studentId,
        sessionId,
        date: new Date(date),
        status: status as AttendanceStatus,
        notes,
      },
    });

    return NextResponse.json({ attendance }, { status: 201 });
  } catch (error) {
    console.error("Error creating attendance:", error);
    return NextResponse.json({ error: "Failed to create attendance" }, { status: 500 });
  }
}

// PUT /api/education/attendance - Update attendance
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Attendance ID is required" }, { status: 400 });
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: { class: { include: { organization: true } } },
    });

    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    // Verify access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, organizationId: attendance.class.organizationId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id },
      data: {
        ...data,
        status: data.status ? (data.status as AttendanceStatus) : undefined,
      },
    });

    return NextResponse.json({ attendance: updatedAttendance });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
  }
}

// DELETE /api/education/attendance - Delete attendance
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Attendance ID is required" }, { status: 400 });
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: { class: { include: { organization: true } } },
    });

    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    // Verify access
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, organizationId: attendance.class.organizationId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.attendance.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json({ error: "Failed to delete attendance" }, { status: 500 });
  }
}
