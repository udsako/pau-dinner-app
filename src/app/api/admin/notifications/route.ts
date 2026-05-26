import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  if (id === "read-all") {
    await prisma.notification.updateMany({ data: { isRead: true } });
    return NextResponse.json({ success: true, message: "All notifications marked as read." });
  }

  try {
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true, notification });
  } catch {
    return NextResponse.json({ success: false, error: "Notification not found." }, { status: 404 });
  }
}