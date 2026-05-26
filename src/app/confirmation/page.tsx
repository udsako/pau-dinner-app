"use client";
// src/app/confirmation/page.tsx

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const name = searchParams.get("name") || "Student";
  const table = searchParams.get("table");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at top, #1e1650 0%, #0d0826 70%)",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ height: "3px", position: "fixed", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, transparent, #c9a84c, #e8c97e, #c9a84c, transparent)" }} />

      {/* Success icon */}
      <div
        className="animate-in"
        style={{
          width: "100px", height: "100px", borderRadius: "50%",
          background: "rgba(52,211,153,0.1)", border: "2px solid rgba(52,211,153,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "48px", marginBottom: "32px",
        }}
      >
        ✓
      </div>

      <p
        style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#34d399", marginBottom: "12px" }}
        className="animate-in"
      >
        Order Confirmed
      </p>

      <h1
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 6vw, 3.2rem)", fontWeight: 600, color: "#f5f0e8", marginBottom: "8px" }}
        className="animate-in"
      >
        Enjoy the Evening,
      </h1>
      <h2
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 5vw, 2.6rem)", color: "#c9a84c", fontStyle: "italic", marginBottom: "32px" }}
        className="animate-in"
      >
        {name.split(" ")[0]}!
      </h2>

      <div className="ornament" style={{ width: "200px", marginBottom: "32px" }}>✦</div>

      <div className="card animate-in" style={{ maxWidth: "420px", width: "100%", padding: "28px", marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label" style={{ marginBottom: 0 }}>Table</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#e8c97e" }}>Table {table}</span>
          </div>
          <div style={{ height: "1px", background: "rgba(201,168,76,0.1)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label" style={{ marginBottom: 0 }}>Order ID</span>
            <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#9b93b0" }}>{orderId?.slice(0, 12)}...</span>
          </div>
          <div style={{ height: "1px", background: "rgba(201,168,76,0.1)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label" style={{ marginBottom: 0 }}>Status</span>
            <span className="badge badge-quorum">⏳ Pending</span>
          </div>
        </div>
      </div>

      <div className="card-surface animate-in" style={{ maxWidth: "420px", width: "100%", padding: "20px" }}>
        <p style={{ color: "#9b93b0", fontSize: "0.875rem", lineHeight: 1.7 }}>
          Your food has been reserved. A waiter will bring it to{" "}
          <strong style={{ color: "#f5f0e8" }}>Table {table}</strong> once your table's
          orders are collected. Sit tight and enjoy the evening! 🎉
        </p>
      </div>

      <p style={{ marginTop: "32px", fontSize: "0.75rem", color: "#9b93b0" }}>
        Pan-Atlantic University · Final Year Dinner 2025
      </p>
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
