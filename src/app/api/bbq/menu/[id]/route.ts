// src/app/api/bbq/menu/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { name, description, quantity, isAvailable } = body;

    const item = await prisma.bbqMenuItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
    });

    return NextResponse.json({
      ...item,
      quantityRemaining: item.quantity - item.quantityReserved,
    });
  } catch (error) {
    console.error("PATCH /api/bbq/menu/[id] error:", error);
    return NextResponse.json({ error: "Failed to update BBQ item." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.bbqMenuItem.delete({ where: { id } });
    return NextResponse.json({ message: "BBQ item deleted." });
  } catch (error) {
    console.error("DELETE /api/bbq/menu/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete BBQ item." }, { status: 500 });
  }
}