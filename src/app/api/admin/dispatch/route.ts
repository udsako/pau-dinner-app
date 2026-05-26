// src/app/api/admin/dispatch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { dispatchTable } from "@/lib/batchDispatch";

// POST /api/admin/dispatch — Manually dispatch all pending orders for a table
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json();
  const { tableNumber, waiterId } = body;

  if (!tableNumber) {
    return NextResponse.json({ success: false, error: "tableNumber is required." }, { status: 400 });
  }

  const table = await prisma.dinnerTable.findUnique({ where: { tableNumber } });
  if (!table) {
    return NextResponse.json({ success: false, error: "Table not found." }, { status: 404 });
  }

  // Assign waiter if provided
  if (waiterId) {
    await prisma.dinnerTable.update({
      where: { id: table.id },
      data: { waiterId },
    });
  }

  const result = await dispatchTable(table.id, "MANUAL");

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: "No pending orders to dispatch for this table." },
      { status: 400 }
    );
  }

  // Fetch waiter name if assigned
  let waiterName = null;
  if (waiterId) {
    const waiter = await prisma.user.findUnique({ where: { id: waiterId }, select: { name: true } });
    waiterName = waiter?.name;
  }

  return NextResponse.json({
    success: true,
    dispatched: {
      tableNumber,
      orderCount: result.orderCount,
      summary: result.summary,
      assignedWaiter: waiterName,
    },
  });
}
