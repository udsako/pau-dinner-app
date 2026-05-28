// src/app/api/tables/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

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
        select: { id: true, studentName: true, status: true, course: true, createdAt: true },
      },
    },
  });

  // Add per-course counts to each table
  const tablesWithCourseCounts = tables.map((table) => {
    const starterOrders = table.orders.filter((o) => o.course === "STARTER");
    const mainOrders = table.orders.filter((o) => o.course === "MAIN");
    const dessertOrders = table.orders.filter((o) => o.course === "DESSERT");

    return {
      ...table,
      courseCounts: {
        STARTER: starterOrders.length,
        MAIN: mainOrders.length,
        DESSERT: dessertOrders.length,
      },
      courseDispatched: {
        STARTER: starterOrders.some((o) => o.status === "DISPATCHED"),
        MAIN: mainOrders.some((o) => o.status === "DISPATCHED"),
        DESSERT: dessertOrders.some((o) => o.status === "DISPATCHED"),
      },
    };
  });

  return NextResponse.json({ success: true, tables: tablesWithCourseCounts });
}