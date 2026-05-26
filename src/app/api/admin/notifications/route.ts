// src/app/api/admin/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/admin/notifications
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (unreadOnly) where.isRead = false;
  if (type) where.type = type;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = await prisma.notification.count({ where: { isRead: false } });

  return NextResponse.json({ success: true, notifications, unreadCount });
}
