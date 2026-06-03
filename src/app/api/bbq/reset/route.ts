// src/app/api/bbq/reset/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const deleted = await prisma.bbqOrder.deleteMany({});
    return NextResponse.json({
      success: true,
      message: `Reset complete — ${deleted.count} BBQ orders deleted.`,
    });
  } catch (error) {
    console.error("BBQ reset error:", error);
    return NextResponse.json({ error: "Reset failed." }, { status: 500 });
  }
}