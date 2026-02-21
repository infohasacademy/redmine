import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import nodemailer from "nodemailer";

// GET /api/email/inbox - Get emails
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || "inbox";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // For now, return emails linked to user's tickets
    // In production, this would connect to actual email providers
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { assigneeId: user.id },
          { reporterId: user.id },
        ],
      },
      include: {
        project: { select: { id: true, name: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform tickets as email-like items
    const emails = tickets.map((ticket) => ({
      id: ticket.id,
      subject: `[${ticket.key}] ${ticket.title}`,
      from: ticket.project.name,
      preview: ticket.description?.substring(0, 100) || "",
      date: ticket.updatedAt,
      read: false,
      folder: "inbox",
      ticketKey: ticket.key,
      projectId: ticket.projectId,
    }));

    return NextResponse.json({ emails, total: emails.length, page, limit });
  } catch (error: any) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
