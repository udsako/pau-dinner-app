// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { checkAndTriggerDispatch, checkStockLevel } from "@/lib/batchDispatch";

const COURSE_ORDER = ["STARTER", "MAIN", "DESSERT"];

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

    const name = studentName.trim();

    // Get open courses
    const courseControl = await prisma.courseControl.findFirst();
    const openCourses: string[] = courseControl?.openCourses || [];

    if (openCourses.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ordering is not open yet. Please wait for the announcement." },
        { status: 409 }
      );
    }

    // Get what this student has already ordered
    const existingOrders = await prisma.order.findMany({
      where: { studentName: name, tableNumber },
      select: { course: true },
    });
    const orderedCourses = existingOrders.map((o) => o.course as string);

    // Find the correct course for this student:
    // The earliest open course they haven't ordered yet, in sequence
    let activeCourse: string | null = null;
    for (const course of COURSE_ORDER) {
      if (!openCourses.includes(course)) continue;
      if (orderedCourses.includes(course)) continue;

      // Check sequential requirement
      const courseIndex = COURSE_ORDER.indexOf(course);
      const previousCourses = COURSE_ORDER.slice(0, courseIndex);
      const missingPrevious = previousCourses.find((c) => !orderedCourses.includes(c));

      if (missingPrevious) {
        // They're missing a previous course — if that previous course is open, they should order it first
        // If it's not open, we skip this course too (can't jump ahead)
        continue;
      }

      activeCourse = course;
      break;
    }

    if (!activeCourse) {
      // Figure out why and give a helpful message
      const nextNeeded = COURSE_ORDER.find((c) => !orderedCourses.includes(c));
      if (nextNeeded && !openCourses.includes(nextNeeded)) {
        return NextResponse.json(
          { success: false, error: `You've completed all currently open courses. Wait for the next course to open.` },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: "No available course to order. Please wait for an announcement." },
        { status: 409 }
      );
    }

    // Check duplicate
    const existingOrder = await prisma.order.findUnique({
      where: { studentName_tableNumber_course: { studentName: name, tableNumber, course: activeCourse as any } },
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

    // Validate items belong to the active course
    const menuItemIds = items.map((i: { menuItemId: string; variant?: string }) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });

    for (const menuItem of menuItems) {
      if (menuItem.course !== activeCourse) {
        return NextResponse.json(
          { success: false, error: `"${menuItem.name}" is not part of your current course (${activeCourse}).` },
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
          course: activeCourse as any,
          specialNotes: specialNotes?.trim() || null,
          status: "PENDING",
          items: {
            create: menuItems.map((menuItem) => {
              const itemInput = items.find((i: any) => i.menuItemId === menuItem.id);
              const variant = itemInput?.variant;
              const displayName = variant ? `${menuItem.name} (${variant})` : menuItem.name;
              return { menuItemId: menuItem.id, menuItemName: displayName, quantity: 1 };
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

    // Notify dashboard
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