// src/app/api/orders/student-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentName = searchParams.get("studentName");
  const tableNumber = parseInt(searchParams.get("tableNumber") || "0");

  if (!studentName || !tableNumber) {
    return NextResponse.json({ orderedCourses: [] });
  }

  const orders = await prisma.order.findMany({
    where: { studentName, tableNumber },
    select: { course: true },
  });

  const orderedCourses = orders.map((o) => o.course);
  return NextResponse.json({ orderedCourses });
}