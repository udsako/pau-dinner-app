// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { checkAndTriggerDispatch, checkStockLevel } from "@/lib/batchDispatch";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentName, tableNumber, items, specialNotes } = body;

    if (!studentName?.trim()) {
      return NextResponse.json({ success: false, error: "Your name is required." }, { status: 400 });
    }
    if (!tableNumber || tableNumber < 1 || tableNumber > 24) {
      return NextResponse.json({ success: false, error: "Invalid table number (must be 1–24)." }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Please select at least one food item." }, { status: 400 });
    }

    // Get active course
    const courseControl = await prisma.courseControl.findFirst();
    const activeCourse = courseControl?.activeCourse;

    if (!activeCourse) {
      return NextResponse.json(
        { success: false, error: "Ordering is not open yet. Please wait for the announcement." },
        { status: 409 }
      );
    }

    // Sequential ordering enforcement
    const name = studentName.trim();

    if (activeCourse === "MAIN" || activeCourse === "DESSERT") {
      const requiredPrevious = activeCourse === "MAIN" ? ["STARTER"] : ["STARTER", "MAIN"];
      for (const requiredCourse of requiredPrevious) {
        const previousOrder = await prisma.order.findFirst({
          where: { studentName: name, tableNumber, course: requiredCourse as any },
        });
        if (!previousOrder) {
          const courseLabel = requiredCourse === "STARTER" ? "Starter" : "Main Course";
          return NextResponse.json(
            { success: false, error: `You need to order your ${courseLabel} before ordering ${activeCourse === "MAIN" ? "the Main Course" : "Dessert"}.` },
            { status: 409 }
          );
        }
      }
    }

    // Check duplicate order for this course
    const existingOrder = await prisma.order.findUnique({
      where: { studentName_tableNumber_course: { studentName: name, tableNumber, course: activeCourse } },
    });
    if (existingOrder) {
      return NextResponse.json(
        { success: false, error: `You have already placed your ${activeCourse.toLowerCase()} order.` },
        { status: 409 }
      );
    }

    const table = await prisma.dinnerTable.findUnique({ where: { tableNumber } });
    if (!table) {
      return NextResponse.json({ success: false, error: "Table not found." }, { status: 404 });
    }

    // Validate menu items
    const menuItemIds = items.map((i: { menuItemId: string; variant?: string }) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });

    for (const menuItem of menuItems) {
      if (menuItem.course !== activeCourse) {
        return NextResponse.json(
          { success: false, error: `"${menuItem.name}" is not part of the current course.` },
          { status: 409 }
        );
      }
      if (!menuItem.isAvailable || menuItem.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: `"${menuItem.name}" is no longer available.` },
          { status: 409 }
        );
      }
    }

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json({ success: false, error: "One or more items were not found." }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const item of menuItems) {
        await tx.menuItem.update({ where: { id: item.id }, data: { quantity: { decrement: 1 } } });
      }

      const newOrder = await tx.order.create({
        data: {
          studentName: name,
          tableNumber,
          tableId: table.id,
          course: activeCourse,
          specialNotes: specialNotes?.trim() || null,
          status: "PENDING",
          items: {
            create: menuItems.map((menuItem) => {
              const itemInput = items.find((i: any) => i.menuItemId === menuItem.id);
              const variant = itemInput?.variant;
              const displayName = variant ? `${menuItem.name} (${variant})` : menuItem.name;
              return {
                menuItemId: menuItem.id,
                menuItemName: displayName,
                quantity: 1,
              };
            }),
          },
        },
        include: { items: true },
      });

      await tx.dinnerTable.update({
        where: { id: table.id },
        data: { orderedCount: { increment: 1 } },
      });

      return newOrder;
    });

    // Notify dashboard of new order
    await prisma.notification.create({
      data: {
        type: "NEW_ORDER",
        message: `📋 New order from Table ${tableNumber} — ${name} (${activeCourse.charAt(0) + activeCourse.slice(1).toLowerCase()})`,
        metadata: { tableNumber, studentName: name, course: activeCourse },
      },
    });

    for (const itemId of menuItemIds) {
      await checkStockLevel(itemId);
    }
    await checkAndTriggerDispatch(table.id);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        studentName: order.studentName,
        tableNumber: order.tableNumber,
        course: order.course,
        status: order.status,
        items: order.items.map((i) => ({ name: i.menuItemName, quantity: i.quantity })),
        createdAt: order.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tableNumberParam = searchParams.get("tableNumber");
  const courseParam = searchParams.get("course");

  const where: Record<string, unknown> = {};
  if (tableNumberParam) where.tableNumber = parseInt(tableNumberParam);
  if (courseParam) where.course = courseParam;

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: [{ course: "asc" }, { createdAt: "asc" }],
  });

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