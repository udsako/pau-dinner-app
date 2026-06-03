// src/app/api/movie/menu/[id]/route.ts

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

    const item = await prisma.movieMenuItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
    });

    return NextResponse.json({ ...item, quantityRemaining: item.quantity - item.quantityReserved });
  } catch (error) {
    console.error("PATCH /api/movie/menu/[id] error:", error);
    return NextResponse.json({ error: "Failed to update movie item." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.movieMenuItem.delete({ where: { id } });
    return NextResponse.json({ message: "Movie item deleted." });
  } catch (error) {
    console.error("DELETE /api/movie/menu/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete movie item." }, { status: 500 });
  }
}