// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, isPAUEmail, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (!isPAUEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Email must be a PAU email address ending in @pau.edu.ng" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const validRoles = ["ADMIN", "WAITER"];
    const userRole = role && validRoles.includes(role) ? role : "WAITER";

    const hashedPassword = await hashPassword(password);

    // If account exists, update role and password instead of erroring
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    let user;
    if (existing) {
      user = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { name, password: hashedPassword, role: userRole },
        select: { id: true, name: true, email: true, role: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: userRole,
        },
        select: { id: true, name: true, email: true, role: true },
      });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return NextResponse.json({ success: true, token, user }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}