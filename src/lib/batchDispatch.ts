// src/lib/batchDispatch.ts
import { prisma } from "./prisma";

const QUORUM_THRESHOLD = 7;
const GRACE_PERIOD_MINUTES = 10;

/**
 * Called after every new order is placed.
 * Checks quorum and potentially triggers auto-dispatch.
 */
export async function checkAndTriggerDispatch(tableId: string): Promise<void> {
  const table = await prisma.dinnerTable.findUnique({
    where: { id: tableId },
    include: { orders: true },
  });

  if (!table || table.status === "DISPATCHED") return;

  const orderedCount = table.orderedCount;

  // If all 10 ordered → immediate dispatch
  if (orderedCount >= table.capacity) {
    await dispatchTable(tableId, "AUTO_FULL");
    return;
  }

  // If quorum just reached → mark it, start grace timer
  if (orderedCount >= QUORUM_THRESHOLD && table.status === "COLLECTING") {
    await prisma.dinnerTable.update({
      where: { id: tableId },
      data: {
        status: "QUORUM_MET",
        quorumMetAt: new Date(),
      },
    });
    console.log(`Table ${table.tableNumber}: Quorum reached. Grace period started.`);
  }
}

/**
 * Dispatch all pending orders for a table.
 * Called by: cron job (grace timer), manual admin action, or auto-full trigger.
 */
export async function dispatchTable(
  tableId: string,
  trigger: "AUTO_FULL" | "GRACE_TIMER" | "MANUAL"
): Promise<{ success: boolean; orderCount: number; summary: Record<string, number> }> {
  const table = await prisma.dinnerTable.findUnique({
    where: { id: tableId },
    include: {
      orders: {
        where: { status: "PENDING" },
        include: { items: true },
      },
    },
  });

  if (!table) return { success: false, orderCount: 0, summary: {} };
  if (table.status === "DISPATCHED" && trigger !== "MANUAL") {
    return { success: false, orderCount: 0, summary: {} };
  }

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

  // Update all pending orders to DISPATCHED
  await prisma.order.updateMany({
    where: { tableId, status: "PENDING" },
    data: { status: "DISPATCHED" },
  });

  // Update table status
  await prisma.dinnerTable.update({
    where: { id: tableId },
    data: {
      status: "DISPATCHED",
      dispatchedAt: new Date(),
    },
  });

  // Create dispatch notification
  await prisma.notification.create({
    data: {
      type: "DISPATCHED",
      message: `Table ${table.tableNumber} dispatched to waiter (${trigger}). ${pendingOrders.length} orders: ${Object.entries(summary).map(([k, v]) => `${v}× ${k}`).join(", ")}`,
      metadata: {
        tableNumber: table.tableNumber,
        trigger,
        summary,
        orderCount: pendingOrders.length,
      },
    },
  });

  console.log(`Table ${table.tableNumber} dispatched via ${trigger}. ${pendingOrders.length} orders.`);
  return { success: true, orderCount: pendingOrders.length, summary };
}

/**
 * Cron job function — checks all QUORUM_MET tables and dispatches if grace period expired.
 * Schedule this to run every minute via Vercel Cron.
 */
export async function processGraceTimers(): Promise<void> {
  const graceCutoff = new Date(Date.now() - GRACE_PERIOD_MINUTES * 60 * 1000);

  const tablesReadyToDispatch = await prisma.dinnerTable.findMany({
    where: {
      status: "QUORUM_MET",
      quorumMetAt: { lte: graceCutoff },
    },
  });

  for (const table of tablesReadyToDispatch) {
    console.log(`Grace timer expired for Table ${table.tableNumber}. Auto-dispatching...`);
    await dispatchTable(table.id, "GRACE_TIMER");
  }
}

/**
 * Check a menu item after an order decrements its quantity.
 * Creates notifications for low stock and sold out.
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
    // Only notify if we haven't already notified at this level
    const existingAlert = await prisma.notification.findFirst({
      where: {
        type: "LOW_STOCK",
        metadata: { path: ["menuItemId"], equals: item.id },
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // within last hour
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
