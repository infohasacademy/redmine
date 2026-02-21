import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcrypt";

export async function GET() {
  try {
    const email = "ranelsabah@admin.synchropm.com";
    const password = "Santafee@@@@@1972";

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { isActive: true },
          orderBy: { joinedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found", email });
    }

    if (!user.password) {
      return NextResponse.json({ error: "User has no password", userId: user.id });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "User is not active", userId: user.id });
    }

    // Test password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        hasPassword: !!user.password,
        passwordValid: isPasswordValid,
        membershipRole: user.memberships[0]?.role || "NONE",
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack?.split("\n").slice(0, 3),
    }, { status: 500 });
  }
}
