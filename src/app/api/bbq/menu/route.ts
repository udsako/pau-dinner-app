// src/app/api/bbq/menu/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/bbq/menu — Public
export async function GET() {
  try {
    const items = await prisma.bbqMenuItem.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const withRemaining = items.map((item) => ({
      ...item,
      quantityRemaining: item.quantity - item.quantityReserved,
    }));

    return NextResponse.json(withRemaining);
  } catch (error) {
    console.error("GET /api/bbq/menu error:", error);
    return NextResponse.json({ error: "Failed to fetch BBQ menu." }, { status: 500 });
  }
}

// POST /api/bbq/menu — Admin only
export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description, category, quantity } = body;

    if (!name || !category || quantity === undefined) {
      return NextResponse.json(
        { error: "Name, category, and quantity are required." },
        { status: 400 }
      );
    }

    const validCategories = ["COMPULSORY", "PROTEIN", "STARCH"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    if (category === "PROTEIN" || category === "STARCH") {
      const existing = await prisma.bbqMenuItem.count({
        where: { category },
      });
      if (existing >= 2) {
        return NextResponse.json(
          { error: `You can only have 2 ${category} options. Delete one first.` },
          { status: 400 }
        );
      }
    }

    const item = await prisma.bbqMenuItem.create({
      data: {
        name,
        description,
        category,
        quantity: Number(quantity),
      },
    });

    return NextResponse.json(
      { ...item, quantityRemaining: item.quantity },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bbq/menu error:", error);
    return NextResponse.json({ error: "Failed to create BBQ menu item." }, { status: 500 });
  }
}