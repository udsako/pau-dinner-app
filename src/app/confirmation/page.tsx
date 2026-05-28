"use client";
// src/app/confirmation/page.tsx

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Course } from "@/types";

const COURSE_MESSAGES: Record<Course, { emoji: string; title: string; subtitle: string; next: string }> = {
  STARTER: {
    emoji: "🥗",
    title: "Starter order confirmed!",
    subtitle: "Enjoy your starter!",
    next: "We'll open ordering again when it's time for your Main Course. Come back then!",
  },
  MAIN: {
    emoji: "🍽️",
    title: "Main course order confirmed!",
    subtitle: "Enjoy your main course!",
    next: "We'll open ordering again when it's time for Dessert. Come back then!",
  },
  DESSERT: {
    emoji: "🍰",
    title: "Dessert order confirmed!",
    subtitle: "Enjoy your dessert!",
    next: "That's all for tonight. Thank you for being part of this special evening!",
  },
};

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const name = searchParams.get("name") || "Student";
  const table = searchParams.get("table");
  const course = (searchParams.get("course") as Course) || "MAIN";

  const courseMsg = COURSE_MESSAGES[course];

  return (
    <main style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at top, #1e1650 0%, #0d0826 70%)",
      padding: "40px 20px", textAlign: "center",
    }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, transparent, #c9a84c, #e8c97e, #c9a84c, transparent)" }} />

      {/* Success icon */}
      <div className="animate-in" style={{
        width: "100px", height: "100px", borderRadius: "50%",
        background: "rgba(52,211,153,0.1)", border: "2px solid rgba(52,211,153,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "48px", marginBottom: "24px",
      }}>
        {courseMsg.emoji}
      </div>

      <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#34d399", marginBottom: "8px" }} className="animate-in">
        Order Confirmed
      </p>

      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 600, color: "#f5f0e8", marginBottom: "4px" }} className="animate-in">
        {courseMsg.subtitle}
      </h1>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.4rem, 4vw, 2rem)", color: "#c9a84c", fontStyle: "italic", marginBottom: "32px" }} className="animate-in">
        {name.split(" ")[0]}!
      </h2>

      <div className="ornament" style={{ width: "200px", marginBottom: "32px" }}>✦</div>

      {/* Order details */}
      <div className="card animate-in" style={{ maxWidth: "420px", width: "100%", padding: "28px", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label" style={{ marginBottom: 0 }}>Course</span>
            <span style={{
              background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "20px", padding: "4px 14px", color: "#e8c97e", fontSize: "0.82rem", fontWeight: 600,
            }}>
              {courseMsg.emoji} {course.charAt(0) + course.slice(1).toLowerCase()}
            </span>
          </div>
          <div style={{ height: "1px", background: "rgba(201,168,76,0.1)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label" style={{ marginBottom: 0 }}>Table</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#e8c97e" }}>Table {table}</span>
          </div>
          <div style={{ height: "1px", background: "rgba(201,168,76,0.1)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label" style={{ marginBottom: 0 }}>Order ID</span>
            <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#9b93b0" }}>{orderId?.slice(0, 12)}...</span>
          </div>
          <div style={{ height: "1px", background: "rgba(201,168,76,0.1)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label" style={{ marginBottom: 0 }}>Status</span>
            <span className="badge badge-quorum">⏳ Pending</span>
          </div>
        </div>
      </div>

      {/* Next course message */}
      <div className="card-surface animate-in" style={{ maxWidth: "420px", width: "100%", padding: "20px", marginBottom: "24px" }}>
        <p style={{ color: "#9b93b0", fontSize: "0.875rem", lineHeight: 1.7 }}>
          {courseMsg.next}
        </p>
      </div>

      {/* Back to order button — only show if not dessert */}
      {course !== "DESSERT" && (
        <button
          className="btn-ghost"
          onClick={() => router.push("/order")}
          style={{ fontSize: "0.85rem" }}
        >
          Back to Menu
        </button>
      )}

      <p style={{ marginTop: "24px", fontSize: "0.75rem", color: "#9b93b0" }}>
        Pan-Atlantic University · Final Year Dinner 2025
      </p>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, transparent, #c9a84c, #e8c97e, #c9a84c, transparent)" }} />
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0d0826" }} />}>
      <ConfirmationContent />
    </Suspense>
  );
}
