// src/app/api/course/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/course — public, returns the currently active course
export async function GET() {
  let control = await prisma.courseControl.findFirst();
  if (!control) {
    control = await prisma.courseControl.create({ data: {} });
  }
  return NextResponse.json({ success: true, activeCourse: control.activeCourse });
}

// POST /api/course — admin only, set the active course
export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["ADMIN"]);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admins only." }, { status: 401 });
  }

  const body = await req.json();
  const { activeCourse } = body;

  const validCourses = ["STARTER", "MAIN", "DESSERT", null];
  if (!validCourses.includes(activeCourse)) {
    return NextResponse.json({ success: false, error: "Invalid course value." }, { status: 400 });
  }

  let control = await prisma.courseControl.findFirst();
  if (!control) {
    control = await prisma.courseControl.create({ data: { activeCourse, updatedBy: user.userId } });
  } else {
    control = await prisma.courseControl.update({
      where: { id: control.id },
      data: { activeCourse, updatedBy: user.userId },
    });
  }

  await prisma.notification.create({
    data: {
      type: "NEW_ORDER",
      message: activeCourse
        ? `✅ ${activeCourse} course is now open for ordering.`
        : `⏸ Ordering has been paused.`,
      metadata: { activeCourse },
    },
  });

  return NextResponse.json({ success: true, activeCourse: control.activeCourse });
}
