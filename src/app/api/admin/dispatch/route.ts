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
  const { tableNumber, course } = body;

  if (!tableNumber) {
    return NextResponse.json({ success: false, error: "tableNumber is required." }, { status: 400 });
  }

  const table = await prisma.dinnerTable.findUnique({ where: { tableNumber } });
  if (!table) {
    return NextResponse.json({ success: false, error: "Table not found." }, { status: 404 });
  }

  // Use provided course, or fall back to first open course
  let targetCourse = course;
  if (!targetCourse) {
    const courseControl = await prisma.courseControl.findFirst();
    const openCourses = courseControl?.openCourses || [];
    targetCourse = openCourses[0];
  }

  if (!targetCourse) {
    return NextResponse.json(
      { success: false, error: "No course specified and no course is currently open." },
      { status: 400 }
    );
  }

  const result = await dispatchTableForCourse(table.id, targetCourse, "MANUAL");

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: `No pending ${targetCourse.toLowerCase()} orders to dispatch for this table.` },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    dispatched: {
      tableNumber,
      course: targetCourse,
      orderCount: result.orderCount,
      summary: result.summary,
    },
  });
}