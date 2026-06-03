// src/app/api/movie/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentName, department, confirmedItems } = body;

    if (!studentName?.trim())
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    if (!department?.trim())
      return NextResponse.json({ error: "Department is required." }, { status: 400 });
    if (!confirmedItems || !Array.isArray(confirmedItems) || confirmedItems.length === 0)
      return NextResponse.json({ error: "Please confirm all items." }, { status: 400 });

    const order = await prisma.$transaction(async (tx) => {
      // Validate all confirmed items exist and have stock
      const allItems = await tx.movieMenuItem.findMany({
        where: { isAvailable: true },
      });

      for (const item of allItems) {
        if (item.quantity - item.quantityReserved <= 0) {
          throw new Error(`SOLD_OUT:${item.name}`);
        }
      }

      // Decrement stock for each confirmed item
      for (const itemId of confirmedItems) {
        await tx.movieMenuItem.update({
          where: { id: itemId },
          data: { quantityReserved: { increment: 1 } },
        });
      }

      return tx.movieOrder.create({
        data: {
          studentName: studentName.trim(),
          department: department.trim(),
          confirmedItems,
        },
      });
    });

    // Post-transaction: disable sold-out items
    const items = await prisma.movieMenuItem.findMany({
      where: { id: { in: confirmedItems } },
    });
    for (const item of items) {
      if (item.quantity - item.quantityReserved <= 0) {
        await prisma.movieMenuItem.update({
          where: { id: item.id },
          data: { isAvailable: false },
        });
      }
    }

    return NextResponse.json(
      {
        orderId: order.id,
        studentName: order.studentName,
        department: order.department,
        confirmedItems,
        message: "Your Movie Night order has been placed!",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("SOLD_OUT:")) {
      const itemName = error.message.split(":")[1];
      return NextResponse.json(
        { error: `Sorry, ${itemName} has sold out.` },
        { status: 409 }
      );
    }
    console.error("POST /api/movie/orders error:", error);
    return NextResponse.json({ error: "Failed to place Movie Night order." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const department = searchParams.get("department") ?? "";

    const orders = await prisma.movieOrder.findMany({
      where: {
        ...(department && { department }),
        ...(search && {
          OR: [
            { studentName: { contains: search, mode: "insensitive" } },
            { department: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { orderedAt: "asc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/movie/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch movie orders." }, { status: 500 });
  }
}