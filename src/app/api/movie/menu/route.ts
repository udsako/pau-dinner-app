// src/app/api/movie/menu/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.movieMenuItem.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(
      items.map((item) => ({
        ...item,
        quantityRemaining: item.quantity - item.quantityReserved,
      }))
    );
  } catch (error) {
    console.error("GET /api/movie/menu error:", error);
    return NextResponse.json({ error: "Failed to fetch movie menu." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, quantity } = body;

    if (!name || quantity === undefined) {
      return NextResponse.json({ error: "Name and quantity are required." }, { status: 400 });
    }

    const item = await prisma.movieMenuItem.create({
      data: { name, description, quantity: Number(quantity) },
    });

    return NextResponse.json({ ...item, quantityRemaining: item.quantity }, { status: 201 });
  } catch (error) {
    console.error("POST /api/movie/menu error:", error);
    return NextResponse.json({ error: "Failed to create movie menu item." }, { status: 500 });
  }
}