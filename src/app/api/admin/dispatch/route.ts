// src/app/api/admin/dispatch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { dispatchTableForCourse } from "@/lib/batchDispatch";

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json();
  const { tableNumber } = body;

  if (!tableNumber) {
    return NextResponse.json({ success: false, error: "tableNumber is required." }, { status: 400 });
  }

  const table = await prisma.dinnerTable.findUnique({ where: { tableNumber } });
  if (!table) {
    return NextResponse.json({ success: false, error: "Table not found." }, { status: 404 });
  }

  // Get the active course
  const courseControl = await prisma.courseControl.findFirst();
  const activeCourse = courseControl?.activeCourse;

  if (!activeCourse) {
    return NextResponse.json(
      { success: false, error: "No course is currently active. Open a course first." },
      { status: 400 }
    );
  }

  const result = await dispatchTableForCourse(table.id, activeCourse, "MANUAL");

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: `No pending ${activeCourse.toLowerCase()} orders to dispatch for this table.` },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    dispatched: {
      tableNumber,
      course: activeCourse,
      orderCount: result.orderCount,
      summary: result.summary,
    },
  });
}