import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization membership
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { joinedAt: "desc" },
    });

    if (!membership) {
      return NextResponse.json({
        totalUsers: 0,
        totalProjects: 0,
        totalTickets: 0,
      });
    }

    // Check if user has admin access
    if (!hasPermission(membership.role, "admin.access")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const organizationId = membership.organizationId;

    // Get stats in parallel
    const [totalUsers, totalProjects, totalTickets] = await Promise.all([
      prisma.organizationMember.count({
        where: { organizationId, isActive: true },
      }),
      prisma.project.count({
        where: { organizationId, isActive: true },
      }),
      prisma.ticket.count({
        where: {
          project: { organizationId },
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalProjects,
      totalTickets,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
