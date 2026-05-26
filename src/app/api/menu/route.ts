// src/app/api/menu/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/menu — Public: get all available menu items
export async function GET() {
  const menu = await prisma.menuItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Group by category
  const grouped: Record<string, typeof menu> = {};
  for (const item of menu) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  return NextResponse.json({ success: true, menu, grouped });
}

// POST /api/menu — Admin: create a menu item
export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["ADMIN"]);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admins only." }, { status: 401 });
  }

  const body = await req.json();
  const { name, category, description, imageUrl, quantity } = body;

  if (!name || !category || quantity === undefined) {
    return NextResponse.json(
      { success: false, error: "Name, category, and quantity are required." },
      { status: 400 }
    );
  }

  const item = await prisma.menuItem.create({
    data: {
      name,
      category,
      description: description || null,
      imageUrl: imageUrl || null,
      quantity: parseInt(quantity),
      isAvailable: parseInt(quantity) > 0,
    },
  });

  return NextResponse.json({ success: true, item }, { status: 201 });
}
