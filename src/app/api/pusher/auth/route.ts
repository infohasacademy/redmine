import { NextRequest, NextResponse } from "next/server";
import { pusher } from "@/lib/pusher/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { socket_id, channel_name } = body;

    // Authorize user for the channel
    const auth = pusher.authorizeChannel(socket_id, channel_name, {
      user_id: user.id,
      user_info: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    return NextResponse.json(auth);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
