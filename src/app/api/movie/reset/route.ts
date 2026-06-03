// src/app/api/movie/reset/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const deleted = await prisma.movieOrder.deleteMany({});
    await prisma.movieMenuItem.updateMany({
      data: { quantityReserved: 0, isAvailable: true },
    });
    return NextResponse.json({
      success: true,
      message: `Reset complete — ${deleted.count} Movie Night orders deleted and stock restored.`,
    });
  } catch (error) {
    console.error("Movie reset error:", error);
    return NextResponse.json({ error: "Reset failed." }, { status: 500 });
  }
}