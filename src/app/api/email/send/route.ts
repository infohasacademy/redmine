import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import nodemailer from "nodemailer";

// POST /api/email/send - Send email
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject, content, ticketId, projectId } = body;

    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: "To, subject, and content are required" },
        { status: 400 }
      );
    }

    // Get SMTP settings from environment or database
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    let emailSent = false;
    let emailMessage = "Email stored locally";

    // Try to send email if SMTP is configured
    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: smtpUser,
          to,
          subject,
          text: content,
          html: content.replace(/\n/g, "<br/>"),
        });

        emailSent = true;
        emailMessage = "Email sent successfully";
      } catch (emailError: any) {
        console.error("SMTP error:", emailError);
        emailMessage = `Email stored locally (SMTP error: ${emailError.message})`;
      }
    }

    // If linked to a ticket, add as comment
    if (ticketId) {
      await prisma.comment.create({
        data: {
          ticketId,
          userId: user.id,
          content: `[Email to: ${to}]\n\n${content}`,
        },
      });
    }

    // Log activity
    if (projectId) {
      await prisma.activity.create({
        data: {
          organizationId: user.organizationId || "",
          projectId,
          ticketId,
          userId: user.id,
          type: "COMMENTED",
          description: `sent email to ${to} with subject: ${subject}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      sent: emailSent,
      message: emailMessage,
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
