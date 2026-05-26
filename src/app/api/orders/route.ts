// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { checkAndTriggerDispatch, checkStockLevel } from "@/lib/batchDispatch";

// POST /api/orders — Student places an order (no auth required)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentName, tableNumber, items, specialNotes } = body;

    // --- Validation ---
    if (!studentName?.trim()) {
      return NextResponse.json({ success: false, error: "Your name is required." }, { status: 400 });
    }
    if (!tableNumber || tableNumber < 1 || tableNumber > 24) {
      return NextResponse.json({ success: false, error: "Invalid table number (must be 1–24)." }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Please select at least one food item." }, { status: 400 });
    }

    // --- Check duplicate order ---
    const existingOrder = await prisma.order.findUnique({
      where: { studentName_tableNumber: { studentName: studentName.trim(), tableNumber } },
    });
    if (existingOrder) {
      return NextResponse.json(
        { success: false, error: `You have already placed an order from Table ${tableNumber}.` },
        { status: 409 }
      );
    }

    // --- Fetch table ---
    const table = await prisma.dinnerTable.findUnique({ where: { tableNumber } });
    if (!table) {
      return NextResponse.json({ success: false, error: "Table not found." }, { status: 404 });
    }
    if (table.status === "DISPATCHED") {
      return NextResponse.json(
        { success: false, error: "Orders for your table have already been dispatched. Please speak to a waiter." },
        { status: 409 }
      );
    }

    // --- Validate and decrement each menu item ---
    const menuItemIds = items.map((i: { menuItemId: string }) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    for (const menuItem of menuItems) {
      if (!menuItem.isAvailable || menuItem.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: `"${menuItem.name}" is no longer available. Please refresh and choose another item.` },
          { status: 409 }
        );
      }
    }

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json({ success: false, error: "One or more selected items were not found." }, { status: 400 });
    }

    // --- Run everything in a transaction ---
    const order = await prisma.$transaction(async (tx) => {
      // Decrement quantities
      for (const item of menuItems) {
        await tx.menuItem.update({
          where: { id: item.id },
          data: { quantity: { decrement: 1 } },
        });
      }

      // Create order with items
      const newOrder = await tx.order.create({
        data: {
          studentName: studentName.trim(),
          tableNumber,
          tableId: table.id,
          specialNotes: specialNotes?.trim() || null,
          status: "PENDING",
          items: {
            create: menuItems.map((item) => ({
              menuItemId: item.id,
              menuItemName: item.name,
              quantity: 1,
            })),
          },
        },
        include: { items: true },
      });

      // Increment table order count
      await tx.dinnerTable.update({
        where: { id: table.id },
        data: { orderedCount: { increment: 1 } },
      });

      return newOrder;
    });

    // --- Post-transaction: check stock levels & batch dispatch (outside tx) ---
    for (const itemId of menuItemIds) {
      await checkStockLevel(itemId);
    }
    await checkAndTriggerDispatch(table.id);

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          studentName: order.studentName,
          tableNumber: order.tableNumber,
          status: order.status,
          specialNotes: order.specialNotes,
          items: order.items.map((i) => ({ name: i.menuItemName, quantity: i.quantity })),
          createdAt: order.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}

// GET /api/orders — List orders, optionally filter by tableNumber (auth required)
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tableNumberParam = searchParams.get("tableNumber");

  const where = tableNumberParam
    ? { tableNumber: parseInt(tableNumberParam) }
    : {};

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  // Build summary if filtering by table
  let summary: Record<string, number> = {};
  let tableData = null;

  if (tableNumberParam) {
    const tableNumber = parseInt(tableNumberParam);
    tableData = await prisma.dinnerTable.findUnique({
      where: { tableNumber },
      include: { assignedWaiter: { select: { id: true, name: true, email: true } } },
    });

    for (const order of orders) {
      for (const item of order.items) {
        summary[item.menuItemName] = (summary[item.menuItemName] || 0) + item.quantity;
      }
    }
  }

  return NextResponse.json({ success: true, orders, summary, table: tableData });
}
