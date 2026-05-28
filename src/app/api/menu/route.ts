// src/app/api/menu/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseParam = searchParams.get("course");

  const where: Record<string, unknown> = {};
  if (courseParam) where.course = courseParam;

  const menu = await prisma.menuItem.findMany({
    where,
    orderBy: [{ course: "asc" }, { category: "asc" }, { name: "asc" }],
  });

  const grouped: Record<string, typeof menu> = {};
  for (const item of menu) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  return NextResponse.json({ success: true, menu, grouped });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["ADMIN"]);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admins only." }, { status: 401 });
  }

  const body = await req.json();
  const { name, category, course, description, imageUrl, quantity } = body;

  if (!name || !category || quantity === undefined) {
    return NextResponse.json(
      { success: false, error: "Name, category, and quantity are required." },
      { status: 400 }
    );
  }

  const validCourses = ["STARTER", "MAIN", "DESSERT"];
  const itemCourse = course && validCourses.includes(course) ? course : "MAIN";

  const item = await prisma.menuItem.create({
    data: {
      name,
      category,
      course: itemCourse,
      description: description || null,
      imageUrl: imageUrl || null,
      quantity: parseInt(quantity),
      isAvailable: parseInt(quantity) > 0,
    },
  });

  return NextResponse.json({ success: true, item }, { status: 201 });
}
