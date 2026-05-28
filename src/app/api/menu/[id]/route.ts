// src/app/api/menu/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["ADMIN"]);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admins only." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const { name, category, course, description, imageUrl, quantity, isAvailable } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (category !== undefined) updateData.category = category;
  if (course !== undefined) updateData.course = course;
  if (description !== undefined) updateData.description = description;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (quantity !== undefined) {
    updateData.quantity = parseInt(quantity);
    updateData.isAvailable = parseInt(quantity) > 0;
  }
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ success: true, item });
  } catch {
    return NextResponse.json({ success: false, error: "Item not found." }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["ADMIN"]);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admins only." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await prisma.orderItem.deleteMany({ where: { menuItemId: id } });
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Item deleted." });
  } catch {
    return NextResponse.json({ success: false, error: "Item not found." }, { status: 404 });
  }
}