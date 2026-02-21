import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    const adminUser = await prisma.user.findUnique({
      where: { email: "ranelsabah@admin.synchropm.com" },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        memberships: {
          select: { role: true }
        }
      }
    });

    return NextResponse.json({
      status: "connected",
      userCount,
      adminUser,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: error.message,
      code: error.code
    }, { status: 500 });
  }
}
