// src/app/api/admin/reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["ADMIN"]);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admins only." }, { status: 401 });
  }

  // 1. Delete order items first (child records)
  await prisma.orderItem.deleteMany();

  // 2. Delete all orders
  await prisma.order.deleteMany();

  // 3. Delete all notifications
  await prisma.notification.deleteMany();

  // 4. Delete course control (closes any open course)
  await prisma.courseControl.deleteMany();

  // 5. Reset all 24 tables to clean state
  await prisma.dinnerTable.updateMany({
    data: {
      orderedCount: 0,
      status: "COLLECTING",
      quorumMetAt: null,
      dispatchedAt: null,
      waiterId: null,
    },
  });

  // 6. Restore all menu items to original quantities
  const menuItems = await prisma.menuItem.findMany();
  for (const item of menuItems) {
    await prisma.menuItem.update({
      where: { id: item.id },
      data: {
        quantity: item.originalQuantity,
        isAvailable: item.originalQuantity > 0,
      },
    });
  }

  return NextResponse.json({
    success: true,
    message: `Reset complete. ${menuItems.length} menu items restored. All tables cleared.`,
  });
}