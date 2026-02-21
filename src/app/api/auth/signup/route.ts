import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        isActive: true,
        emailVerified: new Date(),
      },
    });

    // Find or create default organization for new users
    let organization = await prisma.organization.findFirst({
      where: { slug: "default-org" },
    });

    if (!organization) {
      // Create a personal organization for the user
      organization = await prisma.organization.create({
        data: {
          name: `${name}'s Workspace`,
          slug: `workspace-${user.id.slice(0, 8)}`,
          description: "Personal workspace",
          ownerId: user.id,
          subscriptionPlan: "FREE",
          subscriptionStatus: "ACTIVE",
          maxMembers: 5,
          maxProjects: 10,
          maxStorageMB: 500,
        },
      });
    }

    // Add user as member to organization
    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: "MEMBER",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
