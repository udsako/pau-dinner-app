// src/app/api/bbq/menu/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description, quantity, isAvailable } = body;

    const item = await prisma.bbqMenuItem.update({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    await prisma.bbqMenuItem.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "BBQ item deleted." });
  } catch (error) {
    console.error("DELETE /api/bbq/menu/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete BBQ item." }, { status: 500 });
  }
}