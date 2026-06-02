// src/app/api/bbq/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentName, department, proteinChoiceId, starchChoiceId, confirmedItems } = body;

    if (!studentName?.trim())
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    if (!department?.trim())
      return NextResponse.json({ error: "Department is required." }, { status: 400 });
    if (!proteinChoiceId)
      return NextResponse.json({ error: "Please select a protein choice." }, { status: 400 });
    if (!starchChoiceId)
      return NextResponse.json({ error: "Please select a starch choice." }, { status: 400 });
    if (!confirmedItems || !Array.isArray(confirmedItems) || confirmedItems.length === 0)
      return NextResponse.json({ error: "Please confirm all compulsory items." }, { status: 400 });

    const order = await prisma.$transaction(async (tx) => {
      const protein = await tx.bbqMenuItem.findUnique({ where: { id: proteinChoiceId } });
      if (!protein) throw new Error("PROTEIN_NOT_FOUND");
      if (!protein.isAvailable || protein.quantity - protein.quantityReserved <= 0)
        throw new Error("PROTEIN_SOLD_OUT");

      const starch = await tx.bbqMenuItem.findUnique({ where: { id: starchChoiceId } });
      if (!starch) throw new Error("STARCH_NOT_FOUND");
      if (!starch.isAvailable || starch.quantity - starch.quantityReserved <= 0)
        throw new Error("STARCH_SOLD_OUT");

      const compulsoryItems = await tx.bbqMenuItem.findMany({
        where: { id: { in: confirmedItems }, category: "COMPULSORY" },
      });
      const allCompulsory = await tx.bbqMenuItem.findMany({
        where: { category: "COMPULSORY", isAvailable: true },
      });
      if (compulsoryItems.length < allCompulsory.length) {
        throw new Error("MISSING_CONFIRMATIONS");
      }

      await tx.bbqMenuItem.update({
        where: { id: proteinChoiceId },
        data: { quantityReserved: { increment: 1 } },
      });
      await tx.bbqMenuItem.update({
        where: { id: starchChoiceId },
        data: { quantityReserved: { increment: 1 } },
      });

      return tx.bbqOrder.create({
        data: {
          studentName: studentName.trim(),
          department: department.trim(),
          proteinChoiceId,
          starchChoiceId,
          confirmedItems,
        },
        include: {
          proteinChoice: true,
          starchChoice: true,
        },
      });
    });

    for (const itemId of [proteinChoiceId, starchChoiceId]) {
      const item = await prisma.bbqMenuItem.findUnique({ where: { id: itemId } });
      if (item && item.quantity - item.quantityReserved <= 0) {
        await prisma.bbqMenuItem.update({
          where: { id: itemId },
          data: { isAvailable: false },
        });
      }
    }

    return NextResponse.json(
      {
        orderId: order.id,
        studentName: order.studentName,
        department: order.department,
        protein: order.proteinChoice.name,
        starch: order.starchChoice.name,
        confirmedItems,
        message: "Your BBQ order has been placed successfully!",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      const messages: Record<string, string> = {
        PROTEIN_NOT_FOUND: "Selected protein option not found.",
        PROTEIN_SOLD_OUT: "Sorry, that protein choice has sold out. Please pick another.",
        STARCH_NOT_FOUND: "Selected starch option not found.",
        STARCH_SOLD_OUT: "Sorry, that starch choice has sold out. Please pick another.",
        MISSING_CONFIRMATIONS: "Please confirm all compulsory items before submitting.",
      };
      if (messages[error.message]) {
        return NextResponse.json({ error: messages[error.message] }, { status: 409 });
      }
    }
    console.error("POST /api/bbq/orders error:", error);
    return NextResponse.json({ error: "Failed to place BBQ order." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const department = searchParams.get("department") ?? "";

    const orders = await prisma.bbqOrder.findMany({
      where: {
        ...(department && { department }),
        ...(search && {
          OR: [
            { studentName: { contains: search, mode: "insensitive" } },
            { department: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        proteinChoice: true,
        starchChoice: true,
      },
      orderBy: { orderedAt: "asc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/bbq/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch BBQ orders." }, { status: 500 });
  }
}