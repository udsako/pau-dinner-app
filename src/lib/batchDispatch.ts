// src/lib/batchDispatch.ts
import { prisma } from "./prisma";

const QUORUM_THRESHOLD = 7;
const GRACE_PERIOD_MINUTES = 5;

/**
 * Get the currently active course from CourseControl
 */
async function getActiveCourse(): Promise<string | null> {
  const control = await prisma.courseControl.findFirst();
  return control?.activeCourse ?? null;
}

/**
 * Called after every new order is placed.
 * Checks quorum for the current course and potentially triggers auto-dispatch.
 */
export async function checkAndTriggerDispatch(tableId: string): Promise<void> {
  const activeCourse = await getActiveCourse();
  if (!activeCourse) return;

  const table = await prisma.dinnerTable.findUnique({
    where: { id: tableId },
    include: {
      orders: { where: { status: "PENDING", course: activeCourse as any } },
    },
  });

  if (!table) return;

  // Count how many people have ordered THIS course at this table
  const courseOrderCount = await prisma.order.count({
    where: { tableId, course: activeCourse as any },
  });

  // Check if table is already dispatched FOR THIS COURSE
  const alreadyDispatched = await prisma.order.findFirst({
    where: { tableId, course: activeCourse as any, status: "DISPATCHED" },
  });
  if (alreadyDispatched) return; // already dispatched for this course

  // If all 10 ordered this course → immediate dispatch
  if (courseOrderCount >= table.capacity) {
    await dispatchTableForCourse(tableId, activeCourse, "AUTO_FULL");
    return;
  }

  // If quorum just reached → update table status and quorumMetAt
  if (courseOrderCount >= QUORUM_THRESHOLD && table.status !== "QUORUM_MET") {
    await prisma.dinnerTable.update({
      where: { id: tableId },
      data: { status: "QUORUM_MET", quorumMetAt: new Date() },
    });
  }
}

/**
 * Dispatch pending orders for a specific course at a table.
 */
export async function dispatchTableForCourse(
  tableId: string,
  course: string,
  trigger: "AUTO_FULL" | "GRACE_TIMER" | "MANUAL"
): Promise<{ success: boolean; orderCount: number; summary: Record<string, number> }> {
  const table = await prisma.dinnerTable.findUnique({
    where: { id: tableId },
    include: {
      orders: {
        where: { status: "PENDING", course: course as any },
        include: { items: true },
      },
    },
  });

  if (!table) return { success: false, orderCount: 0, summary: {} };

  const pendingOrders = table.orders;
  if (pendingOrders.length === 0 && trigger !== "MANUAL") {
    return { success: false, orderCount: 0, summary: {} };
  }

  // Build food summary
  const summary: Record<string, number> = {};
  for (const order of pendingOrders) {
    for (const item of order.items) {
      summary[item.menuItemName] = (summary[item.menuItemName] || 0) + item.quantity;
    }
  }

  // Update pending orders for this course to DISPATCHED
  await prisma.order.updateMany({
    where: { tableId, course: course as any, status: "PENDING" },
    data: { status: "DISPATCHED" },
  });

  // Reset table status to COLLECTING (ready for next course)
  await prisma.dinnerTable.update({
    where: { id: tableId },
    data: {
      status: "COLLECTING",
      orderedCount: 0,
      quorumMetAt: null,
      dispatchedAt: new Date(),
    },
  });

  const COURSE_EMOJI: Record<string, string> = {
    STARTER: "🥗", MAIN: "🍽️", DESSERT: "🍰",
  };

  await prisma.notification.create({
    data: {
      type: "DISPATCHED",
      message: `${COURSE_EMOJI[course] || ""} Table ${table.tableNumber} ${course} dispatched (${trigger}). ${pendingOrders.length} orders: ${Object.entries(summary).map(([k, v]) => `${v}× ${k}`).join(", ")}`,
      metadata: {
        tableNumber: table.tableNumber,
        course,
        trigger,
        summary,
        orderCount: pendingOrders.length,
      },
    },
  });

  return { success: true, orderCount: pendingOrders.length, summary };
}

/**
 * Kept for backward compatibility — dispatches for the active course
 */
export async function dispatchTable(
  tableId: string,
  trigger: "AUTO_FULL" | "GRACE_TIMER" | "MANUAL"
): Promise<{ success: boolean; orderCount: number; summary: Record<string, number> }> {
  const activeCourse = await getActiveCourse();
  if (!activeCourse) return { success: false, orderCount: 0, summary: {} };
  return dispatchTableForCourse(tableId, activeCourse, trigger);
}

/**
 * Grace timer — checks QUORUM_MET tables and dispatches if expired
 */
export async function processGraceTimers(): Promise<void> {
  const graceCutoff = new Date(Date.now() - GRACE_PERIOD_MINUTES * 60 * 1000);

  const tablesReadyToDispatch = await prisma.dinnerTable.findMany({
    where: { status: "QUORUM_MET", quorumMetAt: { lte: graceCutoff } },
  });

  for (const table of tablesReadyToDispatch) {
    await dispatchTable(table.id, "GRACE_TIMER");
  }
}

/**
 * Check stock level after an order and create notifications
 */
export async function checkStockLevel(menuItemId: string): Promise<void> {
  const item = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
  if (!item) return;

  if (item.quantity === 0) {
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { isAvailable: false },
    });
    await prisma.notification.create({
      data: {
        type: "SOLD_OUT",
        message: `🔴 SOLD OUT: "${item.name}" has run out of stock.`,
        metadata: { menuItemId: item.id, menuItemName: item.name },
      },
    });
  } else if (item.quantity <= 5) {
    const existingAlert = await prisma.notification.findFirst({
      where: {
        type: "LOW_STOCK",
        metadata: { path: ["menuItemId"], equals: item.id },
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (!existingAlert) {
      await prisma.notification.create({
        data: {
          type: "LOW_STOCK",
          message: `🟡 Low stock: "${item.name}" — only ${item.quantity} servings remaining.`,
          metadata: { menuItemId: item.id, menuItemName: item.name, remaining: item.quantity },
        },
      });
    }
  }
}