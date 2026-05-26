// src/app/api/menu/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// PATCH /api/menu/[id] — Admin: update a menu item
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req, ["ADMIN"]);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admins only." }, { status: 401 });
  }

  const body = await req.json();
  const { name, category, description, imageUrl, quantity, isAvailable } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (category !== undefined) updateData.category = category;
  if (description !== undefined) updateData.description = description;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (quantity !== undefined) {
    updateData.quantity = parseInt(quantity);
    updateData.isAvailable = parseInt(quantity) > 0;
  }
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

  try {
    const item = await prisma.menuItem.update({
      where: { id: params.id },
      data: updateData,
    });
    return NextResponse.json({ success: true, item });
  } catch {
    return NextResponse.json({ success: false, error: "Item not found." }, { status: 404 });
  }
}

// DELETE /api/menu/[id] — Admin: delete a menu item
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req, ["ADMIN"]);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admins only." }, { status: 401 });
  }

  try {
    await prisma.menuItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "Item deleted." });
  } catch {
    return NextResponse.json({ success: false, error: "Item not found." }, { status: 404 });
  }
}
