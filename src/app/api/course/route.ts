// src/app/api/course/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/course — returns list of currently open courses
export async function GET() {
  let control = await prisma.courseControl.findFirst();
  if (!control) {
    control = await prisma.courseControl.create({ data: { openCourses: [] } });
  }
  return NextResponse.json({ success: true, openCourses: control.openCourses });
}

// POST /api/course — admin sets which courses are open
export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["ADMIN"]);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admins only." }, { status: 401 });
  }

  const body = await req.json();
  const { openCourses } = body; // string[] e.g. ["STARTER", "MAIN"]

  const validCourses = ["STARTER", "MAIN", "DESSERT"];
  const filtered = Array.isArray(openCourses)
    ? openCourses.filter((c: string) => validCourses.includes(c))
    : [];

  let control = await prisma.courseControl.findFirst();
  if (!control) {
    control = await prisma.courseControl.create({
      data: { openCourses: filtered, updatedBy: user.userId },
    });
  } else {
    control = await prisma.courseControl.update({
      where: { id: control.id },
      data: { openCourses: filtered, updatedBy: user.userId },
    });
  }

  const message = filtered.length === 0
    ? "⏸ Ordering paused. No courses are open."
    : `✅ Open courses: ${filtered.join(", ")}`;

  await prisma.notification.create({
    data: {
      type: "NEW_ORDER",
      message,
      metadata: { openCourses: filtered },
    },
  });

  return NextResponse.json({ success: true, openCourses: control.openCourses });
}