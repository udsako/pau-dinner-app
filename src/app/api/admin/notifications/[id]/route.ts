// src/app/api/admin/notifications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// PATCH /api/admin/notifications/[id] — mark as read
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  // Support marking ALL as read
  if (params.id === "read-all") {
    await prisma.notification.updateMany({ data: { isRead: true } });
    return NextResponse.json({ success: true, message: "All notifications marked as read." });
  }

  try {
    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true, notification });
  } catch {
    return NextResponse.json({ success: false, error: "Notification not found." }, { status: 404 });
  }
}
