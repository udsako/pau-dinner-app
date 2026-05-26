// src/app/api/tables/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/tables — Overview of all 24 tables (auth required)
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const tables = await prisma.dinnerTable.findMany({
    orderBy: { tableNumber: "asc" },
    include: {
      assignedWaiter: { select: { id: true, name: true, email: true } },
      orders: {
        select: { id: true, studentName: true, status: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ success: true, tables });
}
