import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GradeType } from "@prisma/client";

// GET /api/education/grades - Get grades
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
      return NextResponse.json({ grades: [] });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");
    const sessionId = searchParams.get("sessionId");

    const where: any = {
      class: { organizationId: membership.organizationId }
    };

    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (sessionId) where.sessionId = sessionId;

    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        class: { select: { id: true, name: true, code: true } },
        session: { select: { id: true, name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ grades });
  } catch (error) {
    console.error("Error fetching grades:", error);
    return NextResponse.json({ error: "Failed to fetch grades" }, { status: 500 });
  }
}

// POST /api/education/grades - Create a grade
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      classId, studentId, sessionId, type, title, description,
      maxScore, score, date, comments
    } = body;

    if (!classId || !studentId || !sessionId || !title || maxScore === undefined || score === undefined) {
      return NextResponse.json({ error: "Class, student, session, title, max score, and score are required" }, { status: 400 });
    }

    // Verify class exists and user has access
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: { organization: { include: { members: { where: { userId: user.id } } } } },
    });

    if (!classData || classData.organization.members.length === 0) {
      return NextResponse.json({ error: "Access denied or class not found" }, { status: 403 });
    }

    const percentage = (score / maxScore) * 100;
    let letterGrade = "F";
    if (percentage >= 90) letterGrade = "A";
    else if (percentage >= 80) letterGrade = "B";
    else if (percentage >= 70) letterGrade = "C";
    else if (percentage >= 60) letterGrade = "D";

    const grade = await prisma.grade.create({
      data: {
        classId,
        studentId,
        sessionId,
        type: (type || "ASSIGNMENT") as GradeType,
        title,
        description,
        maxScore,
        score,
        percentage,
        letterGrade,
        date: date ? new Date(date) : new Date(),
        comments,
      },
    });

    return NextResponse.json({ grade }, { status: 201 });
  } catch (error) {
    console.error("Error creating grade:", error);
    return NextResponse.json({ error: "Failed to create grade" }, { status: 500 });
  }
}

// PUT /api/education/grades - Update a grade
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Grade ID is required" }, { status: 400 });
    }

    const grade = await prisma.grade.findUnique({
      where: { id },
      include: { class: { include: { organization: { include: { members: { where: { userId: user.id } } } } } } },
    });

    if (!grade || grade.class.organization.members.length === 0) {
      return NextResponse.json({ error: "Grade not found or access denied" }, { status: 403 });
    }

    // Recalculate percentage and letter grade if scores change
    const maxScore = data.maxScore ?? grade.maxScore;
    const score = data.score ?? grade.score;
    const percentage = (score / maxScore) * 100;
    let letterGrade = "F";
    if (percentage >= 90) letterGrade = "A";
    else if (percentage >= 80) letterGrade = "B";
    else if (percentage >= 70) letterGrade = "C";
    else if (percentage >= 60) letterGrade = "D";

    const updatedGrade = await prisma.grade.update({
      where: { id },
      data: {
        ...data,
        percentage,
        letterGrade,
        date: data.date ? new Date(data.date) : undefined,
      },
    });

    return NextResponse.json({ grade: updatedGrade });
  } catch (error) {
    console.error("Error updating grade:", error);
    return NextResponse.json({ error: "Failed to update grade" }, { status: 500 });
  }
}

// DELETE /api/education/grades - Delete a grade
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Grade ID is required" }, { status: 400 });
    }

    const grade = await prisma.grade.findUnique({
      where: { id },
      include: { class: { include: { organization: { include: { members: { where: { userId: user.id } } } } } } },
    });

    if (!grade || grade.class.organization.members.length === 0) {
      return NextResponse.json({ error: "Grade not found or access denied" }, { status: 403 });
    }

    await prisma.grade.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting grade:", error);
    return NextResponse.json({ error: "Failed to delete grade" }, { status: 500 });
  }
}
