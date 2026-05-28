// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";

const STAFF_INVITE_CODE = process.env.STAFF_INVITE_CODE || "pau2026dinner";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, inviteCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (!inviteCode || inviteCode !== STAFF_INVITE_CODE) {
      return NextResponse.json(
        { success: false, error: "Invalid staff access code. Please contact the event organiser." },
        { status: 403 }
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

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    let user;
    if (existing) {
      // Update role and password if account already exists
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